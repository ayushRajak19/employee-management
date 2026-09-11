import test from "node:test";
import assert from "node:assert/strict";
import { generateAssessmentQuestions } from "./assessmentGeneratorService.js";

test("generateAssessmentQuestions produces requested question count with fallback support", async () => {
  const result = await generateAssessmentQuestions({
    title: "Senior Full Stack Engineer",
    jobDescription: "Must have deep experience with React, TypeScript, Node.js, and MongoDB.",
    questionCount: 6,
    difficulty: "ADVANCED"
  });

  assert.equal(result.questions.length, 6);
  assert.ok(result.suggestedTimeMinutes > 0);
  assert.equal(result.suggestedPassingScore, 70);

  for (const q of result.questions) {
    assert.ok(q.id);
    assert.ok(q.question.length > 5);
    assert.equal(q.type, "MCQ");
    assert.equal(q.options.length, 4);
    assert.ok(typeof q.correctOptionIndex === "number" && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4);
    assert.ok(q.explanation && q.explanation.length > 0);
    assert.equal(q.points, 10);
  }
});

test("generateAssessmentQuestions clamps count boundaries", async () => {
  const minResult = await generateAssessmentQuestions({
    title: "QA Engineer",
    questionCount: 0
  });
  assert.equal(minResult.questions.length, 1);

  const maxResult = await generateAssessmentQuestions({
    title: "DevOps Engineer",
    questionCount: 100
  });
  assert.equal(maxResult.questions.length, 50);
});

test("scoring logic evaluates correctly and respects passing threshold", () => {
  const questions = [
    { id: "q1", points: 10, correctOptionIndex: 1 },
    { id: "q2", points: 10, correctOptionIndex: 0 },
    { id: "q3", points: 10, correctOptionIndex: 3 },
    { id: "q4", points: 10, correctOptionIndex: 2 },
  ];

  const maxPoints = questions.reduce((sum, q) => sum + q.points, 0); // 40
  const passingScore = 70; // 70%

  // Test case 1: 3 out of 4 correct (75%) -> PASSED
  const userAnswers1 = [
    { questionId: "q1", selectedOption: 1 }, // correct (+10)
    { questionId: "q2", selectedOption: 0 }, // correct (+10)
    { questionId: "q3", selectedOption: 3 }, // correct (+10)
    { questionId: "q4", selectedOption: 0 }, // wrong (+0)
  ];

  const answerMap1 = new Map(userAnswers1.map((a) => [a.questionId, a]));
  let score1 = 0;
  questions.forEach((q) => {
    const a = answerMap1.get(q.id);
    if (a && a.selectedOption === q.correctOptionIndex) {
      score1 += q.points;
    }
  });

  const pct1 = Math.round((score1 / maxPoints) * 100);
  assert.equal(score1, 30);
  assert.equal(pct1, 75);
  assert.equal(pct1 >= passingScore ? "PASSED" : "FAILED", "PASSED");

  // Test case 2: 2 out of 4 correct (50%) -> FAILED
  const userAnswers2 = [
    { questionId: "q1", selectedOption: 1 }, // correct (+10)
    { questionId: "q2", selectedOption: 0 }, // correct (+10)
    { questionId: "q3", selectedOption: 1 }, // wrong (+0)
    { questionId: "q4", selectedOption: 0 }, // wrong (+0)
  ];

  const answerMap2 = new Map(userAnswers2.map((a) => [a.questionId, a]));
  let score2 = 0;
  questions.forEach((q) => {
    const a = answerMap2.get(q.id);
    if (a && a.selectedOption === q.correctOptionIndex) {
      score2 += q.points;
    }
  });

  const pct2 = Math.round((score2 / maxPoints) * 100);
  assert.equal(score2, 20);
  assert.equal(pct2, 50);
  assert.equal(pct2 >= passingScore ? "PASSED" : "FAILED", "FAILED");
});
