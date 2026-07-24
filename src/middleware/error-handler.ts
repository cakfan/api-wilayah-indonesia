import type { ErrorHandler } from "hono";
import { errorResponse } from "@/lib/response";
import { logger } from "@/lib/logger";

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, "Request error");

  if (err.message.includes("not found") || err.message.includes("Not Found")) {
    return c.json(errorResponse("NOT_FOUND", err.message), 404);
  }

  if (err.message.includes("validation") || err.message.includes("Validation")) {
    return c.json(errorResponse("VALIDATION_ERROR", err.message), 400);
  }

  return c.json(errorResponse("INTERNAL_ERROR", "Internal server error"), 500);
};
