import { Router } from "express"; import { authenticate } from "../middleware/auth.js"; import { asyncHandler } from "../utils/asyncHandler.js"; import { dashboardSummary } from "../services/dashboardService.js";
import { adminAnalytics } from "../services/adminAnalyticsService.js";
import { AppError } from "../utils/AppError.js";
export const dashboardRouter = Router(); dashboardRouter.get("/summary", authenticate, asyncHandler(async (request, response) => { response.json({ success: true, message: "Dashboard summary retrieved", data: await dashboardSummary({ id: request.user!.id, name: request.user!.name, role: request.user!.role }) }); }));
dashboardRouter.get("/analytics", authenticate, asyncHandler(async (request, response) => {
  if (request.user!.role !== "SUPER_ADMIN") throw new AppError("Super Admin access required", 403);
  response.json({ success: true, message: "Analytics retrieved", data: await adminAnalytics() });
}));
