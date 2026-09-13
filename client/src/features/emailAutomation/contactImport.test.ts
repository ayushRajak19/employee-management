import assert from "node:assert/strict";
import test from "node:test";
import { mapContactRows, suggestContactColumns } from "./contactImport.js";

test("Excel contact columns are suggested, mapped, and invalid rows are rejected", () => {
  const headers = ["Vendor Name", "Company Name", "Work Email"];
  const columns = suggestContactColumns(headers);
  assert.deepEqual(columns, { name: 0, companyName: 1, email: 2, source: null });
  const result = mapContactRows({ fileName: "vendors.xlsx", headers, rows: [["Jane", "Acme", "JANE@ACME.COM"], ["Bad", "Row", "not-email"]] }, columns, "2026-09-13T00:00:00.000Z");
  assert.equal(result.contacts[0]?.email, "jane@acme.com");
  assert.equal(result.contacts[0]?.source, "Excel import: vendors.xlsx");
  assert.deepEqual(result.errors, ["Row 3: invalid email"]);
});
