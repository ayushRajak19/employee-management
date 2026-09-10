export interface CapacityMetrics { currentLeadLoad: number; configuredLeadCapacity: number; requiredHeadcount: number; activeHeadcount: number; headcountGap: number; capacityUtilization: number; coveragePercentage: number }
export const calculateCapacity = (leadCount: number, activeHeadcount: number, capacityPerEmployee: number): CapacityMetrics => {
  const load = Math.max(0, leadCount); const headcount = Math.max(0, activeHeadcount); const capacity = Math.max(1, capacityPerEmployee);
  const requiredHeadcount = Math.ceil(load / capacity);
  return { currentLeadLoad: load, configuredLeadCapacity: capacity, requiredHeadcount, activeHeadcount: headcount, headcountGap: Math.max(0, requiredHeadcount - headcount), capacityUtilization: headcount ? Number((load / (headcount * capacity) * 100).toFixed(2)) : load ? 100 : 0, coveragePercentage: requiredHeadcount ? Number((Math.min(1, headcount / requiredHeadcount) * 100).toFixed(2)) : 100 };
};
export const percentage = (numerator: number, denominator: number): number => denominator > 0 ? Number((numerator / denominator * 100).toFixed(2)) : 0;

export interface TargetProgressMetrics {
  targetAmount: number;
  achievedAmount: number;
  achievementPercentage: number;
  remainingAmount: number;
  remainingPercentage: number;
}

export const calculateTargetProgress = (target: number, actual: number): TargetProgressMetrics => {
  const t = Math.max(0, target);
  const a = Math.max(0, actual);
  const achievementPercentage = t > 0 ? Number(((a / t) * 100).toFixed(2)) : (a > 0 ? 100 : 0);
  const remainingAmount = Math.max(0, t - a);
  const remainingPercentage = t > 0 ? Number(((remainingAmount / t) * 100).toFixed(2)) : 0;
  return {
    targetAmount: t,
    achievedAmount: a,
    achievementPercentage,
    remainingAmount,
    remainingPercentage,
  };
};

export interface CompensationRuleConfig {
  commissionRate?: number;
  bonusThresholdPercentage?: number;
  bonusRate?: number;
  basePayAllocation?: number;
}

export interface CompensationPayoutResult {
  commission: number;
  bonus: number;
  basePay: number;
  totalPayout: number;
}

export const calculateCompensationPayout = (
  rule: CompensationRuleConfig | undefined,
  achieved: number,
  target: number,
): CompensationPayoutResult => {
  if (!rule) {
    return { commission: 0, bonus: 0, basePay: 0, totalPayout: 0 };
  }
  const commissionRate = Math.max(0, rule.commissionRate ?? 0);
  const commission = Number((achieved * (commissionRate / 100)).toFixed(2));
  let bonus = 0;
  if (rule.bonusRate && rule.bonusThresholdPercentage && target > 0) {
    const thresholdAmount = (target * rule.bonusThresholdPercentage) / 100;
    if (achieved > thresholdAmount) {
      const eligibleAmount = achieved - thresholdAmount;
      bonus = Number((eligibleAmount * (rule.bonusRate / 100)).toFixed(2));
    }
  }
  const basePay = Number((rule.basePayAllocation ?? 0).toFixed(2));
  const totalPayout = Number((commission + bonus + basePay).toFixed(2));
  return { commission, bonus, basePay, totalPayout };
};

export type TargetRiskStatus = "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "CRITICAL" | "ACHIEVED" | "EXCEEDED" | "CLOSED";
export interface TargetPerformanceInput {
  officialTarget: number;
  actual: number;
  commitment?: number;
  periodStart: Date;
  periodEnd: Date;
  now?: Date;
  overachievementThreshold?: number;
  compensationRule?: CompensationRuleConfig;
}
export const calculateTargetPerformance = (input: TargetPerformanceInput) => {
  const now = input.now ?? new Date();
  const target = Math.max(0, input.officialTarget);
  const actual = Math.max(0, input.actual);
  const progress = calculateTargetProgress(target, actual);
  const totalDays = Math.max(1, Math.ceil((input.periodEnd.getTime() - input.periodStart.getTime()) / 86400000) + 1);
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((Math.min(now.getTime(), input.periodEnd.getTime()) - input.periodStart.getTime()) / 86400000) + 1));
  const daysRemaining = Math.max(0, Math.ceil((input.periodEnd.getTime() - now.getTime()) / 86400000));
  const achievementPercentage = progress.achievementPercentage;
  const projectedPeriodRevenue = elapsedDays > 0 ? Number((actual / elapsedDays * totalDays).toFixed(2)) : 0;
  const projectedAchievementPercentage = percentage(projectedPeriodRevenue, target);
  const status: TargetRiskStatus = now < input.periodStart ? "NOT_STARTED" : now > input.periodEnd ? (achievementPercentage > (input.overachievementThreshold ?? 100) ? "EXCEEDED" : achievementPercentage >= 100 ? "ACHIEVED" : "CLOSED") : achievementPercentage > (input.overachievementThreshold ?? 100) ? "EXCEEDED" : achievementPercentage >= 100 ? "ACHIEVED" : projectedAchievementPercentage >= 100 ? "ON_TRACK" : projectedAchievementPercentage >= 75 ? "AT_RISK" : "CRITICAL";
  const payout = calculateCompensationPayout(input.compensationRule, actual, target);

  return {
    ...progress,
    officialTarget: target,
    actualAchievement: actual,
    employeeCommitment: input.commitment ?? null,
    remainingOfficialTarget: progress.remainingAmount,
    remainingCommitment: input.commitment == null ? null : Math.max(input.commitment - actual, 0),
    daysRemaining,
    requiredDailyRunRate: daysRemaining > 0 ? Number((progress.remainingAmount / daysRemaining).toFixed(2)) : 0,
    requiredWeeklyRunRate: daysRemaining > 0 ? Number((progress.remainingAmount / Math.max(1, Math.ceil(daysRemaining / 7))).toFixed(2)) : 0,
    currentDailyRunRate: elapsedDays > 0 ? Number((actual / elapsedDays).toFixed(2)) : 0,
    projectedPeriodRevenue,
    projectedAchievementPercentage,
    paceGap: Number((actual - target * elapsedDays / totalDays).toFixed(2)),
    status,
    payout,
  };
};
export const weightedPipelineValue = (items: readonly { estimatedValue: number; probability: number }[]): number => Number(items.reduce((sum, item) => sum + Math.max(0, item.estimatedValue) * Math.min(100, Math.max(0, item.probability)) / 100, 0).toFixed(2));

export interface OpportunityInputs { leadDemandScore: number; coverageGapScore: number; customerWhiteSpaceScore: number; pipelinePotentialScore: number; growthScore: number; conversionPotentialScore: number }
export interface OpportunityWeights { demand: number; coverageGap: number; customerWhiteSpace: number; pipelinePotential: number; growth: number; conversionPotential: number }
const clamp = (value: number) => Math.min(100, Math.max(0, value));
export const calculateOpportunityScore = (input: OpportunityInputs, weights: OpportunityWeights) => {
  const pairs: [number, number][] = [[input.leadDemandScore, weights.demand], [input.coverageGapScore, weights.coverageGap], [input.customerWhiteSpaceScore, weights.customerWhiteSpace], [input.pipelinePotentialScore, weights.pipelinePotential], [input.growthScore, weights.growth], [input.conversionPotentialScore, weights.conversionPotential]];
  const totalWeight = pairs.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0) || 1;
  const score = Number((pairs.reduce((sum, [value, weight]) => sum + clamp(value) * Math.max(0, weight), 0) / totalWeight).toFixed(2));
  const band = score <= 30 ? "LOW" : score <= 60 ? "MEDIUM" : score <= 80 ? "HIGH" : "CRITICAL";
  return { opportunityScore: score, opportunityBand: band as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };
};
export const calculateEstimatedOpportunityLost = (delayedLeads: number, healthyConversionRate: number, delayedConversionRate: number, averageDealValue: number) => {
  const estimatedLostConversions = Math.max(0, delayedLeads) * Math.max(0, healthyConversionRate - delayedConversionRate) / 100;
  return { estimatedLostConversions: Number(estimatedLostConversions.toFixed(2)), estimatedOpportunityLost: Number((estimatedLostConversions * Math.max(0, averageDealValue)).toFixed(2)), isEstimate: true as const };
};
