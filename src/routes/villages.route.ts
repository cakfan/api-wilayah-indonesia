import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";
import { villageSchema } from "@/schemas/region.schema";

const paramsSchema = z.object({
  code: z.string().min(1).openapi({
    param: { name: "code", in: "path" },
    example: "11.01.01.2001",
  }),
});

const getVillageRoute = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Villages"],
  summary: "Get village by code",
  description: "Get detail of a single village (kelurahan/desa) by its code, including postal code and coordinates",
  request: { params: paramsSchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ data: villageSchema }),
        },
      },
      description: "Village detail",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
      description: "Village not found",
    },
  },
});

export function registerVillagesRoutes(app: OpenAPIHono) {
  app.openapi(getVillageRoute, (c) => {
    const { code } = c.req.valid("param");
    const village = regionService.getVillageByCode(code);
    if (!village) {
      return c.json(errorResponse("NOT_FOUND", `Village with code '${code}' not found`), 404);
    }
    return c.json(successResponse(village), 200);
  });
}
