import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { regionService } from "@/services/region.service";
import { successResponse, errorResponse } from "@/lib/response";

const villagesRouter = new Hono();

const paramsSchema = z.object({
  code: z.string().min(1),
});

villagesRouter.get("/:code", zValidator("param", paramsSchema), (c) => {
  const { code } = c.req.valid("param");
  const village = regionService.getVillageByCode(code);
  if (!village) {
    return c.json(errorResponse("NOT_FOUND", `Village with code '${code}' not found`), 404);
  }
  return c.json(successResponse(village));
});

export default villagesRouter;
