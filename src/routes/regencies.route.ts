import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";

const regenciesRouter = new Hono();

const paramsSchema = z.object({
  code: z.string().min(1),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

regenciesRouter.get("/:code", zValidator("param", paramsSchema), (c) => {
  const { code } = c.req.valid("param");
  const regency = regionService.getRegencyByCode(code);
  if (!regency) {
    return c.json(errorResponse("NOT_FOUND", `Regency with code '${code}' not found`), 404);
  }
  return c.json(successResponse(regency));
});

regenciesRouter.get(
  "/:code/districts",
  zValidator("param", paramsSchema),
  zValidator("query", querySchema),
  (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");

    const regency = regionService.getRegencyByCode(code);
    if (!regency) {
      return c.json(errorResponse("NOT_FOUND", `Regency with code '${code}' not found`), 404);
    }

    const result = regionService.getDistrictsByRegency(code, page, limit);
    return c.json(successResponse(result.data, result.meta));
  }
);

export default regenciesRouter;
