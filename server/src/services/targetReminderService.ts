import { Types } from "mongoose";
import { Employee } from "../models/Employee.js";
import { SalesConfiguration } from "../models/SalesConfiguration.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget, type SalesTargetDocument } from "../models/SalesTarget.js";
import { TargetReminderLog, type ReminderType } from "../models/TargetReminderLog.js";
import { Tenant } from "../models/Tenant.js";
import { currentTenantId, runWithTenant } from "../tenancy/tenantContext.js";
import { calculateTargetProgress } from "./salesMath.js";
import { notify } from "./notificationService.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getTargetPeriodLabel = (periodStart: Date, periodType: string): string => {
  const date = new Date(periodStart);
  const monthName = MONTH_NAMES[date.getMonth()] ?? "";
  const year = date.getFullYear();
  if (periodType === "MONTHLY") {
    return monthName;
  }
  if (periodType === "QUARTERLY") {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${year}`;
  }
  return `${year}`;
};

export interface ProcessReminderOptions {
  now?: Date;
  forceChannel?: "IN_APP" | "EMAIL";
}

export interface TargetReminderEvaluationResult {
  targetId: string;
  employeeId?: string;
  shouldSend: boolean;
  reason: string;
  reminderType?: ReminderType;
  milestonePercentage?: number;
  progress: {
    targetAmount: number;
    achievedAmount: number;
    achievementPercentage: number;
    remainingAmount: number;
    remainingPercentage: number;
  };
  reminderLogId?: string;
}

export const processReminderForTarget = async (
  target: SalesTargetDocument & { _id: Types.ObjectId },
  options: ProcessReminderOptions = {},
): Promise<TargetReminderEvaluationResult> => {
  const now = options.now ?? new Date();
  const targetId = target._id.toString();

  // 1. Inactive or superseded targets receive no reminders
  if (target.status !== "ACTIVE") {
    return {
      targetId,
      shouldSend: false,
      reason: `Target status is ${target.status}`,
      progress: calculateTargetProgress(target.revenueTarget, 0),
    };
  }

  // 2. Target period expired: "Reminders should continue until target reaches 100% or the target period ends."
  if (now > target.periodEnd) {
    return {
      targetId,
      shouldSend: false,
      reason: "Target period has ended",
      progress: calculateTargetProgress(target.revenueTarget, 0),
    };
  }

  // 3. Must have an assigned employee
  if (!target.employee) {
    return {
      targetId,
      shouldSend: false,
      reason: "Target is not assigned to an individual employee",
      progress: calculateTargetProgress(target.revenueTarget, 0),
    };
  }

  const employeeId = target.employee.toString();
  const employeeDoc = await Employee.findById(target.employee).select("user firstName lastName officialEmail").lean();
  if (!employeeDoc || !employeeDoc.user) {
    return {
      targetId,
      employeeId,
      shouldSend: false,
      reason: "Employee user account not found",
      progress: calculateTargetProgress(target.revenueTarget, 0),
    };
  }

  // 4. Calculate actual achievement
  const actualAchievement = (
    await SalesRevenueTransaction.aggregate([
      {
        $match: {
          employee: target.employee,
          transactionDate: { $gte: target.periodStart, $lte: target.periodEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
  )[0]?.total ?? 0;

  const progress = calculateTargetProgress(target.revenueTarget, actualAchievement);

  // 5. Completion check: "Stop reminders automatically after completion."
  if (actualAchievement >= target.revenueTarget && target.revenueTarget > 0) {
    return {
      targetId,
      employeeId,
      shouldSend: false,
      reason: "Target is already 100% completed; reminders stopped",
      progress,
    };
  }

  // 6. Get configuration for milestones and frequency
  const config = await SalesConfiguration.findOne({ key: "DEFAULT" }).lean();
  if (config && config.automaticRemindersEnabled === false) {
    return {
      targetId,
      employeeId,
      shouldSend: false,
      reason: "Automatic target reminders are disabled in configuration",
      progress,
    };
  }

  const milestones = (config?.milestones && config.milestones.length > 0 ? config.milestones : [50, 75, 90])
    .slice()
    .sort((a, b) => b - a);
  const reminderFrequencyDays = config?.targetReminderFrequencyDays ?? 7;
  const nearDeadlineDays = config?.nearDeadlineDays ?? 3;

  const periodLabel = getTargetPeriodLabel(target.periodStart, target.periodType);
  const daysRemaining = Math.max(0, Math.ceil((target.periodEnd.getTime() - now.getTime()) / 86400000));

  let eligibleType: ReminderType | null = null;
  let eligibleMilestone: number | undefined = undefined;

  // A. Check milestone reminders (50%, 75%, 90%)
  for (const milestone of milestones) {
    if (progress.achievementPercentage >= milestone) {
      const alreadySent = await TargetReminderLog.exists({
        target: target._id,
        reminderType: "MILESTONE",
        milestonePercentage: milestone,
      });
      if (!alreadySent) {
        eligibleType = "MILESTONE";
        eligibleMilestone = milestone;
        break;
      }
    }
  }

  // B. Check near-deadline alert
  if (!eligibleType && daysRemaining <= nearDeadlineDays && daysRemaining > 0) {
    const deadlineAlertSent = await TargetReminderLog.exists({
      target: target._id,
      reminderType: "NEAR_DEADLINE",
    });
    if (!deadlineAlertSent) {
      eligibleType = "NEAR_DEADLINE";
    }
  }

  // C. Check periodic pacing reminder
  if (!eligibleType) {
    const lastReminder = await TargetReminderLog.findOne({ target: target._id }).sort({ sentAt: -1 }).lean();
    if (!lastReminder) {
      eligibleType = "PERIODIC_PACING";
    } else {
      const daysSinceLastReminder = (now.getTime() - new Date(lastReminder.sentAt).getTime()) / 86400000;
      if (daysSinceLastReminder >= reminderFrequencyDays) {
        eligibleType = "PERIODIC_PACING";
      } else {
        return {
          targetId,
          employeeId,
          shouldSend: false,
          reason: `Frequency throttled; last reminder was sent ${daysSinceLastReminder.toFixed(1)} days ago`,
          progress,
        };
      }
    }
  }

  if (!eligibleType) {
    return {
      targetId,
      employeeId,
      shouldSend: false,
      reason: "No eligible reminder trigger found",
      progress,
    };
  }

  // 7. Compose message strictly adhering to requirements:
  // Example from prompt: “You have achieved 80% of your September target. 20% is still remaining.”
  let title = `Target reminder: ${progress.achievementPercentage}% achieved`;
  let body = `You have achieved ${progress.achievementPercentage}% of your ${periodLabel} target. ${progress.remainingPercentage}% is still remaining.`;

  if (eligibleType === "MILESTONE" && eligibleMilestone) {
    title = `Milestone reached: ${eligibleMilestone}% of your ${periodLabel} target!`;
    body = `You have achieved ${progress.achievementPercentage}% of your ${periodLabel} target. ${progress.remainingPercentage}% is still remaining.`;
  } else if (eligibleType === "NEAR_DEADLINE") {
    title = `Target deadline approaching (${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left)`;
    body = `You have achieved ${progress.achievementPercentage}% of your ${periodLabel} target. ${progress.remainingPercentage}% is still remaining with ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining in the period.`;
  }

  // 8. Dispatch notification via existing notification system
  await notify({
    recipient: employeeDoc.user.toString(),
    type: "TARGET_REMINDER",
    title,
    body,
    entityType: "SalesTarget",
    entityId: targetId,
    email: employeeDoc.officialEmail,
  });

  // 9. Store reminder log for deduplication and manager/admin audit
  const log = await TargetReminderLog.create({
    target: target._id,
    targetGroupId: target.targetGroupId || targetId,
    employee: target.employee,
    user: employeeDoc.user,
    reminderType: eligibleType,
    milestonePercentage: eligibleMilestone,
    achievementPercentage: progress.achievementPercentage,
    remainingPercentage: progress.remainingPercentage,
    targetAmount: progress.targetAmount,
    achievedAmount: progress.achievedAmount,
    remainingAmount: progress.remainingAmount,
    currency: target.currency,
    title,
    body,
    sentAt: now,
    channel: employeeDoc.officialEmail ? "EMAIL" : "IN_APP",
    status: "SENT",
  });

  return {
    targetId,
    employeeId,
    shouldSend: true,
    reason: `Reminder sent: ${eligibleType}`,
    reminderType: eligibleType,
    milestonePercentage: eligibleMilestone,
    progress,
    reminderLogId: log._id.toString(),
  };
};

export const getTargetReminderStatus = async (targetId: string) => {
  const target = await SalesTarget.findById(targetId).lean();
  if (!target) return null;

  const logs = await TargetReminderLog.find({ target: targetId })
    .sort({ sentAt: -1 })
    .limit(50)
    .lean();

  const lastReminder = logs[0] ?? null;

  return {
    targetId,
    totalRemindersSent: logs.length,
    lastReminderSentAt: lastReminder?.sentAt ?? null,
    lastReminderType: lastReminder?.reminderType ?? null,
    lastReminderMilestone: lastReminder?.milestonePercentage ?? null,
    history: logs.map((entry) => ({
      _id: entry._id.toString(),
      reminderType: entry.reminderType,
      milestonePercentage: entry.milestonePercentage,
      achievementPercentage: entry.achievementPercentage,
      remainingPercentage: entry.remainingPercentage,
      title: entry.title,
      body: entry.body,
      sentAt: entry.sentAt,
      channel: entry.channel,
    })),
  };
};

export const runTenantTargetReminderCycle = async (now = new Date()): Promise<TargetReminderEvaluationResult[]> => {
  const activeTargets = await SalesTarget.find({
    status: "ACTIVE",
    isLatest: { $ne: false },
    periodEnd: { $gte: now },
    employee: { $exists: true, $ne: null },
  });

  const results: TargetReminderEvaluationResult[] = [];
  for (const target of activeTargets) {
    try {
      const res = await processReminderForTarget(target, { now });
      results.push(res);
    } catch (error) {
      console.error(`Failed to process target reminder for target ${target._id}`, error);
    }
  }
  return results;
};

let cycleRunning = false;
export const runTargetReminderCycle = async (now = new Date()) => {
  if (cycleRunning) return;
  cycleRunning = true;
  try {
    const tenantId = currentTenantId();
    if (tenantId) {
      await runTenantTargetReminderCycle(now);
    } else {
      const tenants = await Tenant.find({ status: "ACTIVE" }).select("_id").lean();
      for (const tenant of tenants) {
        await runWithTenant(tenant._id, () => runTenantTargetReminderCycle(now));
      }
    }
  } finally {
    cycleRunning = false;
  }
};
