import test from "node:test";
import assert from "node:assert/strict";
import { summarizeTasks, type AnalyticsTask } from "./adminAnalyticsMath.js";
const now = new Date("2026-09-07T12:00:00Z");
const task = (changes: Partial<AnalyticsTask> = {}): AnalyticsTask => ({ isActive: true, status: "IN_PROGRESS", deadline: new Date("2026-09-06T12:00:00Z"), estimatedHours: 5, ...changes });
test("analytics excludes deleted and cancelled tasks and counts overlapping review issues", () => {
  const totals = summarizeTasks([task({ isActive: false }), task({ status: "CANCELLED" }), task({ status: "IN_REVIEW" }), task({ actualHours: 8 })], now);
  assert.equal(totals.total, 2); assert.equal(totals.open, 2); assert.equal(totals.overdue, 2); assert.equal(totals.review, 1); assert.equal(totals.remainingHours, 0);
});
test("on-time rate excludes missing completion dates and includes exact deadline", () => {
  const totals = summarizeTasks([task({ status: "COMPLETED", completionDate: new Date("2026-09-06T12:00:00Z") }), task({ status: "COMPLETED", completionDate: now }), task({ status: "COMPLETED" })], now);
  assert.equal(totals.completed, 3); assert.equal(totals.datedCompletions, 2); assert.equal(totals.onTimeRate, 50); assert.equal(totals.overdue, 0);
});
test("empty analytics is not reported as zero-percent delivery", () => { assert.equal(summarizeTasks([], now).onTimeRate, null); assert.equal(summarizeTasks([task({ deadline: now })], now).overdue, 0); });
