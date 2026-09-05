import mongoose, { type IndexOptions, type Model, type Types } from "mongoose";
import type { IndexDescriptionInfo } from "mongodb";
import { env } from "../config/env.js";
import { Tenant } from "../models/Tenant.js";
import { getTenantModels } from "./tenantModel.js";
import "./modelRegistry.js";

const sameKeys = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length && leftEntries.every(([key, value], index) => {
    const candidate = rightEntries[index];
    return candidate?.[0] === key && candidate[1] === value;
  });
};

const legacyKeysFor = (fields: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([key]) => key !== "tenantId"));

const safeDropIndex = async (model: Model<unknown>, name: string): Promise<void> => {
  try { await model.collection.dropIndex(name); }
  catch (error: unknown) {
    if (!(error instanceof mongoose.mongo.MongoServerError) || ![26, 27].includes(Number(error.code ?? 0))) throw error;
  }
};

const reconcileIndexes = async (model: Model<unknown>): Promise<void> => {
  let existing: IndexDescriptionInfo[] = [];
  try { existing = await model.collection.indexes(); }
  catch (error: unknown) {
    if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 26) throw error;
  }

  const desired = model.schema.indexes() as [Record<string, unknown>, IndexOptions][];
  for (const [fields, options] of desired) {
    const textIndex = Object.values(fields).includes("text");
    if ((!options.unique && !textIndex) || !Object.hasOwn(fields, "tenantId")) continue;
    const legacyKeys = legacyKeysFor(fields);
    const legacy = textIndex
      ? existing.find((index) => index.name !== "_id_" && index.textIndexVersion !== undefined && index.key.tenantId === undefined)
      : existing.find((index) => index.name !== "_id_" && index.unique && sameKeys(index.key, legacyKeys));
    if (legacy?.name) await safeDropIndex(model, legacy.name);
  }

  await model.createIndexes();

  // Once tenant-leading indexes exist, every old non-TTL/non-_id index is both
  // redundant and unsafe for tenant-local uniqueness.
  existing = await model.collection.indexes().catch(() => []);
  for (const index of existing) {
    if (index.name !== "_id_" && index.expireAfterSeconds === undefined && index.key.tenantId === undefined && index.name) await safeDropIndex(model, index.name);
  }
};

export const inspectPendingTenantMigration = async (): Promise<{ name: string; records: number }[]> => {
  const results = await Promise.all(getTenantModels().map(async (model) => {
    let records = 0;
    try {
      records = await model.collection.countDocuments({ $or: [{ tenantId: { $exists: false } }, { tenantId: null }] });
    } catch (error: unknown) {
      if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 26) throw error;
    }
    return { name: model.collection.collectionName, records };
  }));
  return results.filter((result) => result.records > 0);
};

export const ensureTenantIndexes = async (): Promise<void> => {
  for (const model of getTenantModels()) await reconcileIndexes(model);
};

export const inspectUnsafeTenantIndexes = async (): Promise<{ collection: string; indexes: string[] }[]> => {
  const results = await Promise.all(getTenantModels().map(async (model) => {
    let indexes: IndexDescriptionInfo[] = [];
    try { indexes = await model.collection.indexes(); }
    catch (error: unknown) {
      if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 26) throw error;
    }
    return {
      collection: model.collection.collectionName,
      indexes: indexes.filter((index) => index.name !== "_id_" && index.expireAfterSeconds === undefined && index.key.tenantId === undefined).map((index) => index.name ?? "unnamed"),
    };
  }));
  return results.filter((result) => result.indexes.length > 0);
};

export interface TenantMigrationReport {
  tenantId: string;
  collections: { name: string; migrated: number }[];
  gridFsFilesMigrated: number;
}

export const ensureDefaultTenant = async () => Tenant.findOneAndUpdate(
  { slug: env.DEFAULT_TENANT_SLUG },
  { $setOnInsert: { name: env.DEFAULT_TENANT_NAME, slug: env.DEFAULT_TENANT_SLUG, status: "ACTIVE", plan: "ENTERPRISE", activatedAt: new Date() } },
  { upsert: true, new: true, runValidators: true },
);

export const migrateExistingRecordsToDefaultTenant = async (tenantId: Types.ObjectId): Promise<TenantMigrationReport> => {
  const report: TenantMigrationReport = { tenantId: tenantId.toString(), collections: [], gridFsFilesMigrated: 0 };
  for (const model of getTenantModels()) {
    const result = await model.collection.updateMany(
      { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
      { $set: { tenantId } },
    );
    report.collections.push({ name: model.collection.collectionName, migrated: result.modifiedCount });
    await reconcileIndexes(model);
  }

  const database = mongoose.connection.db;
  if (database) {
    const result = await database.collection("privateDocuments.files").updateMany(
      { $or: [{ "metadata.tenantId": { $exists: false } }, { "metadata.tenantId": null }] },
      { $set: { "metadata.tenantId": tenantId.toString() } },
    );
    report.gridFsFilesMigrated = result.modifiedCount;
    await database.collection("privateDocuments.files").createIndex({ "metadata.tenantId": 1, _id: 1 });
  }
  return report;
};
