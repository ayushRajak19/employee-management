import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";
export interface TaskActivityDocument { task: Types.ObjectId; action: string; oldValue?: unknown; newValue?: unknown; performedBy: Types.ObjectId }
const schema = new Schema<TaskActivityDocument>({ task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true }, action: { type: String, required: true, index: true }, oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed, performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true } }, { timestamps: true, versionKey: false }); schema.index({ task: 1, createdAt: -1 }); export const TaskActivity = tenantModel<TaskActivityDocument>("TaskActivity", schema);
