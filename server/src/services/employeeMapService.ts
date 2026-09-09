import type { SessionUser } from "@mobius-ems/shared";
import { Employee } from "../models/Employee.js";
import { EmployeeTerritoryAssignment } from "../models/EmployeeTerritoryAssignment.js";
import { GeoNode } from "../models/GeoNode.js";
import { AppError } from "../utils/AppError.js";
import { resolveSalesScope } from "./salesScopeService.js";

const palette = [
  "#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2",
  "#c026d3", "#4f46e5", "#65a30d", "#be123c", "#0f766e", "#9333ea",
] as const;

export const getEmployeeMapColor = (employeeId: string): string => {
  let hash = 2166136261;
  for (const character of employeeId) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return palette[(hash >>> 0) % palette.length] ?? palette[0]!;
};

const reportingTeamIds = async (userId: string) => {
  const manager = await Employee.findOne({ user: userId, isActive: true }).select("_id");
  if (!manager) return [];
  const seen = new Map([[manager.id, manager._id]]);
  let frontier = [manager._id];
  while (frontier.length) {
    const next = await Employee.find({ reportingManager: { $in: frontier }, isActive: true }).distinct("_id");
    frontier = next.filter((id) => !seen.has(id.toString()));
    for (const id of frontier) seen.set(id.toString(), id);
  }
  return [...seen.values()];
};

export const employeeMap = async (viewer: SessionUser) => {
  let ids;
  let scope: "ALL" | "TEAM" | "SELF";
  if (viewer.permissions.includes("employee_map.all")) {
    ids = await Employee.find({ isActive: true }).distinct("_id");
    scope = "ALL";
  } else if (viewer.permissions.includes("employee_map.team")) {
    ids = viewer.capabilities.includes("SALES_MODULE") && viewer.permissions.includes("sales.map.team")
      ? (await resolveSalesScope(viewer)).allowedEmployeeIds
      : await reportingTeamIds(viewer.id);
    scope = "TEAM";
  } else if (viewer.permissions.includes("employee_map.self")) {
    ids = await Employee.find({ user: viewer.id, isActive: true }).distinct("_id");
    scope = "SELF";
  } else {
    throw new AppError("Employee map access is not permitted", 403);
  }

  const now = new Date();
  const [employees, assignments] = await Promise.all([
    Employee.find({ _id: { $in: ids }, isActive: true })
      .select("firstName lastName employeeId status profilePhotoKey officeLocation department designation reportingManager workLocation")
      .populate("department designation reportingManager", "name code firstName lastName employeeId")
      .lean(),
    EmployeeTerritoryAssignment.find({
      employee: { $in: ids },
      isActive: true,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: now } }],
    }).populate("territory", "name code coverageRules.geoNodeIds").lean(),
  ]);
  const geoIds = employees.flatMap((employee) => {
    const location = employee.workLocation;
    return location ? [location.geoNode, location.country, location.state, location.district, location.city].filter(Boolean) : [];
  });
  const roots = await GeoNode.find({ _id: { $in: geoIds }, isActive: true }).select("_id ancestors").lean();
  const visibleGeoIds = [...new Set(roots.flatMap((node) => [node._id.toString(), ...node.ancestors.map(String)]))];
  const geography = await GeoNode.find({ _id: { $in: visibleGeoIds }, isActive: true })
    .select("name code type parent ancestors depth location boundary")
    .sort({ depth: 1, name: 1 })
    .lean();
  const territoryByEmployee = new Map(assignments.map((assignment) => [assignment.employee.toString(), assignment.territory]));
  return {
    scope,
    geography,
    employees: employees.map((employee) => ({
      ...employee,
      markerColor: getEmployeeMapColor(employee._id.toString()),
      salesTerritory: territoryByEmployee.get(employee._id.toString()),
    })),
  };
};
