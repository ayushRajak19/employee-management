import assert from "node:assert/strict";
import test from "node:test";
import { createEmployeeSchema } from "./employeeValidators.js";

const validEmployee = { employeeId: " mb-2026-001 ", firstName: "Asha", lastName: "Rao", officialEmail: "asha@example.com", department: "507f191e810c19729de860ea", designation: "507f191e810c19729de860eb", dateOfJoining: "2026-09-11", employmentType: "FULL_TIME", role: "EMPLOYEE", status: "ONBOARDING" };

test("employee creation requires a manually supplied employee ID", () => {
  assert.equal(createEmployeeSchema.safeParse({ body: { ...validEmployee, employeeId: "" } }).success, false);
  const result = createEmployeeSchema.parse({ body: validEmployee });
  assert.equal(result.body.employeeId, "MB-2026-001");
});
