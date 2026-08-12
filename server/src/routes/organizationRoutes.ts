import { Router } from "express"; import * as controller from "../controllers/organizationController.js"; import { authenticate, requirePermission } from "../middleware/auth.js"; import { validate } from "../middleware/validate.js"; import { asyncHandler } from "../utils/asyncHandler.js"; import { departmentSchema, designationSchema, teamSchema } from "../validators/organizationValidators.js";
export const organizationRouter = Router(); organizationRouter.use(authenticate);
organizationRouter.get("/", requirePermission("department.view"), asyncHandler(controller.list));
organizationRouter.post("/departments", requirePermission("department.create"), validate(departmentSchema), asyncHandler(controller.createDepartment));
organizationRouter.post("/teams", requirePermission("department.create"), validate(teamSchema), asyncHandler(controller.createTeam));
organizationRouter.post("/designations", requirePermission("department.create"), validate(designationSchema), asyncHandler(controller.createDesignation));
