import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";

const districtsRouter = new Hono();

const paramsSchema = z.object({
  code: z.string().min(1),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

districtsRouter.get("/:code", zValidator("param", paramsSchema), (c) => {
  const { code } = c.req.valid("param");
  const district = regionService.getDistrictByCode(code);
  if (!district) {
    return c.json(errorResponse("NOT_FOUND", `District with code '${code}' not found`), 404);
  }
  return c.json(successResponse(district));
});

districtsRouter.get(
  "/:code/villages",
  zValidator("param", paramsSchema),
  zValidator("query", querySchema),
  (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const district = regionService.getDistrictByCode(code);
    if (!district) {
      return c.json(errorResponse("NOT_FOUND", `District with code '${code}' not found`), 404);
    }

    const result = regionService.getVillagesByDistrict(code, page, limit);
    return c.json(successResponse(result.data, result.meta));
  }
);

export default districtsRouter;
