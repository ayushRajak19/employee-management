# Multi-tenant production runbook

## Isolation model

Every business collection contains an immutable `tenantId`. Mongoose middleware adds the active tenant to reads, writes, updates, deletes, aggregates, inserts and bulk operations. An operation without request-scoped tenant context fails closed. `Tenant` and the permission catalog are the only global collections.

Unique business keys are tenant-local. For example, two organizations may use the same user email, employee ID, department code, project code or skill name. All query indexes lead with `tenantId`; TTL indexes remain single-field as required by MongoDB.

JWT access and refresh tokens carry the tenant ID. Tokens created before this change continue to work because the server resolves their migrated user/session record once and then issues a tenant-aware token. A suspended organization is rejected on every authenticated request.

GridFS files store `metadata.tenantId` and are checked before read or deletion. Cloudinary uploads use a tenant-prefixed folder.

## Existing-data migration

Before the first startup, run `npm run migrate:tenants`. This command creates a complete compressed Extended JSON backup under `.runtime/backups/` before it changes the database. The migration then:

1. Creates the default tenant from `DEFAULT_TENANT_NAME` and `DEFAULT_TENANT_SLUG`.
2. Adds that tenant ID only to records where `tenantId` is missing or null.
3. Adds the same tenant metadata to existing GridFS files.
4. Replaces global unique indexes with tenant-leading compound unique indexes.
5. Builds tenant-leading read indexes.
6. Seeds missing organization presets without overwriting existing records.

The migration does not change `_id`, email, password hashes, employee data or stored file IDs. It is idempotent and safe to rerun. Normal startup refuses to serve an unmigrated database, preventing an accidental unbacked conversion.

After migration, compare every backed-up document with the live database (allowing only the new tenant marker) using:

```bash
npm run verify:preservation -- .runtime/backups/before-tenant-migration-<timestamp>
```

For an additional provider-native backup, use:

```bash
mongodump --uri="$MONGODB_URI" --archive=employee-before-tenancy.archive --gzip
```

Deploy during a maintenance window or with the old application instances drained. Do not run old and new application versions against the database at the same time while indexes are being converted. The built-in backup contains sensitive records and password hashes; keep `.runtime/backups` access restricted and move the archive to encrypted storage after verification.

## Configuration

```dotenv
DEFAULT_TENANT_NAME=MobiusEMS
DEFAULT_TENANT_SLUG=mobius-ems
PLATFORM_ADMIN_EMAILS=owner@example.com
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_POOL_SIZE=30
EMAIL_AUTOMATION_ENABLED=true
```

`PLATFORM_ADMIN_EMAILS` is a comma-separated allowlist. An allowlisted account must also have the `SUPER_ADMIN` role. When the variable is empty, `SUPER_ADMIN_EMAIL` is the fallback platform owner. The original organization keeps its normal login behavior; the Organization ID can be left blank unless the same email exists in multiple organizations.

Email automation uses one platform Brevo account. `EMAIL_AUTOMATION_DAILY_LIMIT` is an account-wide UTC-day safety cap shared atomically by every organization and server instance. Organizations keep separate workflows, contacts, enrollments, deliveries, unsubscribe state, and sender display names. Production startup requires an HTTPS `CLIENT_URL` plus explicit `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_WEBHOOK_TOKEN` values. After upgrading, register the v2 webhook from the Email Automation settings page and remove the older query-token webhook in Brevo if one exists.

## Vendor onboarding

An allowlisted platform owner can use **Administration → Vendor organizations** or these endpoints:

- `GET /api/v1/platform/tenants`
- `POST /api/v1/platform/tenants`
- `PATCH /api/v1/platform/tenants/:id/status`

Provisioning creates tenant-local roles, starter departments/designations and a tenant Super Admin. The new administrator must change the temporary password on first sign-in. Suspending a tenant immediately blocks access but retains all records for later reactivation.

## Operational checks

After deployment:

1. Confirm startup logs contain `MongoDB connected and tenant migration verified`.
2. Sign in to the original account without an Organization ID and verify historical records.
3. Provision a test organization and sign in using its Organization ID.
4. Create the same department or employee email in both organizations to confirm tenant-local uniqueness.
5. Suspend the test organization and confirm its existing session receives `401`.
6. Monitor MongoDB connection-pool saturation and tune the configured min/max pool sizes for the deployment size.
