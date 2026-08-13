import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { Goal, type GoalDocument } from "../models/Goal.js";
import { KPI } from "../models/KPI.js";
import { EmployeeKPI } from "../models/EmployeeKPI.js";
import { EmployeeTraining } from "../models/EmployeeTraining.js";
import { SkillVerification } from "../models/SkillVerification.js";
import { PerformanceReview } from "../models/PerformanceReview.js";
import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js";
import { PerformanceTemplate, type PerformanceTemplateDocument } from "../models/PerformanceTemplate.js";
import { Task } from "../models/Task.js";
import { roleGap } from "./skillService.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { boundedAchievement, classifyPerformance, onTimeRate } from "./performanceMath.js";

type Viewer = { id: string; role: string };
type PeriodType = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "ANNUAL";
type AnalyticsInput = { period: string; periodType: PeriodType; department?: string };

const employeeScope = async (viewer: Viewer) => {
  if (!["EMPLOYEE", "MANAGER"].includes(viewer.role)) return {};
  const own = await Employee.findOne({ user: viewer.id }).select("_id");
  return viewer.role === "EMPLOYEE" ? { _id: own?._id } : { $or: [{ _id: own?._id }, { reportingManager: own?._id }] };
};

export const periodBounds = (period: string, type: PeriodType): { start: Date; end: Date } => {
  let year: number;
  let startMonth: number;
  let months: number;
  if (type === "MONTHLY") {
    const match = /^(\d{4})-(\d{2})$/.exec(period); if (!match) throw new AppError("Monthly period must use YYYY-MM", 422);
    year = Number(match[1]); startMonth = Number(match[2]) - 1; months = 1;
    if (startMonth < 0 || startMonth > 11) throw new AppError("Monthly period contains an invalid month", 422);
  } else if (type === "QUARTERLY") {
    const match = /^(\d{4})-Q([1-4])$/.exec(period); if (!match) throw new AppError("Quarterly period must use YYYY-Q1 to YYYY-Q4", 422);
    year = Number(match[1]); startMonth = (Number(match[2]) - 1) * 3; months = 3;
  } else if (type === "HALF_YEARLY") {
    const match = /^(\d{4})-H([1-2])$/.exec(period); if (!match) throw new AppError("Half-year period must use YYYY-H1 or YYYY-H2", 422);
    year = Number(match[1]); startMonth = (Number(match[2]) - 1) * 6; months = 6;
  } else {
    const match = /^(\d{4})$/.exec(period); if (!match) throw new AppError("Annual period must use YYYY", 422);
    year = Number(match[1]); startMonth = 0; months = 12;
  }
  return { start: new Date(Date.UTC(year, startMonth, 1)), end: new Date(Date.UTC(year, startMonth + months, 1)) };
};

export const listGoals = async (viewer: Viewer) => { const employees = await Employee.find(await employeeScope(viewer)).distinct("_id"); return Goal.find({ employee: { $in: employees }, isActive: true }).populate("employee", "firstName lastName employeeId").sort({ endDate: 1 }).lean(); };
export const createGoal = async (input: Omit<GoalDocument, "createdBy" | "isActive">, actor: string) => { if (!await Employee.exists({ _id: input.employee, isActive: true })) throw new AppError("Employee not found", 404); return Goal.create({ ...input, createdBy: actor }); };
export const listKpis = async () => KPI.find({ isActive: true }).populate("department", "name").populate("role", "name").sort({ period: -1, name: 1 }).lean();
export const createKpi = async (input: Parameters<typeof KPI.create>[0]) => KPI.create(input);
export const evaluateKpi = async (kpiId: string, input: { employee: string; period: string; actual: number; comment?: string }, actor: string) => { const kpi = await KPI.findById(kpiId); if (!kpi) throw new AppError("KPI not found", 404); const achievement = boundedAchievement(input.actual, kpi.target); return EmployeeKPI.findOneAndUpdate({ employee: input.employee, kpi: kpi._id, period: input.period }, { $set: { actual: input.actual, achievement, evaluatedBy: actor, comment: input.comment } }, { upsert: true, new: true, runValidators: true }); };
export const listReviews = async (viewer: Viewer) => { const employees = await Employee.find(await employeeScope(viewer)).distinct("_id"); return PerformanceReview.find({ employee: { $in: employees } }).populate("employee", "firstName lastName employeeId").populate("reviewer", "name").sort({ reviewDate: -1 }).lean(); };
export const createReview = async (input: { employee: string; type: string; period: string; ratings: { category: string; rating: number; comment?: string }[]; comments?: string; employeeResponse?: string }, actor: string) => { const finalRating = Number((input.ratings.reduce((sum, item) => sum + item.rating, 0) / input.ratings.length).toFixed(2)); return PerformanceReview.create({ ...input, reviewer: actor, finalRating, reviewDate: new Date() }); };

const defaultWeights = { taskQuality: 25, onTimeDelivery: 20, kpiAchievement: 20, verifiedSkills: 15, goalAchievement: 10, learningGrowth: 10 };
const defaultThresholds = { exceptional: 90, strong: 80, consistent: 70, developing: 55 };

export const calculateSnapshot = async (input: { employee: string; period: string; periodType: PeriodType }, actor: string) => {
  const employee = await Employee.findOne({ _id: input.employee, isActive: true }); if (!employee) throw new AppError("Employee not found", 404);
  const { start, end } = periodBounds(input.period, input.periodType);
  const user = await User.findById(employee.user);
  const template = await PerformanceTemplate.findOne({ isActive: true, $or: [{ role: user?.role, department: employee.department }, { role: user?.role }, { department: employee.department }, { isDefault: true }] }).sort({ role: -1, department: -1 });
  const configuredWeights = template?.weights ?? defaultWeights; const thresholds = template?.thresholds ?? defaultThresholds;
  const [tasks, kpis, goals, skillGap, assignedTraining, completedTraining, skillVerificationHistory] = await Promise.all([
    Task.find({ assignedEmployee: employee._id, isActive: true, status: "COMPLETED", completionDate: { $gte: start, $lt: end } }).lean(),
    EmployeeKPI.find({ employee: employee._id, period: input.period }).lean(),
    Goal.find({ employee: employee._id, period: input.period, isActive: true }).lean(),
    roleGap(employee.id, employee.designation.toString()),
    EmployeeTraining.countDocuments({ employee: employee._id, createdAt: { $gte: start, $lt: end } }),
    EmployeeTraining.countDocuments({ employee: employee._id, status: "COMPLETED", completedAt: { $gte: start, $lt: end } }),
    SkillVerification.find({ employee: employee._id, status: { $in: ["VERIFIED", "EXPERT_VERIFIED"] }, verificationDate: { $lt: end }, verifiedRating: { $exists: true } }).sort({ verificationDate: 1 }).lean()
  ]);

  const rated = tasks.filter((task) => task.qualityRating !== undefined);
  const quality = rated.length ? rated.reduce((sum, task) => sum + (task.qualityRating ?? 0), 0) / rated.length * 20 : 0;
  const onTime = onTimeRate(tasks);
  const kpi = kpis.length ? kpis.reduce((sum, item) => sum + Math.min(100, item.achievement), 0) / kpis.length : 0;
  const goal = goals.length ? goals.reduce((sum, item) => sum + item.progress, 0) / goals.length : 0;
  const growthParts: number[] = [];
  if (assignedTraining || completedTraining) growthParts.push(Math.min(100, completedTraining / Math.max(assignedTraining, completedTraining) * 100));
  const priorSkillRatings = new Map<string, number>(); const skillGrowthScores: number[] = [];
  for (const verification of skillVerificationHistory) {
    const rating = verification.verifiedRating; if (rating === undefined) continue;
    const key = verification.employeeSkill.toString(); const prior = priorSkillRatings.get(key);
    if (verification.verificationDate >= start) skillGrowthScores.push(prior === undefined ? rating * 10 : safeScore(50 + (rating - prior) * 10));
    priorSkillRatings.set(key, rating);
  }
  if (skillGrowthScores.length) growthParts.push(skillGrowthScores.reduce((sum, score) => sum + score, 0) / skillGrowthScores.length);
  const learningGrowth = growthParts.length ? growthParts.reduce((sum, value) => sum + value, 0) / growthParts.length : 0;
  const raw = { taskQuality: quality, onTimeDelivery: onTime, kpiAchievement: kpi, verifiedSkills: skillGap.roleMatch, goalAchievement: goal, learningGrowth };
  const available = { taskQuality: rated.length > 0, onTimeDelivery: tasks.length > 0, kpiAchievement: kpis.length > 0, verifiedSkills: skillGap.items.length > 0, goalAchievement: goals.length > 0, learningGrowth: growthParts.length > 0 };
  const labels = { taskQuality: "Task quality", onTimeDelivery: "On-time delivery", kpiAchievement: "KPI achievement", verifiedSkills: "Verified role skills", goalAchievement: "Goal achievement", learningGrowth: "Learning & growth" };
  const explanations = { taskQuality: rated.length ? `${quality.toFixed(0)}% from ${rated.length} reviewed tasks completed in ${input.period}` : "No reviewed tasks completed in this period; excluded", onTimeDelivery: tasks.length ? `${onTime.toFixed(0)}% of ${tasks.length} period completions were on time` : "No completed tasks in this period; excluded", kpiAchievement: kpis.length ? `${kpi.toFixed(0)}% average from ${kpis.length} evaluated KPIs` : "No KPI evaluations in this period; excluded", verifiedSkills: skillGap.items.length ? `${skillGap.roleMatch}% verified match across ${skillGap.items.length} required role skills` : "No required skill catalogue; excluded", goalAchievement: goals.length ? `${goal.toFixed(0)}% average progress across ${goals.length} goals` : "No goals in this period; excluded", learningGrowth: growthParts.length ? `${completedTraining} training completions, ${assignedTraining} period assignments and ${skillGrowthScores.length} verified skill changes` : "No verified learning evidence in this period; excluded" };
  const keys = Object.keys(raw) as (keyof typeof raw)[];
  const availableWeight = keys.reduce((sum, key) => sum + (available[key] ? configuredWeights[key] : 0), 0);
  const components = keys.map((key) => { const weight = available[key] && availableWeight ? configuredWeights[key] / availableWeight * 100 : 0; return { key, label: labels[key], rawScore: Number(raw[key].toFixed(2)), weight: Number(weight.toFixed(2)), weightedScore: Number((raw[key] * weight / 100).toFixed(2)), explanation: explanations[key] }; });
  const totalScore = Number(components.reduce((sum, item) => sum + item.weightedScore, 0).toFixed(2));
  const classification = availableWeight ? classifyPerformance(totalScore, thresholds) : "Insufficient Evidence";
  const strengths = components.filter((item) => item.weight > 0 && item.rawScore >= 85).map((item) => `${item.label}: ${item.rawScore}%`);
  const developmentAreas = components.filter((item) => item.weight > 0 && item.rawScore < 60).map((item) => `${item.label}: ${item.rawScore}% with recorded evidence`);
  const snapshot = await PerformanceSnapshot.findOneAndUpdate({ employee: employee._id, period: input.period, periodType: input.periodType }, { $set: { totalScore, classification, components, strengths, developmentAreas, calculatedBy: actor, calculatedAt: new Date() } }, { upsert: true, new: true, runValidators: true });
  await writeAudit({ user: actor, action: "PERFORMANCE_SNAPSHOT_CALCULATED", entityType: "PerformanceSnapshot", entityId: snapshot.id, newValue: { employee: employee.employeeId, period: input.period, totalScore, classification } });
  return snapshot;
};

export const snapshots = async (viewer: Viewer) => { const employees = await Employee.find(await employeeScope(viewer)).distinct("_id"); return PerformanceSnapshot.find({ employee: { $in: employees } }).populate("employee", "firstName lastName employeeId designation department").sort({ calculatedAt: -1 }).lean(); };

const average = (values: number[]) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : null;
const safeScore = (value: number) => Math.max(0, Math.min(100, value));

export const performanceAnalytics = async (input: AnalyticsInput, viewer: Viewer) => {
  const { start, end } = periodBounds(input.period, input.periodType);
  const scope = await employeeScope(viewer);
  const employeeFilter = { ...scope, isActive: true, ...(input.department ? { department: input.department } : {}) };
  const employees = await Employee.find(employeeFilter).populate("department", "name").select("firstName lastName employeeId department").lean();
  const ids = employees.map((item) => item._id);
  const [selected, historical, kpis, goals, tasks] = await Promise.all([
    PerformanceSnapshot.find({ employee: { $in: ids }, period: input.period, periodType: input.periodType }).lean(),
    PerformanceSnapshot.find({ employee: { $in: ids }, periodType: input.periodType }).sort({ period: 1 }).lean(),
    EmployeeKPI.find({ employee: { $in: ids }, period: input.period }).lean(),
    Goal.find({ employee: { $in: ids }, period: input.period, isActive: true }).lean(),
    Task.find({ assignedEmployee: { $in: ids }, isActive: true, status: "COMPLETED", completionDate: { $gte: start, $lt: end } }).select("assignedEmployee qualityRating deadline completionDate").lean()
  ]);
  const selectedMap = new Map(selected.map((item) => [item.employee.toString(), item]));
  const previousMap = new Map<string, typeof historical[number]>();
  for (const item of historical) if (item.period < input.period) previousMap.set(item.employee.toString(), item);
  const valuesByEmployee = <T extends { employee: { toString(): string } }>(items: T[]) => { const result = new Map<string, T[]>(); for (const item of items) { const key = item.employee.toString(); const list = result.get(key) ?? []; list.push(item); result.set(key, list); } return result; };
  const kpiMap = valuesByEmployee(kpis); const goalMap = valuesByEmployee(goals); const taskMap = new Map<string, typeof tasks>();
  for (const task of tasks) { const key = task.assignedEmployee.toString(); const list = taskMap.get(key) ?? []; list.push(task); taskMap.set(key, list); }
  const rows = employees.map((employee) => {
    const key = employee._id.toString(); const snapshot = selectedMap.get(key); const previous = previousMap.get(key); const employeeKpis = kpiMap.get(key) ?? []; const employeeGoals = goalMap.get(key) ?? []; const employeeTasks = taskMap.get(key) ?? []; const rated = employeeTasks.filter((item) => item.qualityRating !== undefined);
    const department = employee.department as unknown as { _id: { toString(): string }; name: string } | null;
    return { employee: { _id: key, firstName: employee.firstName, lastName: employee.lastName, employeeId: employee.employeeId }, department: { _id: department?._id.toString() ?? "", name: department?.name ?? "Unassigned" }, score: snapshot?.totalScore ?? null, classification: snapshot?.classification ?? "Not calculated", scoreChange: snapshot && previous ? Number((snapshot.totalScore - previous.totalScore).toFixed(1)) : null, kpiAchievement: average(employeeKpis.map((item) => safeScore(item.achievement))), goalProgress: average(employeeGoals.map((item) => item.progress)), onTimeDelivery: average(employeeTasks.length ? [onTimeRate(employeeTasks)] : []), taskQuality: average(rated.map((item) => (item.qualityRating ?? 0) * 20)), learningGrowth: snapshot?.components.find((item) => item.key === "learningGrowth" && item.weight > 0)?.rawScore ?? null, completedTasks: employeeTasks.length };
  });
  const trendMap = new Map<string, number[]>(); for (const item of historical) { const list = trendMap.get(item.period) ?? []; list.push(item.totalScore); trendMap.set(item.period, list); }
  const departmentMap = new Map<string, typeof rows>(); for (const row of rows) { const list = departmentMap.get(row.department.name) ?? []; list.push(row); departmentMap.set(row.department.name, list); }
  const componentMap = new Map<string, { label: string; values: number[] }>(); for (const item of selected) for (const component of item.components) if (component.weight > 0) { const entry = componentMap.get(component.key) ?? { label: component.label, values: [] }; entry.values.push(component.rawScore); componentMap.set(component.key, entry); }
  const scoredRows = rows.filter((row): row is typeof row & { score: number } => row.score !== null);
  const scoreChanges = scoredRows.flatMap((row) => row.scoreChange === null ? [] : [row.scoreChange]);
  return {
    period: input.period,
    generatedAt: new Date(),
    summary: { employees: rows.length, snapshots: scoredRows.length, coverage: rows.length ? Number((scoredRows.length / rows.length * 100).toFixed(1)) : 0, averagePerformance: average(scoredRows.map((row) => row.score)), averageKpiAchievement: average(rows.flatMap((row) => row.kpiAchievement === null ? [] : [row.kpiAchievement])), averageGoalProgress: average(rows.flatMap((row) => row.goalProgress === null ? [] : [row.goalProgress])), onTimeDelivery: average(rows.flatMap((row) => row.onTimeDelivery === null ? [] : [row.onTimeDelivery])), taskQuality: average(rows.flatMap((row) => row.taskQuality === null ? [] : [row.taskQuality])), learningGrowth: average(rows.flatMap((row) => row.learningGrowth === null ? [] : [row.learningGrowth])), performanceGrowth: average(scoreChanges), completedTasks: tasks.length, kpiEvaluations: kpis.length, goals: goals.length },
    trend: [...trendMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([period, values]) => ({ period, average: average(values), snapshots: values.length })),
    departments: [...departmentMap.entries()].map(([name, items]) => ({ name, employees: items.length, coverage: items.length ? Number((items.filter((item) => item.score !== null).length / items.length * 100).toFixed(1)) : 0, performance: average(items.flatMap((item) => item.score === null ? [] : [item.score])), kpi: average(items.flatMap((item) => item.kpiAchievement === null ? [] : [item.kpiAchievement])), goals: average(items.flatMap((item) => item.goalProgress === null ? [] : [item.goalProgress])), delivery: average(items.flatMap((item) => item.onTimeDelivery === null ? [] : [item.onTimeDelivery])), growth: average(items.flatMap((item) => item.learningGrowth === null ? [] : [item.learningGrowth])) })).sort((a, b) => (b.performance ?? -1) - (a.performance ?? -1)),
    components: [...componentMap.values()].map((item) => ({ label: item.label, average: average(item.values), evidenceCount: item.values.length })),
    classifications: [...selected.reduce<Map<string, number>>((map, item) => map.set(item.classification, (map.get(item.classification) ?? 0) + 1), new Map()).entries()].map(([name, value]) => ({ name, value })),
    topPerformers: [...scoredRows].sort((a, b) => b.score - a.score).slice(0, 8),
    needsAttention: rows.filter((row) => row.score === null || row.score < 55 || (row.scoreChange !== null && row.scoreChange <= -10)).sort((a, b) => (a.score ?? -1) - (b.score ?? -1)).slice(0, 8)
  };
};

export const calculateAllSnapshots = async (input: AnalyticsInput, viewer: Viewer) => {
  const scope = await employeeScope(viewer); const employees = await Employee.find({ ...scope, isActive: true, ...(input.department ? { department: input.department } : {}) }).select("_id firstName lastName").lean();
  const failures: { employee: string; reason: string }[] = []; let calculated = 0;
  for (const employee of employees) { try { await calculateSnapshot({ employee: employee._id.toString(), period: input.period, periodType: input.periodType }, viewer.id); calculated += 1; } catch (error) { failures.push({ employee: `${employee.firstName} ${employee.lastName}`, reason: error instanceof Error ? error.message : "Calculation failed" }); } }
  return { requested: employees.length, calculated, failed: failures.length, failures };
};

export const saveTemplate = async (input: Omit<PerformanceTemplateDocument, "isActive">) => { const total = Object.values(input.weights as Record<string, number>).reduce((sum, value) => sum + value, 0); if (total !== 100) throw new AppError("Performance weights must total 100", 422); return PerformanceTemplate.create(input); };
