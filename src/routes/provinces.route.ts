import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";

const provincesRouter = new Hono();

const paramsSchema = z.object({
  code: z.string().min(1),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

provincesRouter.get("/", (c) => {
  const result = regionService.getAllProvinces();
  return c.json(successResponse(result.data, result.meta));
});

provincesRouter.get("/:code", zValidator("param", paramsSchema), (c) => {
  const { code } = c.req.valid("param");
  const province = regionService.getProvinceByCode(code);
  if (!province) {
    return c.json(errorResponse("NOT_FOUND", `Province with code '${code}' not found`), 404);
  }
  return c.json(successResponse(province));
});

provincesRouter.get(
  "/:code/regencies",
  zValidator("param", paramsSchema),
  zValidator("query", querySchema),
  (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const province = regionService.getProvinceByCode(code);
    if (!province) {
      return c.json(errorResponse("NOT_FOUND", `Province with code '${code}' not found`), 404);
    }

    const result = regionService.getRegenciesByProvince(code, page, limit);
    return c.json(successResponse(result.data, result.meta));
  }
);

export default provincesRouter;
