import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";
import { regencySchema, districtSchema, metaSchema, pageQuery, limitQuery } from "@/schemas/region.schema";

const paramsSchema = z.object({
  code: z.string().min(1).openapi({
    param: { name: "code", in: "path" },
    example: "11.01",
  }),
});

const getRegencyRoute = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Regencies"],
  summary: "Get regency by code",
  description: "Get detail of a single regency (kabupaten/kota) by its code",
  request: { params: paramsSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: regencySchema }),
        },
      },
      description: "Regency detail",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "Regency not found",
    },
  },
});

const listDistrictsRoute = createRoute({
  method: "get",
  path: "/{code}/districts",
  tags: ["Regencies"],
  summary: "List districts in a regency",
  description: "Get a paginated list of districts (kecamatan) within a regency",
  request: {
    params: paramsSchema,
    query: z.object({ page: pageQuery, limit: limitQuery }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(districtSchema),
            meta: metaSchema,
          }),
        },
      },
      description: "List of districts",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "Regency not found",
    },
  },
});

export function registerRegenciesRoutes(app: OpenAPIHono) {
  app.openapi(getRegencyRoute, (c) => {
    const { code } = c.req.valid("param");
    const regency = regionService.getRegencyByCode(code);
    if (!regency) {
      return c.json(errorResponse("NOT_FOUND", `Regency with code '${code}' not found`), 404);
    }
    return c.json(successResponse(regency), 200);
  });

  app.openapi(listDistrictsRoute, (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const regency = regionService.getRegencyByCode(code);
    if (!regency) {
      return c.json(errorResponse("NOT_FOUND", `Regency with code '${code}' not found`), 404);
    }

    const result = regionService.getDistrictsByRegency(code, page, limit);
    return c.json(successResponse(result.data, result.meta), 200);
  });
}
