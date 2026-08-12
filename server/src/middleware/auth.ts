import type { RequestHandler } from "express";
import type { PermissionName } from "@mobiusbloom/shared";
import { verifyAccessToken } from "../services/tokenService.js";
import { getSessionUser } from "../services/authService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (request, _response, next) => {
  const token = request.cookies.access_token as string | undefined;
  if (!token) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  try { const payload = verifyAccessToken(token); if (!payload.sub || payload.type !== "access") throw new Error(); request.user = await getSessionUser(payload.sub); next(); }
  catch { throw new AppError("Authentication required", 401, "UNAUTHENTICATED"); }
});
export const requirePermission = (...permissions: PermissionName[]): RequestHandler => (request, _response, next) => {
  if (!request.user || !permissions.every((permission) => request.user?.permissions.includes(permission))) return next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
  next();
};
