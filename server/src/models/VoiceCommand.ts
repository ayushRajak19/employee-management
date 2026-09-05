import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const VOICE_INTENTS = ["CREATE_TASK", "UPDATE_STATUS"] as const;
export const VOICE_COMMAND_STATUSES = ["TRANSCRIBED", "CONFIRMED", "CANCELLED", "FAILED"] as const;

export interface VoiceCommandDocument {
  actor: Types.ObjectId;
  actorRole: string;
  transcript: string;
  language?: string;
  durationSeconds?: number;
  intent: typeof VOICE_INTENTS[number];
  confidence: number;
  status: typeof VOICE_COMMAND_STATUSES[number];
  draft: Record<string, unknown>;
  task?: Types.ObjectId;
  errorMessage?: string;
}

const schema = new Schema<VoiceCommandDocument>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actorRole: { type: String, required: true, index: true },
  transcript: { type: String, required: true, trim: true, maxlength: 10_000 },
  language: { type: String, maxlength: 20 },
  durationSeconds: { type: Number, min: 0, max: 3600 },
  intent: { type: String, enum: VOICE_INTENTS, required: true, index: true },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  status: { type: String, enum: VOICE_COMMAND_STATUSES, default: "TRANSCRIBED", index: true },
  draft: { type: Schema.Types.Mixed, required: true },
  task: { type: Schema.Types.ObjectId, ref: "Task", index: true },
  errorMessage: { type: String, maxlength: 1000 }
}, { timestamps: true, versionKey: false });

schema.index({ actor: 1, createdAt: -1 });
schema.index({ status: 1, createdAt: -1 });
export const VoiceCommand = tenantModel<VoiceCommandDocument>("VoiceCommand", schema);
