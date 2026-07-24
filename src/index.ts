import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { successResponse } from "@/lib/response";
import { errorHandler } from "@/middleware/error-handler";
import { rateLimiter } from "@/middleware/rate-limit";
import { cacheControl } from "@/middleware/cache-control";
import healthRouter from "@/routes/health.route";
import provincesRouter from "@/routes/provinces.route";
import regenciesRouter from "@/routes/regencies.route";
import districtsRouter from "@/routes/districts.route";
import villagesRouter from "@/routes/villages.route";
import searchRouter from "@/routes/search.route";
import postalCodesRouter from "@/routes/postal-codes.route";

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    allowMethods: ["GET"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);
app.use("*", compress());
app.use("*", rateLimiter);
app.use("*", cacheControl);

app.onError(errorHandler);

app.get("/", (c) => {
  return c.json(successResponse({ message: "API Wilayah Indonesia" }));
});

app.route("/health", healthRouter);
app.route("/api/v1/provinces", provincesRouter);
app.route("/api/v1/regencies", regenciesRouter);
app.route("/api/v1/districts", districtsRouter);
app.route("/api/v1/villages", villagesRouter);
app.route("/api/v1/search", searchRouter);
app.route("/api/v1/postal-codes", postalCodesRouter);

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
