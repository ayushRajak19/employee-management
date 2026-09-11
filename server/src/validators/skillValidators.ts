import { z } from "zod"; import { VERIFICATION_STATUSES } from "../models/EmployeeSkill.js"; import { VERIFICATION_METHODS } from "../models/SkillVerification.js"; import { DIFFICULTIES } from "../models/Assessment.js";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const skillSchema = z.object({ body: z.object({ name: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(80), description: z.string().trim().max(500).optional() }) });
export const claimSkillSchema = z.object({ body: z.object({ skill: objectId, selfRating: z.number().int().min(1).max(10), yearsOfExperience: z.number().min(0).max(60), lastUsed: z.coerce.date().optional(), description: z.string().trim().max(2000).optional(), evidence: z.array(z.object({ type: z.enum(["PROJECT","GITHUB","PORTFOLIO","CERTIFICATE","DOCUMENT","WORK_SAMPLE","COMMENT"]), url: z.string().url().max(1000).optional(), storageKey: z.string().max(500).optional(), comment: z.string().max(1000).optional() })).max(30).default([]) }) });
export const roleSkillAssessmentSchema = z.object({ body: z.object({ ratings: z.array(z.object({ skillId: z.string().trim().min(1).max(30), rating: z.number().int().min(1).max(10), implementationNote: z.string().trim().min(10, "Explain how you implemented every skill").max(1000) })).min(1).max(100) }) });
export const verifySkillSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ status: z.enum(VERIFICATION_STATUSES), verifiedRating: z.number().int().min(1).max(10).optional(), method: z.enum(VERIFICATION_METHODS), justification: z.string().trim().min(5).max(2000), nextReviewDate: z.coerce.date().optional() }).superRefine((value, context) => { if (["VERIFIED","EXPERT_VERIFIED"].includes(value.status) && value.verifiedRating === undefined) context.addIssue({ code: "custom", path: ["verifiedRating"], message: "Verified rating is required" }); }) });
export const designationSkillsSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ requiredSkills: z.array(z.object({ skill: objectId, minimumRating: z.number().int().min(1).max(10), isCritical: z.boolean().default(false) })).max(100) }) });
export const assessmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(160),
    skill: objectId.optional(),
    skillName: z.string().trim().max(160).optional(),
    jobDescription: z.string().trim().max(10000).optional(),
    difficulty: z.enum(DIFFICULTIES).default("INTERMEDIATE"),
    maximumScore: z.number().positive().max(10000).optional(),
    passingScore: z.number().min(0).max(10000).optional(),
    timeLimitMinutes: z.number().int().min(1).max(1440).default(30),
    assignedEmployee: objectId.optional(),
    assignedEmployees: z.array(objectId).min(1).optional(),
    questions: z.array(z.object({
      id: z.string().optional(),
      question: z.string().trim().min(3).max(2000),
      type: z.enum(["MCQ", "OPEN"]).default("MCQ"),
      options: z.array(z.string().trim()).min(2).max(10),
      correctOptionIndex: z.number().int().min(0).max(10).default(0),
      explanation: z.string().trim().max(2000).optional(),
      points: z.number().min(1).max(1000).default(10)
    })).optional()
  }).refine((value) => value.assignedEmployee || (value.assignedEmployees && value.assignedEmployees.length > 0), {
    path: ["assignedEmployee"],
    message: "At least one assigned employee is required"
  }).refine((value) => {
    if (value.maximumScore !== undefined && value.passingScore !== undefined) {
      return value.passingScore <= value.maximumScore;
    }
    return true;
  }, { path: ["passingScore"], message: "Passing score cannot exceed maximum score" })
});

export const generateAssessmentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    jobDescription: z.string().trim().max(10000).optional(),
    skillName: z.string().trim().max(160).optional(),
    questionCount: z.number().int().min(1).max(50).default(10),
    difficulty: z.enum(DIFFICULTIES).default("INTERMEDIATE"),
  })
});

export const submitAssessmentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    answers: z.array(z.object({
      questionId: z.string().trim().min(1),
      selectedOption: z.number().int().min(0).max(10).optional(),
      textAnswer: z.string().trim().max(4000).optional(),
    })).default([])
  })
});

export const assessmentIdParamSchema = z.object({
  params: z.object({ id: objectId })
});

export const assessmentResultSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ attemptDate: z.coerce.date().default(() => new Date()), score: z.number().min(0), notes: z.string().trim().max(2000).optional() }) });

