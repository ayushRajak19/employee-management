import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const EMAIL_WORKFLOW_STATUSES = ["DRAFT", "ACTIVE", "PAUSED"] as const;
export interface EmailWorkflowDocument {
  kind: "SEQUENCE" | "BROADCAST";
  audienceSource?: string;
  recipientCount?: number;
  scheduledAt?: Date;
  clientRequestId?: string;
  name: string;
  audience: string;
  subject: string;
  message: string;
  followUp: boolean;
  delayDays: number;
  followUpSubject?: string;
  followUpMessage?: string;
  status: typeof EMAIL_WORKFLOW_STATUSES[number];
  createdBy: Types.ObjectId;
  activatedAt?: Date;
}
const schema = new Schema<EmailWorkflowDocument>({
  kind: { type: String, enum: ["SEQUENCE", "BROADCAST"], default: "SEQUENCE", index: true },
  audienceSource: { type: String, trim: true, maxlength: 200 },
  recipientCount: { type: Number, min: 0 },
  scheduledAt: Date,
  clientRequestId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  audience: { type: String, required: true, trim: true, maxlength: 160 },
  subject: { type: String, required: true, trim: true, maxlength: 250 },
  message: { type: String, required: true, maxlength: 20_000 },
  followUp: { type: Boolean, default: true },
  delayDays: { type: Number, min: 1, max: 90, default: 3 },
  followUpSubject: { type: String, trim: true, maxlength: 250 },
  followUpMessage: { type: String, maxlength: 20_000 },
  status: { type: String, enum: EMAIL_WORKFLOW_STATUSES, default: "DRAFT", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  activatedAt: Date,
}, { timestamps: true });
export const EmailWorkflow = tenantModel<EmailWorkflowDocument>("EmailWorkflow", schema);
