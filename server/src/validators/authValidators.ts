import { z } from "zod";
export const loginSchema = z.object({ body: z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) }) });
export const changePasswordSchema = z.object({ body: z.object({ currentPassword: z.string().min(8).max(128), newPassword: z.string().min(12).max(128).regex(/[A-Z]/, "Must include an uppercase letter").regex(/[a-z]/, "Must include a lowercase letter").regex(/[0-9]/, "Must include a number").regex(/[^A-Za-z0-9]/, "Must include a symbol") }) });
export const requestPasswordResetSchema = z.object({ body: z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase()) }) });
export const resetPasswordSchema = z.object({ body: z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase()), token: z.string().length(64), newPassword: z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/) }) });
