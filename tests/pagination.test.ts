import { describe, it, expect } from "bun:test";
import { calculatePagination, getOffset } from "@/lib/pagination";

describe("calculatePagination", () => {
  it("should calculate pagination correctly", () => {
    const result = calculatePagination(100, 1, 50);
    expect(result).toEqual({ total: 100, page: 1, limit: 50, totalPages: 2 });
  });

  it("should handle exact division", () => {
    const result = calculatePagination(100, 2, 50);
    expect(result).toEqual({ total: 100, page: 2, limit: 50, totalPages: 2 });
  });

  it("should handle zero total", () => {
    const result = calculatePagination(0, 1, 50);
    expect(result).toEqual({ total: 0, page: 1, limit: 50, totalPages: 0 });
  });

  it("should round up totalPages", () => {
    const result = calculatePagination(51, 1, 50);
    expect(result.totalPages).toBe(2);
  });

  it("should handle single item", () => {
    const result = calculatePagination(1, 1, 50);
    expect(result).toEqual({ total: 1, page: 1, limit: 50, totalPages: 1 });
  });
});

describe("getOffset", () => {
  it("should return 0 for page 1", () => {
    expect(getOffset(1, 50)).toBe(0);
  });

  it("should return correct offset for page 2", () => {
    expect(getOffset(2, 50)).toBe(50);
  });

  it("should return correct offset for page 3 with limit 20", () => {
    expect(getOffset(3, 20)).toBe(40);
  });
});
