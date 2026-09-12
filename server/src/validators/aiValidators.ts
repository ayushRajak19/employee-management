import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const assistantSchema = z.object({ body: z.object({ question: z.string().trim().min(2).max(500), employeeId: objectId.optional(), history: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().trim().min(1).max(1_500) })).max(8).optional() }) });
export const employeeSummarySchema = z.object({ params: z.object({ id: objectId }) });
export const jokeSchema = z.object({ query: z.object({ index: z.coerce.number().int().min(0).max(2).default(0) }) });
