import { z } from "zod";

const codeParam = z.string().openapi({
  param: { name: "code", in: "path" },
  example: "11",
});

const pageQuery = z.coerce.number().int().min(1).default(1).openapi({
  param: { name: "page", in: "query" },
  example: 1,
});

const limitQuery = z.coerce.number().int().min(1).max(200).default(50).openapi({
  param: { name: "limit", in: "query" },
  example: 50,
});

const qQuery = z.string().min(1).openapi({
  param: { name: "q", in: "query" },
  example: "Jakarta",
});

const typeQuery = z.enum(["provinsi", "kabupaten", "kota", "kecamatan", "kelurahan", "desa"]).optional().openapi({
  param: { name: "type", in: "query" },
});

const provinceSchema = z.object({
  code: z.string(),
  name: z.string(),
});

const regencySchema = z.object({
  code: z.string(),
  province_code: z.string(),
  name: z.string(),
  type: z.enum(["kabupaten", "kota"]),
});

const districtSchema = z.object({
  code: z.string(),
  regency_code: z.string(),
  name: z.string(),
});

const villageSchema = z.object({
  code: z.string(),
  district_code: z.string(),
  name: z.string(),
  type: z.enum(["kelurahan", "desa"]),
  postal_code: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

const metaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const successProvincesResponse = z.object({
  data: z.array(provinceSchema),
  meta: metaSchema,
});

const successProvinceResponse = z.object({
  data: provinceSchema,
});

const successRegenciesResponse = z.object({
  data: z.array(regencySchema),
  meta: metaSchema,
});

const successRegencyResponse = z.object({
  data: regencySchema,
});

const successDistrictsResponse = z.object({
  data: z.array(districtSchema),
  meta: metaSchema,
});

const successDistrictResponse = z.object({
  data: districtSchema,
});

const successVillagesResponse = z.object({
  data: z.array(villageSchema),
  meta: metaSchema,
});

const successVillageResponse = z.object({
  data: villageSchema,
});

const searchResponse = z.object({
  data: z.array(z.union([provinceSchema, regencySchema, districtSchema, villageSchema])),
  meta: metaSchema,
});

export {
  codeParam,
  pageQuery,
  limitQuery,
  qQuery,
  typeQuery,
  provinceSchema,
  regencySchema,
  districtSchema,
  villageSchema,
  metaSchema,
  errorSchema,
  successProvincesResponse,
  successProvinceResponse,
  successRegenciesResponse,
  successRegencyResponse,
  successDistrictsResponse,
  successDistrictResponse,
  successVillagesResponse,
  successVillageResponse,
  searchResponse,
};
