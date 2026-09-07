export interface AnalyticsTask { isActive: boolean; status: string; deadline: Date; completionDate?: Date; estimatedHours: number; actualHours?: number }
export const summarizeTasks = (records: AnalyticsTask[], now: Date) => {
  const tasks = records.filter((task) => task.isActive && task.status !== "CANCELLED");
  const completed = tasks.filter((task) => task.status === "COMPLETED");
  const open = tasks.filter((task) => task.status !== "COMPLETED");
  const dated = completed.filter((task) => task.completionDate);
  const onTime = dated.filter((task) => task.completionDate! <= task.deadline).length;
  return { total: tasks.length, completed: completed.length, open: open.length,
    overdue: open.filter((task) => task.deadline < now).length,
    review: open.filter((task) => task.status === "IN_REVIEW").length,
    blocked: open.filter((task) => task.status === "BLOCKED").length,
    onTime, datedCompletions: dated.length,
    onTimeRate: dated.length ? Math.round(onTime / dated.length * 100) : null,
    remainingHours: Math.round(open.filter((task) => task.status !== "IN_REVIEW").reduce((sum, task) => sum + Math.max(0, task.estimatedHours - (task.actualHours ?? 0)), 0) * 10) / 10 };
};
