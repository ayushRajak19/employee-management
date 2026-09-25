import assert from "node:assert/strict";
import test from "node:test";
import { LEAVE_QUOTAS } from "./peopleOpsService.js";

test("LEAVE_QUOTAS defines appropriate annual limits for standard leave types", () => {
  assert.equal(LEAVE_QUOTAS.CASUAL_LEAVE, 12);
  assert.equal(LEAVE_QUOTAS.SICK_LEAVE, 10);
  assert.equal(LEAVE_QUOTAS.PAID_LEAVE, 15);
  assert.equal(LEAVE_QUOTAS.WORK_FROM_HOME, 24);
  assert.equal(LEAVE_QUOTAS.OTHER, 10);
  assert.equal(LEAVE_QUOTAS.UNPAID_LEAVE, 999);
});

test("leave days calculation computes inclusive calendar day span", () => {
  const calcDays = (start: string, end: string) => {
    return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  assert.equal(calcDays("2026-09-01", "2026-09-01"), 1);
  assert.equal(calcDays("2026-09-01", "2026-09-03"), 3);
  assert.equal(calcDays("2026-09-01", "2026-09-07"), 7);
});

test("leave overlap detection identifies intersecting date intervals", () => {
  const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) => {
    return startA <= endB && endA >= startB;
  };

  const reqStart = new Date("2026-10-05");
  const reqEnd = new Date("2026-10-08");

  // Intersects completely inside
  assert.equal(overlaps(reqStart, reqEnd, new Date("2026-10-06"), new Date("2026-10-07")), true);
  // Partially overlaps start
  assert.equal(overlaps(reqStart, reqEnd, new Date("2026-10-03"), new Date("2026-10-05")), true);
  // Partially overlaps end
  assert.equal(overlaps(reqStart, reqEnd, new Date("2026-10-08"), new Date("2026-10-10")), true);
  // Completely outside before
  assert.equal(overlaps(reqStart, reqEnd, new Date("2026-10-01"), new Date("2026-10-04")), false);
  // Completely outside after
  assert.equal(overlaps(reqStart, reqEnd, new Date("2026-10-09"), new Date("2026-10-12")), false);
});
