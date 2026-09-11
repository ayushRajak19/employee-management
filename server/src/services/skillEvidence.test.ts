import assert from "node:assert/strict";
import test from "node:test";
import { buildSkillEvidence } from "./skillEvidence.js";

test("high self-rating needs a consistent related work record", () => {
  const skill = { skillId: "sales", name: "Prospect identification", category: "Sales", tools: "CRM, LinkedIn", description: "", rating: 9 };
  const task = { _id: "1", taskId: "TSK-1", name: "Build LinkedIn prospect list", status: "COMPLETED", deadline: new Date("2026-01-02"), completionDate: new Date("2026-01-01"), qualityRating: 5 };
  assert.equal(buildSkillEvidence(skill, [task]).status, "NEEDS_EVIDENCE");
  assert.equal(buildSkillEvidence(skill, [task, { ...task, _id: "2" }]).status, "JUSTIFIED");
});
