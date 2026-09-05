import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Assessment } from "../models/Assessment.js";
import { AssessmentResult } from "../models/AssessmentResult.js";
import { Attendance } from "../models/Attendance.js";
import { AuditLog } from "../models/AuditLog.js";
import { AiEmployeeSummary } from "../models/AiEmployeeSummary.js";
import { DailyTodo } from "../models/DailyTodo.js";
import { Department } from "../models/Department.js";
import { Document } from "../models/Document.js";
import { Employee } from "../models/Employee.js";
import { EmployeeKPI } from "../models/EmployeeKPI.js";
import { EmployeeSkill } from "../models/EmployeeSkill.js";
import { EmployeeTimeline } from "../models/EmployeeTimeline.js";
import { EmployeeTraining } from "../models/EmployeeTraining.js";
import { Goal } from "../models/Goal.js";
import { KPI } from "../models/KPI.js";
import { LeaveRequest } from "../models/LeaveRequest.js";
import { Notification } from "../models/Notification.js";
import { PerformanceReview } from "../models/PerformanceReview.js";
import { PerformanceSnapshot } from "../models/PerformanceSnapshot.js";
import { Project } from "../models/Project.js";
import { Recognition } from "../models/Recognition.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { Skill } from "../models/Skill.js";
import { SkillVerification } from "../models/SkillVerification.js";
import { Task } from "../models/Task.js";
import { TaskActivity } from "../models/TaskActivity.js";
import { Team } from "../models/Team.js";
import { Training } from "../models/Training.js";
import { User } from "../models/User.js";
import { runWithTenant } from "../tenancy/tenantContext.js";

const seededSkillNames = ["react", "node.js", "laravel", "php", "python", "sql", "mongodb", "ai / ml", "rag", "devops", "sales", "crm", "seo", "content marketing"];

const run = async (): Promise<void> => {
  const { defaultTenantId } = await connectDatabase();
  try {
    await runWithTenant(defaultTenantId, async () => {
    const employees = await Employee.find({ $or: [{ officialEmail: /@demo\.mobiusbloom\.local$/i }, { employeeId: /^MB-DEMO-/i }] }).select("_id user").lean();
    const employeeIds = employees.map((item) => item._id);
    const employeeUserIds = employees.map((item) => item.user);
    const users = await User.find({ $or: [{ _id: { $in: employeeUserIds } }, { email: /@demo\.mobiusbloom\.local$/i }] }).select("_id").lean();
    const userIds = users.map((item) => item._id);
    const projects = await Project.find({ $or: [{ code: /^DEMO-/i }, { projectManager: { $in: employeeIds } }] }).select("_id").lean();
    const projectIds = projects.map((item) => item._id);
    const tasks = await Task.find({ $or: [{ taskId: /^DEMO-/i }, { assignedEmployee: { $in: employeeIds } }, { project: { $in: projectIds } }] }).select("_id").lean();
    const taskIds = tasks.map((item) => item._id);
    const employeeSkills = await EmployeeSkill.find({ employee: { $in: employeeIds } }).select("_id").lean();
    const employeeSkillIds = employeeSkills.map((item) => item._id);

    const preview = { employees: employeeIds.length, users: userIds.length, projects: projectIds.length, tasks: taskIds.length, employeeSkills: employeeSkillIds.length };
    console.log("Demo cleanup preview", preview);
    if (process.env.CLEANUP_DEMO_CONFIRM !== "REMOVE_DEMO_DATA") {
      console.log("Preview only. Set CLEANUP_DEMO_CONFIRM=REMOVE_DEMO_DATA to delete these records.");
      return;
    }

    await Promise.all([
      TaskActivity.deleteMany({ task: { $in: taskIds } }),
      SkillVerification.deleteMany({ $or: [{ employee: { $in: employeeIds } }, { employeeSkill: { $in: employeeSkillIds } }] }),
      AssessmentResult.deleteMany({ employee: { $in: employeeIds } }),
      Assessment.deleteMany({ assignedEmployee: { $in: employeeIds } }),
      Attendance.deleteMany({ employee: { $in: employeeIds } }),
      AiEmployeeSummary.deleteMany({ employee: { $in: employeeIds } }),
      DailyTodo.deleteMany({ $or: [{ employee: { $in: employeeIds } }, { user: { $in: userIds } }] }),
      Document.deleteMany({ employee: { $in: employeeIds } }),
      EmployeeKPI.deleteMany({ employee: { $in: employeeIds } }),
      EmployeeTimeline.deleteMany({ employee: { $in: employeeIds } }),
      EmployeeTraining.deleteMany({ employee: { $in: employeeIds } }),
      Goal.deleteMany({ employee: { $in: employeeIds } }),
      LeaveRequest.deleteMany({ employee: { $in: employeeIds } }),
      PerformanceReview.deleteMany({ $or: [{ employee: { $in: employeeIds } }, { reviewer: { $in: userIds } }] }),
      PerformanceSnapshot.deleteMany({ employee: { $in: employeeIds } }),
      Recognition.deleteMany({ $or: [{ employee: { $in: employeeIds } }, { awardedBy: { $in: userIds } }] }),
      Notification.deleteMany({ recipient: { $in: userIds } }),
      RefreshSession.deleteMany({ user: { $in: userIds } }),
      AuditLog.deleteMany({ user: { $in: userIds } })
    ]);
    await EmployeeSkill.deleteMany({ _id: { $in: employeeSkillIds } });
    await Task.deleteMany({ _id: { $in: taskIds } });
    await Project.deleteMany({ _id: { $in: projectIds } });
    await Promise.all([
      Department.updateMany({ head: { $in: employeeIds } }, { $unset: { head: 1 } }),
      Team.updateMany({ lead: { $in: employeeIds } }, { $unset: { lead: 1 } }),
      Project.updateMany({}, { $pull: { teamMembers: { $in: employeeIds } } })
    ]);
    await Employee.deleteMany({ _id: { $in: employeeIds } });
    await User.deleteMany({ _id: { $in: userIds } });

    const demoKpis = await KPI.find({ name: "Outcome Quality", period: "2026-Q3" }).select("_id").lean();
    const unusedKpiIds = [];
    for (const kpi of demoKpis) if (!await EmployeeKPI.exists({ kpi: kpi._id })) unusedKpiIds.push(kpi._id);
    if (unusedKpiIds.length) await KPI.deleteMany({ _id: { $in: unusedKpiIds } });

    const candidateSkills = await Skill.find({ normalizedName: { $in: seededSkillNames } }).select("_id").lean();
    const unusedSkillIds = [];
    for (const skill of candidateSkills) {
      const inUse = await Promise.all([
        EmployeeSkill.exists({ skill: skill._id }),
        Assessment.exists({ skill: skill._id }),
        Training.exists({ skill: skill._id })
      ]);
      if (inUse.every((value) => !value)) unusedSkillIds.push(skill._id);
    }
    if (unusedSkillIds.length) await Skill.deleteMany({ _id: { $in: unusedSkillIds } });
    console.log("Demo data removed", { ...preview, unusedSkills: unusedSkillIds.length, unusedKpis: unusedKpiIds.length });
    });
  } finally {
    await disconnectDatabase();
  }
};

void run().catch((error: unknown) => {
  console.error("Demo cleanup failed", error);
  process.exit(1);
});
