import assert from "node:assert/strict";
import test from "node:test";
import { assistantJson } from "./aiFeatureService.js";

test("assistant context is bounded below provider input limits", () => {
  assert.equal(assistantJson({ records: "x".repeat(20_000) }).length, 6_000);
});
