import type { MiddlewareHandler } from "hono";

export const cacheControl: MiddlewareHandler = async (c, next) => {
  await next();

  const path = c.req.path;

  if (path === "/health") {
    c.header("Cache-Control", "no-store");
    return;
  }

  if (path.startsWith("/api/v1/")) {
    c.header("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
  }
};
