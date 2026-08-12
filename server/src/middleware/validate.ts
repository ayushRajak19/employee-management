import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";
export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse({ body: request.body, params: request.params, query: request.query });
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) { const key = issue.path.slice(1).join(".") || "request"; (errors[key] ??= []).push(issue.message); }
    return next(new AppError("Validation failed", 422, "VALIDATION_ERROR", errors));
  }
  const value = result.data as { body?: unknown; params?: unknown; query?: unknown };
  if (value.body) request.body = value.body;
  next();
};
