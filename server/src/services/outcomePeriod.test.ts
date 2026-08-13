import assert from "node:assert/strict";
import test from "node:test";
import { periodBounds } from "./outcomeService.js";

test("performance period bounds cover the selected calendar window", () => {
  assert.deepEqual(periodBounds("2026-08", "MONTHLY"), {
    start: new Date("2026-08-01T00:00:00.000Z"),
    end: new Date("2026-09-01T00:00:00.000Z")
  });
  assert.deepEqual(periodBounds("2026-Q3", "QUARTERLY"), {
    start: new Date("2026-07-01T00:00:00.000Z"),
    end: new Date("2026-10-01T00:00:00.000Z")
  });
  assert.deepEqual(periodBounds("2026-H2", "HALF_YEARLY"), {
    start: new Date("2026-07-01T00:00:00.000Z"),
    end: new Date("2027-01-01T00:00:00.000Z")
  });
  assert.deepEqual(periodBounds("2026", "ANNUAL"), {
    start: new Date("2026-01-01T00:00:00.000Z"),
    end: new Date("2027-01-01T00:00:00.000Z")
  });
});

test("invalid performance period formats are rejected", () => {
  assert.throws(() => periodBounds("2026-13", "MONTHLY"), /invalid month/);
  assert.throws(() => periodBounds("2026-Q5", "QUARTERLY"), /YYYY-Q1/);
  assert.throws(() => periodBounds("2026-H3", "HALF_YEARLY"), /YYYY-H1/);
});
