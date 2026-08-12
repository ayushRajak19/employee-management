import { Router } from "express";
import * as controller from "../controllers/employeeController.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createEmployeeSchema, employeeIdSchema, listEmployeesSchema, onboardingSchema, updateEmployeeSchema } from "../validators/employeeValidators.js";

export const employeeRouter = Router();
employeeRouter.use(authenticate);
employeeRouter.get("/me", requirePermission("employee.view"), asyncHandler(controller.me));
employeeRouter.patch("/me/onboarding", requirePermission("employee.view"), validate(onboardingSchema), asyncHandler(controller.onboarding));
employeeRouter.get("/", requirePermission("employee.view"), validate(listEmployeesSchema), asyncHandler(controller.list));
employeeRouter.post("/", requirePermission("employee.create"), validate(createEmployeeSchema), asyncHandler(controller.create));
employeeRouter.get("/:id", requirePermission("employee.view"), validate(employeeIdSchema), asyncHandler(controller.profile));
employeeRouter.patch("/:id", requirePermission("employee.update"), validate(updateEmployeeSchema), asyncHandler(controller.update));
employeeRouter.delete("/:id", requirePermission("employee.deactivate"), validate(employeeIdSchema), asyncHandler(controller.deactivate));
