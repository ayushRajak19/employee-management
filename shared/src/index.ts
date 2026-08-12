export const ROLES = ["SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "MANAGER", "EMPLOYEE"] as const;
export type RoleName = (typeof ROLES)[number];

export const PERMISSIONS = [
  "employee.view", "employee.create", "employee.update", "employee.deactivate",
  "department.view", "department.create", "department.update",
  "skill.create", "skill.update", "skill.verify", "skill.reject",
  "task.create", "task.assign", "task.update", "task.review",
  "performance.view", "performance.review", "goal.create", "goal.update",
  "kpi.create", "kpi.evaluate", "document.view", "document.upload",
  "report.view", "audit.view", "settings.manage"
] as const;
export type PermissionName = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionName[]> = {
  SUPER_ADMIN: PERMISSIONS,
  HR_ADMIN: PERMISSIONS.filter((permission) => !["settings.manage", "skill.verify"].includes(permission)),
  DEPARTMENT_HEAD: ["employee.view", "department.view", "skill.verify", "task.create", "task.assign", "task.update", "task.review", "performance.view", "performance.review", "goal.create", "goal.update", "kpi.evaluate", "document.view", "report.view"],
  MANAGER: ["employee.view", "department.view", "task.create", "task.assign", "task.update", "task.review", "performance.view", "performance.review", "goal.create", "goal.update", "kpi.evaluate", "document.view", "report.view"],
  EMPLOYEE: ["employee.view", "department.view", "task.update", "performance.view", "goal.update", "document.view", "document.upload"]
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  permissions: PermissionName[];
  forcePasswordChange: boolean;
  onboardingComplete: boolean;
}

export interface ApiResponse<T> { success: boolean; message: string; data?: T; errors?: Record<string, string[]> }
