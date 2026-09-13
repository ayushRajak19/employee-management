import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const workflowBody = z.object({
  name: z.string().trim().min(3).max(160),
  audience: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(250),
  message: z.string().trim().min(5).max(20_000),
  followUp: z.boolean().default(true),
  delayDays: z.coerce.number().int().min(1).max(90).default(3),
  followUpSubject: z.string().trim().max(250).optional(),
  followUpMessage: z.string().trim().max(20_000).optional(),
});
export const createWorkflowSchema = z.object({ body: workflowBody });
export const updateWorkflowSchema = z.object({ params: z.object({ id: objectId }), body: workflowBody.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field") });
export const workflowIdSchema = z.object({ params: z.object({ id: objectId }) });
const contact = z.object({
  name: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  source: z.string().trim().min(2).max(200),
  consentAt: z.coerce.date().refine((value) => value <= new Date(), "Consent date cannot be in the future"),
});
export const contactsSchema = z.object({ body: z.object({ contacts: z.array(contact).min(1).max(1000) }) });
export const contactStatusSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ status: z.enum(["ACTIVE", "REPLIED", "UNSUBSCRIBED", "BOUNCED", "BLOCKED"]) }) });
export const testEmailSchema = z.object({ body: z.object({ recipient: z.string().trim().email().max(254).transform((value) => value.toLowerCase()) }) });
export const unsubscribeSchema = z.object({ params: z.object({ token: z.string().regex(/^[a-f\d]{48}$/i, "Invalid unsubscribe token") }) });
