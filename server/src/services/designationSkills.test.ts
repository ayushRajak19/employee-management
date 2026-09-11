import test from "node:test";
import assert from "node:assert/strict";
import { updateDesignationSkillsSchema } from "../validators/organizationValidators.js";
import { getRoleCatalogSkills } from "./organizationService.js";

test("updateDesignationSkillsSchema validates valid designation skill payload", () => {
  const valid = updateDesignationSkillsSchema.safeParse({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      skills: [
        {
          id: "skill-1",
          name: "System Design",
          category: "Architecture",
          level: "Advanced",
          tools: "Kafka, Redis",
          description: "Design high throughput distributed systems",
          assessmentQuestion: "Describe how you handle event streaming bottlenecks.",
        },
      ],
      catalogRole: "AI/ML Developer",
    },
  });
  assert.equal(valid.success, true);
});

test("updateDesignationSkillsSchema rejects invalid object id or missing description", () => {
  const invalidId = updateDesignationSkillsSchema.safeParse({
    params: { id: "bad-id" },
    body: { skills: [] },
  });
  assert.equal(invalidId.success, false);

  const missingDesc = updateDesignationSkillsSchema.safeParse({
    params: { id: "507f1f77bcf86cd799439011" },
    body: {
      skills: [{ id: "s1", name: "Skill", category: "Cat", level: "Basic", description: "" }],
    },
  });
  assert.equal(missingDesc.success, false);
});

test("getRoleCatalogSkills returns catalog items for standard roles", () => {
  const daSkills = getRoleCatalogSkills("Data Analyst");
  assert.ok(daSkills.length > 0);
  assert.equal(daSkills[0]?.role, "Data Analyst");

  const unknownSkills = getRoleCatalogSkills("NonExistentRole");
  assert.equal(unknownSkills.length, 0);
});
