import { Schema, type Types } from "mongoose";
import { tenantModel } from "../tenancy/tenantModel.js";

export interface EmployeeGamificationDocument {
  employeeId: Types.ObjectId;
  currentLevel: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  totalLifetimeXp: number;
  streakDays: number;
  lastActiveDate?: Date;
  completedTasksCount: number;
  earnedBadges: Array<{ badgeKey: string; name: string; description: string; icon: string; awardedAt: Date }>;
  history: Array<{ taskId: Types.ObjectId; xpEarned: number; reason: string; createdAt: Date }>;
}

const badgeSchema = new Schema({ badgeKey: { type: String, required: true }, name: { type: String, required: true }, description: { type: String, required: true }, icon: { type: String, required: true }, awardedAt: { type: Date, required: true } }, { _id: false });
const historySchema = new Schema({ taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true }, xpEarned: { type: Number, required: true, min: 0 }, reason: { type: String, required: true }, createdAt: { type: Date, required: true } }, { _id: false });
const schema = new Schema<EmployeeGamificationDocument>({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true, index: true },
  currentLevel: { type: Number, default: 1, min: 1 }, currentLevelXp: { type: Number, default: 0, min: 0 }, xpForNextLevel: { type: Number, default: 300, min: 1 },
  totalLifetimeXp: { type: Number, default: 0, min: 0 }, streakDays: { type: Number, default: 0, min: 0 }, lastActiveDate: Date, completedTasksCount: { type: Number, default: 0, min: 0 },
  earnedBadges: { type: [badgeSchema], default: [] }, history: { type: [historySchema], default: [] }
}, { timestamps: true });

export const EmployeeGamification = tenantModel<EmployeeGamificationDocument>("EmployeeGamification", schema);
