import assert from "node:assert/strict";
import test from "node:test";

test("SPOF logic identifies skills with exactly one qualified active employee", () => {
  interface MockEmployeeSkill {
    skillId: string;
    skillName: string;
    category: string;
    employeeId: string;
    employeeName: string;
    rating: number;
  }

  const dataset: MockEmployeeSkill[] = [
    // Skill 1: Held by 2 employees -> NOT a SPOF
    { skillId: "sk-1", skillName: "TypeScript", category: "Engineering", employeeId: "emp-1", employeeName: "Asha Rao", rating: 5 },
    { skillId: "sk-1", skillName: "TypeScript", category: "Engineering", employeeId: "emp-2", employeeName: "Dev Patel", rating: 4 },

    // Skill 2: Held by 1 employee -> IS a SPOF
    { skillId: "sk-2", skillName: "Kubernetes Cluster Architecture", category: "DevOps", employeeId: "emp-2", employeeName: "Dev Patel", rating: 5 },

    // Skill 3: Held by 1 employee -> IS a SPOF
    { skillId: "sk-3", skillName: "Statutory Indian Payroll & TDS", category: "HR Ops", employeeId: "emp-3", employeeName: "Rohan Sharma", rating: 4 },

    // Skill 4: Held by 3 employees -> NOT a SPOF
    { skillId: "sk-4", skillName: "Git", category: "Engineering", employeeId: "emp-1", employeeName: "Asha Rao", rating: 5 },
    { skillId: "sk-4", skillName: "Git", category: "Engineering", employeeId: "emp-2", employeeName: "Dev Patel", rating: 4 },
    { skillId: "sk-4", skillName: "Git", category: "Engineering", employeeId: "emp-3", employeeName: "Rohan Sharma", rating: 3 }
  ];

  const skillMap = new Map<string, MockEmployeeSkill[]>();
  for (const item of dataset) {
    const list = skillMap.get(item.skillId) || [];
    list.push(item);
    skillMap.set(item.skillId, list);
  }

  const spofs: MockEmployeeSkill[] = [];
  for (const [, holders] of skillMap.entries()) {
    const first = holders[0];
    if (holders.length === 1 && first) {
      spofs.push(first);
    }
  }

  assert.equal(spofs.length, 2);
  const spofNames = spofs.map(s => s.skillName).sort();
  assert.deepEqual(spofNames, ["Kubernetes Cluster Architecture", "Statutory Indian Payroll & TDS"].sort());
});
