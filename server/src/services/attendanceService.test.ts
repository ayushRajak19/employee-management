import test from "node:test"; import assert from "node:assert/strict";
import { attendanceMath } from "./attendanceService.js";
test("office distance is zero at the configured office pin", () => { assert.equal(attendanceMath.distance({ latitude: attendanceMath.office.latitude, longitude: attendanceMath.office.longitude, accuracy: 10 }, attendanceMath.office), 0); });
test("attendance dates use the India timezone", () => { assert.equal(attendanceMath.dateKey(new Date("2026-08-12T20:00:00.000Z")), "2026-08-13"); });
