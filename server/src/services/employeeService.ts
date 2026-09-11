import { randomBytes } from "node:crypto"; import bcrypt from "bcrypt"; import type { FilterQuery } from "mongoose"; import type { RoleName, SessionUser } from "@mobius-ems/shared";
import { Employee, type EmployeeDocument } from "../models/Employee.js"; import { User } from "../models/User.js"; import { Role } from "../models/Role.js"; import { Department } from "../models/Department.js"; import { Team } from "../models/Team.js"; import { Designation } from "../models/Designation.js"; import { AppError } from "../utils/AppError.js"; import { writeAudit } from "./auditService.js";
import { notify } from "./notificationService.js";
import { EmployeeTimeline } from "../models/EmployeeTimeline.js"; import { EmployeeSkill } from "../models/EmployeeSkill.js"; import { Task } from "../models/Task.js"; import { Project } from "../models/Project.js"; import { Goal } from "../models/Goal.js"; import { EmployeeKPI } from "../models/EmployeeKPI.js"; import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js"; import { EmployeeTraining } from "../models/EmployeeTraining.js"; import { Document } from "../models/Document.js"; import { Recognition } from "../models/Recognition.js";
import { recalculateProfileCompletion } from "./profileCompletionService.js";
import { RoleSkillAssessment } from "../models/RoleSkillAssessment.js";
import { deletePrivateObject, deleteProfilePhoto, profilePhotoUrl, uploadProfilePhoto } from "./storageService.js";
import { Assessment } from "../models/Assessment.js"; import { AssessmentResult } from "../models/AssessmentResult.js"; import { Attendance } from "../models/Attendance.js"; import { AiEmployeeSummary } from "../models/AiEmployeeSummary.js"; import { ContributionReview } from "../models/ContributionReview.js"; import { ContributionSnapshot } from "../models/ContributionSnapshot.js"; import { DailyTodo } from "../models/DailyTodo.js"; import { LeaveRequest } from "../models/LeaveRequest.js"; import { Notification } from "../models/Notification.js"; import { OneToOne } from "../models/OneToOne.js"; import { PerformanceReview } from "../models/PerformanceReview.js"; import { RefreshSession } from "../models/RefreshSession.js"; import { SkillVerification } from "../models/SkillVerification.js"; import { TaskActivity } from "../models/TaskActivity.js"; import { WeeklyUpdate } from "../models/WeeklyUpdate.js"; import { AuditLog } from "../models/AuditLog.js";
import { employeeAnalytics } from "./salesAnalyticsService.js";
import { GeoNode } from "../models/GeoNode.js";
interface CreateEmployeeInput { employeeId: string; firstName: string; lastName: string; officialEmail: string; phone?: string; department: string; team?: string; designation: string; reportingManager?: string; dateOfJoining: Date; employmentType: EmployeeDocument["employmentType"]; officeLocation?: string; workLocation?: { geoNode: string; coordinates?: { type: "Point"; coordinates: [number, number] } }; role: RoleName; status: EmployeeDocument["status"] }
const temporaryPassword = () => `Mb!${randomBytes(9).toString("base64url")}7a`;
const employeeId = () => `MB-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
export const createEmployee = async (input: CreateEmployeeInput, actorId: string, meta: { ip?: string; userAgent?: string }) => {
  const [department, designation, role] = await Promise.all([Department.findOne({ _id: input.department, isActive: true }), Designation.findOne({ _id: input.designation, isActive: true }), Role.findOne({ name: input.role })]);
  if (!department) throw new AppError("Department not found", 404); if (!designation) throw new AppError("Designation not found", 404); if (!role) throw new AppError("Role not found; run the seed command", 400);
  if (input.team && !await Team.exists({ _id: input.team, department: input.department, isActive: true })) throw new AppError("Team does not belong to the selected department", 422, "INVALID_TEAM");
  if (input.workLocation && !await GeoNode.exists({ _id: input.workLocation.geoNode, isActive: true })) throw new AppError("Work geography not found", 404);
  input.employeeId = input.employeeId.trim().toUpperCase();
  if (await Employee.exists({ employeeId: input.employeeId })) throw new AppError("This employee ID is already in use", 409, "EMPLOYEE_ID_EXISTS");
  const normalizedEmail = input.officialEmail.trim().toLowerCase();
  const [existingUser, existingEmployee] = await Promise.all([
    User.findOne({ email: normalizedEmail }).select("_id isActive").lean(),
    Employee.findOne({ officialEmail: normalizedEmail }).select("_id isActive").lean()
  ]);
  if (existingUser?.isActive || existingEmployee?.isActive) throw new AppError("An active account already uses this email", 409, "EMAIL_EXISTS");
  if (existingEmployee) {
    await deactivateEmployee(existingEmployee._id.toString(), actorId);
  } else if (existingUser) {
    await Promise.all([
      RefreshSession.deleteMany({ user: existingUser._id }),
      Notification.deleteMany({ recipient: existingUser._id }),
      AuditLog.deleteMany({ user: existingUser._id })
    ]);
    await User.deleteOne({ _id: existingUser._id });
  }
  input.officialEmail = normalizedEmail;
  const password = temporaryPassword(); const user = await User.create({ name: `${input.firstName} ${input.lastName}`, email: input.officialEmail, passwordHash: await bcrypt.hash(password, 12), role: role._id, isActive: true, forcePasswordChange: true, onboardingComplete: false });
  try { const employee = await Employee.create({ ...input, user: user._id }); user.employee = employee._id; await user.save(); await EmployeeTimeline.create({ employee: employee._id, type: "JOINED_COMPANY", title: "Joined company", description: `${employee.firstName} joined as an employee.`, performedBy: actorId, occurredAt: employee.dateOfJoining }); await writeAudit({ user: actorId, action: "EMPLOYEE_CREATED", entityType: "Employee", entityId: employee.id, newValue: { employeeId: employee.employeeId, email: employee.officialEmail, role: input.role }, ipAddress: meta.ip, userAgent: meta.userAgent }); await notify({ recipient: user.id, type: "ACCOUNT_CREATED", title: "Welcome to MobiusEMS", body: "Your employee account is ready. Change your temporary password and complete onboarding.", entityType: "Employee", entityId: employee.id }); return { employee: await employee.populate([{ path: "department", select: "name code" }, { path: "team", select: "name code" }, { path: "designation", select: "name code" }]), temporaryCredentials: { email: input.officialEmail, password } }; }
  catch (error) { await User.deleteOne({ _id: user._id }); throw error; }
};
import { getViewerHierarchyScope, assertEmployeeInScope } from "./hierarchyService.js";

export const listEmployees = async (query: { page: number; limit: number; search?: string; department?: string; status?: EmployeeDocument["status"] }, viewer: { id: string; role: RoleName }) => {
  const filter: FilterQuery<EmployeeDocument> = { isActive: true }; if (query.department) filter.department = query.department; if (query.status) filter.status = query.status;
  if (query.search) { const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.$or = [{ firstName: new RegExp(safe, "i") }, { lastName: new RegExp(safe, "i") }, { employeeId: new RegExp(safe, "i") }, { officialEmail: new RegExp(safe, "i") }]; }
  const scope = await getViewerHierarchyScope(viewer);
  if (scope.scopeType === "SELF") {
    filter.user = viewer.id;
  } else if (scope.scopeType === "DEPARTMENT") {
    filter.department = scope.departmentId;
  } else if (scope.scopeType === "SUBTREE") {
    filter._id = { $in: scope.allowedEmployeeIds };
  }
  const [items, total] = await Promise.all([Employee.find(filter).populate("department team designation reportingManager", "name code firstName lastName employeeId").sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(), Employee.countDocuments(filter)]); return { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};
const withPhoto = <T extends object>(employee: T & { profilePhotoKey?: string }) => ({ ...employee, profilePhotoUrl: profilePhotoUrl(employee.profilePhotoKey) });
export const getMyEmployee = async (userId: string) => {
  let employee = await Employee.findOne({ user: userId, isActive: true });
  if (!employee) {
    const user = await User.findById(userId);
    if (user?.isActive) {
      let dept = await Department.findOne({ isActive: true });
      if (!dept) {
        dept = await Department.create({ name: "General", code: "GEN", capabilities: [], isActive: true });
      }
      let desig = await Designation.findOne({ isActive: true });
      if (!desig) {
        desig = await Designation.create({ name: "Administrator", code: "ADMIN", department: dept._id, requiredSkills: [], customSkills: [], isActive: true });
      }
      const parts = (user.name || "Admin User").trim().split(/\s+/);
      const firstName = parts[0] || "Admin";
      const lastName = parts.slice(1).join(" ") || "User";
      employee = await Employee.create({
        employeeId: employeeId(),
        user: user._id,
        firstName,
        lastName,
        officialEmail: user.email,
        department: dept._id,
        designation: desig._id,
        dateOfJoining: user.get("createdAt") || new Date(),
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        onboardingStep: 8,
        profileCompletion: 60,
        isActive: true,
      });
      user.employee = employee._id;
      await user.save();
    }
  }
  if (!employee) throw new AppError("Employee profile not found", 404);
  await recalculateProfileCompletion(employee.id);
  const refreshed = await Employee.findById(employee._id).populate("department team designation reportingManager", "name code firstName lastName employeeId").lean();
  if (!refreshed) throw new AppError("Employee profile not found", 404);
  return withPhoto(refreshed);
};
export const updateOnboarding = async (userId: string, input: { step: number; personal?: EmployeeDocument["personal"]; professionalSummary?: string; previousExperience?: EmployeeDocument["previousExperience"]; complete?: boolean }) => {
  const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404);
  if (input.personal) employee.personal = { ...employee.personal, ...input.personal };
  if (input.professionalSummary !== undefined) employee.professionalSummary = input.professionalSummary;
  if (input.previousExperience) employee.previousExperience = input.previousExperience;
  employee.onboardingStep = Math.max(employee.onboardingStep, input.step);
  if (input.complete) { employee.status = "ACTIVE"; await User.updateOne({ _id: userId }, { $set: { onboardingComplete: true } }); }
  await employee.save(); const refreshed = await recalculateProfileCompletion(employee.id); return withPhoto((refreshed ?? employee).toObject());
};
export const updateMyProfile = async (userId: string, input: { firstName?: string; lastName?: string; phone?: string; professionalSummary?: string; personal?: EmployeeDocument["personal"]; previousExperience?: EmployeeDocument["previousExperience"] }) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); if (input.firstName !== undefined) employee.firstName = input.firstName; if (input.lastName !== undefined) employee.lastName = input.lastName; if (input.phone !== undefined) employee.phone = input.phone; if (input.professionalSummary !== undefined) employee.professionalSummary = input.professionalSummary; if (input.personal) employee.personal = { ...employee.personal, ...input.personal }; if (input.previousExperience !== undefined) employee.previousExperience = input.previousExperience; await employee.save(); await User.updateOne({ _id: userId }, { $set: { name: `${employee.firstName} ${employee.lastName}` } }); const refreshed = await recalculateProfileCompletion(employee.id); return withPhoto((refreshed ?? employee).toObject()); };
export const updateProfilePhoto = async (userId: string, file: Express.Multer.File) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); employee.profilePhotoKey = await uploadProfilePhoto(file.buffer, employee.id, file.mimetype); await employee.save(); return withPhoto(employee.toObject()); };
export const employee360 = async (id: string, viewer: { id: string; role: RoleName; permissions?: SessionUser["permissions"] }) => { const employee = await Employee.findById(id).populate("department team designation reportingManager", "name code capabilities firstName lastName employeeId"); if (!employee?.isActive) throw new AppError("Employee not found", 404); const recalculated = await recalculateProfileCompletion(employee.id); if (recalculated) employee.profileCompletion = recalculated.profileCompletion; const scope = await getViewerHierarchyScope(viewer); assertEmployeeInScope(scope, employee._id, "Employee profile is outside your scope"); const [skills,roleSkillAssessment,tasks,projects,goals,kpis,performance,training,documents,timeline,recognition] = await Promise.all([EmployeeSkill.find({ employee: employee._id, isActive: true }).populate("skill", "name category").lean(),RoleSkillAssessment.findOne({ employee: employee._id }).lean(),Task.find({ assignedEmployee: employee._id, isActive: true }).populate("project", "name code").sort({ createdAt: -1 }).limit(100).lean(),Project.find({ $or: [{ projectManager: employee._id }, { teamMembers: employee._id }], isActive: true }).lean(),Goal.find({ employee: employee._id, isActive: true }).sort({ endDate: -1 }).lean(),EmployeeKPI.find({ employee: employee._id }).populate("kpi", "name unit target weight").sort({ createdAt: -1 }).lean(),PerformanceSnapshot.find({ employee: employee._id }).sort({ calculatedAt: -1 }).lean(),EmployeeTraining.find({ employee: employee._id }).populate({ path: "training", populate: { path: "skill", select: "name" } }).lean(),Document.find({ employee: employee._id, isActive: true }).select("category originalName mimeType size createdAt").lean(),EmployeeTimeline.find({ employee: employee._id }).populate("performedBy", "name").sort({ occurredAt: -1 }).lean(),Recognition.find({ employee: employee._id }).sort({ awardedAt: -1 }).lean()]); const department = employee.department as unknown as { capabilities?: string[] }; const salesEligible = department.capabilities?.includes("SALES_MODULE") ?? false; let salesAnalytics; if (salesEligible && viewer.permissions?.some((permission) => permission.startsWith("sales.analytics."))) { try { salesAnalytics = await employeeAnalytics(viewer as SessionUser, employee.id); } catch (error) { if (!(error instanceof AppError) || error.statusCode !== 403) throw error; } } return { employee: withPhoto(employee.toObject()), skills, roleSkillAssessment, tasks, projects, goals, kpis, performance, training, documents, timeline, recognition, salesEligible, salesAnalytics }; };

interface EmployeeUpdate { firstName?: string; lastName?: string; phone?: string; department?: string; team?: string | null; designation?: string; reportingManager?: string | null; employmentType?: EmployeeDocument["employmentType"]; officeLocation?: string; workLocation?: { geoNode: string; coordinates?: { type: "Point"; coordinates: [number, number] } } | null; role?: RoleName; status?: EmployeeDocument["status"] }
export const updateEmployee = async (id: string, input: EmployeeUpdate, actor: string) => {
  const employee = await Employee.findOne({ _id: id, isActive: true }); if (!employee) throw new AppError("Employee not found", 404);
  if (input.department && !await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404);
  if (input.designation && !await Designation.exists({ _id: input.designation, isActive: true })) throw new AppError("Designation not found", 404);
  if (input.workLocation && !await GeoNode.exists({ _id: input.workLocation.geoNode, isActive: true })) throw new AppError("Work geography not found", 404);
  const targetDepartment = input.department ?? employee.department.toString(); if (input.team && !await Team.exists({ _id: input.team, department: targetDepartment, isActive: true })) throw new AppError("Team does not belong to the selected department", 422);
  const previous = employee.toObject(); Object.assign(employee, input); await employee.save(); await User.updateOne({ _id: employee.user }, { $set: { name: `${employee.firstName} ${employee.lastName}` } });
  if (input.role) {
    const roleDoc = await Role.findOne({ name: input.role });
    if (!roleDoc) throw new AppError("Role not found", 404);
    await User.updateOne({ _id: employee.user }, { $set: { role: roleDoc._id } });
  }
  const tracked = [["department", "DEPARTMENT_CHANGED"], ["designation", "DESIGNATION_CHANGED"], ["reportingManager", "MANAGER_CHANGED"]] as const;
  await Promise.all(tracked.filter(([key]) => input[key] !== undefined && String(previous[key] ?? "") !== String(input[key] ?? "")).map(([key, type]) => EmployeeTimeline.create({ employee: employee._id, type, title: `${key} updated`, description: `Previous: ${String(previous[key] ?? "none")}; new: ${String(input[key] ?? "none")}`, performedBy: actor })));
  await writeAudit({ user: actor, action: "EMPLOYEE_UPDATED", entityType: "Employee", entityId: employee.id, oldValue: previous, newValue: input }); return employee.populate("department team designation reportingManager", "name code firstName lastName employeeId");
};
export async function deactivateEmployee(id: string, actor: string): Promise<void> {
  const employee = await Employee.findById(id);
  if (!employee) throw new AppError("Employee not found", 404);

  const [actorUser, targetUser, superAdminRole] = await Promise.all([
    User.findById(actor).select("employee").lean(),
    User.findById(employee.user).select("role").lean(),
    Role.findOne({ name: "SUPER_ADMIN" }).select("_id").lean()
  ]);
  if (actorUser?.employee?.toString() === employee.id) {
    throw new AppError("You cannot delete your own employee account", 422, "CANNOT_DELETE_SELF");
  }
  if (targetUser && superAdminRole && targetUser.role.toString() === superAdminRole._id.toString()) {
    throw new AppError("A Super Admin account cannot be deleted", 422, "CANNOT_DELETE_SUPER_ADMIN");
  }

  const employeeId = employee._id;
  const userId = employee.user;
  const [employeeSkills, assignedTasks, documents] = await Promise.all([
    EmployeeSkill.find({ employee: employeeId }).select("_id").lean(),
    Task.find({ assignedEmployee: employeeId }).select("_id").lean(),
    Document.find({ employee: employeeId }).select("storageProvider storageKey").lean()
  ]);
  const employeeSkillIds = employeeSkills.map((item) => item._id);
  const taskIds = assignedTasks.map((item) => item._id);

  // Remove private files before their records so a storage failure can be retried safely.
  await Promise.all([
    deleteProfilePhoto(employee.profilePhotoKey),
    ...documents.map((document) => deletePrivateObject({ provider: document.storageProvider, key: document.storageKey }))
  ]);

  await Promise.all([
    TaskActivity.deleteMany({ task: { $in: taskIds } }),
    SkillVerification.deleteMany({ $or: [{ employee: employeeId }, { employeeSkill: { $in: employeeSkillIds } }] }),
    AssessmentResult.deleteMany({ employee: employeeId }), Assessment.deleteMany({ assignedEmployee: employeeId }),
    Attendance.deleteMany({ employee: employeeId }), AiEmployeeSummary.deleteMany({ employee: employeeId }),
    ContributionReview.deleteMany({ employee: employeeId }), ContributionSnapshot.deleteMany({ employee: employeeId }),
    DailyTodo.deleteMany({ $or: [{ employee: employeeId }, { user: userId }] }), Document.deleteMany({ employee: employeeId }),
    EmployeeKPI.deleteMany({ employee: employeeId }), EmployeeTimeline.deleteMany({ employee: employeeId }),
    EmployeeTraining.deleteMany({ employee: employeeId }), Goal.deleteMany({ employee: employeeId }),
    LeaveRequest.deleteMany({ employee: employeeId }), OneToOne.deleteMany({ employee: employeeId }),
    PerformanceReview.deleteMany({ employee: employeeId }), PerformanceSnapshot.deleteMany({ employee: employeeId }),
    Recognition.deleteMany({ employee: employeeId }), RoleSkillAssessment.deleteMany({ employee: employeeId }),
    WeeklyUpdate.deleteMany({ employee: employeeId }),
    Notification.deleteMany({ $or: [{ recipient: userId }, { entityType: "Employee", entityId: employee.id }] }),
    RefreshSession.deleteMany({ user: userId }),
    AuditLog.deleteMany({ $or: [{ user: userId }, { entityType: "Employee", entityId: employee.id }] })
  ]);

  await Promise.all([
    EmployeeSkill.deleteMany({ employee: employeeId }), Task.deleteMany({ _id: { $in: taskIds } }),
    Task.updateMany({ reviewer: employeeId }, { $unset: { reviewer: 1, qualityRating: 1, reviewComment: 1 } }),
    Employee.updateMany({ reportingManager: employeeId }, { $unset: { reportingManager: 1 } }),
    Department.updateMany({ head: employeeId }, { $unset: { head: 1 } }), Team.updateMany({ lead: employeeId }, { $unset: { lead: 1 } }),
    Project.updateMany({ teamMembers: employeeId }, { $pull: { teamMembers: employeeId } }),
    Project.updateMany({ projectManager: employeeId }, { $set: { isActive: false, status: "CANCELLED", archivedAt: new Date() }, $pull: { teamMembers: employeeId } })
  ]);

  await Employee.deleteOne({ _id: employeeId });
  await User.deleteOne({ _id: userId });
  await writeAudit({ user: actor, action: "EMPLOYEE_DELETED", entityType: "Employee", entityId: employee.id, oldValue: { employeeId: employee.employeeId, email: employee.officialEmail }, newValue: { permanentlyDeleted: true } });
}


