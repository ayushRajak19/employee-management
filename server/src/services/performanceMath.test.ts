import assert from "node:assert/strict";
import test from "node:test";
import { boundedAchievement, classifyPerformance, onTimeRate } from "./performanceMath.js";
const thresholds = { exceptional: 90, strong: 80, consistent: 70, developing: 55 };
test("performance classes are deterministic at threshold boundaries", () => { assert.equal(classifyPerformance(90, thresholds), "Exceptional"); assert.equal(classifyPerformance(80, thresholds), "Strong Performer"); assert.equal(classifyPerformance(54.99, thresholds), "Needs Support"); });
test("on-time rate counts completion at or before deadline", () => { const deadline = new Date("2026-08-10T12:00:00Z"); assert.equal(onTimeRate([{ deadline, completionDate: deadline }, { deadline, completionDate: new Date("2026-08-11T12:00:00Z") }]), 50); assert.equal(onTimeRate([]), 0); });
test("KPI achievement is bounded and handles a zero target", () => { assert.equal(boundedAchievement(150, 100), 150); assert.equal(boundedAchievement(300, 100), 200); assert.equal(boundedAchievement(10, 0), 0); });
