import { api } from "@/api/client"; import type { DesignationSkillItem, NamedEntity, OrganizationData } from "./types";
export const organizationApi = {
  list: () => api.get<OrganizationData>("/api/v1/organization"),
  createDepartment: (body: { name: string; code: string; description?: string; capabilities?: ("SALES_MODULE")[] }) => api.post("/api/v1/organization/departments", body),
  createTeam: (body: { name: string; code: string; department: string; description?: string }) => api.post("/api/v1/organization/teams", body),
  createDesignation: (body: { name: string; code: string; department?: string; level?: string; description?: string; catalogRole?: string }) => api.post("/api/v1/organization/designations", body),
  updateDepartment: (id: string, body: Record<string, unknown>) => api.patch(`/api/v1/organization/departments/${id}`, body),
  updateTeam: (id: string, body: Record<string, unknown>) => api.patch(`/api/v1/organization/teams/${id}`, body),
  updateDesignation: (id: string, body: Record<string, unknown>) => api.patch(`/api/v1/organization/designations/${id}`, body),
  updateDesignationSkills: (id: string, body: { skills: DesignationSkillItem[]; catalogRole?: string }) => api.put<{ item: NamedEntity }>(`/api/v1/organization/designations/${id}/skills`, body),
  getSkillCatalogForRole: (role: string) => api.get<{ items: DesignationSkillItem[] }>(`/api/v1/organization/skill-catalog/${encodeURIComponent(role)}`),
};


