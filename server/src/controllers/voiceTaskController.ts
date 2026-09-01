import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import * as service from "../services/voiceTaskService.js";

const actor = (request: Request) => ({ id: request.user!.id, role: request.user!.role, permissions: [...request.user!.permissions] });
export const previewAudio = async (request: Request, response: Response): Promise<void> => {
  if (!request.file) throw new AppError("Add a voice recording", 422, "VOICE_REQUIRED");
  const transcription = await service.transcribeAudio(request.file, typeof request.body.language === "string" ? request.body.language : undefined);
  response.status(201).json({ success: true, message: "Voice transcribed", data: await service.createPreview(transcription.text, actor(request), transcription) });
};
export const previewText = async (request: Request, response: Response): Promise<void> => { response.status(201).json({ success: true, message: "Command interpreted", data: await service.createPreview(request.body.transcript, actor(request), { language: request.body.language === "auto" ? undefined : request.body.language }) }); };
export const confirm = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Voice command applied", data: await service.confirmCommand(String(request.params.id), request.body, actor(request)) }); };
export const cancel = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Voice command cancelled", data: { item: await service.cancelCommand(String(request.params.id), actor(request)) } }); };
export const history = async (request: Request, response: Response): Promise<void> => { response.json({ success: true, message: "Voice history retrieved", data: { items: await service.listHistory(actor(request)) } }); };
