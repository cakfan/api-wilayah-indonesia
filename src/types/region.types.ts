import type { z } from "zod";
import {
  provinceSchema,
  regencySchema,
  districtSchema,
  villageSchema,
  metaSchema,
} from "../schemas/region.schema";

export type Province = z.infer<typeof provinceSchema>;
export type Regency = z.infer<typeof regencySchema>;
export type District = z.infer<typeof districtSchema>;
export type Village = z.infer<typeof villageSchema>;
export type Meta = z.infer<typeof metaSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface SingleResponse<T> {
  data: T;
}
