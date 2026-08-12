export class AppError extends Error {
  constructor(message: string, public readonly statusCode = 500, public readonly code = "INTERNAL_ERROR", public readonly errors?: Record<string, string[]>) { super(message); }
}
