import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const configuredEmails = () => new Set(
  [env.PLATFORM_ADMIN_EMAILS, env.SUPER_ADMIN_EMAIL]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

export const isPlatformAdminEmail = (email: string): boolean => configuredEmails().has(email.toLowerCase());

export const requirePlatformAdmin: RequestHandler = (request, _response, next) => {
  if (!request.user || request.user.role !== "SUPER_ADMIN" || !isPlatformAdminEmail(request.user.email)) {
    return next(new AppError("Platform administrator access is required", 403, "PLATFORM_ADMIN_REQUIRED"));
  }
  next();
};
