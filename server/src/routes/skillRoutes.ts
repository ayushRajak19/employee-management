import { Router } from "express";
import * as controller from "../controllers/skillController.js";
import { authenticate, requireAnyPermission, requirePermission } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assessmentIdParamSchema,
  assessmentResultSchema,
  assessmentSchema,
  claimSkillSchema,
  designationSkillsSchema,
  generateAssessmentSchema,
  roleSkillAssessmentSchema,
  skillSchema,
  submitAssessmentSchema,
  verifySkillSchema
} from "../validators/skillValidators.js";

export const skillRouter = Router();
skillRouter.use(authenticate);
skillRouter.get("/", asyncHandler(controller.list));
skillRouter.post("/", requirePermission("skill.create"), validate(skillSchema), asyncHandler(controller.create));
skillRouter.get("/role-assessment", asyncHandler(controller.roleCatalog));
skillRouter.post("/role-assessment", validate(roleSkillAssessmentSchema), asyncHandler(controller.submitRoleCatalog));
skillRouter.get("/mine", asyncHandler(controller.mine));
skillRouter.post("/mine", validate(claimSkillSchema), asyncHandler(controller.claim));
skillRouter.get("/verifications/pending", requirePermission("skill.verify"), asyncHandler(controller.pending));
skillRouter.patch("/verifications/:id", requirePermission("skill.verify"), validate(verifySkillSchema), asyncHandler(controller.verify));
skillRouter.get("/heatmap", requirePermission("employee.view"), asyncHandler(controller.heatmap));
skillRouter.put("/designations/:id/requirements", requirePermission("department.update"), validate(designationSkillsSchema), asyncHandler(controller.designationSkills));

skillRouter.get("/assessments", asyncHandler(controller.assessments));
skillRouter.post("/assessments/generate", requireAnyPermission("skill.verify", "skill.create", "employee.update", "department.view"), validate(generateAssessmentSchema), asyncHandler(controller.generateAssessment));
skillRouter.post("/assessments", requireAnyPermission("skill.verify", "skill.create", "employee.update", "department.view"), validate(assessmentSchema), asyncHandler(controller.assignAssessment));
skillRouter.get("/assessments/:id", validate(assessmentIdParamSchema), asyncHandler(controller.getAssessment));
skillRouter.post("/assessments/:id/start", validate(assessmentIdParamSchema), asyncHandler(controller.startAssessment));
skillRouter.post("/assessments/:id/submit", validate(submitAssessmentSchema), asyncHandler(controller.submitAssessment));
skillRouter.delete("/assessments/:id", requireAnyPermission("skill.verify", "skill.create", "employee.update", "department.view"), validate(assessmentIdParamSchema), asyncHandler(controller.deleteAssessment));
skillRouter.patch("/assessments/:id/result", requirePermission("skill.verify"), validate(assessmentResultSchema), asyncHandler(controller.recordAssessmentResult));

