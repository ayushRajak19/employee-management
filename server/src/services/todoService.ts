import { DailyTodo } from "../models/DailyTodo.js";
import { Employee } from "../models/Employee.js";
import { AppError } from "../utils/AppError.js";

const employeeFor = async (user: string) => { const employee = await Employee.findOne({ user, isActive: true }).select("_id"); if (!employee) throw new AppError("Employee profile not found", 404); return employee; };
export const list = async (user: string, date: string) => DailyTodo.find({ user, date }).sort({ completed: 1, createdAt: 1 }).lean();
export const create = async (user: string, input: { date: string; title: string }) => DailyTodo.create({ user, employee: (await employeeFor(user))._id, ...input });
export const update = async (user: string, id: string, input: { title?: string; completed?: boolean }) => { const changes: Record<string, unknown> = { ...input }; if (input.completed !== undefined) changes.completedAt = input.completed ? new Date() : undefined; const item = await DailyTodo.findOneAndUpdate({ _id: id, user }, { $set: changes }, { new: true, runValidators: true }); if (!item) throw new AppError("To-do item not found", 404); return item; };
export const remove = async (user: string, id: string) => { const item = await DailyTodo.findOneAndDelete({ _id: id, user }); if (!item) throw new AppError("To-do item not found", 404); return item; };
