import assert from "node:assert/strict";
import test from "node:test";
import { expiryMilestone } from "./documentExpiryService.js";

test("document alerts follow India calendar days, including the expiry date", () => {
  const now = new Date("2026-09-17T04:00:00.000Z");
  assert.equal(expiryMilestone(new Date("2026-10-18T18:29:59.999Z"), now), null);
  assert.equal(expiryMilestone(new Date("2026-10-17T18:29:59.999Z"), now), 30);
  assert.equal(expiryMilestone(new Date("2026-09-24T18:29:59.999Z"), now), 7);
  assert.equal(expiryMilestone(new Date("2026-09-17T18:29:59.999Z"), now), 0);
  assert.equal(expiryMilestone(new Date("2026-09-16T18:29:59.999Z"), now), 0);
});
