import assert from "node:assert/strict";
import test from "node:test";
import { Tenant } from "../models/Tenant.js";
import { createTenant } from "./tenantService.js";
import { createTenantSchema } from "../validators/tenantValidators.js";
import { loginSchema } from "../validators/authValidators.js";

test("organization IDs are optional and normalized when supplied for login", () => {
  assert.equal(createTenantSchema.safeParse({ body: { name: "Acme", plan: "STANDARD", adminName: "Admin", adminEmail: "admin@acme.test", temporaryPassword: "Test-password-123" } }).success, true);
  assert.equal(loginSchema.safeParse({ body: { email: "admin@acme.test", password: "password123" } }).success, true);
  assert.equal(loginSchema.parse({ body: { email: "admin@acme.test", password: "password123", tenantSlug: "  ACME-HQ " } }).body.tenantSlug, "acme-hq");
  assert.equal(loginSchema.safeParse({ body: { email: "admin@acme.test", password: "password123", tenantSlug: "bad slug" } }).success, false);
});

test("public registration cannot resume or overwrite any existing organization", async (t) => {
  const lookup = t.mock.method(Tenant, "findOne");
  for (const status of ["PROVISIONING", "ACTIVE", "SUSPENDED"]) {
    lookup.mock.mockImplementation((async () => ({ status })) as unknown as typeof Tenant.findOne);
    await assert.rejects(createTenant({ name: "Other organization", slug: "existing", plan: "STANDARD", adminName: "Other admin", adminEmail: "other@example.com", temporaryPassword: "Test-password-123" }), /already in use/);
  }
});
