import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse } from "@/lib/response";
import { provinceSchema, regencySchema, districtSchema, villageSchema, metaSchema, qQuery, typeQuery, pageQuery, limitQuery } from "@/schemas/region.schema";

const searchResultSchema = z.object({
  data: z.array(z.union([provinceSchema, regencySchema, districtSchema, villageSchema])),
  meta: metaSchema,
});

const searchRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Search"],
  summary: "Search regions",
  description: "Search across all region levels by name. Optionally filter by type.",
  request: {
    query: z.object({
      q: qQuery,
      type: typeQuery,
      page: pageQuery,
      limit: limitQuery,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: searchResultSchema,
        },
      },
      description: "Search results",
    },
  },
});

export function registerSearchRoutes(app: OpenAPIHono) {
  app.openapi(searchRoute, (c) => {
    const { q, type, page, limit } = c.req.valid("query");
    const result = regionService.searchRegions(q, type, page, limit);
    return c.json(successResponse(result.data, result.meta), 200);
  });
}
