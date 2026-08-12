import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32), JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"), JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(), CLOUDINARY_API_KEY: z.string().optional(), CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(), SMTP_PORT: z.coerce.number().int().positive().optional(), SMTP_USER: z.string().optional(), SMTP_PASSWORD: z.string().optional(),
  SUPER_ADMIN_NAME: z.string().optional(), SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional()
  ,DEMO_EMPLOYEE_PASSWORD: z.string().min(12).optional()
});

const result = schema.safeParse(process.env);
if (!result.success) throw new Error(`Invalid environment configuration: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
export const env = result.data;
