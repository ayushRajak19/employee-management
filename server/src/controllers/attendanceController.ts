import type { Request, Response } from "express"; import * as service from "../services/attendanceService.js";
export const today = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Today's attendance retrieved", data: await service.today(request.user!.id) }); };
export const checkIn = async (request: Request, response: Response): Promise<void> => { response.status(201).json({ success: true, message: "Checked in successfully", data: { attendance: await service.checkIn(request.user!.id, request.body, { ip: request.ip, userAgent: request.get("user-agent") }) } }); };
export const checkOut = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Checked out successfully", data: { attendance: await service.checkOut(request.user!.id, request.body, { ip: request.ip, userAgent: request.get("user-agent") }) } }); };
export const register = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Attendance register retrieved", data: await service.register({ role: request.user!.role }, request.query as { date?: string; department?: string; search?: string }) }); };
export const configureOffice = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Office attendance location updated", data: { office: await service.configureOffice({ id: request.user!.id, role: request.user!.role }, request.body, { ip: request.ip, userAgent: request.get("user-agent") }) } }); };
export const updateOfficeRadius = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Attendance radius updated", data: { office: await service.updateOfficeRadius({ id: request.user!.id, role: request.user!.role }, request.body.radiusMeters, { ip: request.ip, userAgent: request.get("user-agent") }) } }); };

export const requestRegularization = async (request: Request, response: Response): Promise<void> => {
  response.status(201).json({
    success: true,
    message: "Attendance regularization requested",
    data: {
      regularization: await service.requestRegularization(request.user!.id, request.body, {
        ip: request.ip,
        userAgent: request.get("user-agent")
      })
    }
  });
};

export const listRegularizations = async (request: Request, response: Response): Promise<void> => {
  response.json({
    success: true,
    message: "Attendance regularizations retrieved",
    data: {
      items: await service.listRegularizations(
        { id: request.user!.id, role: request.user!.role },
        request.query as { status?: string; dateKey?: string }
      )
    }
  });
};

export const reviewRegularization = async (request: Request, response: Response): Promise<void> => {
  response.json({
    success: true,
    message: "Attendance regularization reviewed",
    data: {
      regularization: await service.reviewRegularization(
        request.params.id as string,
        request.body,
        { id: request.user!.id, role: request.user!.role },
        { ip: request.ip, userAgent: request.get("user-agent") }
      )
    }
  });
};
