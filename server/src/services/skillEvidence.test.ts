import assert from "node:assert/strict";
import test from "node:test";
import { buildSkillEvidence } from "./skillEvidence.js";

test("high self-rating needs a consistent related work record", () => {
  const skill = { skillId: "sales", name: "Prospect identification", category: "Sales", tools: "CRM, LinkedIn", description: "", rating: 9 };
  const task = { _id: "1", taskId: "TSK-1", name: "Build LinkedIn prospect list", status: "COMPLETED", deadline: new Date("2026-01-02"), completionDate: new Date("2026-01-01"), estimatedHours: 4, actualHours: 4, qualityRating: 5 };
  assert.equal(buildSkillEvidence(skill, [task]).status, "NEEDS_EVIDENCE");
  assert.equal(buildSkillEvidence(skill, [task, { ...task, _id: "2" }]).status, "NEEDS_EVIDENCE");
  assert.equal(buildSkillEvidence(skill, [task, { ...task, _id: "2" }, { ...task, _id: "3" }]).status, "JUSTIFIED");
});
test("unreviewed work and work tagged with another skill do not prove a claim", () => {
  const skill = { skillId: "sales", name: "Prospect identification", category: "Sales", description: "", rating: 9 };
  const task = { _id: "1", taskId: "TSK-1", name: "Sales prospect list", skillId: "finance", status: "COMPLETED", deadline: new Date("2026-01-02"), completionDate: new Date("2026-01-01"), estimatedHours: 4, actualHours: 2, qualityRating: 5 };
  assert.equal(buildSkillEvidence(skill, [task]).matchedTasks, 0);
  assert.equal(buildSkillEvidence(skill, [{ ...task, skillId: "sales", qualityRating: undefined }]).status, "UNTESTED");
});
