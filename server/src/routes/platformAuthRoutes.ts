import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { createPlatformToken, requirePlatformOwner, validPlatformOwnerCredentials } from "../middleware/platformOwner.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const platformAuthRouter = Router();
const cookie = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 8 * 60 * 60 * 1000, ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}) };
platformAuthRouter.post("/login", rateLimit({ windowMs: 15 * 60_000, limit: 10 }), validate(z.object({ body: z.object({ email: z.string().email(), password: z.string().min(12).max(128) }) })), asyncHandler(async (request, response) => {
  if (!validPlatformOwnerCredentials(request.body.email, request.body.password)) throw new AppError("Invalid platform owner credentials", 401, "INVALID_PLATFORM_CREDENTIALS");
  response.cookie("platform_access_token", createPlatformToken(), cookie).json({ success: true, message: "Platform owner signed in", data: { owner: { name: env.PLATFORM_OWNER_NAME ?? "Platform Owner", email: env.PLATFORM_OWNER_EMAIL } } });
}));
platformAuthRouter.get("/me", requirePlatformOwner, (_request, response) => response.json({ success: true, message: "Platform owner session retrieved", data: { owner: { name: env.PLATFORM_OWNER_NAME ?? "Platform Owner", email: env.PLATFORM_OWNER_EMAIL } } }));
platformAuthRouter.post("/logout", (_request, response) => { response.clearCookie("platform_access_token", { ...cookie, maxAge: undefined }); response.json({ success: true, message: "Signed out" }); });
