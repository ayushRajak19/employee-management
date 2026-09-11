import { Department } from "../models/Department.js";
import { Team } from "../models/Team.js";
import { Designation, type DesignationSkillItem } from "../models/Designation.js";
import { Employee } from "../models/Employee.js";
import { AppError } from "../utils/AppError.js";
import { roleSkillCatalog } from "../data/roleSkillCatalog.js";
import { profilePhotoUrl } from "./storageService.js";

type DepartmentInput = { name: string; code: string; description?: string; capabilities?: ("SALES_MODULE")[] };
type TeamInput = Omit<DepartmentInput, "capabilities"> & { department: string };
type DesignationInput = Omit<DepartmentInput, "capabilities"> & { department?: string; level?: string; catalogRole?: string; customSkills?: DesignationSkillItem[] };

export const listOrganization = async () => {
  const [departments, teams, designations] = await Promise.all([
    Department.find({ isActive: true }).sort("name").lean(),
    Team.find({ isActive: true }).populate("department", "name code").sort("name").lean(),
    Designation.find({ isActive: true }).populate("department", "name code").sort("name").lean(),
  ]);
  const skillCatalogRoles = [...new Set(roleSkillCatalog.map((item) => item.role))].map((role) => ({
    role,
    skillCount: roleSkillCatalog.filter((item) => item.role === role).length,
  }));
  return { departments, teams, designations, skillCatalogRoles };
};

export const createDepartment = async (input: DepartmentInput) => Department.create(input);

export const createTeam = async (input: TeamInput) => {
  if (!await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  return Team.create(input);
};

export const createDesignation = async (input: DesignationInput) => {
  if (input.department && !await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  if (input.catalogRole && !roleSkillCatalog.some((item) => item.role === input.catalogRole)) throw new AppError("Select a valid skill catalogue for this designation", 422, "INVALID_SKILL_CATALOG");
  return Designation.create(input);
};

export const updateDepartment = async (id: string, input: Partial<DepartmentInput>) => {
  const item = await Department.findOneAndUpdate({ _id: id, isActive: true }, { $set: input }, { new: true, runValidators: true });
  if (!item) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  return item;
};

export const updateTeam = async (id: string, input: Partial<TeamInput>) => {
  if (input.department && !await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  const item = await Team.findOneAndUpdate({ _id: id, isActive: true }, { $set: input }, { new: true, runValidators: true }).populate("department", "name code");
  if (!item) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  return item;
};

export const updateDesignation = async (id: string, input: Partial<DesignationInput>) => {
  if (input.department && !await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  if (input.catalogRole && !roleSkillCatalog.some((item) => item.role === input.catalogRole)) throw new AppError("Select a valid skill catalogue for this designation", 422, "INVALID_SKILL_CATALOG");
  const item = await Designation.findOneAndUpdate({ _id: id, isActive: true }, { $set: input }, { new: true, runValidators: true }).populate("department", "name code");
  if (!item) throw new AppError("Designation not found", 404, "DESIGNATION_NOT_FOUND");
  return item;
};

export const setDesignationAssessmentSkills = async (id: string, skills: DesignationSkillItem[], catalogRole?: string) => {
  const updateData: Record<string, unknown> = { customSkills: skills };
  if (catalogRole !== undefined) updateData.catalogRole = catalogRole;
  const item = await Designation.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("department", "name code");
  if (!item) throw new AppError("Designation not found", 404, "DESIGNATION_NOT_FOUND");
  return item;
};

import { calculateSeniorityRank } from "./hierarchyService.js";

export const getRoleCatalogSkills = (role: string) => {
  return roleSkillCatalog.filter((item) => item.role.toLowerCase() === role.toLowerCase());
};

export const getOrganizationHierarchyFlow = async () => {
  const [departments, teams, designations, rawEmployees] = await Promise.all([
    Department.find({ isActive: true }).select("name code description").sort("name").lean(),
    Team.find({ isActive: true }).populate("department", "name code").select("name code department").sort("name").lean(),
    Designation.find({ isActive: true }).populate("department", "name code").select("name code department level").sort("name").lean(),
    Employee.find({ isActive: true })
      .populate("department", "name code")
      .populate("team", "name code")
      .populate("designation", "name code level")
      .populate("reportingManager", "firstName lastName employeeId profilePhotoKey")
      .populate("user", "role")
      .select("employeeId firstName lastName officialEmail phone profilePhotoKey department team designation reportingManager status employmentType user dateOfJoining")
      .sort("firstName")
      .lean(),
  ]);

  const mappedEmployees = rawEmployees.map((emp) => {
    const seniority = calculateSeniorityRank({
      role: (emp.user as any)?.role,
      designationTitle: (emp.designation as any)?.name,
      designationLevel: (emp.designation as any)?.level,
    });

    return {
      _id: emp._id.toString(),
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      officialEmail: emp.officialEmail,
      phone: emp.phone,
      profilePhotoUrl: profilePhotoUrl(emp.profilePhotoKey),
      department: emp.department
        ? {
            _id: (emp.department as any)._id?.toString() || "",
            name: (emp.department as any).name || "",
            code: (emp.department as any).code || "",
          }
        : null,
      team: emp.team
        ? {
            _id: (emp.team as any)._id?.toString() || "",
            name: (emp.team as any).name || "",
            code: (emp.team as any).code || "",
          }
        : null,
      designation: emp.designation
        ? {
            _id: (emp.designation as any)._id?.toString() || "",
            name: (emp.designation as any).name || "",
            code: (emp.designation as any).code || "",
            level: (emp.designation as any).level || "",
          }
        : null,
      reportingManager: emp.reportingManager
        ? {
            _id: (emp.reportingManager as any)._id?.toString() || "",
            firstName: (emp.reportingManager as any).firstName || "",
            lastName: (emp.reportingManager as any).lastName || "",
            name: `${(emp.reportingManager as any).firstName || ""} ${(emp.reportingManager as any).lastName || ""}`.trim(),
            employeeId: (emp.reportingManager as any).employeeId || "",
            profilePhotoUrl: profilePhotoUrl((emp.reportingManager as any).profilePhotoKey),
          }
        : null,
      seniorityRank: seniority.rank,
      seniorityTierName: seniority.tierName,
      role: (emp.user as any)?.role || "EMPLOYEE",
      userId: (emp.user as any)?._id?.toString() || "",
      status: emp.status,
      employmentType: emp.employmentType,
      dateOfJoining: emp.dateOfJoining,
    };
  });

  // Sort employees by seniority rank ascending (Rank 1 CEO is top)
  const sortedBySeniority = [...mappedEmployees].sort((a, b) => a.seniorityRank - b.seniorityRank);
  const topExecutive = sortedBySeniority[0] || null;

  let unassignedManagersCount = 0;

  // Resolve effective hierarchy: infer reporting lines if reportingManager is null in DB
  const resolvedEmployees = mappedEmployees.map((emp) => {
    if (emp.reportingManager?._id) {
      return {
        ...emp,
        effectiveReportingManager: emp.reportingManager,
        isReportingManagerInferred: false,
      };
    }

    // Top executive has no reporting manager (root of organization)
    if (topExecutive && emp._id === topExecutive._id) {
      return {
        ...emp,
        effectiveReportingManager: null,
        isReportingManagerInferred: false,
      };
    }

    unassignedManagersCount++;

    // Tier 2 (C-Suite / VP) reports directly to top executive
    if (emp.seniorityRank <= 2 && topExecutive) {
      return {
        ...emp,
        effectiveReportingManager: {
          _id: topExecutive._id,
          firstName: topExecutive.firstName,
          lastName: topExecutive.lastName,
          name: topExecutive.name,
          employeeId: topExecutive.employeeId,
          profilePhotoUrl: topExecutive.profilePhotoUrl,
        },
        isReportingManagerInferred: true,
      };
    }

    // Tier 3-6: Look for departmental superior (same department, higher seniority rank)
    const deptSuperior = sortedBySeniority.find(
      (cand) =>
        cand._id !== emp._id &&
        cand.department?._id &&
        cand.department._id === emp.department?._id &&
        cand.seniorityRank < emp.seniorityRank
    );

    if (deptSuperior) {
      return {
        ...emp,
        effectiveReportingManager: {
          _id: deptSuperior._id,
          firstName: deptSuperior.firstName,
          lastName: deptSuperior.lastName,
          name: deptSuperior.name,
          employeeId: deptSuperior.employeeId,
          profilePhotoUrl: deptSuperior.profilePhotoUrl,
        },
        isReportingManagerInferred: true,
      };
    }

    // Fallback: Highest superior across the organization or top executive
    const fallbackSuperior =
      sortedBySeniority.find((cand) => cand._id !== emp._id && cand.seniorityRank < emp.seniorityRank) ||
      topExecutive;

    return {
      ...emp,
      effectiveReportingManager:
        fallbackSuperior && fallbackSuperior._id !== emp._id
          ? {
              _id: fallbackSuperior._id,
              firstName: fallbackSuperior.firstName,
              lastName: fallbackSuperior.lastName,
              name: fallbackSuperior.name,
              employeeId: fallbackSuperior.employeeId,
              profilePhotoUrl: fallbackSuperior.profilePhotoUrl,
            }
          : null,
      isReportingManagerInferred: Boolean(fallbackSuperior && fallbackSuperior._id !== emp._id),
    };
  });

  // Calculate direct reports count for each employee based on effective hierarchy
  const directReportsCountMap = new Map<string, number>();
  for (const emp of resolvedEmployees) {
    const mgrId = emp.effectiveReportingManager?._id;
    if (mgrId) {
      directReportsCountMap.set(
        mgrId,
        (directReportsCountMap.get(mgrId) || 0) + 1
      );
    }
  }

  const enrichedEmployees = resolvedEmployees.map((emp) => ({
    ...emp,
    directReportsCount: directReportsCountMap.get(emp._id) || 0,
  }));

  // Group into industry-standard seniority tiers
  const tierDefinitions = [
    { rank: 1, tierName: "Executive Leadership (Tier 1)", badgeColor: "amber" },
    { rank: 2, tierName: "Senior Leadership / C-Suite (Tier 2)", badgeColor: "indigo" },
    { rank: 3, tierName: "Management & Leads (Tier 3)", badgeColor: "teal" },
    { rank: 4, tierName: "Senior Staff & Specialists (Tier 4)", badgeColor: "emerald" },
    { rank: 5, tierName: "Individual Contributors (Tier 5)", badgeColor: "blue" },
    { rank: 6, tierName: "Associate & Entry Level (Tier 6)", badgeColor: "slate" },
  ];

  const seniorityTiers = tierDefinitions
    .map((def) => ({
      ...def,
      employees: enrichedEmployees.filter((e) => e.seniorityRank === def.rank),
    }))
    .filter((t) => t.employees.length > 0);

  return {
    departments,
    teams,
    designations,
    employees: enrichedEmployees,
    seniorityTiers,
    stats: {
      totalEmployees: enrichedEmployees.length,
      totalDepartments: departments.length,
      totalTeams: teams.length,
      totalDesignations: designations.length,
      totalManagers: directReportsCountMap.size,
      unassignedManagersCount,
    },
  };
};


