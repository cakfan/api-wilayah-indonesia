import type { Meta } from "@/types/region.types";

export interface SuccessResponse<T> {
  data: T;
  meta?: Meta;
}

export function successResponse<T>(data: T, meta?: Meta): SuccessResponse<T> {
  const response: SuccessResponse<T> = { data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function errorResponse(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  };
}
