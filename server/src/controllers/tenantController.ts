import type { Request, Response } from "express";
import * as tenantService from "../services/tenantService.js";

export const list = async (_request: Request, response: Response): Promise<void> => {
  response.json({ success: true, message: "Organizations retrieved", data: { items: await tenantService.listTenants() } });
};
export const create = async (request: Request, response: Response): Promise<void> => {
  const item = await tenantService.createTenant(request.body, request.user!.id);
  response.status(201).json({ success: true, message: "Organization provisioned", data: { item } });
};
export const updateStatus = async (request: Request, response: Response): Promise<void> => {
  const item = await tenantService.updateTenantStatus(String(request.params.id), request.body.status, request.user!.tenantId);
  response.json({ success: true, message: `Organization ${request.body.status === "ACTIVE" ? "activated" : "suspended"}`, data: { item } });
};

