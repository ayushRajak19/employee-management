import { Router } from "express"; import * as controller from "../controllers/attendanceController.js"; import { authenticate } from "../middleware/auth.js"; import { validate } from "../middleware/validate.js"; import { asyncHandler } from "../utils/asyncHandler.js"; import { attendanceLocationSchema, attendanceOfficeSchema, attendanceRegisterSchema } from "../validators/attendanceValidators.js";
export const attendanceRouter = Router(); attendanceRouter.use(authenticate);
attendanceRouter.get("/today", asyncHandler(controller.today));
attendanceRouter.post("/check-in", validate(attendanceLocationSchema), asyncHandler(controller.checkIn));
attendanceRouter.post("/check-out", validate(attendanceLocationSchema), asyncHandler(controller.checkOut));
attendanceRouter.get("/register", validate(attendanceRegisterSchema), asyncHandler(controller.register));
attendanceRouter.put("/office", validate(attendanceOfficeSchema), asyncHandler(controller.configureOffice));
