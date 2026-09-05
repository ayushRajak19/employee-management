import assert from "node:assert/strict";
import test from "node:test";
import { Schema, Types } from "mongoose";
import { currentTenantId, runWithTenant, TenantContextError } from "./tenantContext.js";
import { tenantModel } from "./tenantModel.js";

interface TestRecord { name: string; externalKey: string }
const schema = new Schema<TestRecord>({
  name: { type: String, required: true, index: true },
  externalKey: { type: String, required: true, unique: true },
});
const TenantIsolationTestRecord = tenantModel<TestRecord>("TenantIsolationTestRecord", schema);

type HookRunner = { execPre(name: string, context: unknown, args: unknown[], callback: (error?: Error | null) => void): void };
const runPreHook = async (name: string, context: unknown, args: unknown[] = []): Promise<void> => {
  const hooks = (TenantIsolationTestRecord.schema as unknown as { s: { hooks: HookRunner } }).s.hooks;
  await new Promise<void>((resolve, reject) => hooks.execPre(name, context, args, (error) => error ? reject(error) : resolve()));
};

test("tenant context remains isolated across concurrent asynchronous work", async () => {
  const first = new Types.ObjectId();
  const second = new Types.ObjectId();
  const values = await Promise.all([
    runWithTenant(first, async () => { await Promise.resolve(); return currentTenantId()?.toString(); }),
    runWithTenant(second, async () => { await Promise.resolve(); return currentTenantId()?.toString(); }),
  ]);
  assert.deepEqual(values, [first.toString(), second.toString()]);
  assert.equal(currentTenantId(), undefined);
});

test("new records receive tenantId and writes without context fail closed", async () => {
  const tenantId = new Types.ObjectId();
  const document = new TenantIsolationTestRecord({ name: "Scoped", externalKey: "scoped" });
  await runWithTenant(tenantId, () => document.validate());
  assert.equal(document.get("tenantId").toString(), tenantId.toString());

  const unscoped = new TenantIsolationTestRecord({ name: "Unscoped", externalKey: "unscoped" });
  await assert.rejects(() => unscoped.validate(), TenantContextError);
});

test("queries are forced to the active tenant and reject a conflicting tenant", async () => {
  const tenantId = new Types.ObjectId();
  const query = TenantIsolationTestRecord.find({ name: "Scoped" });
  await runWithTenant(tenantId, () => runPreHook("find", query));
  assert.equal(query.getFilter().tenantId.toString(), tenantId.toString());

  const conflicting = TenantIsolationTestRecord.find({ tenantId: new Types.ObjectId() });
  await assert.rejects(() => runWithTenant(tenantId, () => runPreHook("find", conflicting)), /Cross-tenant/);
});

test("bulk operations complete and receive tenant scope", async () => {
  const tenantId = new Types.ObjectId();
  const operations: { updateOne: { filter: Record<string, unknown>; update: Record<string, unknown>; upsert: boolean } }[] = [{ updateOne: { filter: { externalKey: "bulk" }, update: { $set: { name: "Bulk" } }, upsert: true } }];
  await runWithTenant(tenantId, () => runPreHook("bulkWrite", TenantIsolationTestRecord, [operations]));
  const item = operations[0]!.updateOne;
  assert.equal((item.filter.tenantId as Types.ObjectId).toString(), tenantId.toString());
  assert.equal((item.update.$setOnInsert as { tenantId: Types.ObjectId }).tenantId.toString(), tenantId.toString());
});

test("batch inserts complete and receive tenant scope", async () => {
  const tenantId = new Types.ObjectId();
  const documents: Record<string, unknown>[] = [{ name: "Batch", externalKey: "batch" }];
  await runWithTenant(tenantId, () => runPreHook("insertMany", TenantIsolationTestRecord, [documents, {}]));
  assert.equal((documents[0]!.tenantId as Types.ObjectId).toString(), tenantId.toString());
});

test("aggregations begin with a tenant match", async () => {
  const tenantId = new Types.ObjectId();
  const aggregate = TenantIsolationTestRecord.aggregate([{ $match: { name: "Scoped" } }]);
  await runWithTenant(tenantId, () => runPreHook("aggregate", aggregate));
  const firstStage = aggregate.pipeline()[0] as { $match: { tenantId: Types.ObjectId } };
  assert.equal(firstStage.$match.tenantId.toString(), tenantId.toString());
});

test("unique and lookup indexes lead with tenantId while TTL remains valid", () => {
  const indexes = TenantIsolationTestRecord.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => fields.tenantId === 1 && fields.externalKey === 1 && options.unique));
  assert.ok(indexes.some(([fields]) => fields.tenantId === 1 && fields.name === 1));
  assert.ok(!indexes.some(([fields]) => fields.externalKey === 1 && fields.tenantId === undefined));
});
