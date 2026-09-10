import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const REMINDER_TYPES = ["MILESTONE", "PERIODIC_PACING", "NEAR_DEADLINE", "COMPLETION"] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export interface TargetReminderLogDocument {
  target: Types.ObjectId;
  targetGroupId?: string;
  employee: Types.ObjectId;
  user: Types.ObjectId;
  reminderType: ReminderType;
  milestonePercentage?: number;
  achievementPercentage: number;
  remainingPercentage: number;
  targetAmount: number;
  achievedAmount: number;
  remainingAmount: number;
  currency: string;
  title: string;
  body: string;
  sentAt: Date;
  channel: "IN_APP" | "EMAIL";
  status: "SENT" | "SKIPPED";
}

const schema = new Schema<TargetReminderLogDocument>(
  {
    target: { type: Schema.Types.ObjectId, ref: "SalesTarget", required: true, index: true },
    targetGroupId: { type: String, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reminderType: { type: String, enum: REMINDER_TYPES, required: true, index: true },
    milestonePercentage: { type: Number, min: 0, max: 100 },
    achievementPercentage: { type: Number, required: true },
    remainingPercentage: { type: Number, required: true },
    targetAmount: { type: Number, required: true },
    achievedAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    currency: { type: String, uppercase: true, trim: true, maxlength: 3, required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 2000 },
    sentAt: { type: Date, default: Date.now, required: true, index: true },
    channel: { type: String, enum: ["IN_APP", "EMAIL"], default: "IN_APP" },
    status: { type: String, enum: ["SENT", "SKIPPED"], default: "SENT" },
  },
  { timestamps: true },
);

schema.index({ target: 1, reminderType: 1, milestonePercentage: 1 });
schema.index({ target: 1, sentAt: -1 });
schema.index({ employee: 1, sentAt: -1 });

export const TargetReminderLog = tenantModel<TargetReminderLogDocument>("TargetReminderLog", schema);
