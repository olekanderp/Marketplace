import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";
import { ZodError, flattenError } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (m = "Bad request", d?: unknown) => new ApiError(400, m, d);
export const unauthorized = (m = "Authentication required") => new ApiError(401, m);
export const forbidden = (m = "Forbidden") => new ApiError(403, m);
export const notFound = (m = "Not found") => new ApiError(404, m);
export const conflict = (m = "Conflict") => new ApiError(409, m);

export function jsonOk(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return Response.json(
        { error: err.message, details: err.details ?? null },
        { status: err.status },
      );
    }
    if (err instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", details: flattenError(err) },
        { status: 400 },
      );
    }
    if (err instanceof UniqueConstraintError) {
      return Response.json(
        { error: "That value is already taken", details: null },
        { status: 409 },
      );
    }
    if (err instanceof ValidationError) {
      return Response.json(
        { error: err.errors.map((e) => e.message).join("; ") || "Invalid data", details: null },
        { status: 400 },
      );
    }
    if (err instanceof BaseError) {
      console.error("[api] database error:", err);
      return Response.json({ error: "Database error" }, { status: 503 });
    }
    console.error("[api] unhandled error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
}
