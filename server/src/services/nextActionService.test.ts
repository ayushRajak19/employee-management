import assert from "node:assert/strict";
import test from "node:test";
import { rankNextActions } from "./nextActionService.js";

test("next actions rank deterministically by urgency, value, probability and effort", () => {
  const base = { entityType: "lead" as const, clientName: "Client", recommendedAction: "Follow up", suggestedTiming: "Now", reasonCodes: ["test"], draftScriptOrNote: "Call", urgency: "HIGH" as const, conversionProbability: 60 };
  const ranked = rankNextActions([
    { ...base, id: "email", entityId: "1", title: "Email", dealValue: 100_000, confidenceScore: 60, recommendedChannel: "EMAIL" },
    { ...base, id: "meeting", entityId: "2", title: "Meeting", dealValue: 100_000, confidenceScore: 60, recommendedChannel: "MEETING" },
    { ...base, id: "critical", entityId: "3", title: "Critical", dealValue: 100_000, confidenceScore: 60, recommendedChannel: "CALL", urgency: "CRITICAL" },
  ]);
  assert.deepEqual(ranked.map((item) => item.id), ["critical", "email", "meeting"]);
  assert.equal(ranked[0]?.priorityScore, 150_000);
});
