import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, AlertOctagon, AlertTriangle, ArrowUpRight, Briefcase, CalendarClock,
  ChevronRight, Clock, Eye, Layers, Search, ShieldCheck,
  Sparkles, Trophy, Users, Zap,
} from "lucide-react";
import { api } from "@/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { MoodBreakPanel } from "@/features/ai/AiWorkspacePanels";
import { GamificationHeader } from "@/features/work/GamificationHeader";
import { cn } from "@/lib/cn";
import { AdminAnalytics } from "./AdminAnalytics";

/* ─── Types ─── */
interface Metric { label: string; value: number | string; detail: string }
interface Person { _id: string; firstName: string; lastName: string; employeeId: string }
interface EmployeeProfileSummary {
  status: string;
  employmentType: string;
  department?: { name: string };
  designation?: { name: string };
}

interface SubordinatePerson {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: string;
  profilePhotoKey?: string;
  department?: { name: string; code: string };
  designation?: { name: string; code: string };
  team?: { name: string; code: string };
  openTasksCount: number;
  inProgressCount: number;
  inReviewCount: number;
  blockedCount: number;
  overdueCount: number;
}

interface SubordinateTask {
  _id: string;
  taskId: string;
  name: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "REOPENED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: string;
  startDate?: string;
  actualHours?: number;
  estimatedHours?: number;
  project?: { _id: string; name: string; code: string };
  assignedEmployee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    profilePhotoKey?: string;
  };
  reviewer?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  blocker?: {
    reason: string;
    comment?: string;
    startedAt?: string;
  };
}

interface SubordinateWork {
  isSuperior: boolean;
  scopeType: "ALL" | "DEPARTMENT" | "SUBTREE" | "SELF";
  subordinates: SubordinatePerson[];
  tasks: SubordinateTask[];
  metrics: {
    totalSubordinates: number;
    activeTasks: number;
    inProgressTasks: number;
    inReviewTasks: number;
    blockedTasks: number;
    overdueTasks: number;
  };
}

interface Summary {
  greetingName: string;
  employeeProfile: EmployeeProfileSummary | null;
  metrics: Metric[];
  topPerformers: { employee: Person; score: number; classification: string }[];
  performanceEvidence: {
    state: "RANKED" | "ACTION_REQUIRED" | "EMPTY";
    sufficientCount: number;
    totalEmployees: number;
    attentionCount: number;
    topPerformers: { employee: Person; score: number; classification: string }[];
    attention: { employee: Person; status: "INSUFFICIENT_EVIDENCE" | "NOT_CALCULATED"; action: string }[];
  };
  upcomingDeadlines: { id: string; name: string; deadline: string; priority: string; employee: Person }[];
  workloadAttention: { employee: Person; estimatedHours: number; openTasks: number; classification: string }[];
  needsAttention: { employee: Person; score: number; developmentAreas: string[] }[];
  subordinateWork?: SubordinateWork;
}

/* ─── Helpers ─── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const metricAccents = [
  { bar: "accent-bar-violet", iconBg: "bg-violet-100", iconColor: "text-violet-600", Icon: Users },
  { bar: "accent-bar-blue", iconBg: "bg-blue-100", iconColor: "text-blue-600", Icon: Zap },
  { bar: "accent-bar-amber", iconBg: "bg-amber-100", iconColor: "text-amber-600", Icon: ShieldCheck },
  { bar: "accent-bar-emerald", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", Icon: ArrowUpRight },
];

const rankStyles = [
  "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200",
  "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md shadow-orange-200",
];

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  HIGH: { bg: "bg-red-50", text: "text-red-700", border: "border-l-red-400" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-l-amber-400" },
  LOW: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-l-emerald-400" },
};

const taskStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  TODO: { bg: "bg-slate-100", text: "text-slate-700", label: "To do" },
  IN_PROGRESS: { bg: "bg-blue-100 text-blue-800", text: "text-blue-800", label: "In progress" },
  IN_REVIEW: { bg: "bg-purple-100 text-purple-800", text: "text-purple-800", label: "In review" },
  BLOCKED: { bg: "bg-red-100 text-red-800", text: "text-red-800", label: "Blocked" },
  COMPLETED: { bg: "bg-emerald-100 text-emerald-800", text: "text-emerald-800", label: "Completed" },
  REOPENED: { bg: "bg-orange-100 text-orange-800", text: "text-orange-800", label: "Reopened" },
  CANCELLED: { bg: "bg-slate-100 text-slate-500", text: "text-slate-500", label: "Cancelled" },
};

const relativeDeadline = (dateStr: string) => {
  const now = new Date();
  const target = new Date(dateStr);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  return `In ${Math.ceil(diffDays / 7)} weeks`;
};

/* ─── Component ─── */
export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string>("ALL");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("ACTIVE");
  const [taskSearch, setTaskSearch] = useState<string>("");
  const [adminViewMode, setAdminViewMode] = useState<"HIERARCHY" | "ANALYTICS">("HIERARCHY");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get<Summary>("/api/v1/dashboard/summary"),
  });

  const firstName = data?.greetingName ?? user?.name.split(" ")[0];
  const employeeView = user?.role === "EMPLOYEE";
  const metrics = data?.metrics;
  const performance = data?.performanceEvidence;
  const subordinateWork = data?.subordinateWork;
  const isSuperior = !employeeView && Boolean(subordinateWork?.isSuperior);

  const filteredSubordinateTasks = useMemo(() => {
    if (!subordinateWork?.tasks) return [];
    return subordinateWork.tasks.filter((task) => {
      if (selectedSubordinateId !== "ALL" && task.assignedEmployee._id !== selectedSubordinateId) {
        return false;
      }
      if (taskStatusFilter === "ACTIVE" && ["COMPLETED", "CANCELLED"].includes(task.status)) {
        return false;
      }
      if (taskStatusFilter === "IN_PROGRESS" && task.status !== "IN_PROGRESS") {
        return false;
      }
      if (taskStatusFilter === "IN_REVIEW" && task.status !== "IN_REVIEW") {
        return false;
      }
      if (taskStatusFilter === "BLOCKED" && task.status !== "BLOCKED") {
        return false;
      }
      if (taskStatusFilter === "COMPLETED" && task.status !== "COMPLETED") {
        return false;
      }
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchName = task.name.toLowerCase().includes(q);
        const matchAssignee = `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`.toLowerCase().includes(q);
        const matchProject = task.project?.name?.toLowerCase().includes(q);
        if (!matchName && !matchAssignee && !matchProject) return false;
      }
      return true;
    });
  }, [subordinateWork?.tasks, selectedSubordinateId, taskStatusFilter, taskSearch]);

  if (user?.role === "SUPER_ADMIN" && adminViewMode === "ANALYTICS") {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 pt-6 sm:px-8">
          <button
            type="button"
            onClick={() => setAdminViewMode("HIERARCHY")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            ← Switch to Subordinates Surveillance Hub
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Viewing: Executive Analytics
          </span>
        </div>
        <AdminAnalytics />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-x-clip px-4 py-6 sm:px-8 sm:py-9">
      <div className="mx-auto w-full min-w-0 max-w-[1440px]">
        {employeeView && <div className="mb-7 animate-fadeInUp"><GamificationHeader/></div>}

        {/* ────── Hero greeting ────── */}
        <div className="animate-fadeInUp flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
              {employeeView ? "Your overview" : isSuperior ? "Hierarchy & Workforce Overview" : "Workforce overview"}
            </p>
            <h1 className="mt-2 max-w-full break-words text-2xl font-bold tracking-tight text-ink sm:text-4xl">
              {getGreeting()},{" "}
              <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-500">
              {employeeView
                ? "Your current work, capability, goals and growth in one place."
                : isSuperior
                ? "Live surveillance of subordinate delivery, task blockers, and team operations across your reporting hierarchy."
                : "Live capability, delivery and workforce signals within your permitted scope."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {user?.role === "SUPER_ADMIN" && (
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1">
                <button
                  type="button"
                  onClick={() => setAdminViewMode("HIERARCHY")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    adminViewMode === "HIERARCHY"
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-600 hover:text-ink"
                  )}
                >
                  Subordinates Hub
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode("ANALYTICS")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    adminViewMode === "ANALYTICS"
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-600 hover:text-ink"
                  )}
                >
                  Executive Analytics
                </button>
              </div>
            )}
            <div className="flex max-w-full items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50/60 px-4 py-2 text-xs font-medium text-emerald-700 backdrop-blur-sm">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              {employeeView ? "Live personal view" : isSuperior ? "Hierarchical surveillance view" : "Live management view"}
            </div>
          </div>
        </div>

        {/* ────── Metric cards ────── */}
        <section
          aria-label="Key workforce metrics"
          className="mt-7 grid min-w-0 gap-4 sm:mt-9 sm:grid-cols-2 xl:grid-cols-4"
        >
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))
            : metrics?.map((metric, index) => {
                const accent = metricAccents[index] ?? metricAccents[0];
                const AccentIcon = accent.Icon;
                return (
                  <article
                    key={metric.label}
                    className={cn(
                      "animate-fadeInUp group min-w-0 overflow-hidden rounded-2xl border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg sm:p-6",
                      accent.bar,
                      index === 0 && "anim-delay-1",
                      index === 1 && "anim-delay-2",
                      index === 2 && "anim-delay-3",
                      index === 3 && "anim-delay-4"
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-medium text-slate-500">
                        {employeeView && index === 0 ? "My employee profile" : metric.label}
                      </p>
                      <div
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                          accent.iconBg, accent.iconColor
                        )}
                      >
                        <AccentIcon size={18} />
                      </div>
                    </div>
                    {employeeView && index === 0 ? (
                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Assigned designation</p>
                        <p className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-ink">
                          {data?.employeeProfile?.designation?.name ?? "Not assigned"}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Department</p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-700">{data?.employeeProfile?.department?.name ?? "Not assigned"}</p>
                          </div>
                          <div className="min-w-0 border-l border-slate-200 pl-3">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Employment</p>
                            <p className="mt-1 truncate text-xs font-semibold capitalize text-slate-700">{data?.employeeProfile?.employmentType.replaceAll("_", " ").toLowerCase() ?? "Not assigned"}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          {data?.employeeProfile?.status.replaceAll("_", " ") ?? "Unknown"}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-4 break-words text-4xl font-bold tracking-tight text-ink">{metric.value}</p>
                        <p className="mt-2 break-words text-xs leading-5 text-slate-400">{metric.detail}</p>
                      </>
                    )}
                  </article>
                );
              })}
        </section>

        {/* ────── Superior's Subordinate Work Surveillance Hub ────── */}
        {isSuperior && subordinateWork && (
          <section
            aria-label="Subordinate delivery surveillance"
            className="animate-fadeInUp anim-delay-2 mt-8 overflow-hidden rounded-2xl border bg-white shadow-soft"
          >
            {/* Hub Header */}
            <div className="flex flex-col justify-between gap-4 border-b bg-gradient-to-r from-slate-50 via-white to-brand-50/30 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex items-center gap-3.5">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200">
                  <Briefcase size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-ink">Subordinates&apos; Work & Delivery</h2>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                      {subordinateWork.scopeType === "DEPARTMENT"
                        ? "Department Scope"
                        : subordinateWork.scopeType === "SUBTREE"
                        ? "Subtree Reporting Line"
                        : "Global Scope"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Live tasks, progress, reviews and blockers for employees reporting directly or indirectly to you.
                  </p>
                </div>
              </div>

              {/* Subordinate Work Quick Signal Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Users size={14} className="text-slate-500" />
                  {subordinateWork.metrics.totalSubordinates} subordinates
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <Clock size={14} className="text-blue-500" />
                  {subordinateWork.metrics.inProgressTasks} in progress
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold",
                  subordinateWork.metrics.inReviewTasks > 0
                    ? "border-purple-200 bg-purple-50 text-purple-700 font-bold"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                )}>
                  <Eye size={14} className="text-purple-500" />
                  {subordinateWork.metrics.inReviewTasks} in review
                </span>
                {subordinateWork.metrics.blockedTasks > 0 && (
                  <span className="inline-flex animate-pulse items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                    <AlertOctagon size={14} className="text-red-600" />
                    {subordinateWork.metrics.blockedTasks} blocked
                  </span>
                )}
                {subordinateWork.metrics.overdueTasks > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14} className="text-amber-600" />
                    {subordinateWork.metrics.overdueTasks} overdue
                  </span>
                )}
              </div>
            </div>

            {/* Subordinate Team Members Roster Bar */}
            {subordinateWork.subordinates.length > 0 && (
              <div className="border-b bg-slate-50/50 p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Subordinates in your reporting branch (click to filter):
                </p>
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSubordinateId("ALL")}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 font-medium transition",
                      selectedSubordinateId === "ALL"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Layers size={14} />
                    <span>All Subordinates</span>
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      selectedSubordinateId === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      {subordinateWork.subordinates.length}
                    </span>
                  </button>

                  {subordinateWork.subordinates.map((sub) => {
                    const isSelected = selectedSubordinateId === sub._id;
                    return (
                      <button
                        key={sub._id}
                        type="button"
                        onClick={() => setSelectedSubordinateId(isSelected ? "ALL" : sub._id)}
                        className={cn(
                          "flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2 transition text-left",
                          isSelected
                            ? "border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="grid size-6 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                          {sub.firstName[0]}{sub.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{sub.firstName} {sub.lastName}</p>
                          <p className="truncate text-[10px] text-slate-400">{sub.designation?.name ?? "Member"}</p>
                        </div>
                        <div className="ml-1 flex items-center gap-1">
                          {sub.openTasksCount > 0 && (
                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700" title="Open tasks">
                              {sub.openTasksCount}
                            </span>
                          )}
                          {sub.blockedCount > 0 && (
                            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700" title="Blocked tasks">
                              {sub.blockedCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter and Search Toolbar */}
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "ACTIVE", label: "All active work" },
                  { key: "IN_PROGRESS", label: "In progress" },
                  { key: "IN_REVIEW", label: "In review" },
                  { key: "BLOCKED", label: "Blocked" },
                  { key: "COMPLETED", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTaskStatusFilter(tab.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 font-medium transition",
                      taskStatusFilter === tab.key
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Filter tasks or subordinate..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Tasks Surveillance List */}
            <div className="divide-y">
              {filteredSubordinateTasks.length > 0 ? (
                filteredSubordinateTasks.map((task) => {
                  const statusInfo = taskStatusStyles[task.status] ?? taskStatusStyles.TODO;
                  const prioInfo = priorityColors[task.priority] ?? priorityColors.MEDIUM;
                  const isBlocked = task.status === "BLOCKED";
                  const isOverdue = task.status !== "COMPLETED" && task.deadline && new Date(task.deadline) < new Date();

                  return (
                    <div
                      key={task._id}
                      className={cn(
                        "flex flex-col gap-4 p-5 transition-colors duration-150 hover:bg-slate-50/70 sm:flex-row sm:items-start sm:p-6",
                        isBlocked && "bg-red-50/30",
                        task.status === "IN_REVIEW" && "bg-purple-50/20"
                      )}
                    >
                      {/* Subordinate Assignee Column */}
                      <div className="flex w-full shrink-0 items-center gap-3 sm:w-56">
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 uppercase">
                          {task.assignedEmployee.firstName[0]}{task.assignedEmployee.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink">
                            {task.assignedEmployee.firstName} {task.assignedEmployee.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">{task.assignedEmployee.employeeId}</p>
                        </div>
                      </div>

                      {/* Task Info Column */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-400">{task.taskId}</span>
                          {task.project && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {task.project.name}
                            </span>
                          )}
                          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", statusInfo.bg, statusInfo.text)}>
                            {statusInfo.label}
                          </span>
                          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", prioInfo.bg, prioInfo.text)}>
                            {task.priority}
                          </span>
                        </div>

                        <h3 className="mt-1.5 text-sm font-semibold text-ink">{task.name}</h3>

                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
                        )}

                        {/* Blocker Callout if Blocked */}
                        {isBlocked && task.blocker && (
                          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                            <AlertOctagon size={16} className="mt-0.5 shrink-0 text-red-600" />
                            <div>
                              <p className="font-semibold">Blocker: {task.blocker.reason.replaceAll("_", " ")}</p>
                              {task.blocker.comment && (
                                <p className="mt-0.5 text-red-700/90">&ldquo;{task.blocker.comment}&rdquo;</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deadline & Action Column */}
                      <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className={cn(isOverdue ? "text-red-500" : "text-slate-400")} />
                            <span className={cn("text-xs font-semibold", isOverdue ? "text-red-600 font-bold" : "text-ink")}>
                              {relativeDeadline(task.deadline)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Due {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/work")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <span>Manage</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center text-sm text-slate-400">
                  <p className="font-semibold text-slate-600">No subordinate tasks found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {taskSearch
                      ? "No tasks match your search filter."
                      : selectedSubordinateId !== "ALL"
                      ? "This subordinate currently has no tasks in this status."
                      : "Your reporting subtree does not currently have tasks matching this criteria."}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ────── Performance evidence + Upcoming deadlines ────── */}
        <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-2">

          {/* Top performers */}
          <section className="animate-fadeInUp anim-delay-3 min-w-0 overflow-hidden rounded-2xl border bg-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg">
            <div className="flex min-w-0 items-center gap-3 border-b bg-gradient-to-r from-amber-50/80 to-white p-5 sm:p-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-200/60">
                <Trophy size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="break-words font-bold text-ink">
                  {employeeView ? "My performance evidence" : performance?.state === "RANKED" ? "Top performance evidence" : "Performance evidence needed"}
                </h2>
                <p className="break-words text-xs text-slate-400">
                  {performance?.state === "RANKED"
                    ? `Latest explainable snapshots · ${performance.sufficientCount} of ${performance.totalEmployees} ready`
                    : "Complete the evidence before comparing performance."}
                </p>
              </div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="space-y-3 p-5 sm:p-6" aria-label="Loading performance evidence">
                  {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-14 rounded-xl" />)}
                </div>
              ) : isError ? (
                <div className="p-8 text-center" role="alert">
                  <AlertCircle className="mx-auto text-red-500" size={24} />
                  <p className="mt-3 text-sm font-semibold text-ink">Performance evidence could not be loaded</p>
                  <p className="mt-1 text-xs text-slate-500">Other dashboard information may also be unavailable.</p>
                  <button type="button" onClick={() => void refetch()} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700">Try again</button>
                </div>
              ) : performance?.state === "RANKED" && performance.topPerformers.length ? (
                <>
                {performance.topPerformers.map((item, index) => (
                  <div
                    className="animate-slideInRight group/row flex min-w-0 items-center gap-4 p-5 transition-colors duration-200 hover:bg-slate-50/70 sm:p-6"
                    style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                    key={item.employee._id}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold",
                        index < 3 ? rankStyles[index] : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-ink">
                        {item.employee.firstName} {item.employee.lastName}
                      </p>
                      <p className="break-words text-xs text-slate-400">{item.classification}</p>
                    </div>
                    {/* Score bar */}
                    <div className="flex shrink-0 items-center gap-2.5">
                      <div className="hidden h-2 w-16 overflow-hidden rounded-full bg-slate-100 sm:block">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700"
                          style={{ width: `${Math.min(item.score, 100)}%` }}
                        />
                      </div>
                      <p className="text-lg font-bold text-brand-700">{Math.round(item.score)}%</p>
                    </div>
                  </div>
                ))}
                {performance.attentionCount > 0 && <div className="flex items-center gap-2 bg-amber-50 px-5 py-3 text-xs text-amber-800 sm:px-6"><AlertTriangle size={14} className="shrink-0"/><span>{performance.attentionCount} {performance.attentionCount === 1 ? "employee needs" : "employees need"} more evidence and {performance.attentionCount === 1 ? "is" : "are"} excluded from ranking.</span></div>}
                </>
              ) : performance?.attention.length ? (
                performance.attention.map((item) => (
                  <div className="flex min-w-0 items-start gap-4 p-5 sm:p-6" key={item.employee._id}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle size={16}/></span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-ink">{item.employee.firstName} {item.employee.lastName}</p>
                      <p className="mt-0.5 text-xs font-medium text-amber-700">{item.status === "NOT_CALCULATED" ? "Snapshot not calculated" : "More evidence required"}</p>
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500">{item.action}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Not ranked</span>
                  </div>
                ))
              ) : (
                <p className="p-10 text-center text-sm text-slate-400">
                  No employees are available in your scope.
                </p>
              )}
            </div>
          </section>

          {/* Upcoming deadlines */}
          <section className="animate-fadeInUp anim-delay-4 min-w-0 overflow-hidden rounded-2xl border bg-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg">
            <div className="flex min-w-0 items-center gap-3 border-b bg-gradient-to-r from-brand-50/80 to-white p-5 sm:p-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-200/60">
                <CalendarClock size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-ink">Upcoming deadlines</h2>
                <p className="break-words text-xs text-slate-400">
                  The next work requiring attention.
                </p>
              </div>
            </div>
            <div className="divide-y">
              {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
                data.upcomingDeadlines.map((item, index) => {
                  const prio = priorityColors[item.priority] ?? priorityColors.MEDIUM;
                  return (
                    <div
                      className={cn(
                        "animate-slideInRight flex min-w-0 items-start gap-4 border-l-[3px] p-5 transition-colors duration-200 hover:bg-slate-50/70 sm:items-center sm:p-6",
                        prio.border
                      )}
                      style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                      key={item.id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-ink">{item.name}</p>
                        <p className="break-words text-xs text-slate-400">
                          {item.employee.firstName} {item.employee.lastName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <p className="text-xs font-semibold text-ink">
                            {relativeDeadline(item.deadline)}
                          </p>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(item.deadline).toLocaleDateString()}
                        </p>
                        <span
                          className={cn(
                            "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            prio.bg, prio.text
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="p-10 text-center text-sm text-slate-400">
                  No upcoming task deadlines.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ────── Workload attention + Decision principle ────── */}
        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-2">

          {/* Workload attention */}
          <section className="animate-fadeInUp anim-delay-5 min-w-0 overflow-hidden rounded-2xl border bg-white p-5 shadow-soft transition-shadow duration-300 hover:shadow-soft-lg sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={18} />
              </div>
              <h2 className="font-bold text-ink">Workload attention</h2>
            </div>
            <div className="mt-5 space-y-3">
              {data?.workloadAttention && data.workloadAttention.length > 0 ? (
                data.workloadAttention.map((item, index) => {
                  const isOverloaded = item.classification === "OVERLOADED";
                  return (
                    <div
                      className={cn(
                        "animate-slideInRight flex min-w-0 flex-col items-start gap-3 rounded-xl p-4 sm:flex-row sm:items-center",
                        isOverloaded ? "bg-red-50/70 ring-1 ring-red-100" : "bg-amber-50/70"
                      )}
                      style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                      key={item.employee._id}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-ink">
                          {item.employee.firstName} {item.employee.lastName}
                        </p>
                        <p className={cn("break-words text-xs", isOverloaded ? "text-red-600" : "text-amber-700")}>
                          {item.openTasks} tasks · {item.estimatedHours}h remaining
                        </p>
                        {/* Mini load bar */}
                        <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isOverloaded
                                ? "bg-gradient-to-r from-red-400 to-red-500"
                                : "bg-gradient-to-r from-amber-400 to-amber-500"
                            )}
                            style={{ width: `${Math.min((item.estimatedHours / 60) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={cn(
                          "max-w-full rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                          isOverloaded
                            ? "animate-pulseGlow bg-red-100 text-red-700"
                            : "bg-white text-amber-700 shadow-sm"
                        )}
                      >
                        {item.classification.replaceAll("_", " ")}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No high-workload signals.
                </p>
              )}
            </div>
          </section>

          {/* Decision principle */}
          <section className="animate-fadeInUp anim-delay-6 group relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#302947] via-[#3d2f5c] to-[#4a2e6e] p-6 text-white shadow-soft sm:p-8">
            {/* Shimmer overlay */}
            <div className="bg-shimmer animate-shimmer pointer-events-none absolute inset-0" />
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-fuchsia-500/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2.5 text-violet-300">
                <Sparkles size={18} className="animate-float" />
                <span className="text-xs font-bold uppercase tracking-[.18em]">
                  Decision principle
                </span>
              </div>
              <h2 className="mt-6 break-words text-2xl font-bold leading-tight sm:text-3xl">
                Evidence informs.
                <br />
                <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  People decide.
                </span>
              </h2>
              <p className="mt-4 break-words text-sm leading-7 text-white/55">
                Scores remain deterministic and explainable. Recommendations never decide
                promotion, termination, salary or discipline.
              </p>
            </div>
          </section>
        </div>

        {/* ────── Employee-only panels ────── */}
        {employeeView && (
          <div className="mt-5 max-w-2xl animate-fadeInUp anim-delay-6">
            <MoodBreakPanel />
          </div>
        )}

      </div>
    </main>
  );
};
