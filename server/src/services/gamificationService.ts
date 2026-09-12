import { Employee } from "../models/Employee.js";
import { EmployeeGamification } from "../models/EmployeeGamification.js";
import type { TaskDocument } from "../models/Task.js";
import type { HydratedDocument } from "mongoose";
import { AppError } from "../utils/AppError.js";

const tiers = [
  { level: 1, name: "Apprentice", min: 0, next: 300 }, { level: 2, name: "Junior Specialist", min: 300, next: 800 },
  { level: 3, name: "Core Contributor", min: 800, next: 1500 }, { level: 4, name: "Senior Operator", min: 1500, next: 2500 },
  { level: 5, name: "Lead Specialist", min: 2500, next: 4000 }, { level: 6, name: "Master Tactician", min: 4000, next: 6000 }
] as const;

export const levelForXp = (xp: number) => {
  const fixed = [...tiers].reverse().find((tier) => xp >= tier.min);
  if (xp < 6000) return fixed!;
  const level = Math.max(7, Math.floor(Math.sqrt(xp / 100)));
  return { level, name: "Legendary Producer", min: level === 7 ? 6000 : level * level * 100, next: (level + 1) * (level + 1) * 100 };
};

export const baseXpForComplexity = (complexity: TaskDocument["complexity"]) => complexity === "EASY" ? 50 : complexity === "MEDIUM" ? 100 : 200;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const previousWorkingDay = (date: Date) => { const value = startOfDay(date); do value.setDate(value.getDate() - 1); while ([0, 6].includes(value.getDay())); return value; };
const sameDay = (left?: Date, right?: Date) => !!left && !!right && startOfDay(left).getTime() === startOfDay(right).getTime();

export const getGamificationForUser = async (userId: string) => {
  const employee = await Employee.findOne({ user: userId, isActive: true }).select("_id");
  if (!employee) throw new AppError("Employee profile not found", 404);
  const record = await EmployeeGamification.findOneAndUpdate({ employeeId: employee._id }, { $setOnInsert: { employeeId: employee._id } }, { new: true, upsert: true });
  return presentGamification(record.toObject());
};

const presentGamification = (record: { currentLevel: number; currentLevelXp: number; xpForNextLevel: number; totalLifetimeXp: number; streakDays: number; completedTasksCount: number; earnedBadges: EmployeeGamificationDocumentLike["earnedBadges"]; history?: Array<{ createdAt: Date }> }) => {
  const tier = levelForXp(record.totalLifetimeXp);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const completedTasksCount = record.history ? record.history.filter((item) => item.createdAt >= monthStart).length : record.completedTasksCount;
  const publicRecord = { ...record }; delete publicRecord.history;
  return { ...publicRecord, completedTasksCount, tierName: tier.name, xpToNextLevel: Math.max(0, tier.next - record.totalLifetimeXp), progressPercent: Math.min(100, Math.round(record.currentLevelXp / record.xpForNextLevel * 100)), recentAchievement: record.earnedBadges.at(-1) ?? null };
};
type EmployeeGamificationDocumentLike = { earnedBadges: Array<{ badgeKey: string; name: string; description: string; icon: string; awardedAt: Date }> };

export const awardTaskXp = async (task: HydratedDocument<TaskDocument>) => {
  if (!task.isActive || task.status !== "COMPLETED" || task.assignmentSource !== "MANAGER_ASSIGNED") return null;
  const now = task.completionDate ?? new Date();
  let record = await EmployeeGamification.findOne({ employeeId: task.assignedEmployee });
  if (!record) record = await EmployeeGamification.findOneAndUpdate({ employeeId: task.assignedEmployee }, { $setOnInsert: { employeeId: task.assignedEmployee } }, { new: true, upsert: true });
  if (!record) throw new AppError("Gamification profile could not be created", 500);
  if (record.history.some((item) => item.taskId.toString() === task._id.toString())) return null;

  const yesterday = previousWorkingDay(now);
  const streakDays = sameDay(record.lastActiveDate, now) ? record.streakDays : sameDay(record.lastActiveDate, yesterday) ? record.streakDays + 1 : 1;
  const base = baseXpForComplexity(task.complexity);
  const onTime = now <= task.deadline ? 25 : 0;
  const quality = (task.qualityRating ?? 0) >= 4 ? 50 : 0;
  const streak = streakDays * 15;
  const xpEarned = base + onTime + quality + streak;
  const previousLevel = levelForXp(record.totalLifetimeXp).level;

  const awarded = await EmployeeGamification.findOneAndUpdate(
    { employeeId: task.assignedEmployee, "history.taskId": { $ne: task._id } },
    { $inc: { totalLifetimeXp: xpEarned, completedTasksCount: 1 }, $set: { streakDays, lastActiveDate: now }, $push: { history: { taskId: task._id, xpEarned, reason: `Completion ${base} + on-time ${onTime} + quality ${quality} + streak ${streak}`, createdAt: now } } },
    { new: true }
  );
  if (!awarded) return null;
  const tier = levelForXp(awarded.totalLifetimeXp);
  awarded.currentLevel = tier.level;
  awarded.currentLevelXp = awarded.totalLifetimeXp - tier.min;
  awarded.xpForNextLevel = tier.next - tier.min;
  if (tier.level > previousLevel && !awarded.earnedBadges.some((badge) => badge.badgeKey === `level-${tier.level}`)) awarded.earnedBadges.push({ badgeKey: `level-${tier.level}`, name: tier.name, description: `Reached Level ${tier.level}`, icon: "🏆", awardedAt: now });
  await awarded.save();
  return { xpEarned, leveledUp: tier.level > previousLevel, previousLevel, gamification: presentGamification(awarded.toObject()) };
};
