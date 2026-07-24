import { Hono } from "hono";
import { successResponse } from "@/lib/response";
import { getDb } from "@/db/connection";

const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  try {
    const db = getDb();
    db.query("SELECT 1").get();
    return c.json(
      successResponse({
        status: "healthy",
        database: "connected",
      })
    );
  } catch {
    return c.json(
      successResponse({
        status: "unhealthy",
        database: "disconnected",
      }),
      503
    );
  }
});

export default healthRouter;
