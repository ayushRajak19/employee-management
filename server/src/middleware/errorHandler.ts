import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import mongoose from "mongoose";
import multer from "multer";
export const notFound: RequestHandler = (request, _response, next) => next(new AppError(`Route ${request.method} ${request.path} was not found`, 404, "NOT_FOUND"));
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next;
  const duplicate = error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
  const known = error instanceof AppError ? error : error instanceof ZodError ? new AppError("Validation failed", 422, "VALIDATION_ERROR") : error instanceof multer.MulterError ? new AppError(error.code === "LIMIT_FILE_SIZE" ? "Document exceeds the 10 MB limit" : "Invalid document upload", 422, error.code) : duplicate ? new AppError("A record with those details already exists", 409, "DUPLICATE_RECORD") : error instanceof mongoose.Error.CastError ? new AppError("Resource not found", 404, "NOT_FOUND") : new AppError("Unexpected server error");
  if (known.statusCode >= 500 && env.NODE_ENV !== "test") console.error(error);
  response.status(known.statusCode).json({ success: false, message: known.message, ...(known.errors && { errors: known.errors }), ...(env.NODE_ENV === "development" && error instanceof Error && { code: known.code }) });
};
