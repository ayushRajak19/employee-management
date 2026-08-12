import { z } from "zod";
const location = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().positive().max(5000) });
export const attendanceLocationSchema = z.object({ body: location });
export const attendanceRegisterSchema = z.object({ query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), department: z.string().regex(/^[a-f\d]{24}$/i).optional(), search: z.string().trim().max(100).optional() }) });
export const attendanceOfficeSchema = z.object({ body: location.extend({ name: z.string().trim().min(3).max(200).default("Shivnath Business Centre, Raipur"), radiusMeters: z.number().int().min(50).max(1000).default(300) }) });
