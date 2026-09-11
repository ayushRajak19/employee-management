import { Router } from "express";
import * as controller from "../controllers/tenantController.js";
import { requirePlatformOwner } from "../middleware/platformOwner.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createTenantSchema, updateTenantStatusSchema } from "../validators/tenantValidators.js";

export const tenantRouter = Router();
tenantRouter.use(requirePlatformOwner);
tenantRouter.get("/", asyncHandler(controller.list));
tenantRouter.get("/analytics", asyncHandler(controller.analytics));
tenantRouter.post("/", validate(createTenantSchema), asyncHandler(controller.create));
tenantRouter.patch("/:id/status", validate(updateTenantStatusSchema), asyncHandler(controller.updateStatus));
