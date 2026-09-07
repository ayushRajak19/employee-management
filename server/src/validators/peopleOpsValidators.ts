import { z } from "zod"; import { BADGES } from "../models/Recognition.js"; import { LEAVE_TYPES } from "../models/LeaveRequest.js"; import { PERMISSIONS } from "@mobius-ems/shared"; const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const leaveSchema = z.object({ body: z.object({ type: z.enum(LEAVE_TYPES), startDate: z.coerce.date(), endDate: z.coerce.date(), reason: z.string().trim().min(3).max(2000) }).refine((value) => value.endDate >= value.startDate, { path: ["endDate"], message: "End date must be on or after start date" }) });
export const leaveReviewSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ status: z.enum(["APPROVED","REJECTED"]), reviewComment: z.string().trim().max(1000).optional() }) });
export const recognitionSchema = z.object({ body: z.object({ employee: objectId, badge: z.enum(BADGES), explanation: z.string().trim().min(5).max(1000), evidence: z.array(z.string().trim().max(500)).max(20).default([]) }) });
export const rolePermissionsSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length) }) });
export const administratorSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: z.enum(["SUPER_ADMIN", "HR_ADMIN"]),
}) });

