import assert from "node:assert/strict";
import { test } from "node:test";
import { reportCsv } from "./reportExport.js";

test("CSV exports nested rows, quotes and formula-like values safely", () => {
  const csv = reportCsv([{ employee: { name: 'A," B', code: "=1+1" }, score: 3 }, { employee: { name: "C", code: " @SUM(1)" } }]);
  assert.match(csv, /^\uFEFF"employee.name","employee.code","score"\r\n/);
  assert.match(csv, /"A,"" B","'=1\+1","3"/);
  assert.match(csv, /"C","' @SUM\(1\)",""/);
});
