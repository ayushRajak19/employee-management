import { Router } from "express";
import * as controller from "../controllers/tenantController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePlatformAdmin } from "../middleware/platformAdmin.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createTenantSchema, updateTenantStatusSchema } from "../validators/tenantValidators.js";

export const tenantRouter = Router();
tenantRouter.use(authenticate, requirePlatformAdmin);
tenantRouter.get("/", asyncHandler(controller.list));
tenantRouter.get("/analytics", asyncHandler(controller.analytics));
tenantRouter.post("/", validate(createTenantSchema), asyncHandler(controller.create));
tenantRouter.patch("/:id/status", validate(updateTenantStatusSchema), asyncHandler(controller.updateStatus));
