import { Types } from "mongoose";
import type { RoleName } from "@mobius-ems/shared";
import { Employee } from "../models/Employee.js";
import { AppError } from "../utils/AppError.js";

export interface ViewerHierarchyScope {
  scopeType: "ALL" | "DEPARTMENT" | "SUBTREE" | "SELF";
  ownEmployeeId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  allowedEmployeeIds: Types.ObjectId[];
  subordinateEmployeeIds: Types.ObjectId[];
}

export const getRecursiveSubordinateIds = async (rootEmployeeId: Types.ObjectId): Promise<Types.ObjectId[]> => {
  const seen = new Set<string>();
  let frontier: Types.ObjectId[] = [rootEmployeeId];
  const results: Types.ObjectId[] = [];

  while (frontier.length > 0) {
    const children = (await Employee.find({
      reportingManager: { $in: frontier },
      isActive: true,
    }).distinct("_id")) as Types.ObjectId[];

    frontier = [];
    for (const childId of children) {
      const idStr = childId.toString();
      if (!seen.has(idStr) && idStr !== rootEmployeeId.toString()) {
        seen.add(idStr);
        results.push(childId);
        frontier.push(childId);
      }
    }
  }

  return results;
};

export const getViewerHierarchyScope = async (viewer: { id: string; role: RoleName }): Promise<ViewerHierarchyScope> => {
  if (viewer.role === "SUPER_ADMIN" || viewer.role === "HR_ADMIN") {
    const allEmployees = (await Employee.find({ isActive: true }).distinct("_id")) as Types.ObjectId[];
    const own = await Employee.findOne({ user: viewer.id, isActive: true }).select("_id");
    return {
      scopeType: "ALL",
      ownEmployeeId: own?._id,
      allowedEmployeeIds: allEmployees,
      subordinateEmployeeIds: own ? allEmployees.filter((id) => !id.equals(own._id)) : allEmployees,
    };
  }

  const own = await Employee.findOne({ user: viewer.id, isActive: true }).select("_id department team");

  if (!own) {
    return {
      scopeType: viewer.role === "EMPLOYEE" ? "SELF" : "SUBTREE",
      allowedEmployeeIds: [],
      subordinateEmployeeIds: [],
    };
  }

  if (viewer.role === "DEPARTMENT_HEAD") {
    const deptEmployees = (await Employee.find({
      department: own.department,
      isActive: true,
    }).distinct("_id")) as Types.ObjectId[];

    return {
      scopeType: "DEPARTMENT",
      ownEmployeeId: own._id,
      departmentId: own.department,
      allowedEmployeeIds: deptEmployees,
      subordinateEmployeeIds: deptEmployees.filter((id) => !id.equals(own._id)),
    };
  }

  if (viewer.role === "MANAGER") {
    const subordinates = await getRecursiveSubordinateIds(own._id);
    return {
      scopeType: "SUBTREE",
      ownEmployeeId: own._id,
      departmentId: own.department,
      allowedEmployeeIds: [own._id, ...subordinates],
      subordinateEmployeeIds: subordinates,
    };
  }

  if (viewer.role === "TEAM_LEAD") {
    const directConditions: Record<string, unknown>[] = [{ reportingManager: own._id }];
    if (own.team) {
      directConditions.push({ team: own.team, _id: { $ne: own._id } });
    }

    const directReports = (await Employee.find({
      $or: directConditions,
      isActive: true,
    }).distinct("_id")) as Types.ObjectId[];

    const seen = new Set<string>();
    const subordinates: Types.ObjectId[] = [];
    let frontier: Types.ObjectId[] = [];

    for (const reportId of directReports) {
      const idStr = reportId.toString();
      if (!seen.has(idStr) && idStr !== own._id.toString()) {
        seen.add(idStr);
        subordinates.push(reportId);
        frontier.push(reportId);
      }
    }

    while (frontier.length > 0) {
      const children = (await Employee.find({
        reportingManager: { $in: frontier },
        isActive: true,
      }).distinct("_id")) as Types.ObjectId[];

      frontier = [];
      for (const childId of children) {
        const idStr = childId.toString();
        if (!seen.has(idStr) && idStr !== own._id.toString()) {
          seen.add(idStr);
          subordinates.push(childId);
          frontier.push(childId);
        }
      }
    }

    return {
      scopeType: "SUBTREE",
      ownEmployeeId: own._id,
      departmentId: own.department,
      allowedEmployeeIds: [own._id, ...subordinates],
      subordinateEmployeeIds: subordinates,
    };
  }

  return {
    scopeType: "SELF",
    ownEmployeeId: own._id,
    departmentId: own.department,
    allowedEmployeeIds: [own._id],
    subordinateEmployeeIds: [],
  };
};

export const assertEmployeeInScope = (
  scope: ViewerHierarchyScope,
  targetEmployeeId: string | Types.ObjectId,
  errorMessage = "Employee is outside your permitted scope",
): void => {
  if (scope.scopeType === "ALL") return;
  const targetStr = targetEmployeeId.toString();
  const allowed = scope.allowedEmployeeIds.some((id) => id.toString() === targetStr);
  if (!allowed) {
    throw new AppError(errorMessage, 403, "FORBIDDEN");
  }
};

export const assertSubordinateInScope = (
  scope: ViewerHierarchyScope,
  targetEmployeeId: string | Types.ObjectId,
  errorMessage = "Target employee is not a subordinate in your reporting hierarchy",
): void => {
  if (scope.scopeType === "ALL") return;
  const targetStr = targetEmployeeId.toString();
  const allowed = scope.subordinateEmployeeIds.some((id) => id.toString() === targetStr);
  if (!allowed) {
    throw new AppError(errorMessage, 403, "FORBIDDEN");
  }
};
