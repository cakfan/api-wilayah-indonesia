import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "../services/region.service";
import { successResponse, errorResponse } from "../lib/response";
import { provinceSchema, regencySchema, metaSchema, pageQuery, limitQuery } from "../schemas/region.schema";

const paramsSchema = z.object({
  code: z.string().min(1).openapi({
    param: { name: "code", in: "path" },
    example: "11",
  }),
});

const listProvincesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Provinces"],
  summary: "List all provinces",
  description: "Get a list of all provinces in Indonesia",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(provinceSchema),
            meta: metaSchema,
          }),
        },
      },
      description: "List of provinces",
    },
  },
});

const getProvinceRoute = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Provinces"],
  summary: "Get province by code",
  description: "Get detail of a single province by its code",
  request: { params: paramsSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: provinceSchema }),
        },
      },
      description: "Province detail",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
      description: "Province not found",
    },
  },
});

const listRegenciesRoute = createRoute({
  method: "get",
  path: "/{code}/regencies",
  tags: ["Provinces"],
  summary: "List regencies in a province",
  description: "Get a paginated list of regencies (kabupaten/kota) within a province",
  request: {
    params: paramsSchema,
    query: z.object({ page: pageQuery, limit: limitQuery }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(regencySchema),
            meta: metaSchema,
          }),
        },
      },
      description: "List of regencies",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "Province not found",
    },
  },
});

export function registerProvincesRoutes(app: OpenAPIHono) {
  app.openapi(listProvincesRoute, (c) => {
    const result = regionService.getAllProvinces();
    return c.json(successResponse(result.data, result.meta), 200);
  });

  app.openapi(getProvinceRoute, (c) => {
    const { code } = c.req.valid("param");
    const province = regionService.getProvinceByCode(code);
    if (!province) {
      return c.json(errorResponse("NOT_FOUND", `Province with code '${code}' not found`), 404);
    }
    return c.json(successResponse(province), 200);
  });

  app.openapi(listRegenciesRoute, (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const province = regionService.getProvinceByCode(code);
    if (!province) {
      return c.json(errorResponse("NOT_FOUND", `Province with code '${code}' not found`), 404);
    }

    const result = regionService.getRegenciesByProvince(code, page, limit);
    return c.json(successResponse(result.data, result.meta), 200);
  });
}
