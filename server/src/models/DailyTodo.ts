import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface DailyTodoDocument {
  user: Types.ObjectId;
  employee: Types.ObjectId;
  date: string;
  title: string;
  type: "WORK" | "MEETING" | "LEARNING" | "FOLLOW_UP" | "PERSONAL" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  durationMinutes: number;
  deadline?: Date;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  completed: boolean;
  completedAt?: Date;
}

const schema = new Schema<DailyTodoDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 240 },
  type: { type: String, enum: ["WORK", "MEETING", "LEARNING", "FOLLOW_UP", "PERSONAL", "OTHER"], default: "WORK", index: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM", index: true },
  durationMinutes: { type: Number, min: 5, max: 1440, default: 30 },
  deadline: { type: Date, index: true },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "TODO", index: true },
  completed: { type: Boolean, default: false, index: true },
  completedAt: Date
}, { timestamps: true, versionKey: false });

schema.index({ user: 1, date: 1, createdAt: 1 });
schema.index({ date: 1, employee: 1, status: 1 });
export const DailyTodo = tenantModel<DailyTodoDocument>("DailyTodo", schema);
