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
  AI_PROVIDER: z.enum(["groq", "openai", "openrouter", "together", "anthropic", "gemini", "generic"]).default("groq"),
  AI_API_KEY: z.string().optional(), GROQ_API_KEY: z.string().optional(), OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(), GEMINI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(), AI_MODEL: z.string().optional(), AI_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(120_000).default(45_000),
  AI_COMPANY_KNOWLEDGE: z.string().max(20_000).optional(),
  SUPER_ADMIN_NAME: z.string().optional(), SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
  ATTENDANCE_OFFICE_NAME: z.string().default("Shivnath Business Centre, Raipur"),
  ATTENDANCE_OFFICE_LATITUDE: z.coerce.number().min(-90).max(90).default(21.251413450117614),
  ATTENDANCE_OFFICE_LONGITUDE: z.coerce.number().min(-180).max(180).default(81.70943785263866),
  ATTENDANCE_RADIUS_METERS: z.coerce.number().int().min(50).max(5000).default(300),
  ATTENDANCE_MAX_ACCURACY_METERS: z.coerce.number().int().min(10).max(1000).default(200)
});

const result = schema.safeParse(process.env);
if (!result.success) throw new Error(`Invalid environment configuration: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`);
export const env = result.data;
