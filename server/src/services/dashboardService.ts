import { Employee } from "../models/Employee.js";
import { Department } from "../models/Department.js";
import { Task } from "../models/Task.js";
import { EmployeeSkill } from "../models/EmployeeSkill.js";
import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js";
import { workload } from "./developmentService.js";

const visibleIds = async (viewer: { id: string; role: string }) => {
  if (!["EMPLOYEE", "MANAGER"].includes(viewer.role)) return Employee.find({ isActive: true }).distinct("_id");
  const own = await Employee.findOne({ user: viewer.id }).select("_id");
  return viewer.role === "EMPLOYEE"
    ? own ? [own._id] : []
    : Employee.find({ $or: [{ _id: own?._id }, { reportingManager: own?._id }], isActive: true }).distinct("_id");
};

export const dashboardSummary = async (viewer: { id: string; name: string; role: string }) => {
  const ids = await visibleIds(viewer);
  const now = new Date();
  const [employeeCount, activeEmployees, departments, openTasks, overdueTasks, pendingSkills, snapshots, deadlines, load, employeeProfile] = await Promise.all([
    Employee.countDocuments({ _id: { $in: ids } }),
    Employee.countDocuments({ _id: { $in: ids }, status: "ACTIVE" }),
    Department.countDocuments({ isActive: true }),
    Task.countDocuments({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] } }),
    Task.countDocuments({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] }, deadline: { $lt: now } }),
    EmployeeSkill.countDocuments({ employee: { $in: ids }, verificationStatus: { $in: ["PENDING", "REVIEW_REQUIRED"] }, isActive: true }),
    PerformanceSnapshot.aggregate([{ $match: { employee: { $in: ids } } }, { $sort: { calculatedAt: -1 } }, { $group: { _id: "$employee", latest: { $first: "$$ROOT" } } }]),
    Task.find({ assignedEmployee: { $in: ids }, status: { $nin: ["COMPLETED", "CANCELLED"] }, deadline: { $gte: now } }).populate("assignedEmployee", "firstName lastName").sort({ deadline: 1 }).limit(6).lean(),
    workload(viewer),
    viewer.role === "EMPLOYEE"
      ? Employee.findOne({ user: viewer.id, isActive: true }).select("status employmentType department designation").populate("department", "name code").populate("designation", "name code").lean()
      : Promise.resolve(null)
  ]);
  const averagePerformance = snapshots.length ? Math.round(snapshots.reduce((sum, item) => sum + item.latest.totalScore, 0) / snapshots.length) : 0;
  const roleMatches = snapshots.flatMap((item) => item.latest.components.filter((component: { key: string }) => component.key === "verifiedSkills").map((component: { rawScore: number }) => component.rawScore));
  const averageRoleMatch = roleMatches.length ? Math.round(roleMatches.reduce((a, b) => a + b, 0) / roleMatches.length) : 0;
  const latestIds = snapshots.map((item) => item.latest._id);
  const populatedSnapshots = await PerformanceSnapshot.find({ _id: { $in: latestIds } }).populate("employee", "firstName lastName employeeId").sort({ totalScore: -1 }).lean();
  return {
    greetingName: viewer.name.split(" ")[0],
    employeeProfile,
    metrics: [
      { label: "Total employees", value: employeeCount, detail: `${activeEmployees} active in your scope` },
      { label: "Open tasks", value: openTasks, detail: `${overdueTasks} overdue` },
      { label: "Pending verifications", value: pendingSkills, detail: "Evidence awaiting a decision" },
      { label: "Average performance", value: averagePerformance ? `${averagePerformance}%` : "—", detail: averagePerformance ? `${averageRoleMatch}% average verified role match` : "No snapshots yet" }
    ],
    topPerformers: populatedSnapshots.slice(0, 5).map((item) => ({ employee: item.employee, score: item.totalScore, classification: item.classification })),
    upcomingDeadlines: deadlines.map((task) => ({ id: task._id.toString(), name: task.name, deadline: task.deadline, priority: task.priority, employee: task.assignedEmployee })),
    workloadAttention: load.filter((item) => ["HIGH_WORKLOAD", "OVERLOADED"].includes(item.classification)).slice(0, 5),
    needsAttention: populatedSnapshots.filter((item) => item.totalScore < 55).slice(0, 5).map((item) => ({ employee: item.employee, score: item.totalScore, developmentAreas: item.developmentAreas.slice(0, 2) })),
    departments
  };
};
