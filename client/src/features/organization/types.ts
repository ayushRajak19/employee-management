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

export interface HierarchyEmployeeNode {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  officialEmail: string;
  phone?: string;
  profilePhotoUrl?: string;
  department: NamedEntity | null;
  team: NamedEntity | null;
  designation: (NamedEntity & { level?: string }) | null;
  reportingManager: {
    _id: string;
    firstName: string;
    lastName: string;
    name: string;
    employeeId: string;
    profilePhotoUrl?: string;
  } | null;
  role: string;
  userId: string;
  status: string;
  employmentType: string;
  dateOfJoining?: string;
  directReportsCount: number;
}

export interface OrganizationHierarchyData {
  departments: NamedEntity[];
  teams: NamedEntity[];
  designations: NamedEntity[];
  employees: HierarchyEmployeeNode[];
  stats: {
    totalEmployees: number;
    totalDepartments: number;
    totalTeams: number;
    totalDesignations: number;
    totalManagers: number;
  };
}

