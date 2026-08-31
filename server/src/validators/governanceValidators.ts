import { z } from "zod"; import { DOCUMENT_CATEGORIES } from "../models/Document.js"; const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const documentMetadataSchema = z.object({ employee: objectId, category: z.enum(DOCUMENT_CATEGORIES) });
export const resumeMetadataSchema = z.object({ employee: objectId });
export const resumeListSchema = z.object({ query: z.object({ department: objectId.optional() }) });
export const resumeScreeningSchema = z.object({ jobTitle: z.string().trim().min(2).max(160), jobDescription: z.string().trim().min(100).max(30_000) });
export const jobDescriptionSchema = z.object({ title: z.string().trim().min(2).max(160), description: z.string().trim().min(100).max(30_000) });
export const searchSchema = z.object({ query: z.object({ q: z.string().trim().min(2).max(100) }) });
export const reportSchema = z.object({ query: z.object({ type: z.enum(["EMPLOYEE","DEPARTMENT","SKILL","SKILL_GAP","TASK_PERFORMANCE","PROJECT","PERFORMANCE","KPI","GOAL","TRAINING"]) }) });
