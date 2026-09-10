import { randomBytes } from "node:crypto"; import bcrypt from "bcrypt"; import { SECTION_PERMISSIONS, type PermissionName, type SectionPermissionName } from "@mobius-ems/shared"; import { Employee } from "../models/Employee.js"; import { LeaveRequest, type LeaveRequestDocument } from "../models/LeaveRequest.js"; import { Recognition, type RecognitionDocument } from "../models/Recognition.js"; import { Role } from "../models/Role.js"; import { User } from "../models/User.js"; import { AppError } from "../utils/AppError.js"; import { notify } from "./notificationService.js"; import { writeAudit } from "./auditService.js";
const scopedEmployees = async (viewer: { id: string; role: string }) => { if (!["EMPLOYEE","MANAGER"].includes(viewer.role)) return Employee.find({ isActive: true }).distinct("_id"); const own = await Employee.findOne({ user: viewer.id }).select("_id"); return viewer.role === "EMPLOYEE" ? own ? [own._id] : [] : Employee.find({ $or: [{ _id: own?._id }, { reportingManager: own?._id }] }).distinct("_id"); };
export const listLeaves = async (viewer: { id: string; role: string }) => LeaveRequest.find({ employee: { $in: await scopedEmployees(viewer) } }).populate("employee", "firstName lastName employeeId").populate("reviewedBy", "name").sort({ createdAt: -1 }).lean();
export const requestLeave = async (userId: string, input: { type: LeaveRequestDocument["type"]; startDate: Date; endDate: Date; reason: string }) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); return LeaveRequest.create({ ...input, employee: employee._id }); };
export const reviewLeave = async (id: string, input: { status: "APPROVED" | "REJECTED"; reviewComment?: string }, viewer: { id: string; role: string }) => { const leave = await LeaveRequest.findById(id); if (!leave) throw new AppError("Leave request not found", 404); if (["EMPLOYEE","MANAGER"].includes(viewer.role)) { const allowed = (await scopedEmployees(viewer)).some((employeeId) => employeeId.equals(leave.employee)); if (!allowed || viewer.role === "EMPLOYEE") throw new AppError("Leave request is outside your review scope", 403); } leave.status = input.status; leave.reviewComment = input.reviewComment; leave.reviewedBy = viewer.id as never; await leave.save(); const employee = await Employee.findById(leave.employee); if (employee) await notify({ recipient: employee.user.toString(), type: "LEAVE_REVIEWED", title: `Leave request ${input.status.toLowerCase()}`, body: input.reviewComment || `Your leave request was ${input.status.toLowerCase()}.`, entityType: "LeaveRequest", entityId: leave.id }); return leave; };
export const listRecognition = async (viewer: { id: string; role: string }) => Recognition.find({ employee: { $in: await scopedEmployees(viewer) } }).populate("employee", "firstName lastName employeeId").populate("awardedBy", "name").sort({ awardedAt: -1 }).lean();
export const awardRecognition = async (input: { employee: string; badge: RecognitionDocument["badge"]; explanation: string; evidence: string[] }, actor: string) => { const employee = await Employee.findById(input.employee); if (!employee) throw new AppError("Employee not found", 404); const item = await Recognition.create({ ...input, awardedBy: actor, awardedAt: new Date() }); await notify({ recipient: employee.user.toString(), type: "RECOGNITION_AWARDED", title: `Recognition: ${input.badge.replaceAll("_", " ")}`, body: input.explanation, entityType: "Recognition", entityId: item.id }); await writeAudit({ user: actor, action: "RECOGNITION_AWARDED", entityType: "Recognition", entityId: item.id, newValue: input }); return item; };
export const listRoles = async () => Role.find().sort("name").lean();
export const updateRolePermissions = async (id: string, permissions: string[], actor: string) => { const role = await Role.findById(id); if (!role) throw new AppError("Role not found", 404); if (role.name === "SUPER_ADMIN") throw new AppError("Super Admin always has full access", 422, "SUPER_ADMIN_ACCESS_LOCKED"); const oldValue = role.permissions; role.permissions = permissions as typeof role.permissions; await role.save(); await writeAudit({ user: actor, action: "ROLE_PERMISSIONS_CHANGED", entityType: "Role", entityId: role.id, oldValue, newValue: permissions }); return role; };
export const updateRoleSectionAccess = async (id: string, sections: SectionPermissionName[], actor: string) => {
  const role = await Role.findById(id);
  if (!role) throw new AppError("Role not found", 404);
  if (role.name === "SUPER_ADMIN") throw new AppError("Super Admin always has access to every section", 422, "SUPER_ADMIN_ACCESS_LOCKED");
  const oldValue = role.permissions.filter((permission) => SECTION_PERMISSIONS.includes(permission as SectionPermissionName));
  const operationalPermissions = role.permissions.filter((permission) => !SECTION_PERMISSIONS.includes(permission as SectionPermissionName));
  role.permissions = [...operationalPermissions, ...sections] as PermissionName[];
  await role.save();
  await writeAudit({ user: actor, action: "ROLE_SECTION_ACCESS_CHANGED", entityType: "Role", entityId: role.id, oldValue, newValue: sections });
  return role;
};
const administratorRoles = ["SUPER_ADMIN", "HR_ADMIN"] as const;
export const listAdministrators = async () => {
  const roles = await Role.find({ name: { $in: administratorRoles } }).select("_id");
  return User.find({ role: { $in: roles.map((role) => role._id) } }).select("name email role isActive forcePasswordChange lastLoginAt createdAt").populate("role", "name").sort({ createdAt: -1 }).lean();
};
export const createAdministrator = async (input: { name: string; email: string; role: typeof administratorRoles[number] }, actor: string, meta: { ip?: string; userAgent?: string }) => {
  if (!administratorRoles.includes(input.role)) throw new AppError("Administrator role is not allowed", 422, "INVALID_ADMIN_ROLE");
  if (await User.exists({ email: input.email })) throw new AppError("An account already uses this email", 409, "EMAIL_EXISTS");
  const role = await Role.findOne({ name: input.role });
  if (!role) throw new AppError("Administrator role was not found; run the seed command", 400, "ROLE_NOT_FOUND");
  const password = `Mb!${randomBytes(9).toString("base64url")}7a`;
  const account = await User.create({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(password, 12), role: role._id, isActive: true, forcePasswordChange: true, onboardingComplete: true });
  await writeAudit({ user: actor, action: "ADMINISTRATOR_CREATED", entityType: "User", entityId: account.id, newValue: { name: account.name, email: account.email, role: input.role }, ipAddress: meta.ip, userAgent: meta.userAgent });
  const safeAccount = await User.findById(account._id).select("name email role isActive forcePasswordChange lastLoginAt createdAt").populate("role", "name").lean().orFail();
  return { account: safeAccount, temporaryCredentials: { email: account.email, password } };
};
