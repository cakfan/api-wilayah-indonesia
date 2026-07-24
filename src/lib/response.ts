import type { Meta } from "@/types/region.types";

export interface SuccessResponse<T> {
  data: T;
  meta?: Meta;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function successResponse<T>(data: T, meta?: Meta): SuccessResponse<T> {
  const response: SuccessResponse<T> = { data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function errorResponse(code: string, message: string): ErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}
