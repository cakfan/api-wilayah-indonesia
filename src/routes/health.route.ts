import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { getDb } from "../db/connection";
import { successResponse } from "../lib/response";

const healthResponse = z
  .object({
    data: z.object({
      status: z.string().openapi({ example: "healthy" }),
      database: z.string().openapi({ example: "connected" }),
    }),
  })
  .openapi("HealthResponse");

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check",
  description: "Check API and database health status",
  responses: {
    200: {
      content: { "application/json": { schema: healthResponse } },
      description: "Health status",
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono) {
  app.openapi(healthRoute, (c) => {
    try {
      const db = getDb();
      db.query("SELECT 1").get();
      return c.json(successResponse({ status: "healthy", database: "connected" }), 200);
    } catch {
      return c.json(successResponse({ status: "unhealthy", database: "disconnected" }), 503 as 200);
    }
  });
}
