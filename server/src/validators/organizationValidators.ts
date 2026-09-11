import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const code = z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/).transform((v) => v.toUpperCase());
const capabilities = z.array(z.enum(["SALES_MODULE"])).default([]);
export const departmentSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, description: z.string().trim().max(500).optional(), capabilities }) });
export const teamSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, department: objectId, description: z.string().trim().max(500).optional() }) });
export const designationSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(120), code, department: objectId.optional(), level: z.string().trim().max(50).optional(), description: z.string().trim().max(500).optional(), catalogRole: z.string().trim().max(120).optional() }) });
export const updateDepartmentSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ name: z.string().trim().min(2).max(120).optional(), code: code.optional(), description: z.string().trim().max(500).optional(), capabilities: capabilities.optional() }) });
export const updateTeamSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ name: z.string().trim().min(2).max(120).optional(), code: code.optional(), department: objectId.optional(), description: z.string().trim().max(500).optional() }) });
export const updateDesignationSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ name: z.string().trim().min(2).max(120).optional(), code: code.optional(), department: objectId.optional(), level: z.string().trim().max(50).optional(), description: z.string().trim().max(500).optional(), catalogRole: z.string().trim().max(120).optional() }) });

export const designationSkillItemSchema = z.object({
  id: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  level: z.enum(["Basic", "Intermediate", "Advanced"]).default("Basic"),
  tools: z.string().trim().max(200).optional(),
  description: z.string().trim().min(1).max(1000),
  assessmentQuestion: z.string().trim().max(1000).optional(),
});

export const updateDesignationSkillsSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    skills: z.array(designationSkillItemSchema),
    catalogRole: z.string().trim().max(120).optional(),
  }),
});

export const generateSkillsSchema = z.object({
  body: z.object({
    designationTitle: z.string().trim().min(1).max(120),
    department: z.string().trim().max(120).optional(),
    level: z.string().trim().max(50).optional(),
    jobDescription: z.string().trim().max(25000).optional(),
    skillCount: z.number().int().min(3).max(20).optional(),
  }),
});

