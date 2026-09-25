import assert from "node:assert/strict";
import test from "node:test";
import { createEmployeeSchema, updateEmployeeSchema, updateMyProfileSchema } from "./employeeValidators.js";

const validEmployee = { employeeId: " mb-2026-001 ", firstName: "Asha", lastName: "Rao", officialEmail: "asha@example.com", department: "507f191e810c19729de860ea", designation: "507f191e810c19729de860eb", dateOfJoining: "2026-09-11", employmentType: "FULL_TIME", role: "EMPLOYEE", status: "ONBOARDING" };

test("employee creation requires a manually supplied employee ID", () => {
  assert.equal(createEmployeeSchema.safeParse({ body: { ...validEmployee, employeeId: "" } }).success, false);
  const result = createEmployeeSchema.parse({ body: validEmployee });
  assert.equal(result.body.employeeId, "MB-2026-001");
});

test("employee ID can be changed during or after onboarding", () => {
  const result = updateEmployeeSchema.parse({ params: { id: "507f191e810c19729de860ec" }, body: { employeeId: " mb-2026-099 " } });
  assert.equal(result.body.employeeId, "MB-2026-099");
  assert.equal(updateEmployeeSchema.safeParse({ params: { id: "507f191e810c19729de860ec" }, body: { employeeId: "" } }).success, false);
});

test("statutory IDs and banking details parse properly in updateMyProfileSchema", () => {
  const result = updateMyProfileSchema.parse({
    body: {
      personal: {
        panNumber: "ABCDE1234F",
        aadhaarNumber: "1234 5678 9012",
        taxId: "UAN10029384"
      },
      bankDetails: {
        accountHolderName: "Asha Rao",
        accountNumber: "987654321098",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
        branchName: "Civil Lines, Raipur"
      }
    }
  });

  assert.equal(result.body.personal?.panNumber, "ABCDE1234F");
  assert.equal(result.body.personal?.aadhaarNumber, "1234 5678 9012");
  assert.equal(result.body.bankDetails?.bankName, "HDFC Bank");
  assert.equal(result.body.bankDetails?.ifscCode, "HDFC0001234");
});
