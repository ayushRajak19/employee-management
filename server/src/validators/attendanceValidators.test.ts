import test from "node:test";
import assert from "node:assert/strict";
import { attendanceOfficeSchema, attendanceRadiusSchema } from "./attendanceValidators.js";

test("attendance radius accepts whole metres from 50 through 5,000", () => {
  for (const radiusMeters of [50, 300, 5000]) {
    assert.equal(attendanceRadiusSchema.parse({ body: { radiusMeters } }).body.radiusMeters, radiusMeters);
  }
});

test("attendance radius rejects unsafe bounds and fractional metres", () => {
  for (const radiusMeters of [49, 50.5, 5001]) {
    assert.equal(attendanceRadiusSchema.safeParse({ body: { radiusMeters } }).success, false);
  }
});

test("office calibration accepts the same radius range", () => {
  const result = attendanceOfficeSchema.parse({ body: { latitude: 21.2, longitude: 81.6, accuracy: 10, name: "Main office", radiusMeters: 5000 } });
  assert.equal(result.body.radiusMeters, 5000);
});
