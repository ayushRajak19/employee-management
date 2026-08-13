import { randomBytes } from "node:crypto"; import bcrypt from "bcrypt"; import type { FilterQuery } from "mongoose"; import type { RoleName } from "@mobiusbloom/shared";
import { Employee, type EmployeeDocument } from "../models/Employee.js"; import { User } from "../models/User.js"; import { Role } from "../models/Role.js"; import { Department } from "../models/Department.js"; import { Team } from "../models/Team.js"; import { Designation } from "../models/Designation.js"; import { AppError } from "../utils/AppError.js"; import { writeAudit } from "./auditService.js";
import { notify } from "./notificationService.js";
import { EmployeeTimeline } from "../models/EmployeeTimeline.js"; import { EmployeeSkill } from "../models/EmployeeSkill.js"; import { Task } from "../models/Task.js"; import { Project } from "../models/Project.js"; import { Goal } from "../models/Goal.js"; import { EmployeeKPI } from "../models/EmployeeKPI.js"; import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js"; import { EmployeeTraining } from "../models/EmployeeTraining.js"; import { Document } from "../models/Document.js"; import { Recognition } from "../models/Recognition.js";
import { recalculateProfileCompletion } from "./profileCompletionService.js";
import { RoleSkillAssessment } from "../models/RoleSkillAssessment.js";
import { profilePhotoUrl, uploadProfilePhoto } from "./storageService.js";
interface CreateEmployeeInput { firstName: string; lastName: string; officialEmail: string; phone?: string; department: string; team?: string; designation: string; reportingManager?: string; dateOfJoining: Date; employmentType: EmployeeDocument["employmentType"]; officeLocation?: string; role: RoleName; status: EmployeeDocument["status"] }
const temporaryPassword = () => `Mb!${randomBytes(9).toString("base64url")}7a`;
const employeeId = () => `MB-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
export const createEmployee = async (input: CreateEmployeeInput, actorId: string, meta: { ip?: string; userAgent?: string }) => {
  const [department, designation, role] = await Promise.all([Department.findOne({ _id: input.department, isActive: true }), Designation.findOne({ _id: input.designation, isActive: true }), Role.findOne({ name: input.role })]);
  if (!department) throw new AppError("Department not found", 404); if (!designation) throw new AppError("Designation not found", 404); if (!role) throw new AppError("Role not found; run the seed command", 400);
  if (input.team && !await Team.exists({ _id: input.team, department: input.department, isActive: true })) throw new AppError("Team does not belong to the selected department", 422, "INVALID_TEAM");
  if (await User.exists({ email: input.officialEmail })) throw new AppError("An account already uses this email", 409, "EMAIL_EXISTS");
  const password = temporaryPassword(); const user = await User.create({ name: `${input.firstName} ${input.lastName}`, email: input.officialEmail, passwordHash: await bcrypt.hash(password, 12), role: role._id, isActive: true, forcePasswordChange: true, onboardingComplete: false });
  try { const employee = await Employee.create({ ...input, employeeId: employeeId(), user: user._id }); user.employee = employee._id; await user.save(); await EmployeeTimeline.create({ employee: employee._id, type: "JOINED_COMPANY", title: "Joined company", description: `${employee.firstName} joined as an employee.`, performedBy: actorId, occurredAt: employee.dateOfJoining }); await writeAudit({ user: actorId, action: "EMPLOYEE_CREATED", entityType: "Employee", entityId: employee.id, newValue: { employeeId: employee.employeeId, email: employee.officialEmail, role: input.role }, ipAddress: meta.ip, userAgent: meta.userAgent }); await notify({ recipient: user.id, type: "ACCOUNT_CREATED", title: "Welcome to MobiusBloom Employee", body: "Your employee account is ready. Change your temporary password and complete onboarding.", entityType: "Employee", entityId: employee.id }); return { employee: await employee.populate([{ path: "department", select: "name code" }, { path: "team", select: "name code" }, { path: "designation", select: "name code" }]), temporaryCredentials: { email: input.officialEmail, password } }; }
  catch (error) { await User.deleteOne({ _id: user._id }); throw error; }
};
export const listEmployees = async (query: { page: number; limit: number; search?: string; department?: string; status?: EmployeeDocument["status"] }, viewer: { id: string; role: RoleName }) => {
  const filter: FilterQuery<EmployeeDocument> = { isActive: true }; if (query.department) filter.department = query.department; if (query.status) filter.status = query.status;
  if (query.search) { const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.$or = [{ firstName: new RegExp(safe, "i") }, { lastName: new RegExp(safe, "i") }, { employeeId: new RegExp(safe, "i") }, { officialEmail: new RegExp(safe, "i") }]; }
  if (viewer.role === "EMPLOYEE") filter.user = viewer.id; else if (viewer.role === "MANAGER") { const own = await Employee.findOne({ user: viewer.id }).select("_id"); filter.$or = [...(filter.$or ?? []), { reportingManager: own?._id }, { user: viewer.id }]; }
  const [items, total] = await Promise.all([Employee.find(filter).populate("department team designation reportingManager", "name code firstName lastName employeeId").sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(), Employee.countDocuments(filter)]); return { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
};
const withPhoto = <T extends object>(employee: T & { profilePhotoKey?: string }) => ({ ...employee, profilePhotoUrl: profilePhotoUrl(employee.profilePhotoKey) });
export const getMyEmployee = async (userId: string) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); await recalculateProfileCompletion(employee.id); const refreshed = await Employee.findById(employee._id).populate("department team designation reportingManager", "name code firstName lastName employeeId").lean(); if (!refreshed) throw new AppError("Employee profile not found", 404); return withPhoto(refreshed); };
const onboardingMissing = async (employee: EmployeeDocument & { _id: unknown }) => {
  const [skillCount, documentCategories] = await Promise.all([
    EmployeeSkill.countDocuments({ employee: employee._id, isActive: true }),
    Document.distinct("category", { employee: employee._id, isActive: true })
  ]);
  const missing: string[] = [];
  if (!employee.personal?.personalEmail || !employee.personal.address || !employee.personal.emergencyContact) missing.push("personal information");
  if (!employee.professionalSummary || employee.professionalSummary.trim().length < 20) missing.push("professional summary");
  if (!employee.previousExperience?.length) missing.push("previous experience");
  if (!skillCount) missing.push("at least one skill");
  if (!documentCategories.includes("CERTIFICATE")) missing.push("certificate");
  if (!documentCategories.includes("RESUME")) missing.push("resume");
  if (!documentCategories.includes("ID_DOCUMENT")) missing.push("identity document");
  return missing;
};
export const updateOnboarding = async (userId: string, input: { step: number; personal?: EmployeeDocument["personal"]; professionalSummary?: string; previousExperience?: EmployeeDocument["previousExperience"]; complete?: boolean }) => {
  const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404);
  if (input.personal) employee.personal = { ...employee.personal, ...input.personal };
  if (input.professionalSummary !== undefined) employee.professionalSummary = input.professionalSummary;
  if (input.previousExperience) employee.previousExperience = input.previousExperience;
  if (input.step === 2 && (!employee.personal?.personalEmail || !employee.personal.address || !employee.personal.emergencyContact)) throw new AppError("Personal email, address and emergency contact are required", 422, "ONBOARDING_STEP_INCOMPLETE");
  if (input.step === 3 && (!employee.professionalSummary || employee.professionalSummary.trim().length < 20)) throw new AppError("Professional summary must contain at least 20 characters", 422, "ONBOARDING_STEP_INCOMPLETE");
  if (input.step === 4 && !employee.previousExperience?.length) throw new AppError("Previous company, role and start date are required", 422, "ONBOARDING_STEP_INCOMPLETE");
  if (input.step >= 5) { const missing = await onboardingMissing(employee); const requiredThroughStep = input.complete ? missing : input.step === 5 ? missing.filter((item) => item === "at least one skill") : input.step === 6 ? missing.filter((item) => item === "certificate") : input.step === 7 ? missing.filter((item) => item === "resume" || item === "identity document") : []; if (requiredThroughStep.length) throw new AppError(`Complete the required section: ${requiredThroughStep.join(", ")}`, 422, "ONBOARDING_STEP_INCOMPLETE"); }
  employee.onboardingStep = Math.max(employee.onboardingStep, input.step);
  if (input.complete) { employee.status = "ACTIVE"; await User.updateOne({ _id: userId }, { $set: { onboardingComplete: true } }); }
  await employee.save(); const refreshed = await recalculateProfileCompletion(employee.id); return withPhoto((refreshed ?? employee).toObject());
};
export const updateMyProfile = async (userId: string, input: { firstName?: string; lastName?: string; phone?: string; professionalSummary?: string; personal?: EmployeeDocument["personal"] }) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); if (input.firstName !== undefined) employee.firstName = input.firstName; if (input.lastName !== undefined) employee.lastName = input.lastName; if (input.phone !== undefined) employee.phone = input.phone; if (input.professionalSummary !== undefined) employee.professionalSummary = input.professionalSummary; if (input.personal) employee.personal = { ...employee.personal, ...input.personal }; await employee.save(); await User.updateOne({ _id: userId }, { $set: { name: `${employee.firstName} ${employee.lastName}` } }); const refreshed = await recalculateProfileCompletion(employee.id); return withPhoto((refreshed ?? employee).toObject()); };
export const updateProfilePhoto = async (userId: string, file: Express.Multer.File) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); employee.profilePhotoKey = await uploadProfilePhoto(file.buffer, employee.id, file.mimetype); await employee.save(); return withPhoto(employee.toObject()); };
export const employee360 = async (id: string, viewer: { id: string; role: RoleName }) => { const employee = await Employee.findById(id).populate("department team designation reportingManager", "name code firstName lastName employeeId"); if (!employee?.isActive) throw new AppError("Employee not found", 404); const recalculated = await recalculateProfileCompletion(employee.id); if (recalculated) employee.profileCompletion = recalculated.profileCompletion; if (["EMPLOYEE","MANAGER"].includes(viewer.role)) { const own = await Employee.findOne({ user: viewer.id }).select("_id"); const allowed = employee._id.equals(own?._id) || (viewer.role === "MANAGER" && employee.reportingManager && String(employee.reportingManager._id ?? employee.reportingManager) === own?._id.toString()); if (!allowed) throw new AppError("Employee profile is outside your scope", 403); } const [skills,roleSkillAssessment,tasks,projects,goals,kpis,performance,training,documents,timeline,recognition] = await Promise.all([EmployeeSkill.find({ employee: employee._id, isActive: true }).populate("skill", "name category").lean(),RoleSkillAssessment.findOne({ employee: employee._id }).lean(),Task.find({ assignedEmployee: employee._id, isActive: true }).populate("project", "name code").sort({ createdAt: -1 }).limit(100).lean(),Project.find({ $or: [{ projectManager: employee._id }, { teamMembers: employee._id }], isActive: true }).lean(),Goal.find({ employee: employee._id, isActive: true }).sort({ endDate: -1 }).lean(),EmployeeKPI.find({ employee: employee._id }).populate("kpi", "name unit target weight").sort({ createdAt: -1 }).lean(),PerformanceSnapshot.find({ employee: employee._id }).sort({ calculatedAt: -1 }).lean(),EmployeeTraining.find({ employee: employee._id }).populate({ path: "training", populate: { path: "skill", select: "name" } }).lean(),Document.find({ employee: employee._id, isActive: true }).select("category originalName mimeType size createdAt").lean(),EmployeeTimeline.find({ employee: employee._id }).populate("performedBy", "name").sort({ occurredAt: -1 }).lean(),Recognition.find({ employee: employee._id }).sort({ awardedAt: -1 }).lean()]); return { employee: withPhoto(employee.toObject()), skills, roleSkillAssessment, tasks, projects, goals, kpis, performance, training, documents, timeline, recognition }; };

interface EmployeeUpdate { firstName?: string; lastName?: string; phone?: string; department?: string; team?: string | null; designation?: string; reportingManager?: string | null; employmentType?: EmployeeDocument["employmentType"]; officeLocation?: string; status?: EmployeeDocument["status"] }
export const updateEmployee = async (id: string, input: EmployeeUpdate, actor: string) => {
  const employee = await Employee.findOne({ _id: id, isActive: true }); if (!employee) throw new AppError("Employee not found", 404);
  if (input.department && !await Department.exists({ _id: input.department, isActive: true })) throw new AppError("Department not found", 404);
  if (input.designation && !await Designation.exists({ _id: input.designation, isActive: true })) throw new AppError("Designation not found", 404);
  const targetDepartment = input.department ?? employee.department.toString(); if (input.team && !await Team.exists({ _id: input.team, department: targetDepartment, isActive: true })) throw new AppError("Team does not belong to the selected department", 422);
  const previous = employee.toObject(); Object.assign(employee, input); await employee.save(); await User.updateOne({ _id: employee.user }, { $set: { name: `${employee.firstName} ${employee.lastName}` } });
  const tracked = [["department", "DEPARTMENT_CHANGED"], ["designation", "DESIGNATION_CHANGED"], ["reportingManager", "MANAGER_CHANGED"]] as const;
  await Promise.all(tracked.filter(([key]) => input[key] !== undefined && String(previous[key] ?? "") !== String(input[key] ?? "")).map(([key, type]) => EmployeeTimeline.create({ employee: employee._id, type, title: `${key} updated`, description: `Previous: ${String(previous[key] ?? "none")}; new: ${String(input[key] ?? "none")}`, performedBy: actor })));
  await writeAudit({ user: actor, action: "EMPLOYEE_UPDATED", entityType: "Employee", entityId: employee.id, oldValue: previous, newValue: input }); return employee.populate("department team designation reportingManager", "name code firstName lastName employeeId");
};
export const deactivateEmployee = async (id: string, actor: string) => {
  const employee = await Employee.findOne({ _id: id, isActive: true });
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

  employee.isActive = false;
  employee.archivedAt = new Date();
  employee.status = "INACTIVE";
  await employee.save();
  await User.updateOne({ _id: employee.user }, { $set: { isActive: false }, $unset: { refreshTokenHash: 1, refreshTokenFamily: 1 } });
  await EmployeeTimeline.create({ employee: employee._id, type: "EMPLOYEE_DEACTIVATED", title: "Employee deleted", performedBy: actor });
  await writeAudit({ user: actor, action: "EMPLOYEE_DEACTIVATED", entityType: "Employee", entityId: employee.id, oldValue: { isActive: true }, newValue: { isActive: false, archivedAt: employee.archivedAt } });
};
