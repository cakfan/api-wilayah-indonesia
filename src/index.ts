import { Hono } from "hono";
import { logger } from "hono/logger";
import { successResponse } from "@/lib/response";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.json(successResponse({ message: "API Wilayah Indonesia" }));
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
