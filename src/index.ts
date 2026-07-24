import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { successResponse } from "@/lib/response";
import { errorHandler } from "@/middleware/error-handler";
import { rateLimiter } from "@/middleware/rate-limit";
import { cacheControl } from "@/middleware/cache-control";
import { registerHealthRoutes } from "@/routes/health.route";
import { registerProvincesRoutes } from "@/routes/provinces.route";
import { registerRegenciesRoutes } from "@/routes/regencies.route";
import { registerDistrictsRoutes } from "@/routes/districts.route";
import { registerVillagesRoutes } from "@/routes/villages.route";
import { registerSearchRoutes } from "@/routes/search.route";
import { registerPostalCodesRoutes } from "@/routes/postal-codes.route";

const app = new OpenAPIHono();

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

registerHealthRoutes(app);
app.route("/api/v1/provinces", (() => {
  const sub = new OpenAPIHono();
  registerProvincesRoutes(sub);
  return sub;
})());
app.route("/api/v1/regencies", (() => {
  const sub = new OpenAPIHono();
  registerRegenciesRoutes(sub);
  return sub;
})());
app.route("/api/v1/districts", (() => {
  const sub = new OpenAPIHono();
  registerDistrictsRoutes(sub);
  return sub;
})());
app.route("/api/v1/villages", (() => {
  const sub = new OpenAPIHono();
  registerVillagesRoutes(sub);
  return sub;
})());
app.route("/api/v1/search", (() => {
  const sub = new OpenAPIHono();
  registerSearchRoutes(sub);
  return sub;
})());
app.route("/api/v1/postal-codes", (() => {
  const sub = new OpenAPIHono();
  registerPostalCodesRoutes(sub);
  return sub;
})());

app.doc("/openapi.json", {
  openapi: "3.0.3",
  info: {
    title: "API Wilayah Indonesia",
    version: "0.1.0",
    description:
      "API publik read-only untuk data wilayah administratif Indonesia 4 level (Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan/Desa) dengan kode pos dan koordinat lat/lng.",
    license: { name: "MIT" },
  },
  servers: [{ url: "http://localhost:3000", description: "Development" }],
});

app.get("/docs", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Wilayah Indonesia - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });
  </script>
</body>
</html>`);
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
