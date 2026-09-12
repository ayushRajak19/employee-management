import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const assistantSchema = z.object({ body: z.object({ question: z.string().trim().min(2).max(500), employeeId: objectId.optional() }) });
export const employeeSummarySchema = z.object({ params: z.object({ id: objectId }) });
export const jokeSchema = z.object({ query: z.object({ index: z.coerce.number().int().min(0).max(2).default(0) }) });
