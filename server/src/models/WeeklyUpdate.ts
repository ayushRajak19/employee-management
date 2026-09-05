import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export const BLOCKER_CATEGORIES = ["APPROVAL", "CLIENT", "DEPENDENCY", "REQUIREMENTS", "ACCESS", "TECHNICAL", "CAPACITY", "OTHER"] as const;

export interface WeeklyUpdateDocument {
  employee: Types.ObjectId;
  weekStart: Date;
  accomplishments: string[];
  currentPriorities: string[];
  blockers: { description: string; category: typeof BLOCKER_CATEGORIES[number]; external: boolean }[];
  helpNeeded?: string;
  nextWeekPlan?: string;
  submittedAt: Date;
  managerComment?: string;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
}

const blockerSchema = new Schema({
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  category: { type: String, enum: BLOCKER_CATEGORIES, required: true },
  external: { type: Boolean, default: false }
}, { _id: false });

const schema = new Schema<WeeklyUpdateDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  weekStart: { type: Date, required: true, index: true },
  accomplishments: { type: [String], default: [] },
  currentPriorities: { type: [String], default: [] },
  blockers: { type: [blockerSchema], default: [] },
  helpNeeded: { type: String, trim: true, maxlength: 2000 },
  nextWeekPlan: { type: String, trim: true, maxlength: 2000 },
  submittedAt: { type: Date, default: Date.now },
  managerComment: { type: String, trim: true, maxlength: 2000 },
  acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
  acknowledgedAt: Date
}, { timestamps: true });

schema.index({ employee: 1, weekStart: 1 }, { unique: true });
export const WeeklyUpdate = tenantModel<WeeklyUpdateDocument>("WeeklyUpdate", schema);
