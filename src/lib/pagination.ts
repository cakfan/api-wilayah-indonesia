import type { Meta } from "@/types/region.types";

export function calculatePagination(
  total: number,
  page: number,
  limit: number
): Meta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
  };
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
