import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const code = z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase());
export const departmentSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, description: z.string().trim().max(500).optional() }) });
export const teamSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, department: objectId, description: z.string().trim().max(500).optional() }) });
export const designationSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, department: objectId.optional(), level: z.string().trim().max(50).optional(), description: z.string().trim().max(500).optional() }) });
