import { z } from "zod";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Use lowercase letters, numbers and hyphens");
export const createTenantSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(120),
  slug: slug.optional(),
  industry: z.string().trim().min(2).max(80).optional(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  website: z.string().trim().url().max(200).optional().or(z.literal("").transform(() => undefined)),
  referralSource: z.string().trim().min(2).max(80).optional(),
  primaryUseCase: z.string().trim().min(2).max(120).optional(),
  plan: z.enum(["STANDARD", "ENTERPRISE"]).default("STANDARD"),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().email().max(254).transform((value) => value.toLowerCase()),
  temporaryPassword: z.string().min(12).max(128).regex(/[A-Z]/, "Must include an uppercase letter").regex(/[a-z]/, "Must include a lowercase letter").regex(/[0-9]/, "Must include a number").regex(/[^A-Za-z0-9]/, "Must include a symbol"),
}) });
export const updateTenantStatusSchema = z.object({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }), body: z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }) });
