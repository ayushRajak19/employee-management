import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const LEAD_WORK_STATUSES = ["NOT_STARTED", "ATTEMPTED", "CONNECTED", "FOLLOW_UP", "INTERESTED", "QUALIFIED", "NOT_INTERESTED", "INVALID", "CONVERTED"] as const;
export type LeadWorkStatus = typeof LEAD_WORK_STATUSES[number];

export interface LeadWorkItemDocument {
  task: Types.ObjectId; lead: Types.ObjectId; assignedEmployee: Types.ObjectId;
  status: LeadWorkStatus; attemptCount: number; lastAttemptAt?: Date; lastActivityAt?: Date;
  nextFollowUpAt?: Date; latestNote?: string; sourceRow: number; originalData: Record<string, string>;
  version: number; createdAt: Date; updatedAt: Date;
}

const schema = new Schema<LeadWorkItemDocument>({
  task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  lead: { type: Schema.Types.ObjectId, ref: "SalesLead", required: true, index: true },
  assignedEmployee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  status: { type: String, enum: LEAD_WORK_STATUSES, default: "NOT_STARTED", index: true },
  attemptCount: { type: Number, default: 0, min: 0 }, lastAttemptAt: Date, lastActivityAt: Date,
  nextFollowUpAt: { type: Date, index: true }, latestNote: { type: String, trim: true, maxlength: 2000 },
  sourceRow: { type: Number, required: true, min: 2 }, originalData: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
schema.index({ task: 1, status: 1 });
schema.index({ assignedEmployee: 1, status: 1 });
schema.index({ assignedEmployee: 1, nextFollowUpAt: 1 });
schema.index({ task: 1, lead: 1 }, { unique: true });
export const LeadWorkItem = tenantModel<LeadWorkItemDocument>("LeadWorkItem", schema);
