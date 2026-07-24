import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse } from "@/lib/response";

const postalCodesRouter = new Hono();

const paramsSchema = z.object({
  code: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits"),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

postalCodesRouter.get(
  "/:code",
  zValidator("param", paramsSchema),
  zValidator("query", querySchema),
  (c) => {
    const { code } = c.req.valid("param");
    const { page, limit } = c.req.valid("query");
    const result = regionService.getVillagesByPostalCode(code, page, limit);
    return c.json(successResponse(result.data, result.meta));
  }
);

export default postalCodesRouter;
