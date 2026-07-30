import "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger as honerLogger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { successResponse } from "./lib/response";
import { logger } from "./lib/logger";
import { errorHandler } from "./middleware/error-handler";
import { rateLimiter } from "./middleware/rate-limit";
import { cacheControl } from "./middleware/cache-control";
import { registerHealthRoutes } from "./routes/health.route";
import { registerProvincesRoutes } from "./routes/provinces.route";
import { registerRegenciesRoutes } from "./routes/regencies.route";
import { registerDistrictsRoutes } from "./routes/districts.route";
import { registerVillagesRoutes } from "./routes/villages.route";
import { registerSearchRoutes } from "./routes/search.route";
import { registerPostalCodesRoutes } from "./routes/postal-codes.route";

const app = new OpenAPIHono();

app.use("*", honerLogger());
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
  servers: [
    {
      url: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      description: process.env.VERCEL_ENV === "production" ? "Production" : "Development",
    },
  ],
});

app.get("/docs", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Wilayah Indonesia — Docs</title>
  <script>
    (function() {
      var t = localStorage.getItem('swagger-ui-theme');
      var d = t || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', d);
      if (d === 'dark') document.documentElement.classList.add('dark-mode');
    })();
  </script>
  <style>
    :root {
      --bg: oklch(98.5% 0.001 286);
      --bg-card: oklch(100% 0 0);
      --bg-muted: oklch(96.7% 0.001 286);
      --border: oklch(88.5% 0.005 286);
      --border-strong: oklch(75.5% 0.013 286);
      --text: oklch(14.1% 0.004 286);
      --text-muted: oklch(37.0% 0.012 286);
      --text-faint: oklch(44.2% 0.015 286);
      --primary: oklch(21.0% 0.006 286);
      --primary-hover: oklch(27.4% 0.005 286);
      --accent: oklch(96.7% 0.001 286);
      --radius: 0.5rem;
      --get-bg: oklch(98.2% 0.018 156);
      --get-border: oklch(78% 0.14 154);
      --get-text: oklch(33% 0.09 153);
      --get-badge: oklch(33% 0.09 153);
      --post-bg: oklch(97.0% 0.014 255);
      --post-border: oklch(72% 0.10 252);
      --post-text: oklch(32% 0.14 266);
      --post-badge: oklch(32% 0.14 266);
      --delete-bg: oklch(97.1% 0.013 17);
      --delete-border: oklch(72% 0.10 20);
      --delete-text: oklch(33% 0.13 26);
      --delete-badge: oklch(33% 0.13 26);
      --put-bg: oklch(98.7% 0.021 95);
      --put-border: oklch(78% 0.15 92);
      --put-text: oklch(35% 0.11 46);
      --put-badge: oklch(35% 0.11 46);
    }
    [data-theme="dark"] {
      --bg: oklch(14.1% 0.004 286);
      --bg-card: oklch(21.0% 0.006 286);
      --bg-muted: oklch(27.4% 0.005 286);
      --border: oklch(52% 0.012 286);
      --border-strong: oklch(56% 0.015 286);
      --text: oklch(98.5% 0.001 286);
      --text-muted: oklch(87.1% 0.005 286);
      --text-faint: oklch(71.2% 0.013 286);
      --primary: oklch(98.5% 0.001 286);
      --primary-hover: oklch(87.1% 0.005 286);
      --accent: oklch(27.4% 0.005 286);
      --get-bg: oklch(20% 0.04 156);
      --get-border: oklch(50% 0.10 154);
      --get-text: oklch(82% 0.14 154);
      --get-badge: oklch(28% 0.10 155);
      --post-bg: oklch(20% 0.04 255);
      --post-border: oklch(50% 0.10 252);
      --post-text: oklch(80% 0.10 252);
      --post-badge: oklch(28% 0.14 266);
      --delete-bg: oklch(20% 0.04 17);
      --delete-border: oklch(55% 0.10 20);
      --delete-text: oklch(80% 0.10 20);
      --delete-badge: oklch(28% 0.13 26);
      --put-bg: oklch(20% 0.04 95);
      --put-border: oklch(55% 0.12 92);
      --put-text: oklch(85% 0.15 92);
      --put-badge: oklch(28% 0.11 46);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg); color: var(--text); line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
  </style>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🇮🇩</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    /* === Hide all Swagger UI chrome === */
    .swagger-ui .topbar,
    .swagger-ui .scheme-container,
    .swagger-ui .filter-container,
    .swagger-ui .info .base-url,
    .swagger-ui .download-url-wrapper,
    .swagger-ui .no-js { display: none !important; }

    /* === Layout === */
    .swagger-ui { padding: 0 !important; max-width: 64rem; margin: 0 auto !important; }

    /* === Header === */
    .top-bar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; height: 3.5rem;
      background: var(--bg-card); border-bottom: 1px solid var(--border);
    }
    .top-bar-brand { display: flex; align-items: center; gap: 0.625rem; }
    .top-bar-brand h1 {
      font-size: 0.9rem; font-weight: 600; color: var(--text); letter-spacing: -0.01em;
    }
    .top-bar-pill {
      font-size: 0.65rem; font-weight: 600; letter-spacing: 0.03em;
      padding: 0.1rem 0.45rem; border-radius: 9999px;
      background: var(--accent); color: var(--text-muted); border: 1px solid var(--border);
    }
    .top-bar-actions { display: flex; align-items: center; gap: 0.375rem; }
    .top-bar-btn {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 500;
      color: var(--text-muted); text-decoration: none;
      border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--bg-card); cursor: pointer;
    }
    .top-bar-btn:hover { color: var(--text); border-color: var(--border-strong); background: var(--bg-muted); }
    .top-bar-btn svg { width: 0.875rem; height: 0.875rem; }
    .theme-btn .icon-moon { display: none; }
    [data-theme="dark"] .theme-btn .icon-sun { display: none; }
    [data-theme="dark"] .theme-btn .icon-moon { display: block; }

    /* === Info === */
    .swagger-ui .info { margin: 2rem 1.5rem 0 !important; }
    .swagger-ui .info .title {
      font-size: 1.75rem !important; font-weight: 700 !important;
      color: var(--text) !important; letter-spacing: -0.03em !important;
      line-height: 1.2 !important;
    }
    .swagger-ui .info .title small {
      font-size: 0.7rem !important; font-weight: 600 !important;
      color: var(--text-muted) !important; background: var(--accent) !important;
      border: 1px solid var(--border) !important; border-radius: 9999px !important;
      padding: 0.1rem 0.45rem !important; margin-left: 0.5rem !important;
      vertical-align: middle !important; top: -0.15em !important; position: relative !important;
    }
    .swagger-ui .info .description {
      font-size: 0.9rem !important; color: var(--text) !important;
      line-height: 1.7 !important; max-width: 40rem !important;
    }
    .swagger-ui .info a { color: var(--text) !important; text-decoration: underline !important; text-underline-offset: 2px !important; }
    .swagger-ui .info a:hover { opacity: 0.7; }
    .swagger-ui .info .divider { display: none !important; }

    /* === Section spacing === */
    .swagger-ui .opblock-tag-section { margin-top: 2.5rem; }
    .swagger-ui .opblock-tag {
      font-size: 1rem !important; font-weight: 600 !important;
      color: var(--text) !important; padding: 0 1.5rem !important;
      padding-bottom: 0.75rem !important; border-bottom: 1px solid var(--border) !important;
    }
    .swagger-ui .opblock-tag small { color: var(--text-muted) !important; font-weight: 400 !important; margin-left: 0.375rem !important; }
    .swagger-ui .opblock-tag a { color: var(--text-muted) !important; }

    /* === Operation cards === */
    .swagger-ui .opblock {
      border: 1px solid var(--border) !important; border-radius: var(--radius) !important;
      box-shadow: none !important; margin: 0 1.5rem 0.5rem !important;
      overflow: hidden !important;
    }
    .swagger-ui .opblock .opblock-summary {
      border: none !important; border-radius: var(--radius) !important;
      padding: 0.75rem 1rem !important; min-height: auto !important;
      cursor: pointer !important;
    }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 0.25rem !important; font-size: 0.7rem !important;
      font-weight: 700 !important; min-width: 3rem !important;
      padding: 0.2rem 0 !important; text-transform: uppercase !important;
      letter-spacing: 0.04em !important;
    }
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path__deprecated {
      font-size: 0.8rem !important; font-weight: 500 !important;
    }
    .swagger-ui .opblock .opblock-summary-description {
      font-size: 0.8rem !important; color: var(--text-muted) !important;
      font-style: normal !important;
    }
    .swagger-ui .opblock .opblock-summary-controls { opacity: 0.4; }
    .swagger-ui .opblock .opblock-summary-controls:hover { opacity: 1; }

    /* GET */
    .swagger-ui .opblock.opblock-get {
      background: var(--get-bg) !important; border-color: var(--get-border) !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary { background: transparent !important; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: var(--get-badge) !important; color: #fff !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-path { color: var(--get-text) !important; }
    /* POST */
    .swagger-ui .opblock.opblock-post {
      background: var(--post-bg) !important; border-color: var(--post-border) !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary { background: transparent !important; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: var(--post-badge) !important; color: #fff !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-path { color: var(--post-text) !important; }
    /* PUT */
    .swagger-ui .opblock.opblock-put {
      background: var(--put-bg) !important; border-color: var(--put-border) !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary { background: transparent !important; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: var(--put-badge) !important; color: #fff !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-path { color: var(--put-text) !important; }
    /* DELETE */
    .swagger-ui .opblock.opblock-delete {
      background: var(--delete-bg) !important; border-color: var(--delete-border) !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary { background: transparent !important; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: var(--delete-badge) !important; color: #fff !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-path { color: var(--delete-text) !important; }

    /* === Expanded body === */
    .swagger-ui .opblock-body { background: var(--bg-card) !important; padding: 0 !important; }
    .swagger-ui .opblock-body-wrapper { background: var(--bg-card) !important; }

    .swagger-ui .opblock-body table {
      background: var(--bg-card) !important; color: var(--text) !important;
      border-collapse: collapse !important;
    }
    .swagger-ui .opblock-body table td,
    .swagger-ui .opblock-body table th {
      border-color: var(--border) !important; color: var(--text) !important;
      font-size: 0.8rem !important; padding: 0.5rem 0.75rem !important;
    }
    .swagger-ui .opblock-body table td:first-child {
      font-weight: 500 !important;
    }

    /* === Parameters & Responses === */
    .swagger-ui .parameters,
    .swagger-ui .responses-table { margin: 0 !important; }
    .swagger-ui .parameters thead th,
    .swagger-ui .responses-table thead th {
      font-size: 0.7rem !important; font-weight: 600 !important;
      text-transform: uppercase !important; letter-spacing: 0.05em !important;
      color: var(--text-muted) !important; border-color: var(--border) !important;
      padding: 0.5rem 0.75rem !important;
    }
    .swagger-ui .parameters td,
    .swagger-ui .parameters th,
    .swagger-ui .responses-table td,
    .swagger-ui .responses-table th {
      border-color: var(--border) !important; color: var(--text) !important;
    }
    .swagger-ui .parameter__name { color: var(--text) !important; font-weight: 600 !important; }
    .swagger-ui .parameter__type { color: var(--text-muted) !important; }
    .swagger-ui .parameter__in { color: var(--text-faint) !important; }
    .swagger-ui .response-col_status {
      font-weight: 600 !important; color: var(--text) !important;
    }

    /* === Try-out & Execute === */
    .swagger-ui .try-out__btn {
      color: var(--text-muted) !important; border-color: var(--border) !important;
      background: transparent !important; font-size: 0.75rem !important;
    }
    .swagger-ui .try-out__btn:hover { color: var(--text) !important; border-color: var(--border-strong) !important; }
    .swagger-ui .execute-wrapper { padding: 0.5rem 0.75rem !important; }
    .swagger-ui .btn.execute {
      background: var(--primary) !important; color: var(--bg-card) !important;
      border: none !important; border-radius: var(--radius) !important;
      font-weight: 500 !important; padding: 0.4rem 1rem !important;
    }
    .swagger-ui .btn.execute:hover { background: var(--primary-hover) !important; }
    .swagger-ui .btn.cancel {
      background: transparent !important; color: var(--text-muted) !important;
      border: 1px solid var(--border) !important;
    }
    .swagger-ui .btn.authorize {
      color: var(--text-muted) !important; border-color: var(--border) !important;
      background: transparent !important;
    }

    /* === Models === */
    .swagger-ui section.models {
      border: 1px solid var(--border) !important; border-radius: var(--radius) !important;
      margin: 2.5rem 1.5rem 0 !important; background: var(--bg-card) !important;
    }
    .swagger-ui section.models h4 {
      color: var(--text) !important; font-weight: 600 !important;
      padding: 0.75rem 1rem !important; margin: 0 !important;
      border-bottom: 1px solid var(--border) !important;
    }
    .swagger-ui section.models h4 span { color: var(--text-muted) !important; }
    .swagger-ui .model-box {
      background: transparent !important; border: none !important;
      border-radius: 0 !important;
    }
    .swagger-ui .model-box + .model-box { border-top: 1px solid var(--border) !important; }
    .swagger-ui .model-title { color: var(--text) !important; font-weight: 600 !important; font-size: 0.85rem !important; }
    .swagger-ui .model-toggle::after { border-color: var(--text-muted) !important; }
    .swagger-ui .prop-type { color: var(--text-muted) !important; }
    .swagger-ui .prop-name { color: var(--text) !important; font-weight: 600 !important; }

    /* === Inputs === */
    .swagger-ui select {
      font-size: 0.8rem !important; border-radius: var(--radius) !important;
      border: 1px solid var(--border) !important;
      background: var(--bg-card) !important; color: var(--text) !important;
      padding: 0.25rem 0.5rem !important;
    }
    .swagger-ui input[type=text],
    .swagger-ui textarea {
      font-size: 0.8rem !important; border-radius: var(--radius) !important;
      border: 1px solid var(--border) !important;
      background: var(--bg-card) !important; color: var(--text) !important;
      padding: 0.375rem 0.5rem !important;
    }
    .swagger-ui input[type=text]:focus,
    .swagger-ui textarea:focus {
      border-color: var(--border-strong) !important;
      outline: none !important; box-shadow: 0 0 0 2px var(--accent) !important;
    }

    /* === Misc === */
    .swagger-ui .markdown p { color: var(--text) !important; line-height: 1.6 !important; }
    .swagger-ui .highlight-code { border-radius: var(--radius) !important; overflow: hidden !important; }
    .swagger-ui .copy-to-clipboard { border-radius: var(--radius) !important; }
    .swagger-ui .dialog-ux .modal-ux {
      background: var(--bg-card) !important; border: 1px solid var(--border) !important;
      border-radius: var(--radius) !important;
    }
    .swagger-ui .errors-wrapper { font-size: 0.85rem !important; }

    @media (max-width: 768px) {
      .swagger-ui .info { margin: 1.5rem 1rem 0 !important; }
      .swagger-ui .info .title { font-size: 1.25rem !important; }
      .swagger-ui .opblock { margin: 0 1rem 0.5rem !important; }
      .swagger-ui .opblock-tag { padding: 0 1rem !important; }
      .swagger-ui section.models { margin: 2rem 1rem 0 !important; }
      .top-bar { padding: 0 1rem; }
      .top-bar-actions .label { display: none; }
    }

    /* ============================================================
       DARK MODE — flat overrides for Swagger UI hardcoded colors.
       ============================================================ */

    /* Global */
    [data-theme="dark"] .swagger-ui { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui label { color: var(--text-muted) !important; }

    /* Info */
    [data-theme="dark"] .swagger-ui .info a:hover { color: var(--primary-hover) !important; }
    [data-theme="dark"] .swagger-ui .info .title small { background: var(--accent) !important; color: var(--text-muted) !important; border: 1px solid var(--border) !important; }

    /* Opblock structural */
    [data-theme="dark"] .swagger-ui .opblock { border-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .opblock.is-open .opblock-summary { border-bottom-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .opblock .opblock-section-header { background: var(--bg-muted) !important; }
    [data-theme="dark"] .swagger-ui .opblock .opblock-description-wrapper h4,
    [data-theme="dark"] .swagger-ui .opblock .opblock-external-docs-wrapper h4,
    [data-theme="dark"] .swagger-ui .opblock .opblock-title_normal h4 { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .opblock .tab-header .tab-item.active h4 span::after { background: var(--text-muted) !important; }

    /* Parameters & Responses */
    [data-theme="dark"] .swagger-ui .parameter__extension { color: var(--text-faint) !important; }
    [data-theme="dark"] .swagger-ui .parameter__deprecated { color: #f87171 !important; }
    [data-theme="dark"] .swagger-ui .response__extension { color: var(--text-faint) !important; }
    [data-theme="dark"] .swagger-ui .response-col_links a { color: var(--text-muted) !important; }

    /* Code blocks / syntax */
    [data-theme="dark"] .swagger-ui .opblock-body pre.microlight { background: var(--bg-muted) !important; color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .markdown pre { color: var(--text) !important; background: var(--bg-muted) !important; }
    [data-theme="dark"] .swagger-ui .markdown code { background: var(--bg-muted) !important; color: #c4b5fd !important; }
    [data-theme="dark"] .swagger-ui span.token-string { color: #86efac !important; }
    [data-theme="dark"] .swagger-ui span.token-not-formatted { color: var(--text) !important; }

    /* Inputs / selects */
    [data-theme="dark"] .swagger-ui input[disabled] { color: var(--text-muted) !important; background: var(--bg-muted) !important; }
    [data-theme="dark"] .swagger-ui select[disabled] { border-color: var(--border) !important; }

    /* Buttons */
    [data-theme="dark"] .swagger-ui .btn { color: var(--text) !important; border-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .btn.execute { background: var(--primary) !important; color: var(--bg-card) !important; }
    [data-theme="dark"] .swagger-ui button.invalid { background: #7f1d1d !important; color: #fca5a5 !important; }

    /* Dialog / Modal */
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux { background: var(--bg-card) !important; border-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux-header { border-bottom-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux-header h3 { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux-content p { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux-content h4 { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux-content a { color: #93c5fd !important; }

    /* Auth container */
    [data-theme="dark"] .swagger-ui .auth-container { border-bottom-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .auth-container .errors { background: #7f1d1d !important; color: #fca5a5 !important; }
    [data-theme="dark"] .swagger-ui .scopes h2 { color: var(--text) !important; }

    /* Errors wrapper */
    [data-theme="dark"] .swagger-ui .errors-wrapper .errors h4 { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .errors-wrapper .errors small { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .errors-wrapper hgroup h4 { color: var(--text) !important; }

    /* Models / schemas */
    [data-theme="dark"] .swagger-ui .model .deprecated span,
    [data-theme="dark"] .swagger-ui .model .deprecated td { color: #f87171 !important; }
    [data-theme="dark"] .swagger-ui .model .external-docs { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui table.model tr.description { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui table.model tr.extension { color: var(--text-faint) !important; }
    [data-theme="dark"] .swagger-ui section.models h5 { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui section.models .model-container:hover { background: var(--bg-muted) !important; }

    /* Expand methods icon */
    [data-theme="dark"] .swagger-ui .expand-methods svg { fill: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .expand-methods:hover svg { fill: var(--text) !important; }

    /* JSON Schema 2020-12 */
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword__value { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword__value--primary { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword__value--extension { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword__name--extension { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword--description { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12__attribute { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer__name--extension { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer__value--primary { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer__value--extension { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer-extension-keyword .name,
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer-extension-keyword .value { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-keyword__children { border-left-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .json-schema-2020-12-json-viewer__children { border-left-color: var(--border) !important; }

    /* Checkbox */
    [data-theme="dark"] .swagger-ui .checkbox { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui .checkbox p { color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .checkbox input[type=checkbox]+label>.item { background: var(--bg-muted) !important; box-shadow: 0 0 0 2px var(--border) !important; }

    /* Headers table */
    [data-theme="dark"] .swagger-ui table.headers td { color: var(--text) !important; }
    [data-theme="dark"] .swagger-ui table.headers .header-example { color: var(--text-muted) !important; }

    /* Response control */
    [data-theme="dark"] .swagger-ui .response-control-media-type--accept-controller select { border-color: var(--border) !important; }
    [data-theme="dark"] .swagger-ui .response-control-media-type__accept-message { color: var(--text-muted) !important; }

    /* Version pragma / fallback */
    [data-theme="dark"] .swagger-ui .version-pragma__message code { background: var(--bg-muted) !important; color: var(--text-muted) !important; }
    [data-theme="dark"] .swagger-ui .fallback { color: var(--text-muted) !important; }

    /* Table borders */
    [data-theme="dark"] .swagger-ui table thead tr td,
    [data-theme="dark"] .swagger-ui table thead tr th { border-bottom-color: var(--border) !important; }
  </style>
</head>
<body>
  <header class="top-bar">
    <div class="top-bar-brand">
      <h1>API Wilayah Indonesia</h1>
      <span class="top-bar-pill">v0.1.0</span>
    </div>
    <div class="top-bar-actions">
      <a class="top-bar-btn" href="/openapi.json" target="_blank">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="label">OpenAPI JSON</span>
      </a>
      <button class="top-bar-btn theme-btn" onclick="toggleTheme()" aria-label="Toggle theme">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  </header>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    function toggleTheme() {
      var el = document.documentElement;
      var next = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      el.setAttribute('data-theme', next);
      el.classList.toggle('dark-mode', next === 'dark');
      localStorage.setItem('swagger-ui-theme', next);
    }
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      plugins: [SwaggerUIBundle.plugins.DownloadUrl],
      layout: 'BaseLayout',
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
      filter: false,
      tryItOutEnabled: false
    });
  </script>
</body>
</html>`);
});

export default app;

if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  const env = process.env.NODE_ENV || "development";

  logger.info({ port, env }, "Starting API Wilayah Indonesia");

  Bun.serve({ port, fetch: app.fetch });
}
