export interface CapacityMetrics { currentLeadLoad: number; configuredLeadCapacity: number; requiredHeadcount: number; activeHeadcount: number; headcountGap: number; capacityUtilization: number; coveragePercentage: number }
export const calculateCapacity = (leadCount: number, activeHeadcount: number, capacityPerEmployee: number): CapacityMetrics => {
  const load = Math.max(0, leadCount); const headcount = Math.max(0, activeHeadcount); const capacity = Math.max(1, capacityPerEmployee);
  const requiredHeadcount = Math.ceil(load / capacity);
  return { currentLeadLoad: load, configuredLeadCapacity: capacity, requiredHeadcount, activeHeadcount: headcount, headcountGap: Math.max(0, requiredHeadcount - headcount), capacityUtilization: headcount ? Number((load / (headcount * capacity) * 100).toFixed(2)) : load ? 100 : 0, coveragePercentage: requiredHeadcount ? Number((Math.min(1, headcount / requiredHeadcount) * 100).toFixed(2)) : 100 };
};
export const percentage = (numerator: number, denominator: number): number => denominator > 0 ? Number((numerator / denominator * 100).toFixed(2)) : 0;
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
