import assert from "node:assert/strict";
import test from "node:test";
import { detectMentionedVoiceHours, detectVoiceAction, detectVoiceHours, detectVoiceStatusIntent, extractVoiceAssigner, parseVoiceDeadline, splitVoiceAssignments } from "./voiceTaskService.js";

test("completion intent is detected across supported Indian languages", () => {
  const examples = [
    "I completed the payroll report", "मैंने रिपोर्ट पूरी कर ली", "রিপোর্ট সম্পন্ন হয়েছে", "அறிக்கை முடிந்தது",
    "రిపోర్ట్ పూర్తయింది", "अहवाल पूर्ण केले", "રિપોર્ટ પૂર્ણ છે", "ವರದಿ ಪೂರ್ಣವಾಗಿದೆ", "റിപ്പോർട്ട് പൂർത്തിയായി",
    "ਰਿਪੋਰਟ ਮੁਕੰਮਲ ਹੋਇਆ", "رپورٹ مکمل ہو گئی"
  ];
  for (const example of examples) assert.equal(detectVoiceStatusIntent(example), "complete", example);
});

test("hours are extracted from multilingual number words", () => {
  assert.equal(detectVoiceHours("completed it in three hours"), 3);
  assert.equal(detectVoiceHours("तीन घंटे में पूरा किया"), 3);
  assert.equal(detectVoiceHours("மூன்று மணி நேரத்தில் முடித்தேன்"), 3);
});

test("a future completion deadline is treated as a new assignment", () => {
  const transcript = "I got one task from the manager that I have to complete the employment by 2:00 p.m.";
  assert.equal(detectVoiceStatusIntent(transcript), undefined);
  assert.equal(detectVoiceAction(transcript), "CREATE_TASK");
  assert.equal(extractVoiceAssigner(transcript), "manager");
});

test("named assigners are extracted from natural speech", () => {
  assert.equal(extractVoiceAssigner("I received a task assigned by Priya Sharma to prepare payroll by Friday"), "Priya Sharma");
  assert.equal(extractVoiceAssigner("My team lead told me to update the report"), "team lead");
});

test("deadline time uses the employee browser timezone", () => {
  const deadline = parseVoiceDeadline("finish it today by 2:00 p.m.", -330, new Date("2026-09-01T06:00:00.000Z"));
  assert.equal(deadline, "2026-09-01T08:30:00.000Z");
});

test("deadline clock values are not mistaken for worked hours", () => {
  assert.equal(detectMentionedVoiceHours("complete the report by 2:00 p.m."), undefined);
  assert.equal(detectMentionedVoiceHours("complete the report in two hours"), 2);
});

test("one Hinglish command is split into assignments for multiple employees", () => {
  const assignments = splitVoiceAssignments(
    "Vandana ko payroll report banana hai aur Ayush ko client follow-up karna hai by tomorrow",
    [
      { id: "vandana-id", label: "Vandana Sharma", detail: "EMP-101" },
      { id: "ayush-id", label: "Ayush Rajak", detail: "EMP-102" }
    ]
  );
  assert.deepEqual(assignments, [
    { assignedEmployee: "vandana-id", assigneeLabel: "Vandana Sharma", text: "payroll report banana hai" },
    { assignedEmployee: "ayush-id", assigneeLabel: "Ayush Rajak", text: "client follow-up karna hai by tomorrow" }
  ]);
});

test("ambiguous first names are not guessed", () => {
  const assignments = splitVoiceAssignments("Aman ko report banana hai", [
    { id: "aman-one", label: "Aman Gupta" },
    { id: "aman-two", label: "Aman Sharma" }
  ]);
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0]?.assignedEmployee, undefined);
  assert.equal(assignments[0]?.assigneeLabel, "Aman");
});

test("browser speech spelling variants still resolve separate assignees", () => {
  const assignments = splitVoiceAssignments(
    "Van ko payroll report banana hai aur Aayush ko client follow up karna hai bye tomorrow",
    [
      { id: "vandana-id", label: "Vandana Thapa", detail: "MB-2026-6D3C7E" },
      { id: "ayush-id", label: "Ayush Rajak", detail: "MB-2026-A1B2C3" }
    ]
  );
  assert.equal(assignments.length, 2);
  assert.equal(assignments[0]?.assignedEmployee, "vandana-id");
  assert.equal(assignments[1]?.assignedEmployee, "ayush-id");
});
