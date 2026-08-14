import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowUpRight, CalendarClock, Clock, ShieldCheck,
  Sparkles, Trophy, Users, Zap,
} from "lucide-react";
import { api } from "@/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { DailyTodoPanel, MoodBreakPanel } from "@/features/ai/AiWorkspacePanels";
import { cn } from "@/lib/cn";

/* ─── Types ─── */
interface Metric { label: string; value: number | string; detail: string; badges?: string[] }
interface Person { _id: string; firstName: string; lastName: string; employeeId: string }
interface EmployeeProfileSummary {
  status: string;
  employmentType: string;
  department?: { name: string };
  designation?: { name: string };
}
interface Summary {
  greetingName: string;
  employeeProfile: EmployeeProfileSummary | null;
  metrics: Metric[];
  topPerformers: { employee: Person; score: number; classification: string }[];
  upcomingDeadlines: { id: string; name: string; deadline: string; priority: string; employee: Person }[];
  workloadAttention: { employee: Person; estimatedHours: number; openTasks: number; classification: string }[];
  needsAttention: { employee: Person; score: number; developmentAreas: string[] }[];
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
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get<Summary>("/api/v1/dashboard/summary"),
  });

  const firstName = data?.greetingName ?? user?.name.split(" ")[0];
  const employeeView = user?.role === "EMPLOYEE";
  const metrics = data?.metrics.map((metric, index) =>
    employeeView && index === 0
      ? {
          label: "My employee profile",
          value: data.employeeProfile?.designation?.name ?? "Role not assigned",
          detail: data.employeeProfile?.department?.name ?? "Department not assigned",
          badges: data.employeeProfile
            ? [data.employeeProfile.employmentType.replaceAll("_", " "), data.employeeProfile.status.replaceAll("_", " ")]
            : []
        }
      : metric
  );

  return (
    <main className="flex-1 overflow-x-clip px-4 py-6 sm:px-8 sm:py-9">
      <div className="mx-auto w-full min-w-0 max-w-[1440px]">

        {/* ────── Hero greeting ────── */}
        <div className="animate-fadeInUp flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
              {employeeView ? "Your overview" : "Workforce overview"}
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
                : "Live capability, delivery and workforce signals within your permitted scope."}
            </p>
          </div>
          <div className="flex max-w-full items-center gap-2.5 self-start rounded-full border border-emerald-200 bg-emerald-50/60 px-4 py-2 text-xs font-medium text-emerald-700 backdrop-blur-sm sm:self-auto">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            {employeeView ? "Live personal view" : "Live management view"}
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
                        {metric.label}
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
                    <p className="mt-4 break-words text-4xl font-bold tracking-tight text-ink">
                      {metric.value}
                    </p>
                    <p className="mt-2 break-words text-xs leading-5 text-slate-400">
                      {metric.detail}
                    </p>
                    {metric.badges?.length ? <div className="mt-3 flex flex-wrap gap-2">
                      {metric.badges.map((badge) => <span key={badge} className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">{badge}</span>)}
                    </div> : null}
                  </article>
                );
              })}
        </section>

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
                  {employeeView ? "My performance evidence" : "Top performance evidence"}
                </h2>
                <p className="break-words text-xs text-slate-400">
                  Latest explainable snapshot—not a permanent rank.
                </p>
              </div>
            </div>
            <div className="divide-y">
              {data?.topPerformers.length ? (
                data.topPerformers.map((item, index) => (
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
                      <p className="text-lg font-bold text-brand-700">{item.score}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-10 text-center text-sm text-slate-400">
                  No performance snapshots yet.
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
              {data?.upcomingDeadlines.length ? (
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
              {data?.workloadAttention.length ? (
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
          <div className="mt-6 max-w-3xl animate-fadeInUp anim-delay-5">
            <DailyTodoPanel />
          </div>
        )}
        {employeeView && (
          <div className="mt-5 max-w-2xl animate-fadeInUp anim-delay-6">
            <MoodBreakPanel />
          </div>
        )}

      </div>
    </main>
  );
};
