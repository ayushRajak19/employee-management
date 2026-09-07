import assert from "node:assert/strict";
import test from "node:test";
import { taskIdSchema, taskReassignSchema } from "./workValidators.js";

const taskId = "507f1f77bcf86cd799439011";
const employeeId = "507f191e810c19729de860ea";

test("task reassignment accepts valid task and employee identifiers", () => {
  const result = taskReassignSchema.safeParse({ params: { id: taskId }, body: { assignedEmployee: employeeId } });
  assert.equal(result.success, true);
});

test("task reassignment rejects malformed or missing employee identifiers", () => {
  assert.equal(taskReassignSchema.safeParse({ params: { id: taskId }, body: { assignedEmployee: "invalid" } }).success, false);
  assert.equal(taskReassignSchema.safeParse({ params: { id: taskId }, body: {} }).success, false);
});

test("task deletion requires a valid task identifier", () => {
  assert.equal(taskIdSchema.safeParse({ params: { id: taskId } }).success, true);
  assert.equal(taskIdSchema.safeParse({ params: { id: "not-an-object-id" } }).success, false);
});
