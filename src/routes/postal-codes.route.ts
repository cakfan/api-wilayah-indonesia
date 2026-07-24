import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse } from "@/lib/response";
import { villageSchema, metaSchema, pageQuery, limitQuery } from "@/schemas/region.schema";

const paramsSchema = z.object({
  code: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits").openapi({
    param: { name: "code", in: "path" },
    example: "10310",
  }),
});

const getPostalCodesRoute = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Postal Codes"],
  summary: "Lookup villages by postal code",
  description: "Get a list of villages that match a given 5-digit postal code",
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
      description: "List of villages matching the postal code",
    },
  },
});

export function registerPostalCodesRoutes(app: OpenAPIHono) {
  app.openapi(getPostalCodesRoute, (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");
    const result = regionService.getVillagesByPostalCode(code, page, limit);
    return c.json(successResponse(result.data, result.meta), 200);
  });
}
