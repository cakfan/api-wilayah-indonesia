import { describe, it, expect } from "bun:test";
import { successResponse, errorResponse } from "@/lib/response";

describe("successResponse", () => {
  it("should return data only", () => {
    const result = successResponse({ name: "test" });
    expect(result).toEqual({ data: { name: "test" } });
  });

  it("should return data with meta", () => {
    const meta = { total: 10, page: 1, limit: 50, totalPages: 1 };
    const result = successResponse([1, 2, 3], meta);
    expect(result).toEqual({ data: [1, 2, 3], meta });
  });
});

describe("errorResponse", () => {
  it("should return error with code and message", () => {
    const result = errorResponse("NOT_FOUND", "Resource not found");
    expect(result).toEqual({ error: { code: "NOT_FOUND", message: "Resource not found" } });
  });
});
