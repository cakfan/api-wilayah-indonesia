import { z } from "zod";
import { extendZodWithOpenApi } from "@hono/zod-openapi";

extendZodWithOpenApi(z);

const provinceSchema = z
  .object({
    code: z.string().openapi({ example: "11" }),
    name: z.string().openapi({ example: "ACEH" }),
  })
  .openapi("Province");

const regencySchema = z
  .object({
    code: z.string().openapi({ example: "11.01" }),
    province_code: z.string().openapi({ example: "11" }),
    name: z.string().openapi({ example: "KAB. ACEH SELATAN" }),
    type: z.enum(["kabupaten", "kota"]).openapi({ example: "kabupaten" }),
  })
  .openapi("Regency");

const districtSchema = z
  .object({
    code: z.string().openapi({ example: "11.01.01" }),
    regency_code: z.string().openapi({ example: "11.01" }),
    name: z.string().openapi({ example: "Kec. Bakongan" }),
  })
  .openapi("District");

const villageSchema = z
  .object({
    code: z.string().openapi({ example: "11.01.01.2001" }),
    district_code: z.string().openapi({ example: "11.01.01" }),
    name: z.string().openapi({ example: "Desa Bakongan" }),
    type: z.enum(["kelurahan", "desa"]).openapi({ example: "desa" }),
    postal_code: z.string().nullable().openapi({ example: "23773" }),
    latitude: z.number().nullable().openapi({ example: 2.9561 }),
    longitude: z.number().nullable().openapi({ example: 97.2847 }),
  })
  .openapi("Village");

const metaSchema = z
  .object({
    total: z.number().openapi({ example: 38 }),
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 50 }),
    totalPages: z.number().openapi({ example: 1 }),
  })
  .openapi("Meta");

const errorSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "NOT_FOUND" }),
      message: z.string().openapi({ example: "Province with code '99' not found" }),
    }),
  })
  .openapi("Error");

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

const typeQuery = z
  .enum(["provinsi", "kabupaten", "kota", "kecamatan", "kelurahan", "desa"])
  .optional()
  .openapi({
    param: { name: "type", in: "query" },
    example: "kota",
  });

export {
  provinceSchema,
  regencySchema,
  districtSchema,
  villageSchema,
  metaSchema,
  errorSchema,
  pageQuery,
  limitQuery,
  qQuery,
  typeQuery,
};
