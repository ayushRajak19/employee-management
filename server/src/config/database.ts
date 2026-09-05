import mongoose from "mongoose";
import { env } from "./env.js";
import { ensureDefaultTenant, inspectPendingTenantMigration, migrateExistingRecordsToDefaultTenant } from "../tenancy/migrateTenants.js";
import { SystemMigration } from "../models/SystemMigration.js";

const TENANT_MIGRATION_KEY = "tenant-isolation-v1";

export const connectDatabase = async (options: { migrateTenants?: boolean } = {}): Promise<{ defaultTenantId: string }> => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    // Indexes are built only after legacy records receive tenantId, preventing
    // unique-index races during a rolling migration.
    autoIndex: false,
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 20_000,
    socketTimeoutMS: 60_000,
    maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
    minPoolSize: env.MONGODB_MIN_POOL_SIZE,
    maxIdleTimeMS: 60_000,
    retryWrites: true,
  });
  if (!options.migrateTenants) {
    const [migration, tenant] = await Promise.all([
      SystemMigration.findOne({ key: TENANT_MIGRATION_KEY }).lean(),
      mongoose.connection.collection("tenants").findOne({ slug: env.DEFAULT_TENANT_SLUG, status: "ACTIVE" }),
    ]);
    if (!migration || !tenant) throw new Error('Tenant migration has not been finalized. Run "npm run migrate:tenants" before starting this version.');
    return { defaultTenantId: tenant._id.toString() };
  }
  const pending = await inspectPendingTenantMigration();
  if (pending.length) console.log(`Tenant migration preflight found ${pending.reduce((sum, collection) => sum + collection.records, 0)} records`);
  {
    const tenant = await ensureDefaultTenant();
    const report = await migrateExistingRecordsToDefaultTenant(tenant._id);
    const migrated = report.collections.reduce((sum, collection) => sum + collection.migrated, 0) + report.gridFsFilesMigrated;
    console.log(`Tenant migration assigned ${migrated} existing records to ${tenant.slug}`);
    await SystemMigration.findOneAndUpdate({ key: TENANT_MIGRATION_KEY }, { $set: { appliedAt: new Date(), details: { defaultTenantId: tenant.id, collections: report.collections.length } } }, { upsert: true, new: true });
    return { defaultTenantId: tenant.id };
  }
};

export const disconnectDatabase = async (): Promise<void> => mongoose.disconnect();
