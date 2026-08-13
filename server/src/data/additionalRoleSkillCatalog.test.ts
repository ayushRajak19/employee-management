import assert from "node:assert/strict";
import test from "node:test";
import { additionalDesignationPresets, additionalRoleSkillCatalog } from "./additionalRoleSkillCatalog.js";

test("every new designation has 25 unique skill assessment questions", () => {
  assert.equal(additionalDesignationPresets.length, 12);
  for (const preset of additionalDesignationPresets) {
    const items = additionalRoleSkillCatalog.filter((item) => item.role === preset.catalogRole);
    assert.equal(items.length, 25, `${preset.name} should have 25 topics`);
    assert.equal(new Set(items.map((item) => item.id)).size, 25);
    assert.equal(new Set(items.map((item) => item.name)).size, 25);
    assert.ok(items.every((item) => item.assessmentQuestion.length > 40));
  }
});

test("new designation codes are unique and assigned to requested departments", () => {
  assert.equal(new Set(additionalDesignationPresets.map((item) => item.code)).size, additionalDesignationPresets.length);
  assert.deepEqual(additionalDesignationPresets.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.department]: (counts[item.department] ?? 0) + 1 }), {}), { Administration: 3, Marketing: 2, Sales: 7 });
});
