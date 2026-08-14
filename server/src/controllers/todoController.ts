import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as service from "../services/todoService.js";

const employeeOnly = (request: Request) => { if (request.user!.role !== "EMPLOYEE") throw new AppError("Only employees can change task tracker items", 403, "FORBIDDEN"); };
const query = (request: Request) => ({
  date: typeof request.query.date === "string" ? request.query.date : undefined,
  employee: typeof request.query.employee === "string" ? request.query.employee : undefined,
  status: typeof request.query.status === "string" ? request.query.status as "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" : undefined
});

export const list = async (request: Request, response: Response): Promise<void> => {
  if (!["EMPLOYEE", "SUPER_ADMIN"].includes(request.user!.role)) throw new AppError("Task tracker access is restricted", 403, "FORBIDDEN");
  const items = request.user!.role === "SUPER_ADMIN" ? await service.listAll(query(request)) : await service.listOwn(request.user!.id, query(request));
  response.json({ success: true, message: "Task tracker retrieved", data: { items } });
};
export const create = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.status(201).json({ success: true, message: "Task added", data: { item: await service.create(request.user!.id, request.body) } }); };
export const update = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.json({ success: true, message: "Task updated", data: { item: await service.update(request.user!.id, String(request.params.id), request.body) } }); };
export const remove = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.json({ success: true, message: "Task deleted", data: { item: await service.remove(request.user!.id, String(request.params.id)) } }); };
