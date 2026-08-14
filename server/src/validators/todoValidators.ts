import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const type = z.enum(["WORK", "MEETING", "LEARNING", "FOLLOW_UP", "PERSONAL", "OTHER"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const status = z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const deadline = z.string().datetime();

export const todoListSchema = z.object({ query: z.object({ date: date.optional(), employee: objectId.optional(), status: status.optional() }) });
export const todoCreateSchema = z.object({ body: z.object({
  date,
  title: z.string().trim().min(2).max(240),
  type: type.default("WORK"),
  priority: priority.default("MEDIUM"),
  durationMinutes: z.number().int().min(5).max(1440).default(30),
  deadline: deadline.optional()
}) });
export const todoUpdateSchema = z.object({ params: z.object({ id: objectId }), body: z.object({
  date: date.optional(),
  title: z.string().trim().min(2).max(240).optional(),
  type: type.optional(),
  priority: priority.optional(),
  durationMinutes: z.number().int().min(5).max(1440).optional(),
  deadline: deadline.optional(),
  status: status.optional(),
  completed: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, "Provide a change") });
export const todoDeleteSchema = z.object({ params: z.object({ id: objectId }) });
