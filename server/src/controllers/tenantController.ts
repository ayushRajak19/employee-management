import type { Request, Response } from "express";
import * as tenantService from "../services/tenantService.js";

export const list = async (_request: Request, response: Response): Promise<void> => {
  response.json({ success: true, message: "Organizations retrieved", data: { items: await tenantService.listTenants() } });
};
export const analytics = async (_request: Request, response: Response): Promise<void> => {
  response.json({ success: true, message: "Platform analytics retrieved", data: await tenantService.platformAnalytics() });
};
export const create = async (request: Request, response: Response): Promise<void> => {
  const item = await tenantService.createTenant(request.body);
  response.status(201).json({ success: true, message: "Organization provisioned", data: { item } });
};
export const updateStatus = async (request: Request, response: Response): Promise<void> => {
  const item = await tenantService.updateTenantStatus(String(request.params.id), request.body.status, "");
  response.json({ success: true, message: `Organization ${request.body.status === "ACTIVE" ? "activated" : "suspended"}`, data: { item } });
};
