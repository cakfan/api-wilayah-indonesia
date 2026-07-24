import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse } from "@/lib/response";

const searchRouter = new Hono();

const querySchema = z.object({
  q: z.string().min(1),
  type: z
    .enum(["provinsi", "kabupaten", "kota", "kecamatan", "kelurahan", "desa"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

searchRouter.get("/", zValidator("query", querySchema), (c) => {
  const { q, type, page, limit } = c.req.valid("query");
  const result = regionService.searchRegions(q, type, page, limit);
  return c.json(successResponse(result.data, result.meta));
});

export default searchRouter;
