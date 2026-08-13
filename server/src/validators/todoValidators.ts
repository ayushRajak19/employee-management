import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const todoListSchema = z.object({ query: z.object({ date }) });
export const todoCreateSchema = z.object({ body: z.object({ date, title: z.string().trim().min(2).max(240) }) });
export const todoUpdateSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ title: z.string().trim().min(2).max(240).optional(), completed: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "Provide a change") });
export const todoDeleteSchema = z.object({ params: z.object({ id: objectId }) });
