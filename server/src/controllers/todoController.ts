import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as service from "../services/todoService.js";
const employeeOnly = (request: Request) => { if (request.user!.role !== "EMPLOYEE") throw new AppError("Daily to-dos are private to employee accounts", 403, "FORBIDDEN"); };
export const list = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.json({ success: true, message: "Daily to-dos retrieved", data: { items: await service.list(request.user!.id, String(request.query.date)) } }); };
export const create = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.status(201).json({ success: true, message: "To-do added", data: { item: await service.create(request.user!.id, request.body) } }); };
export const update = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.json({ success: true, message: "To-do updated", data: { item: await service.update(request.user!.id, String(request.params.id), request.body) } }); };
export const remove = async (request: Request, response: Response): Promise<void> => { employeeOnly(request); response.json({ success: true, message: "To-do deleted", data: { item: await service.remove(request.user!.id, String(request.params.id)) } }); };
