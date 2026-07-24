import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";
import { districtSchema, villageSchema, metaSchema, pageQuery, limitQuery } from "@/schemas/region.schema";

const paramsSchema = z.object({
  code: z.string().min(1).openapi({
    param: { name: "code", in: "path" },
    example: "11.01.01",
  }),
});

const getDistrictRoute = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Districts"],
  summary: "Get district by code",
  description: "Get detail of a single district (kecamatan) by its code",
  request: { params: paramsSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: districtSchema }),
        },
      },
      description: "District detail",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "District not found",
    },
  },
});

const listVillagesRoute = createRoute({
  method: "get",
  path: "/{code}/villages",
  tags: ["Districts"],
  summary: "List villages in a district",
  description: "Get a paginated list of villages (kelurahan/desa) within a district",
  request: {
    params: paramsSchema,
    query: z.object({ page: pageQuery, limit: limitQuery }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(villageSchema),
            meta: metaSchema,
          }),
        },
      },
      description: "List of villages",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "District not found",
    },
  },
});

export function registerDistrictsRoutes(app: OpenAPIHono) {
  app.openapi(getDistrictRoute, (c) => {
    const { code } = c.req.valid("param");
    const district = regionService.getDistrictByCode(code);
    if (!district) {
      return c.json(errorResponse("NOT_FOUND", `District with code '${code}' not found`), 404);
    }
    return c.json(successResponse(district), 200);
  });

  app.openapi(listVillagesRoute, (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const district = regionService.getDistrictByCode(code);
    if (!district) {
      return c.json(errorResponse("NOT_FOUND", `District with code '${code}' not found`), 404);
    }

    const result = regionService.getVillagesByDistrict(code, page, limit);
    return c.json(successResponse(result.data, result.meta), 200);
  });
}
