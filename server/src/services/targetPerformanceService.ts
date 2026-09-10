import type { SessionUser } from "@mobius-ems/shared";
import { EmployeeTargetCommitment } from "../models/EmployeeTargetCommitment.js";
import { SalesRevenueTransaction } from "../models/SalesRevenueTransaction.js";
import { SalesTarget } from "../models/SalesTarget.js";
import { resolveSalesScope } from "./salesScopeService.js";
import { calculateTargetPerformance } from "./salesMath.js";
import { getTargetReminderStatus } from "./targetReminderService.js";
import { AppError } from "../utils/AppError.js";

const targetFilter = (scope: Awaited<ReturnType<typeof resolveSalesScope>>) => ({
  employee: { $in: scope.allowedEmployeeIds },
  status: { $in: ["ACTIVE", "CLOSED"] },
  isLatest: { $ne: false },
});

export const targetPerformance = async (viewer: SessionUser, team = false) => {
  const scope = await resolveSalesScope(viewer);
  if (!team && scope.employeeId) {
    scope.allowedEmployeeIds = scope.allowedEmployeeIds.filter((id) => id.toString() === scope.employeeId);
  }
  const targets = await SalesTarget.find(targetFilter(scope))
    .sort({ periodStart: -1 })
    .populate("employee", "firstName lastName employeeId")
    .lean();

  return Promise.all(
    targets.map(async (target) => {
      const employeeId = (target.employee as { _id?: unknown })._id ?? target.employee;
      const effectiveStart = target.effectiveFrom ?? target.periodStart;
      const effectiveEnd = target.effectiveTo ?? target.periodEnd;
      const actual = (
        await SalesRevenueTransaction.aggregate([
          {
            $match: {
              employee: employeeId,
              transactionDate: { $gte: target.periodStart, $lte: target.periodEnd },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
      )[0]?.total ?? 0;

      const commitment = await EmployeeTargetCommitment.findOne({ target: target._id, employee: employeeId })
        .sort({ version: -1 })
        .lean();

      const performance = calculateTargetPerformance({
        officialTarget: target.revenueTarget,
        actual,
        commitment: commitment?.committedRevenue,
        periodStart: target.periodStart,
        periodEnd: target.periodEnd,
        compensationRule: target.compensationRule,
      });

      const reminderSummary = await getTargetReminderStatus(target._id.toString());

      return {
        target: {
          ...target,
          version: target.version ?? 1,
          effectiveFrom: effectiveStart,
          effectiveTo: effectiveEnd,
        },
        performance,
        commitment,
        reminderStatus: reminderSummary,
      };
    }),
  );
};

export const targetPerformanceForVersion = async (viewer: SessionUser, targetId: string) => {
  const scope = await resolveSalesScope(viewer);
  const target = await SalesTarget.findOne({
    _id: targetId,
    employee: { $in: scope.allowedEmployeeIds },
  })
    .populate("employee", "firstName lastName employeeId")
    .lean();
  if (!target) throw new AppError("Target version not found", 404);

  const employeeId = (target.employee as { _id?: unknown })._id ?? target.employee;
  const effectiveStart = target.effectiveFrom ?? target.periodStart;
  const effectiveEnd = target.effectiveTo ?? target.periodEnd;

  const actual = (
    await SalesRevenueTransaction.aggregate([
      {
        $match: {
          employee: employeeId,
          transactionDate: { $gte: effectiveStart, $lte: effectiveEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
  )[0]?.total ?? 0;

  const performance = calculateTargetPerformance({
    officialTarget: target.revenueTarget,
    actual,
    periodStart: target.periodStart,
    periodEnd: target.periodEnd,
    compensationRule: target.compensationRule,
  });

  return {
    target: {
      ...target,
      version: target.version ?? 1,
      effectiveFrom: effectiveStart,
      effectiveTo: effectiveEnd,
    },
    performance,
  };
};
export const commitToTarget = async (viewer: SessionUser, targetId: string, body: { committedRevenue?: number; note?: string }) => {
  const scope = await resolveSalesScope(viewer); if (!scope.employeeId) throw new AppError("Only employees can submit commitments", 403);
  const target = await SalesTarget.findOne({ _id: targetId, employee: scope.employeeId }); if (!target) throw new AppError("Target not found", 404);
  const version = ((await EmployeeTargetCommitment.findOne({ target: targetId, employee: scope.employeeId }).sort({ version: -1 }).lean())?.version ?? 0) + 1;
  return EmployeeTargetCommitment.create({ target: targetId, employee: scope.employeeId, ...body, version, submittedAt: new Date(), status: "SUBMITTED" });
};
