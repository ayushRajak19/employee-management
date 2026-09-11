import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const digest = (value: string) => createHash("sha256").update(value).digest();
export const validPlatformOwnerCredentials = (email: string, password: string) => {
  if (!env.PLATFORM_OWNER_EMAIL || !env.PLATFORM_OWNER_PASSWORD) return false;
  return email.toLowerCase() === env.PLATFORM_OWNER_EMAIL.toLowerCase() && timingSafeEqual(digest(password), digest(env.PLATFORM_OWNER_PASSWORD));
};
export const createPlatformToken = () => jwt.sign({ purpose: "platform-owner", email: env.PLATFORM_OWNER_EMAIL }, env.JWT_ACCESS_SECRET, { expiresIn: "8h", audience: "platform-owner", issuer: "mobius-ems" });
export const requirePlatformOwner: RequestHandler = (request, _response, next) => {
  try {
    const token = request.cookies.platform_access_token as string | undefined;
    const payload = token && jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"], audience: "platform-owner", issuer: "mobius-ems" });
    if (!payload || typeof payload === "string" || payload.purpose !== "platform-owner" || payload.email !== env.PLATFORM_OWNER_EMAIL) throw new Error();
    next();
  } catch { next(new AppError("Platform owner authentication required", 401, "PLATFORM_OWNER_REQUIRED")); }
};
