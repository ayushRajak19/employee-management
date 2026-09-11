import { Employee } from "../models/Employee.js";
import { Department } from "../models/Department.js";
import { Task } from "../models/Task.js";
import { EmployeeSkill } from "../models/EmployeeSkill.js";
import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js";
import { workload } from "./developmentService.js";
import { getViewerHierarchyScope } from "./hierarchyService.js";
import type { RoleName } from "@mobius-ems/shared";

export const dashboardSummary = async (viewer: { id: string; name: string; role: string }) => {
  const scope = await getViewerHierarchyScope(viewer as { id: string; role: RoleName });
  const ids = scope.allowedEmployeeIds;
  const subordinateIds = scope.subordinateEmployeeIds;
  const now = new Date();

  const [
    scopedEmployees,
    employeeCount,
    activeEmployees,
    departments,
    openTasks,
    overdueTasks,
    pendingSkills,
    snapshots,
    deadlines,
    load,
    employeeProfile,
    subordinates,
    subordinateTasks,
  ] = await Promise.all([
    Employee.find({ _id: { $in: ids } }).select("firstName lastName employeeId").lean(),
    Employee.countDocuments({ _id: { $in: ids } }),
    Employee.countDocuments({ _id: { $in: ids }, status: "ACTIVE" }),
    Department.countDocuments({ isActive: true }),
    Task.countDocuments({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] } }),
    Task.countDocuments({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] }, deadline: { $lt: now } }),
    EmployeeSkill.countDocuments({ employee: { $in: ids }, verificationStatus: { $in: ["PENDING", "REVIEW_REQUIRED"] }, isActive: true }),
    PerformanceSnapshot.aggregate([
      { $match: { employee: { $in: ids } } },
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: "$employee", latest: { $first: "$$ROOT" } } },
    ]),
    Task.find({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] }, deadline: { $gte: now } })
      .populate("assignedEmployee", "firstName lastName")
      .sort({ deadline: 1 })
      .limit(6)
      .lean(),
    workload(viewer),
    viewer.role === "EMPLOYEE"
      ? Employee.findOne({ user: viewer.id, isActive: true })
          .select("status employmentType department designation")
          .populate("department", "name code")
          .populate("designation", "name code")
          .lean()
      : Promise.resolve(null),
    subordinateIds.length > 0
      ? Employee.find({ _id: { $in: subordinateIds }, isActive: true })
          .select("firstName lastName employeeId status profilePhotoKey department designation team")
          .populate("department designation team", "name code")
          .sort({ firstName: 1 })
          .lean()
      : Promise.resolve([]),
    subordinateIds.length > 0
      ? Task.find({ assignedEmployee: { $in: subordinateIds }, isActive: true, status: { $ne: "CANCELLED" } })
          .populate("assignedEmployee", "firstName lastName employeeId profilePhotoKey")
          .populate("project", "name code")
          .populate("reviewer", "firstName lastName employeeId")
          .sort({ deadline: 1, createdAt: -1 })
          .limit(50)
          .lean()
      : Promise.resolve([]),
  ]);

  const rankableLatest = snapshots.filter(
    (item) => item.latest.classification !== "Insufficient Evidence" && item.latest.components.some((c: { weight?: number }) => (c.weight ?? 0) > 0),
  );
  const averagePerformance = rankableLatest.length
    ? Math.round(rankableLatest.reduce((sum, item) => sum + item.latest.totalScore, 0) / rankableLatest.length)
    : 0;
  const roleMatches = rankableLatest.flatMap((item) =>
    item.latest.components
      .filter((c: { key: string; weight?: number }) => c.key === "verifiedSkills" && (c.weight ?? 0) > 0)
      .map((c: { rawScore: number }) => c.rawScore),
  );
  const averageRoleMatch = roleMatches.length ? Math.round(roleMatches.reduce((a, b) => a + b, 0) / roleMatches.length) : 0;
  const latestIds = snapshots.map((item) => item.latest._id);
  const populatedSnapshots = await PerformanceSnapshot.find({ _id: { $in: latestIds } })
    .populate("employee", "firstName lastName employeeId")
    .sort({ totalScore: -1 })
    .lean();
  const sufficientSnapshots = populatedSnapshots.filter(
    (item) => item.classification !== "Insufficient Evidence" && item.components.some((c) => (c.weight ?? 0) > 0),
  );
  const snapshotByEmployee = new Map(populatedSnapshots.map((item) => [item.employee._id.toString(), item]));
  const evidenceAttention = scopedEmployees.flatMap((employee) => {
    const snapshot = snapshotByEmployee.get(employee._id.toString());
    if (snapshot && snapshot.classification !== "Insufficient Evidence") return [];
    return [
      {
        employee,
        status: snapshot ? ("INSUFFICIENT_EVIDENCE" as const) : ("NOT_CALCULATED" as const),
        action: snapshot ? "Add reviewed work, goals, KPIs or verified skills" : "Calculate a snapshot after evidence is recorded",
      },
    ];
  });

  // Build subordinate work breakdown for superiors
  const isSuperior = viewer.role !== "EMPLOYEE";
  const subordinateSummary = subordinates.map((sub) => {
    const empTasks = subordinateTasks.filter(
      (t) => (t.assignedEmployee as unknown as { _id: { toString(): string } })._id.toString() === sub._id.toString(),
    );
    return {
      _id: sub._id.toString(),
      firstName: sub.firstName,
      lastName: sub.lastName,
      employeeId: sub.employeeId,
      status: sub.status,
      profilePhotoKey: sub.profilePhotoKey,
      department: sub.department as unknown as { name: string; code: string } | undefined,
      designation: sub.designation as unknown as { name: string; code: string } | undefined,
      team: sub.team as unknown as { name: string; code: string } | undefined,
      openTasksCount: empTasks.filter((t) => t.status !== "COMPLETED").length,
      inProgressCount: empTasks.filter((t) => t.status === "IN_PROGRESS").length,
      inReviewCount: empTasks.filter((t) => t.status === "IN_REVIEW").length,
      blockedCount: empTasks.filter((t) => t.status === "BLOCKED").length,
      overdueCount: empTasks.filter((t) => t.status !== "COMPLETED" && t.deadline && new Date(t.deadline) < now).length,
    };
  });

  const subordinateWork = {
    isSuperior,
    scopeType: scope.scopeType,
    subordinates: subordinateSummary,
    tasks: subordinateTasks.map((task) => ({
      _id: task._id.toString(),
      taskId: task.taskId,
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      startDate: task.startDate,
      actualHours: task.actualHours,
      estimatedHours: task.estimatedHours,
      project: task.project as unknown as { _id: string; name: string; code: string } | undefined,
      assignedEmployee: task.assignedEmployee as unknown as {
        _id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
        profilePhotoKey?: string;
      },
      reviewer: task.reviewer as unknown as {
        _id: string;
        firstName: string;
        lastName: string;
        employeeId: string;
      } | undefined,
      blocker: task.blocker,
    })),
    metrics: {
      totalSubordinates: subordinates.length,
      activeTasks: subordinateTasks.filter((t) => t.status !== "COMPLETED").length,
      inProgressTasks: subordinateTasks.filter((t) => t.status === "IN_PROGRESS").length,
      inReviewTasks: subordinateTasks.filter((t) => t.status === "IN_REVIEW").length,
      blockedTasks: subordinateTasks.filter((t) => t.status === "BLOCKED").length,
      overdueTasks: subordinateTasks.filter((t) => t.status !== "COMPLETED" && t.deadline && new Date(t.deadline) < now).length,
    },
  };

  return {
    greetingName: viewer.name.split(" ")[0],
    employeeProfile,
    metrics: [
      { label: "Total employees", value: employeeCount, detail: `${activeEmployees} active in your scope` },
      { label: "Open tasks", value: openTasks, detail: `${overdueTasks} overdue` },
      { label: "Pending verifications", value: pendingSkills, detail: "Evidence awaiting a decision" },
      {
        label: "Average performance",
        value: rankableLatest.length ? `${averagePerformance}%` : "—",
        detail: rankableLatest.length
          ? roleMatches.length
            ? `${averageRoleMatch}% average verified role match`
            : "No verified role-skill evidence"
          : "No sufficient evidence yet",
      },
    ],
    performanceEvidence: {
      state: sufficientSnapshots.length ? "RANKED" : evidenceAttention.length ? "ACTION_REQUIRED" : "EMPTY",
      sufficientCount: sufficientSnapshots.length,
      totalEmployees: scopedEmployees.length,
      attentionCount: evidenceAttention.length,
      topPerformers: sufficientSnapshots.slice(0, 5).map((item) => ({ employee: item.employee, score: item.totalScore, classification: item.classification })),
      attention: evidenceAttention.slice(0, 5),
    },
    // Kept temporarily for older clients; insufficient snapshots are never rankings.
    topPerformers: sufficientSnapshots.slice(0, 5).map((item) => ({ employee: item.employee, score: item.totalScore, classification: item.classification })),
    upcomingDeadlines: deadlines.map((task) => ({ id: task._id.toString(), name: task.name, deadline: task.deadline, priority: task.priority, employee: task.assignedEmployee })),
    workloadAttention: load.filter((item) => ["HIGH_WORKLOAD", "OVERLOADED"].includes(item.classification)).slice(0, 5),
    needsAttention: populatedSnapshots
      .filter((item) => item.totalScore < 55)
      .slice(0, 5)
      .map((item) => ({ employee: item.employee, score: item.totalScore, developmentAreas: item.developmentAreas.slice(0, 2) })),
    departments,
    subordinateWork,
  };
};
