import test from "node:test";
import assert from "node:assert/strict";
import { attendanceOfficeSchema, attendanceRadiusSchema, attendanceRegularizeSchema, attendanceReviewRegularizeSchema } from "./attendanceValidators.js";

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

test("attendance regularize schema validates valid regularization requests", () => {
  const parsed = attendanceRegularizeSchema.parse({
    body: {
      dateKey: "2026-09-24",
      reason: "CLIENT_MEETING",
      note: "On-site customer visit in Raipur for contract review"
    }
  });
  assert.equal(parsed.body.dateKey, "2026-09-24");
  assert.equal(parsed.body.reason, "CLIENT_MEETING");
});

test("attendance regularize schema rejects invalid date format or short note", () => {
  assert.equal(attendanceRegularizeSchema.safeParse({
    body: { dateKey: "24-09-2026", reason: "CLIENT_MEETING", note: "Valid note here" }
  }).success, false);

  assert.equal(attendanceRegularizeSchema.safeParse({
    body: { dateKey: "2026-09-24", reason: "CLIENT_MEETING", note: "No" }
  }).success, false);
});

test("attendance review regularize schema accepts approval or rejection", () => {
  const approved = attendanceReviewRegularizeSchema.parse({
    params: { id: "507f191e810c19729de860ea" },
    body: { status: "APPROVED", reviewComment: "Approved after verifying calendar invite." }
  });
  assert.equal(approved.body.status, "APPROVED");

  const rejected = attendanceReviewRegularizeSchema.parse({
    params: { id: "507f191e810c19729de860eb" },
    body: { status: "REJECTED" }
  });
  assert.equal(rejected.body.status, "REJECTED");
});
