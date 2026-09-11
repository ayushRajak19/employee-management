import type { CapabilityName } from "@mobius-ems/shared";
export interface DesignationSkillItem {
  id: string;
  name: string;
  category: string;
  level: "Basic" | "Intermediate" | "Advanced";
  tools?: string;
  description: string;
  assessmentQuestion?: string;
}
export interface NamedEntity { _id: string; name: string; code: string; description?: string; department?: NamedEntity; catalogRole?: string; customSkills?: DesignationSkillItem[]; capabilities?: CapabilityName[] }
export interface OrganizationData { departments: NamedEntity[]; teams: NamedEntity[]; designations: NamedEntity[]; skillCatalogRoles: { role: string; skillCount: number }[] }
export interface EmployeeRow { _id: string; employeeId: string; firstName: string; lastName: string; officialEmail: string; phone?: string; profilePhotoUrl?: string; department: NamedEntity; team?: NamedEntity; designation: NamedEntity; reportingManager?: { firstName: string; lastName: string }; status: string; employmentType: string; profileCompletion: number }
