import { z } from "zod";
import { BLOCKER_CATEGORIES } from "../models/WeeklyUpdate.js";
import { CONTRIBUTION_AREAS } from "../models/ContributionReview.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");
const textList = z.array(z.string().trim().min(2).max(1000)).max(12);

export const weeklyUpdateSchema = z.object({ body: z.object({
  weekStart: z.coerce.date(), accomplishments: textList.min(1), currentPriorities: textList.default([]),
  blockers: z.array(z.object({ description: z.string().trim().min(2).max(1000), category: z.enum(BLOCKER_CATEGORIES), external: z.boolean().default(false) })).max(12).default([]),
  helpNeeded: z.string().trim().max(2000).optional(), nextWeekPlan: z.string().trim().max(2000).optional()
}) });
export const acknowledgeWeeklySchema = z.object({ params: z.object({ id: objectId }), body: z.object({ managerComment: z.string().trim().max(2000).optional() }) });
export const checkInSchema = z.object({ body: z.object({ employee: objectId, meetingDate: z.coerce.date(), accomplishments: z.string().trim().max(3000).optional(), challenges: z.string().trim().max(3000).optional(), supportNeeded: z.string().trim().max(3000).optional(), careerGoals: z.string().trim().max(3000).optional(), agreedActions: z.array(z.object({ text: z.string().trim().min(2).max(1000), dueDate: z.coerce.date().optional(), completed: z.boolean().default(false) })).max(20).default([]), nextReviewDate: z.coerce.date().optional() }) });
export const responseSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ employeeResponse: z.string().trim().min(2).max(3000) }) });
export const selfReviewSchema = z.object({ body: z.object({ period, accomplishments: z.string().trim().min(2).max(5000), impact: z.string().trim().min(2).max(5000), collaboration: z.string().trim().min(2).max(5000), growth: z.string().trim().min(2).max(5000), challenges: z.string().trim().max(3000).optional(), evidenceLinks: z.array(z.string().url().max(1000)).max(20).default([]) }) });
const ratings = Object.fromEntries(CONTRIBUTION_AREAS.map((area) => [area, z.number().int().min(1).max(5)])) as Record<typeof CONTRIBUTION_AREAS[number], z.ZodNumber>;
export const managerReviewSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ ratings: z.object(ratings), comment: z.string().trim().min(2).max(5000) }) });
export const snapshotSchema = z.object({ body: z.object({ employee: objectId, period }) });
