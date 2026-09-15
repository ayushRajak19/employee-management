import type { Request, Response } from "express";
import * as service from "../services/emailAutomationService.js";
import { AppError } from "../utils/AppError.js";
import * as gmail from "../services/gmailService.js";
import { env } from "../config/env.js";

export const startGoogle = async (request: Request, response: Response) => {
  requireSuperAdmin(request);
  response.setHeader("Cache-Control", "no-store");
  response.json({ success: true, data: await gmail.startGoogleConnection(request.user!.id) });
};
export const googleCallback = async (request: Request, response: Response) => {
  requireSuperAdmin(request);
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  let result = "connected";
  try { await gmail.finishGoogleConnection(request.user!.id, typeof request.query.state === "string" ? request.query.state : "", typeof request.query.code === "string" ? request.query.code : undefined); }
  catch (error) { result = error instanceof AppError ? error.code || "GOOGLE_AUTH_FAILED" : "GOOGLE_AUTH_FAILED"; }
  response.redirect(`${env.CLIENT_URL}/email-automation?google=${encodeURIComponent(result)}`);
};
export const disconnectGoogle = async (request: Request, response: Response) => {
  requireSuperAdmin(request);
  await gmail.disconnectGoogle(request.user!.id);
  response.json({ success: true, data: {} });
};

const requireSuperAdmin = (request: Request) => { if (request.user!.role !== "SUPER_ADMIN") throw new AppError("Only a Super Admin can manage email automation", 403, "SUPER_ADMIN_REQUIRED"); };
export const getConfiguration = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email configuration retrieved", data: await service.configuration() }); };
export const updateConfiguration = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Organization sender saved", data: await service.updateConfiguration(request.body, request.user!.id) }); };
export const checkConnection = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Brevo API connection is valid", data: await service.testConnection() }); };
export const registerWebhook = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Brevo webhook configured", data: await service.registerWebhook() }); };
export const sendTest = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Test email accepted by Brevo", data: await service.sendTest(request.body.recipient) }); };
export const getSummary = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email automation summary retrieved", data: await service.summary() }); };
export const getDeliveries = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email delivery activity retrieved", data: { items: await service.listDeliveries() } }); };
export const getWorkflows = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email workflows retrieved", data: { items: await service.listWorkflows() } }); };
export const createWorkflow = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.status(201).json({ success: true, message: "Email workflow created", data: { item: await service.createWorkflow(request.body, request.user!.id) } }); };
export const updateWorkflow = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email workflow updated", data: { item: await service.updateWorkflow(String(request.params.id), request.body, request.user!.id) } }); };
export const deleteWorkflow = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); await service.deleteWorkflow(String(request.params.id), request.user!.id); response.json({ success: true, message: "Email workflow deleted", data: {} }); };
export const activateWorkflow = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email workflow activated", data: { item: await service.activateWorkflow(String(request.params.id), request.user!.id) } }); };
export const pauseWorkflow = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Email workflow paused", data: { item: await service.pauseWorkflow(String(request.params.id), request.user!.id) } }); };
export const getContacts = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Vendor contacts retrieved", data: { items: await service.listContacts() } }); };
export const addContacts = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.status(201).json({ success: true, message: "Vendor contacts imported", data: await service.addContacts(request.body.contacts, request.user!.id) }); };
export const setContactStatus = async (request: Request, response: Response): Promise<void> => { requireSuperAdmin(request); response.json({ success: true, message: "Vendor contact updated", data: { item: await service.updateContactStatus(String(request.params.id), request.body.status, request.user!.id) } }); };
export const brevoWebhook = async (request: Request, response: Response): Promise<void> => { await service.handleWebhook(request.body, request.get("x-brevo-webhook-token") || String(request.query.token || "")); response.status(204).end(); };
export const unsubscribe = async (request: Request, response: Response): Promise<void> => { await service.unsubscribe(String(request.params.token)); response.type("html").send("<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width\"><title>Unsubscribed</title></head><body style=\"font-family:system-ui;padding:48px;text-align:center;color:#1e293b\"><h1>You have been unsubscribed</h1><p>You will not receive further vendor outreach emails from this automation.</p></body></html>"); };
