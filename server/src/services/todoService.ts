import { DailyTodo, type DailyTodoDocument } from "../models/DailyTodo.js";
import { Employee } from "../models/Employee.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";

type CreateInput = Pick<DailyTodoDocument, "date" | "title" | "type" | "priority" | "durationMinutes"> & { deadline?: string };
type UpdateInput = Partial<Pick<DailyTodoDocument, "date" | "title" | "type" | "priority" | "durationMinutes" | "status" | "completed">> & { deadline?: string };
type ListInput = { date?: string; employee?: string; status?: DailyTodoDocument["status"] };

const employeeFor = async (user: string) => {
  const employee = await Employee.findOne({ user, isActive: true }).select("_id");
  if (!employee) throw new AppError("Employee profile not found", 404);
  return employee;
};

const filterFor = (input: ListInput) => ({
  ...(input.date ? { date: input.date } : {}),
  ...(input.employee ? { employee: input.employee } : {}),
  ...(input.status ? { status: input.status } : {})
});

export const listOwn = async (user: string, input: ListInput) => DailyTodo.find({ user, ...filterFor(input) }).populate({ path: "employee", select: "firstName lastName employeeId department designation employmentType", populate: [{ path: "department", select: "name code" }, { path: "designation", select: "name code" }] }).sort({ date: -1, completed: 1, deadline: 1, createdAt: 1 }).limit(500).lean();
export const listAll = async (input: ListInput) => DailyTodo.find(filterFor(input)).populate({ path: "employee", select: "firstName lastName employeeId department designation employmentType", populate: [{ path: "department", select: "name code" }, { path: "designation", select: "name code" }] }).sort({ date: -1, completed: 1, deadline: 1, createdAt: 1 }).limit(1000).lean();

export const create = async (user: string, input: CreateInput) => {
  const employee = await employeeFor(user);
  const item = await DailyTodo.create({ ...input, employee: employee._id, user, deadline: input.deadline ? new Date(input.deadline) : undefined });
  await writeAudit({ user, action: "TASK_TRACKER_ITEM_CREATED", entityType: "DailyTodo", entityId: item.id, newValue: { title: item.title, date: item.date, type: item.type, priority: item.priority, durationMinutes: item.durationMinutes, deadline: item.deadline } });
  return item;
};

export const update = async (user: string, id: string, input: UpdateInput) => {
  const changes: Record<string, unknown> = { ...input };
  if (input.deadline !== undefined) changes.deadline = new Date(input.deadline);
  if (input.completed !== undefined) changes.status = input.completed ? "COMPLETED" : "TODO";
  if (input.status !== undefined) changes.completed = input.status === "COMPLETED";
  const completed = changes.completed === true || changes.status === "COMPLETED";
  if (input.completed !== undefined || input.status !== undefined) changes.completedAt = completed ? new Date() : undefined;
  const item = await DailyTodo.findOneAndUpdate({ _id: id, user }, { $set: changes }, { new: true, runValidators: true });
  if (!item) throw new AppError("Task tracker item not found", 404);
  await writeAudit({ user, action: "TASK_TRACKER_ITEM_UPDATED", entityType: "DailyTodo", entityId: item.id, newValue: input });
  return item;
};

export const remove = async (user: string, id: string) => {
  const item = await DailyTodo.findOneAndDelete({ _id: id, user });
  if (!item) throw new AppError("Task tracker item not found", 404);
  await writeAudit({ user, action: "TASK_TRACKER_ITEM_DELETED", entityType: "DailyTodo", entityId: item.id, oldValue: { title: item.title, date: item.date } });
  return item;
};
