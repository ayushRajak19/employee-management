import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCircle2, History, Layers, Send, ShieldCheck, Target, Users } from "lucide-react";
import { useState } from "react";
import { salesApi, type TargetPerformanceDto } from "../salesApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";

const money = (n?: number, currency = "₹") => `${currency}${Math.round(n ?? 0).toLocaleString("en-IN")}`;
const formatDate = (dateString?: string) => (dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export const TargetPerformancePage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"me" | "team">("me");
  const [commit, setCommit] = useState("");
  const [selectedTargetForHistory, setSelectedTargetForHistory] = useState<string | null>(null);

  const canViewTeam = Boolean(user?.permissions.includes("sales.analytics.team") || user?.permissions.includes("sales.analytics.all"));

  const myQuery = useQuery({
    queryKey: ["target-performance", "me"],
    queryFn: salesApi.targetPerformance,
  });

  const teamQuery = useQuery({
    queryKey: ["target-performance", "team"],
    queryFn: salesApi.teamTargetPerformance,
    enabled: canViewTeam && activeTab === "team",
  });

  const versionsQuery = useQuery({
    queryKey: ["target-versions", selectedTargetForHistory],
    queryFn: () => salesApi.targetVersions(selectedTargetForHistory!),
    enabled: Boolean(selectedTargetForHistory),
  });

  const item: TargetPerformanceDto | undefined = myQuery.data?.items?.[0];

  const commitMutation = useMutation({
    mutationFn: () => salesApi.commitment(item!.target._id, { committedRevenue: Number(commit) }),
    onSuccess: () => {
      setCommit("");
      qc.invalidateQueries({ queryKey: ["target-performance"] });
    },
  });

  const triggerReminderMutation = useMutation({
    mutationFn: (targetId: string) => salesApi.triggerReminder(targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["target-performance"] });
    },
  });

  if (myQuery.isLoading) {
    return <main className="p-8 text-slate-500">Loading target & performance details…</main>;
  }

  const p = item?.performance;
  const target = item?.target;
  const compRule = target?.compensationRule;
  const reminderStatus = item?.reminderStatus;

  return (
    <main className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Sales Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Target & Compensation</h1>
        </div>
        {canViewTeam && (
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${activeTab === "me" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              onClick={() => setActiveTab("me")}
            >
              My Target
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${activeTab === "team" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              onClick={() => setActiveTab("team")}
            >
              <Users size={14} /> Team Progress & Reminders
            </button>
          </div>
        )}
      </div>

      {activeTab === "team" ? (
        /* =================== TEAM VIEW FOR MANAGERS / ADMINS =================== */
        <section className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Team Target Progress & Automatic Reminders</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review real-time target completion, remaining %, compensation version, and automated reminder delivery for all assigned team members.
            </p>

            {teamQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading team progress…</p>
            ) : !teamQuery.data?.items?.length ? (
              <p className="py-8 text-center text-sm text-slate-400">No active team targets found.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3 text-right">Target Amount</th>
                      <th className="px-4 py-3 text-right">Achieved Amount</th>
                      <th className="px-4 py-3 text-center">Achievement %</th>
                      <th className="px-4 py-3 text-right">Remaining Amount</th>
                      <th className="px-4 py-3 text-center">Remaining %</th>
                      <th className="px-4 py-3 text-center">Version</th>
                      <th className="px-4 py-3">Reminder Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-600">
                    {teamQuery.data.items.map((entry) => {
                      const emp = entry.target.employee as { firstName?: string; lastName?: string; employeeId?: string } | undefined;
                      const empName = emp ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId || "—" : "Territory Goal";
                      const perf = entry.performance;
                      const rem = entry.reminderStatus;
                      const isComplete = perf.achievementPercentage >= 100;

                      return (
                        <tr key={entry.target._id} className="hover:bg-slate-50/80">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                            <div>{empName}</div>
                            {emp?.employeeId && <span className="text-xs text-slate-400">{emp.employeeId}</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink">
                            {money(perf.targetAmount ?? perf.officialTarget)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700">
                            {money(perf.achievedAmount ?? perf.actualAchievement)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${perf.achievementPercentage >= 100 ? "bg-emerald-100 text-emerald-800" : perf.achievementPercentage >= 75 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                              {perf.achievementPercentage}%
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700">
                            {money(perf.remainingAmount ?? perf.remainingOfficialTarget)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center">
                            <span className="text-xs font-semibold text-slate-500">
                              {perf.remainingPercentage ?? Math.max(0, 100 - perf.achievementPercentage)}%
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center">
                            <button
                              type="button"
                              className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              onClick={() => setSelectedTargetForHistory(entry.target._id)}
                            >
                              v{entry.target.version ?? 1}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {isComplete ? (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 size={13} /> 100% completed · Reminders closed
                              </span>
                            ) : rem?.lastReminderSentAt ? (
                              <div>
                                <span className="font-medium text-slate-700">
                                  {rem.lastReminderType === "MILESTONE" ? `${rem.lastReminderMilestone}% milestone` : rem.lastReminderType?.replaceAll("_", " ")}
                                </span>
                                <p className="text-[11px] text-slate-400">Sent {formatDate(rem.lastReminderSentAt)}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Pacing scheduled</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {!isComplete && (
                              <Button
                                variant="secondary"
                                className="h-8 px-2.5 text-xs"
                                disabled={triggerReminderMutation.isPending}
                                onClick={() => triggerReminderMutation.mutate(entry.target._id)}
                              >
                                <Send size={12} className="mr-1" /> Send Reminder
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : !item || !p ? (
        <main className="rounded-2xl border bg-white p-8 text-center shadow-soft">
          <Target className="mx-auto text-slate-300" size={36} />
          <h1 className="mt-3 text-xl font-semibold text-ink">My sales target</h1>
          <p className="mt-2 text-sm text-slate-500">No active target is assigned to you for the current period.</p>
        </main>
      ) : (
        /* =================== EMPLOYEE TARGET & PERFORMANCE VIEW =================== */
        <>
          {/* Target Version & Audit Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Layers size={14} className="text-brand-600" /> Target Version: v{target?.version ?? 1}
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {target?.status}
              </span>
              <span className="text-slate-400">·</span>
              <span>Effective: {formatDate(target?.effectiveFrom)} – {formatDate(target?.effectiveTo ?? target?.periodEnd)}</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 font-semibold text-brand-700 underline hover:text-brand-900"
              onClick={() => setSelectedTargetForHistory(target?._id ?? null)}
            >
              <History size={13} /> View Version History
            </button>
          </div>

          {/* Primary Progress Banner */}
          <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Target size={18} className="text-brand-400" /> Official Assigned Quota ({target?.periodType})
              </div>
              <div className="text-xs text-slate-400">
                Period: {formatDate(target?.periodStart)} – {formatDate(target?.periodEnd)}
              </div>
            </div>

            {/* Target vs Achieved Display */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {money(p.achievedAmount ?? p.actualAchievement)}
              </span>
              <span className="text-xl font-medium text-slate-400">
                / {money(p.targetAmount ?? p.officialTarget)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 h-3.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, p.achievementPercentage)}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-sm font-medium">
              <span className="text-emerald-400 font-semibold">{p.achievementPercentage}% Achieved</span>
              <span className="text-slate-300">{p.daysRemaining} days remaining</span>
            </div>
          </section>

          {/* 5 Core Metrics (Target Progress & Remaining Percentage) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Value</p>
              <p className="mt-2 text-2xl font-bold text-ink">{money(p.targetAmount ?? p.officialTarget)}</p>
              <p className="mt-1 text-xs text-slate-500">100% baseline quota</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Achieved Value</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{money(p.achievedAmount ?? p.actualAchievement)}</p>
              <p className="mt-1 text-xs text-slate-500">Confirmed revenue</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Achievement %</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{p.achievementPercentage}%</p>
              <p className="mt-1 text-xs text-slate-500">Current progress</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining Value</p>
              <p className="mt-2 text-2xl font-bold text-ink">{money(p.remainingAmount ?? p.remainingOfficialTarget)}</p>
              <p className="mt-1 text-xs text-slate-500">To reach 100%</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Remaining %</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {p.remainingPercentage ?? Math.max(0, 100 - p.achievementPercentage)}%
              </p>
              <p className="mt-1 text-xs text-slate-500">Still pending</p>
            </div>
          </div>

          {/* Secondary Pacing & Status Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Required Daily Pace</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{money(p.requiredDailyRunRate)}</p>
              <p className="mt-1 text-xs text-slate-500">Per remaining calendar day</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Required Weekly Pace</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{money(p.requiredWeeklyRunRate)}</p>
              <p className="mt-1 text-xs text-slate-500">Per remaining 7-day period</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projected Achievement</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{p.projectedAchievementPercentage}%</p>
              <p className="mt-1 text-xs text-slate-500">At current daily velocity</p>
            </div>
          </div>

          {/* Status & Automatic Reminder Panel */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className={`rounded-2xl border p-5 ${p.status === "AT_RISK" || p.status === "CRITICAL" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                {p.status === "AT_RISK" || p.status === "CRITICAL" ? <AlertTriangle size={18} className="text-amber-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
                Pacing Status: {p.status.replaceAll("_", " ")}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Your official quota is tracked deterministically against version v{target?.version ?? 1}. Pacing status helps prioritize client pipeline without altering quota baselines.
              </p>
            </section>

            {/* Reminder History Card */}
            <section className="rounded-2xl border bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <Bell size={18} className="text-brand-600" /> Target Reminders
                </div>
                {p.achievementPercentage >= 100 ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Completed · Reminders Stopped</span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Active</span>
                )}
              </div>

              <div className="mt-3 text-sm text-slate-600">
                {p.achievementPercentage >= 100 ? (
                  <p className="text-emerald-700 font-medium">Congratulations! You have achieved 100% of your target. Reminders have stopped automatically.</p>
                ) : reminderStatus?.lastReminderSentAt ? (
                  <div>
                    <p className="font-medium text-slate-900">
                      Latest alert: “You have achieved {p.achievementPercentage}% of your {formatDate(target?.periodStart)} target. {p.remainingPercentage}% is still remaining.”
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Delivered {formatDate(reminderStatus.lastReminderSentAt)} via {reminderStatus.history?.[0]?.channel ?? "Notification"}</p>
                  </div>
                ) : (
                  <p className="text-slate-500">Automated milestone (50%, 75%, 90%) and deadline reminders will trigger as progress updates.</p>
                )}
              </div>
            </section>
          </div>

          {/* Compensation Rule & Historical Payout Breakdown (if rule attached) */}
          {compRule && (
            <section className="rounded-2xl border bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck size={18} className="text-emerald-600" /> Active Compensation Rule (v{target?.version ?? 1})
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Historical payouts use the exact compensation rules active during this assignment period and remain immutable.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-xs text-slate-400">Commission Rate</span>
                  <p className="mt-1 font-semibold text-ink">{compRule.commissionRate}% of revenue</p>
                </div>
                {compRule.bonusThresholdPercentage && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-xs text-slate-400">Overachievement Accelerator</span>
                    <p className="mt-1 font-semibold text-ink">+{compRule.bonusRate}% above {compRule.bonusThresholdPercentage}%</p>
                  </div>
                )}
                {compRule.basePayAllocation && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <span className="text-xs text-slate-400">Base Allocation</span>
                    <p className="mt-1 font-semibold text-ink">{money(compRule.basePayAllocation)}</p>
                  </div>
                )}
                {p.payout && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-900">
                    <span className="text-xs font-semibold text-emerald-700">Estimated Total Payout</span>
                    <p className="mt-1 font-bold text-lg text-emerald-800">{money(p.payout.totalPayout)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Employee Commitment Section */}
          <section className="rounded-2xl border bg-white p-5 shadow-soft">
            <h2 className="font-semibold text-ink">Employee Commitment (Optional)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current personal target commitment: {p.employeeCommitment == null ? "Not set" : money(p.employeeCommitment)}
            </p>
            <div className="mt-4 flex max-w-sm gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Enter personal commitment"
                value={commit}
                onChange={(e) => setCommit(e.target.value)}
              />
              <Button disabled={!commit || commitMutation.isPending} onClick={() => commitMutation.mutate()}>
                Save Commitment
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Target Version History Modal */}
      {selectedTargetForHistory && (
        <div className="fixed inset-0 z-[2000] grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
          <div className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Target Version History</h3>
                <p className="text-xs text-slate-500">Immutable historical versions for audit and accurate payout calculation</p>
              </div>
              <Button variant="ghost" className="h-8 px-2" onClick={() => setSelectedTargetForHistory(null)}>
                ✕
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {versionsQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-slate-400">Loading version history…</p>
              ) : !versionsQuery.data?.items?.length ? (
                <p className="py-6 text-center text-sm text-slate-400">No version records found.</p>
              ) : (
                versionsQuery.data.items.map((ver) => (
                  <div key={ver._id} className="rounded-xl border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">Version {ver.version ?? 1}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ver.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {ver.status}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>Quota: <span className="font-semibold text-slate-700">{money(ver.revenueTarget)}</span></div>
                      <div>Effective: <span className="font-semibold text-slate-700">{formatDate(ver.effectiveFrom)} – {formatDate(ver.effectiveTo ?? ver.periodEnd)}</span></div>
                      {ver.changeReason && <div className="col-span-2">Reason: <span className="text-slate-700">{ver.changeReason}</span></div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedTargetForHistory(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
