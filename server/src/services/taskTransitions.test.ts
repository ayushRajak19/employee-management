import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionTask } from "./taskTransitions.js";
test("task workflow permits valid review flow", () => { assert.equal(canTransitionTask("IN_PROGRESS", "IN_REVIEW"), true); assert.equal(canTransitionTask("IN_REVIEW", "COMPLETED"), true); });
test("completed and cancelled tasks cannot bypass workflow", () => { assert.equal(canTransitionTask("COMPLETED", "IN_PROGRESS"), false); assert.equal(canTransitionTask("CANCELLED", "NOT_STARTED"), false); });
