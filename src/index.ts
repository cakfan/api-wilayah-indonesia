import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "API Wilayah Indonesia" });
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
