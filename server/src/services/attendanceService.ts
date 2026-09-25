import type { RoleName } from "@mobius-ems/shared";
import { Attendance } from "../models/Attendance.js";
import { Employee } from "../models/Employee.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { AttendanceOffice } from "../models/AttendanceOffice.js";
import { AttendanceRegularization, type AttendanceRegularizationDocument } from "../models/AttendanceRegularization.js";
import { notify } from "./notificationService.js";

type Coordinates = { latitude: number; longitude: number; accuracy: number };
const defaultOffice = { name: env.ATTENDANCE_OFFICE_NAME, latitude: env.ATTENDANCE_OFFICE_LATITUDE, longitude: env.ATTENDANCE_OFFICE_LONGITUDE, radiusMeters: env.ATTENDANCE_RADIUS_METERS, maxAccuracyMeters: env.ATTENDANCE_MAX_ACCURACY_METERS, isPreciselyConfigured: false };
const officeConfig = async () => { const saved = await AttendanceOffice.findOne({ key: "PRIMARY" }).lean(); return saved ? { name: saved.name, latitude: saved.latitude, longitude: saved.longitude, radiusMeters: saved.radiusMeters, maxAccuracyMeters: saved.maxAccuracyMeters, isPreciselyConfigured: true, configuredAt: saved.configuredAt } : defaultOffice; };
const dateKey = (date = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const istParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as { hour: number; minute: number };
const checkInStatus = (date: Date): "PRESENT" | "LATE" => { const time = istParts(date); return time.hour > 11 || (time.hour === 11 && time.minute > 30) ? "LATE" : "PRESENT"; };
const distance = (a: Coordinates, b: { latitude: number; longitude: number }) => { const radians = (value: number) => value * Math.PI / 180; const dLat = radians(b.latitude - a.latitude); const dLon = radians(b.longitude - a.longitude); const lat1 = radians(a.latitude); const lat2 = radians(b.latitude); const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2; return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))); };
const proof = async (coordinates: Coordinates, now: Date) => { const office = await officeConfig(); if (coordinates.accuracy > office.maxAccuracyMeters) throw new AppError(`Location accuracy is too low (${Math.round(coordinates.accuracy)} m). Move near a window and try again.`, 422, "LOCATION_ACCURACY_LOW"); const distanceMeters = distance(coordinates, office); if (distanceMeters > office.radiusMeters) throw new AppError(`You are ${distanceMeters} m from the office. Attendance is allowed within ${office.radiusMeters} m of ${office.name}.`, 403, "OUTSIDE_ATTENDANCE_GEOFENCE"); return { ...coordinates, distanceMeters, recordedAt: now }; };
export const attendanceMath = { office: defaultOffice, dateKey, distance, checkInStatus };
const ownEmployee = async (userId: string) => { const employee = await Employee.findOne({ user: userId, isActive: true }); if (!employee) throw new AppError("Employee profile not found", 404); return employee; };
export const today = async (userId: string) => { const employee = await ownEmployee(userId); const key = dateKey(); let attendance = await Attendance.findOne({ employee: employee._id, dateKey: key, isActive: true }).lean(); if (attendance && attendance.status !== "HALF_DAY") { const corrected = checkInStatus(attendance.checkInAt); if (attendance.status !== corrected) { await Attendance.updateOne({ _id: attendance._id }, { $set: { status: corrected } }); attendance = { ...attendance, status: corrected }; } } return { office: await officeConfig(), date: key, attendance }; };
export const checkIn = async (userId: string, coordinates: Coordinates, meta: { ip?: string; userAgent?: string }) => {
  const employee = await ownEmployee(userId); const now = new Date(); const key = dateKey(now);
  const existing = await Attendance.findOne({ employee: employee._id, dateKey: key });
  if (existing?.isActive) { if (existing.status !== "HALF_DAY") { const corrected = checkInStatus(existing.checkInAt); if (existing.status !== corrected) { existing.status = corrected; await existing.save(); } } return existing; }
  const location = await proof(coordinates, now); const status = checkInStatus(now);
  let attendance;
  if (existing) {
    attendance = await Attendance.findByIdAndUpdate(existing._id, { $set: { department: employee.department, status, checkInAt: now, checkInLocation: location, workedMinutes: 0, isActive: true }, $unset: { checkOutAt: 1, checkOutLocation: 1 } }, { new: true, runValidators: true });
    if (!attendance) throw new AppError("Attendance record could not be restored", 409, "ATTENDANCE_RESTORE_FAILED");
  } else {
    try { attendance = await Attendance.create({ employee: employee._id, department: employee.department, dateKey: key, status, checkInAt: now, checkInLocation: location }); }
    catch (error: unknown) {
      const concurrent = await Attendance.findOne({ employee: employee._id, dateKey: key, isActive: true });
      if (concurrent) return concurrent;
      throw error;
    }
  }
  await writeAudit({ user: userId, action: "ATTENDANCE_CHECKED_IN", entityType: "Attendance", entityId: attendance.id, newValue: { dateKey: key, status, distanceMeters: location.distanceMeters }, ipAddress: meta.ip, userAgent: meta.userAgent }); return attendance;
};
export const checkOut = async (userId: string, coordinates: Coordinates, meta: { ip?: string; userAgent?: string }) => { const employee = await ownEmployee(userId); const now = new Date(); const attendance = await Attendance.findOne({ employee: employee._id, dateKey: dateKey(now), isActive: true }); if (!attendance) throw new AppError("Check in before checking out", 422, "CHECK_IN_REQUIRED"); if (attendance.checkOutAt) throw new AppError("You have already checked out today", 409, "ALREADY_CHECKED_OUT"); const location = await proof(coordinates, now); attendance.checkOutAt = now; attendance.checkOutLocation = location; attendance.workedMinutes = Math.max(0, Math.round((now.getTime() - attendance.checkInAt.getTime()) / 60000)); if (attendance.workedMinutes < 240) attendance.status = "HALF_DAY"; await attendance.save(); await writeAudit({ user: userId, action: "ATTENDANCE_CHECKED_OUT", entityType: "Attendance", entityId: attendance.id, newValue: { workedMinutes: attendance.workedMinutes, distanceMeters: location.distanceMeters }, ipAddress: meta.ip, userAgent: meta.userAgent }); return attendance; };
export const register = async (viewer: { role: RoleName }, query: { date?: string; department?: string; search?: string }) => { if (viewer.role !== "SUPER_ADMIN") throw new AppError("Only Super Admin can access the organization attendance register", 403); const key = query.date ?? dateKey(); const dayStart = new Date(`${key}T00:00:00+05:30`); const dayEnd = new Date(`${key}T23:59:59+05:30`); const employeeFilter: Record<string, unknown> = { isActive: true, dateOfJoining: { $lte: dayEnd } }; if (query.department) employeeFilter.department = query.department; if (query.search) { const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); employeeFilter.$or = [{ firstName: new RegExp(safe, "i") }, { lastName: new RegExp(safe, "i") }, { employeeId: new RegExp(safe, "i") }]; } const employees = await Employee.find(employeeFilter).populate("department designation", "name code").sort({ firstName: 1, lastName: 1 }).lean(); const employeeIds = employees.map((item) => item._id); const [records, leaves] = await Promise.all([Attendance.find({ employee: { $in: employeeIds }, dateKey: key, isActive: true }).lean(), LeaveRequest.find({ employee: { $in: employeeIds }, status: "APPROVED", startDate: { $lte: dayEnd }, endDate: { $gte: dayStart } }).select("employee").lean()]); const map = new Map(records.map((item) => [item.employee.toString(), item])); const leaveIds = new Set(leaves.map((item) => item.employee.toString())); const items = employees.map((employee) => ({ employee, attendance: map.get(employee._id.toString()) ?? null, dailyStatus: map.get(employee._id.toString())?.status ?? (leaveIds.has(employee._id.toString()) ? "ON_LEAVE" : "ABSENT") })); const summary = { total: items.length, present: items.filter((item) => ["PRESENT", "LATE"].includes(item.dailyStatus)).length, late: items.filter((item) => item.dailyStatus === "LATE").length, halfDay: items.filter((item) => item.dailyStatus === "HALF_DAY").length, onLeave: items.filter((item) => item.dailyStatus === "ON_LEAVE").length, absent: items.filter((item) => item.dailyStatus === "ABSENT").length }; return { date: key, office: await officeConfig(), summary, items }; };
export const configureOffice = async (viewer: { id: string; role: RoleName }, input: Coordinates & { name: string; radiusMeters: number }, meta: { ip?: string; userAgent?: string }) => { if (viewer.role !== "SUPER_ADMIN") throw new AppError("Only Super Admin can configure the office attendance location", 403); if (input.accuracy > env.ATTENDANCE_MAX_ACCURACY_METERS) throw new AppError(`Location accuracy is too low (${Math.round(input.accuracy)} m). Move near a window and try again.`, 422, "LOCATION_ACCURACY_LOW"); const configuredAt = new Date(); const office = await AttendanceOffice.findOneAndUpdate({ key: "PRIMARY" }, { $set: { name: input.name, latitude: input.latitude, longitude: input.longitude, radiusMeters: input.radiusMeters, maxAccuracyMeters: env.ATTENDANCE_MAX_ACCURACY_METERS, configuredBy: viewer.id, configuredAt } }, { upsert: true, new: true, runValidators: true }); await writeAudit({ user: viewer.id, action: "ATTENDANCE_OFFICE_CONFIGURED", entityType: "AttendanceOffice", entityId: office.id, newValue: { name: office.name, latitude: office.latitude, longitude: office.longitude, radiusMeters: office.radiusMeters, accuracy: input.accuracy }, ipAddress: meta.ip, userAgent: meta.userAgent }); return { name: office.name, latitude: office.latitude, longitude: office.longitude, radiusMeters: office.radiusMeters, maxAccuracyMeters: office.maxAccuracyMeters, isPreciselyConfigured: true, configuredAt: office.configuredAt }; };
export const updateOfficeRadius = async (viewer: { id: string; role: RoleName }, radiusMeters: number, meta: { ip?: string; userAgent?: string }) => {
  if (viewer.role !== "SUPER_ADMIN") throw new AppError("Only Super Admin can configure the attendance radius", 403);
  const office = await AttendanceOffice.findOne({ key: "PRIMARY" });
  if (!office) throw new AppError("Set the exact office location before changing its attendance radius", 409, "ATTENDANCE_OFFICE_NOT_CONFIGURED");
  const previousRadiusMeters = office.radiusMeters;
  office.set({ radiusMeters, configuredBy: viewer.id });
  await office.save();
  await writeAudit({ user: viewer.id, action: "ATTENDANCE_RADIUS_UPDATED", entityType: "AttendanceOffice", entityId: office.id, oldValue: { radiusMeters: previousRadiusMeters }, newValue: { radiusMeters }, ipAddress: meta.ip, userAgent: meta.userAgent });
  return { name: office.name, latitude: office.latitude, longitude: office.longitude, radiusMeters: office.radiusMeters, maxAccuracyMeters: office.maxAccuracyMeters, isPreciselyConfigured: true, configuredAt: office.configuredAt };
};

export const requestRegularization = async (
  userId: string,
  input: { dateKey: string; reason: AttendanceRegularizationDocument["reason"]; note: string },
  meta: { ip?: string; userAgent?: string }
) => {
  const employee = await ownEmployee(userId);
  const existing = await Attendance.findOne({ employee: employee._id, dateKey: input.dateKey });
  if (existing?.status === "PRESENT") {
    throw new AppError("Attendance for this day is already recorded as Present", 409, "ALREADY_PRESENT");
  }

  const pending = await AttendanceRegularization.findOne({
    employee: employee._id,
    dateKey: input.dateKey,
    status: "PENDING"
  });
  if (pending) {
    throw new AppError("A regularization request is already pending for this date", 409, "REGULARIZATION_PENDING");
  }

  const originalStatus = (existing?.status as "LATE" | "HALF_DAY") ?? "ABSENT";
  const req = await AttendanceRegularization.create({
    employee: employee._id,
    department: employee.department,
    dateKey: input.dateKey,
    originalStatus,
    requestedStatus: "PRESENT",
    reason: input.reason,
    note: input.note,
    status: "PENDING"
  });

  await writeAudit({
    user: userId,
    action: "ATTENDANCE_REGULARIZATION_REQUESTED",
    entityType: "AttendanceRegularization",
    entityId: req.id,
    newValue: { dateKey: input.dateKey, originalStatus, reason: input.reason },
    ipAddress: meta.ip,
    userAgent: meta.userAgent
  });

  if (employee.reportingManager) {
    const manager = await Employee.findById(employee.reportingManager).select("user");
    if (manager?.user) {
      await notify({
        recipient: manager.user.toString(),
        type: "ATTENDANCE_REGULARIZATION_PENDING",
        title: "Attendance Regularization Request",
        body: `${employee.firstName} ${employee.lastName} requested attendance regularization for ${input.dateKey}.`,
        entityType: "AttendanceRegularization",
        entityId: req.id
      });
    }
  }

  return req;
};

export const listRegularizations = async (
  viewer: { id: string; role: RoleName },
  query: { status?: string; dateKey?: string }
) => {
  const filter: Record<string, unknown> = { isActive: true };
  if (query.status) filter.status = query.status;
  if (query.dateKey) filter.dateKey = query.dateKey;

  if (viewer.role === "EMPLOYEE") {
    const employee = await Employee.findOne({ user: viewer.id, isActive: true }).select("_id");
    if (!employee) return [];
    filter.employee = employee._id;
  } else if (["MANAGER", "TEAM_LEAD", "DEPARTMENT_HEAD"].includes(viewer.role)) {
    const own = await Employee.findOne({ user: viewer.id, isActive: true }).select("_id department");
    if (!own) return [];
    if (viewer.role === "DEPARTMENT_HEAD" && own.department) {
      filter.department = own.department;
    } else {
      const reports = await Employee.find({ $or: [{ _id: own._id }, { reportingManager: own._id }], isActive: true }).distinct("_id");
      filter.employee = { $in: reports };
    }
  }

  return AttendanceRegularization.find(filter)
    .populate("employee", "firstName lastName employeeId department")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

export const reviewRegularization = async (
  id: string,
  input: { status: "APPROVED" | "REJECTED"; reviewComment?: string },
  viewer: { id: string; role: RoleName },
  meta: { ip?: string; userAgent?: string }
) => {
  if (viewer.role === "EMPLOYEE") {
    throw new AppError("Employees cannot review regularization requests", 403, "FORBIDDEN");
  }

  const req = await AttendanceRegularization.findById(id);
  if (!req || !req.isActive) throw new AppError("Regularization request not found", 404);
  if (req.status !== "PENDING") throw new AppError("This regularization request has already been reviewed", 409);

  req.status = input.status;
  req.reviewComment = input.reviewComment;
  req.reviewedBy = viewer.id as never;
  req.reviewedAt = new Date();
  await req.save();

  const employee = await Employee.findById(req.employee);
  if (input.status === "APPROVED") {
    const office = await officeConfig();
    const mockLocation = {
      latitude: office.latitude,
      longitude: office.longitude,
      accuracy: 10,
      distanceMeters: 0,
      recordedAt: new Date(`${req.dateKey}T09:30:00+05:30`)
    };

    const existing = await Attendance.findOne({ employee: req.employee, dateKey: req.dateKey });
    if (existing) {
      existing.status = "PRESENT";
      if (!existing.workedMinutes || existing.workedMinutes < 240) {
        existing.workedMinutes = 540;
      }
      await existing.save();
    } else {
      await Attendance.create({
        employee: req.employee,
        department: req.department,
        dateKey: req.dateKey,
        status: "PRESENT",
        checkInAt: new Date(`${req.dateKey}T09:30:00+05:30`),
        checkInLocation: mockLocation,
        checkOutAt: new Date(`${req.dateKey}T18:30:00+05:30`),
        checkOutLocation: mockLocation,
        workedMinutes: 540
      });
    }
  }

  if (employee?.user) {
    await notify({
      recipient: employee.user.toString(),
      type: "ATTENDANCE_REGULARIZATION_REVIEWED",
      title: `Attendance Regularization ${input.status}`,
      body: input.reviewComment || `Your regularization for ${req.dateKey} was ${input.status.toLowerCase()}.`,
      entityType: "AttendanceRegularization",
      entityId: req.id
    });
  }

  await writeAudit({
    user: viewer.id,
    action: "ATTENDANCE_REGULARIZATION_REVIEWED",
    entityType: "AttendanceRegularization",
    entityId: req.id,
    newValue: { status: input.status, dateKey: req.dateKey, employee: req.employee },
    ipAddress: meta.ip,
    userAgent: meta.userAgent
  });

  return req;
};

