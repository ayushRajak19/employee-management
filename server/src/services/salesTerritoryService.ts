import type { SessionUser } from "@mobius-ems/shared";
import { Department } from "../models/Department.js";
import { Employee } from "../models/Employee.js";
import {
  EmployeeTerritoryAssignment,
  type EmployeeTerritoryAssignmentDocument,
} from "../models/EmployeeTerritoryAssignment.js";
import { GeoNode } from "../models/GeoNode.js";
import { SalesTerritory, type SalesTerritoryDocument } from "../models/SalesTerritory.js";
import { SalesCustomer } from "../models/SalesCustomer.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { assertSalesEmployeeScope, assertSalesGeoScope, assertSalesTerritoryScope, resolveSalesScope } from "./salesScopeService.js";

type TerritoryInput = Pick<SalesTerritoryDocument, "name" | "code" | "status" | "effectiveFrom" | "coverageRules"> & {
  parentTerritory?: string;
  ownerEmployee?: string;
  effectiveTo?: Date;
};

const validateTerritoryInput = async (input: Partial<TerritoryInput>, id?: string) => {
  if (input.effectiveFrom && input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
    throw new AppError("Effective end must be after start", 422);
  }
  let ancestors: SalesTerritoryDocument["ancestors"] | undefined;
  if (input.parentTerritory) {
    if (input.parentTerritory === id) throw new AppError("Territory cannot be its own parent", 422, "CIRCULAR_TERRITORY_HIERARCHY");
    const parent = await SalesTerritory.findById(input.parentTerritory);
    if (!parent) throw new AppError("Parent territory not found", 404);
    if (id && parent.ancestors.some((ancestor) => ancestor.toString() === id)) {
      throw new AppError("Circular territory hierarchy is not allowed", 422, "CIRCULAR_TERRITORY_HIERARCHY");
    }
    ancestors = [...parent.ancestors, parent._id];
  } else if (input.parentTerritory === "") {
    ancestors = [];
  }
  if (input.ownerEmployee && !await Employee.exists({ _id: input.ownerEmployee, isActive: true })) {
    throw new AppError("Owner employee not found", 404);
  }
  const geoIds = input.coverageRules?.geoNodeIds ?? [];
  if (geoIds.length && await GeoNode.countDocuments({ _id: { $in: geoIds }, isActive: true }) !== geoIds.length) {
    throw new AppError("Coverage includes an invalid geography", 422);
  }
  const accountIds = input.coverageRules?.namedAccountIds ?? [];
  if (accountIds.length) {
    if (await SalesCustomer.countDocuments({ _id: { $in: accountIds } }) !== accountIds.length) throw new AppError("Coverage includes an invalid named account", 422);
  }
  return ancestors;
};

export const listTerritories = async (viewer: SessionUser) => {
  const scope = await resolveSalesScope(viewer);
  return SalesTerritory.find({ _id: { $in: scope.allowedTerritoryIds }, status: { $ne: "INACTIVE" } })
    .populate("parentTerritory ownerEmployee", "name code firstName lastName employeeId")
    .sort("name")
    .lean();
};

export const getTerritory = async (viewer: SessionUser, id: string) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesTerritoryScope(scope, id);
  const item = await SalesTerritory.findById(id)
    .populate("parentTerritory ownerEmployee coverageRules.geoNodeIds", "name code type firstName lastName employeeId")
    .lean();
  if (!item) throw new AppError("Territory not found", 404);
  return item;
};

export const createTerritory = async (viewer: SessionUser, input: TerritoryInput) => {
  const scope = await resolveSalesScope(viewer);
  if (input.parentTerritory) assertSalesTerritoryScope(scope, input.parentTerritory);
  if (input.ownerEmployee) assertSalesEmployeeScope(scope, input.ownerEmployee);
  for (const geoId of input.coverageRules?.geoNodeIds ?? []) {
    assertSalesGeoScope(scope, geoId.toString());
  }
  const normalized = scope.level !== "ALL" && scope.employeeId
    ? { ...input, ownerEmployee: scope.employeeId }
    : input;
  const item = await SalesTerritory.create({ ...normalized, ancestors: await validateTerritoryInput(normalized) ?? [] });
  if (scope.employeeId) {
    await EmployeeTerritoryAssignment.create({
      employee: scope.employeeId,
      territory: item._id,
      assignmentRole: "OWNER",
      primary: true,
      effectiveFrom: normalized.effectiveFrom,
      isActive: true,
    });
  }
  await writeAudit({ user: viewer.id, action: "SALES_TERRITORY_CREATED", entityType: "SalesTerritory", entityId: item.id, newValue: input });
  return item;
};

export const updateTerritory = async (viewer: SessionUser, id: string, input: Partial<TerritoryInput>) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesTerritoryScope(scope, id);
  if (input.parentTerritory) assertSalesTerritoryScope(scope, input.parentTerritory);
  if (input.ownerEmployee) assertSalesEmployeeScope(scope, input.ownerEmployee);
  for (const geoId of input.coverageRules?.geoNodeIds ?? []) assertSalesGeoScope(scope, geoId.toString());
  const item = await SalesTerritory.findById(id);
  if (!item) throw new AppError("Territory not found", 404);
  const previous = item.toObject();
  const ancestors = await validateTerritoryInput(input, id);
  Object.assign(item, input, ancestors !== undefined ? { ancestors } : {});
  await item.save();
  if (ancestors !== undefined) {
    const descendants = await SalesTerritory.find({ ancestors: item._id });
    for (const descendant of descendants) {
      const position = descendant.ancestors.findIndex((ancestor) => ancestor.equals(item._id));
      descendant.ancestors = [...ancestors, item._id, ...descendant.ancestors.slice(position + 1)];
      await descendant.save();
    }
  }
  await writeAudit({ user: viewer.id, action: "SALES_TERRITORY_UPDATED", entityType: "SalesTerritory", entityId: item.id, oldValue: previous, newValue: input });
  return item;
};

type AssignmentInput = Omit<EmployeeTerritoryAssignmentDocument, "employee" | "territory" | "isActive"> & {
  employee: string;
  territory: string;
};

export const effectivePeriodsOverlap = (firstStart: Date, firstEnd: Date | undefined, secondStart: Date, secondEnd: Date | undefined) => {
  const endOfTime = new Date("9999-12-31T23:59:59.999Z");
  return firstStart <= (secondEnd ?? endOfTime) && secondStart <= (firstEnd ?? endOfTime);
};

export const assignEmployee = async (viewer: SessionUser, input: AssignmentInput) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesEmployeeScope(scope, input.employee);
  assertSalesTerritoryScope(scope, input.territory);
  if (scope.level === "SELF") {
    if (scope.employeeId !== input.employee) throw new AppError("Sales employees can only assign themselves", 403, "SALES_SCOPE_FORBIDDEN");
  }
  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) throw new AppError("Effective end must be after start", 422);
  const employee = await Employee.findOne({ _id: input.employee, isActive: true }).select("department").lean();
  const territory = await SalesTerritory.exists({ _id: input.territory, status: { $ne: "INACTIVE" } });
  if (!employee || !territory) throw new AppError("Employee or territory not found", 404);
  if (!await Department.exists({ _id: employee.department, capabilities: "SALES_MODULE", isActive: true })) {
    throw new AppError("Employee is not eligible for Sales", 422, "SALES_NOT_ENABLED");
  }
  const existingAssignment = await EmployeeTerritoryAssignment.findOne({
    employee: input.employee,
    territory: input.territory,
    isActive: true,
    assignmentRole: input.assignmentRole,
    effectiveFrom: { $lte: input.effectiveFrom },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: input.effectiveFrom } }],
  }).sort({ effectiveFrom: -1 });
  if (existingAssignment) return existingAssignment;
  const overlap = await EmployeeTerritoryAssignment.exists({
    employee: input.employee,
    territory: input.territory,
    isActive: true,
    effectiveFrom: { $lte: input.effectiveTo ?? new Date("9999-12-31") },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: input.effectiveFrom } }],
  });
  if (overlap) throw new AppError("This employee is already assigned to this territory for the selected period", 409, "ASSIGNMENT_OVERLAP");
  const item = await EmployeeTerritoryAssignment.create({ ...input, isActive: true });
  await writeAudit({ user: viewer.id, action: "SALES_TERRITORY_ASSIGNED", entityType: "EmployeeTerritoryAssignment", entityId: item.id, newValue: input });
  return item;
};

export const territoryEmployees = async (viewer: SessionUser, territoryId: string) => {
  const scope = await resolveSalesScope(viewer);
  assertSalesTerritoryScope(scope, territoryId);
  const territories = await SalesTerritory.find({ $or: [{ _id: territoryId }, { ancestors: territoryId }] }).distinct("_id");
  const allowed = territories.filter((id) => scope.allowedTerritoryIds.some((candidate) => candidate.equals(id)));
  return EmployeeTerritoryAssignment.find({
    territory: { $in: allowed },
    employee: { $in: scope.allowedEmployeeIds },
    isActive: true,
  })
    .populate("employee", "firstName lastName employeeId department designation")
    .populate("territory", "name code")
    .sort({ primary: -1, effectiveFrom: -1 })
    .lean();
};
