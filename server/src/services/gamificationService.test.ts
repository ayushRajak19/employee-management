import assert from "node:assert/strict";
import test from "node:test";
import { baseXpForComplexity, levelForXp } from "./gamificationService.js";

test("gamification tier boundaries and task base rewards remain stable", () => {
  assert.deepEqual([0, 300, 800, 1500, 2500, 4000, 6000].map((xp) => levelForXp(xp).level), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(["EASY", "MEDIUM", "HARD", "VERY_HARD"].map((value) => baseXpForComplexity(value as "EASY" | "MEDIUM" | "HARD" | "VERY_HARD")), [50, 100, 200, 200]);
});
