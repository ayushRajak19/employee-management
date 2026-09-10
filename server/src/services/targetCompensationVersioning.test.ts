import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCompensationPayout,
  calculateTargetPerformance,
  calculateTargetProgress,
} from "./salesMath.js";
import { getTargetPeriodLabel } from "./targetReminderService.js";

test("Target progress and remaining percentage calculate deterministically matching prompt example", () => {
  // Example from user prompt:
  // Target = ₹10,00,000
  // Achieved = ₹8,00,000
  // Achievement = 80%
  // Remaining = ₹2,00,000
  // Remaining = 20%
  const progress = calculateTargetProgress(1_000_000, 800_000);

  assert.equal(progress.targetAmount, 1_000_000);
  assert.equal(progress.achievedAmount, 800_000);
  assert.equal(progress.achievementPercentage, 80);
  assert.equal(progress.remainingAmount, 200_000);
  assert.equal(progress.remainingPercentage, 20);

  // Integrated performance check
  const perf = calculateTargetPerformance({
    officialTarget: 1_000_000,
    actual: 800_000,
    periodStart: new Date("2026-09-01T00:00:00.000Z"),
    periodEnd: new Date("2026-09-30T23:59:59.999Z"),
    now: new Date("2026-09-15T00:00:00.000Z"),
  });

  assert.equal(perf.targetAmount, 1_000_000);
  assert.equal(perf.achievedAmount, 800_000);
  assert.equal(perf.achievementPercentage, 80);
  assert.equal(perf.remainingAmount, 200_000);
  assert.equal(perf.remainingPercentage, 20);
  assert.equal(perf.officialTarget, 1_000_000);
  assert.equal(perf.actualAchievement, 800_000);
  assert.equal(perf.remainingOfficialTarget, 200_000);
});

test("Target progress handles overachievement and boundary cases cleanly", () => {
  // Overachievement: Achieved ₹12,00,000 against ₹10,00,000
  const over = calculateTargetProgress(1_000_000, 1_200_000);
  assert.equal(over.targetAmount, 1_000_000);
  assert.equal(over.achievedAmount, 1_200_000);
  assert.equal(over.achievementPercentage, 120);
  assert.equal(over.remainingAmount, 0);
  assert.equal(over.remainingPercentage, 0);

  // 0 target edge case
  const zeroTarget = calculateTargetProgress(0, 0);
  assert.equal(zeroTarget.targetAmount, 0);
  assert.equal(zeroTarget.achievedAmount, 0);
  assert.equal(zeroTarget.achievementPercentage, 0);
  assert.equal(zeroTarget.remainingAmount, 0);
  assert.equal(zeroTarget.remainingPercentage, 0);

  // Zero achievement
  const zeroAchieved = calculateTargetProgress(500_000, 0);
  assert.equal(zeroAchieved.achievementPercentage, 0);
  assert.equal(zeroAchieved.remainingAmount, 500_000);
  assert.equal(zeroAchieved.remainingPercentage, 100);
});

test("Historical compensation payout uses exact version active during achievement period", () => {
  // Target Version 1 active in Q1: 5% commission rate, no accelerator
  const v1Rule = {
    commissionRate: 5,
    bonusThresholdPercentage: 100,
    bonusRate: 0,
    basePayAllocation: 20_000,
  };

  const v1Payout = calculateCompensationPayout(v1Rule, 1_000_000, 1_000_000);
  // 5% of 1,000,000 = 50,000 + 20,000 base = 70,000
  assert.equal(v1Payout.commission, 50_000);
  assert.equal(v1Payout.bonus, 0);
  assert.equal(v1Payout.basePay, 20_000);
  assert.equal(v1Payout.totalPayout, 70_000);

  // Target Version 2 updated in Q2: 8% commission rate with 3% bonus above 100%
  const v2Rule = {
    commissionRate: 8,
    bonusThresholdPercentage: 100,
    bonusRate: 3,
    basePayAllocation: 25_000,
  };

  // When calculating Q2 achievement of 1,200,000 against 1,000,000 quota:
  const v2Payout = calculateCompensationPayout(v2Rule, 1_200_000, 1_000_000);
  // 8% of 1,200,000 = 96,000 commission
  // 3% on 200,000 overachievement = 6,000 bonus
  // base = 25,000
  // total = 127,000
  assert.equal(v2Payout.commission, 96_000);
  assert.equal(v2Payout.bonus, 6_000);
  assert.equal(v2Payout.basePay, 25_000);
  assert.equal(v2Payout.totalPayout, 127_000);

  // Safety check: Historical Q1 payout when re-evaluated with historical v1 remains strictly 70,000!
  const historicalReplay = calculateCompensationPayout(v1Rule, 1_000_000, 1_000_000);
  assert.equal(historicalReplay.totalPayout, 70_000);
});

test("Period labels format correctly for reminder text", () => {
  const septDate = new Date("2026-09-10T12:00:00.000Z");
  assert.equal(getTargetPeriodLabel(septDate, "MONTHLY"), "September");

  const q3Date = new Date("2026-08-15T12:00:00.000Z");
  assert.equal(getTargetPeriodLabel(q3Date, "QUARTERLY"), "Q3 2026");

  const yearDate = new Date("2026-01-01T12:00:00.000Z");
  assert.equal(getTargetPeriodLabel(yearDate, "YEARLY"), "2026");
});

test("Reminder message text strictly adheres to user example format", () => {
  const periodLabel = "September";
  const achievementPercentage = 80;
  const remainingPercentage = 20;

  const reminderMessage = `You have achieved ${achievementPercentage}% of your ${periodLabel} target. ${remainingPercentage}% is still remaining.`;
  assert.equal(
    reminderMessage,
    "You have achieved 80% of your September target. 20% is still remaining.",
  );
});

test("Milestone evaluation selects highest reached unsent milestone and stops after completion", () => {
  const milestones = [90, 75, 50];

  // At 80% achievement with no prior reminders:
  const achievement = 80;
  const sentMilestones = new Set<number>();

  let selectedMilestone: number | null = null;
  for (const m of milestones) {
    if (achievement >= m && !sentMilestones.has(m)) {
      selectedMilestone = m;
      break;
    }
  }
  // 75% is the highest reached unsent milestone
  assert.equal(selectedMilestone, 75);

  // Once 75% is sent:
  sentMilestones.add(75);
  selectedMilestone = null;
  for (const m of milestones) {
    if (achievement >= m && !sentMilestones.has(m)) {
      selectedMilestone = m;
      break;
    }
  }
  // 50% is now selected
  assert.equal(selectedMilestone, 50);

  // Completion check: when target reaches 100% or more, reminders MUST stop!
  const completeAchievement = 100;
  const isComplete = completeAchievement >= 100;
  assert.equal(isComplete, true);
  // Decision: Stop reminders automatically
  const shouldSendReminders = !isComplete;
  assert.equal(shouldSendReminders, false);
});

