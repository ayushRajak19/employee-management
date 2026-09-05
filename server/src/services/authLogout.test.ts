import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { RefreshSession } from "../models/RefreshSession.js";
import { revokeRefreshToken } from "./authService.js";
import { hashToken } from "./tokenService.js";

test("logout executes session revocation with tenant scope and tolerates repeated logout", async (t) => {
  const tenantId = new Types.ObjectId();
  const token = "isolated-logout-test-token";
  t.mock.method(RefreshSession.collection, "findOne", async () => ({ tenantId }));
  let calls = 0;
  t.mock.method(RefreshSession.collection, "updateOne", async (filter: Record<string, unknown>, update: { $set: { revokedAt: Date } }) => {
    assert.equal(String(filter.tenantId), tenantId.toString());
    assert.equal(filter.tokenHash, hashToken(token));
    assert.deepEqual(filter.revokedAt, { $exists: false });
    assert.ok(update.$set.revokedAt instanceof Date);
    calls += 1;
    return { acknowledged: true, matchedCount: calls === 1 ? 1 : 0, modifiedCount: calls === 1 ? 1 : 0 };
  });
  await revokeRefreshToken(token);
  await revokeRefreshToken(token);
  await revokeRefreshToken(undefined);
  assert.equal(calls, 2);
});
