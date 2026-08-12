import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const verifyRequestOrigin: RequestHandler = (request, _response, next) => {
  if (SAFE_METHODS.has(request.method)) return next();
  const origin = request.get("origin");
  if (origin && origin !== env.CLIENT_URL) return next(new AppError("Request origin is not allowed", 403, "INVALID_ORIGIN"));
  next();
};
