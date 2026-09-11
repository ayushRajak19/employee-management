import type { Request, Response } from "express"; import * as service from "../services/organizationService.js"; import { writeAudit } from "../services/auditService.js";
const audit = (request: Request, action: string, entityType: string, entityId: string) => writeAudit({ user: request.user!.id, action, entityType, entityId, newValue: request.body, ipAddress: request.ip, userAgent: request.get("user-agent") });
export const list = async (_request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Organization retrieved", data: await service.listOrganization() }); };
export const createDepartment = async (request: Request, response: Response): Promise<void> => { const item = await service.createDepartment(request.body); await audit(request, "DEPARTMENT_CREATED", "Department", item._id.toString()); response.status(201).json({ success: true, message: "Department created", data: { item } }); };
export const createTeam = async (request: Request, response: Response): Promise<void> => { const item = await service.createTeam(request.body); await audit(request, "TEAM_CREATED", "Team", item._id.toString()); response.status(201).json({ success: true, message: "Team created", data: { item } }); };
export const createDesignation = async (request: Request, response: Response): Promise<void> => { const item = await service.createDesignation(request.body); await audit(request, "DESIGNATION_CREATED", "Designation", item._id.toString()); response.status(201).json({ success: true, message: "Designation created", data: { item } }); };
export const updateDepartment = async (request: Request, response: Response): Promise<void> => { const item = await service.updateDepartment(String(request.params.id), request.body); await audit(request, "DEPARTMENT_UPDATED", "Department", item._id.toString()); response.json({ success: true, message: "Department updated", data: { item } }); };
export const updateTeam = async (request: Request, response: Response): Promise<void> => { const item = await service.updateTeam(String(request.params.id), request.body); await audit(request, "TEAM_UPDATED", "Team", item._id.toString()); response.json({ success: true, message: "Team updated", data: { item } }); };
export const updateDesignation = async (request: Request, response: Response): Promise<void> => { const item = await service.updateDesignation(String(request.params.id), request.body); await audit(request, "DESIGNATION_UPDATED", "Designation", item._id.toString()); response.json({ success: true, message: "Designation updated", data: { item } }); };
export const updateDesignationSkills = async (request: Request, response: Response): Promise<void> => {
  const item = await service.setDesignationAssessmentSkills(String(request.params.id), request.body.skills, request.body.catalogRole);
  await audit(request, "DESIGNATION_SKILLS_UPDATED", "Designation", item._id.toString());
  response.json({ success: true, message: "Designation skills updated", data: { item } });
};

export const getSkillCatalogForRole = async (request: Request, response: Response): Promise<void> => {
  const role = String(request.params.role);
  const items = service.getRoleCatalogSkills(role);
  response.json({ success: true, message: "Role catalog retrieved", data: { items } });
};


