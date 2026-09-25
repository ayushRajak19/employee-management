import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CalendarDays, Plus, X, Calendar, ChevronLeft, ChevronRight, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { peopleOpsApi } from "@/features/peopleOps/peopleOpsApi";

type Tab = "leave" | "calendar" | "recognition";
type Dialog = "leave" | "recognition" | null;

export const PeopleOpsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEmployee = user?.role === "EMPLOYEE";
  const [tab, setTab] = useState<Tab>("leave");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [leave, setLeave] = useState({ type: "CASUAL_LEAVE", startDate: "", endDate: "", reason: "" });
  const [award, setAward] = useState({ employee: "", badge: "QUALITY_CHAMPION", explanation: "", evidence: [] as string[] });

  // Calendar month state: YYYY-MM
  const now = new Date();
  const [calMonth, setCalMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const leaves = useQuery({ queryKey: ["leaves"], queryFn: peopleOpsApi.leaves });
  const balances = useQuery({ queryKey: ["leaveBalances"], queryFn: () => peopleOpsApi.leaveBalances() });
  const teamCal = useQuery({ queryKey: ["teamCalendar", calMonth], queryFn: () => peopleOpsApi.teamCalendar(calMonth) });
  const recognition = useQuery({ queryKey: ["recognition"], queryFn: peopleOpsApi.recognition });
  const employees = useQuery({ queryKey: ["employees", "recognition"], queryFn: () => employeeApi.list(new URLSearchParams({ page: "1", limit: "100" })), enabled: dialog === "recognition" });

  const create = useMutation({
    mutationFn: () => dialog === "leave" ? peopleOpsApi.requestLeave(leave) : peopleOpsApi.award(award),
    onSuccess: async () => {
      const completedDialog = dialog;
      setDialog(null);
      if (completedDialog === "leave") setLeave({ type: "CASUAL_LEAVE", startDate: "", endDate: "", reason: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
        queryClient.invalidateQueries({ queryKey: ["teamCalendar"] }),
        queryClient.invalidateQueries({ queryKey: ["recognition"] })
      ]);
    }
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => peopleOpsApi.reviewLeave(id, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
        queryClient.invalidateQueries({ queryKey: ["teamCalendar"] })
      ]);
    }
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "leave", label: "Leave Requests" },
    { key: "calendar", label: "Team Leave Calendar" },
    { key: "recognition", label: "Recognition" },
  ];

  const changeMonth = (delta: number) => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div>
          <p className="text-sm font-medium text-brand-700">{isEmployee ? "My workspace" : "People operations"}</p>
          <h1 className="mt-1 text-3xl font-semibold">Leave & recognition</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isEmployee ? "Request leave, track your annual quotas, and review team availability." : "Review employee leave requests, team calendar schedules, and manage recognition."}
          </p>
        </div>

        {/* Balance cards for employees or when viewing leaves */}
        {balances.data?.items && balances.data.items.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {balances.data.items.map((b) => (
              <div key={b.type} className="rounded-2xl border bg-white p-4 shadow-soft">
                <p className="text-xs font-medium text-slate-400">{b.type.replaceAll("_", " ")}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">{b.type === "UNPAID_LEAVE" ? b.usedDays : b.remainingDays}</span>
                  <span className="text-xs text-slate-400">{b.type === "UNPAID_LEAVE" ? "days taken" : `left of ${b.quotaDays}`}</span>
                </div>
                {b.type !== "UNPAID_LEAVE" && (
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.remainingDays === 0 ? "bg-red-500" : b.remainingDays <= 3 ? "bg-amber-500" : "bg-brand-600"}`}
                      style={{ width: `${Math.min(100, Math.round((b.usedDays / b.quotaDays) * 100))}%` }}
                    />
                  </div>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {b.type === "UNPAID_LEAVE" ? "Unlimited policy" : `${b.usedDays} days utilized`}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 flex gap-1 rounded-xl border bg-white p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`h-10 rounded-lg px-4 text-sm font-medium transition ${tab === key ? "bg-ink text-white" : "text-slate-500 hover:text-slate-900"}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "leave" && (
          <section className="mt-5 rounded-2xl border bg-white shadow-soft">
            <div className="flex items-center border-b p-5">
              <CalendarDays size={17} className="text-brand-600"/>
              <div className="ml-2">
                <h2 className="font-semibold">{isEmployee ? "My leave requests" : "Employee leave requests"}</h2>
                <p className="text-xs text-slate-400">{isEmployee ? "Track your submitted requests, remaining balance, and decisions." : "Approve or reject requests within your authorized scope."}</p>
              </div>
              {isEmployee && (
                <Button className="ml-auto h-9" onClick={() => { create.reset(); setDialog("leave"); }}>
                  <Plus size={14}/> Request leave
                </Button>
              )}
            </div>
            <div className="divide-y">
              {leaves.data?.items.length ? (
                leaves.data.items.map((item) => (
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center" key={item._id}>
                    <div>
                      {!isEmployee && (
                        <p className="text-sm font-semibold">
                          {item.employee.firstName} {item.employee.lastName} <span className="font-normal text-slate-400">· {item.employee.employeeId}</span>
                        </p>
                      )}
                      <p className={`${isEmployee ? "text-sm font-semibold" : "text-xs text-slate-400"}`}>
                        {item.type.replaceAll("_", " ")} · {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{item.reason}</p>
                      {item.reviewComment && <p className="mt-1 text-xs text-slate-400">Review: {item.reviewComment}</p>}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold sm:ml-auto ${item.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : item.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {item.status}
                    </span>
                    {item.status === "PENDING" && !isEmployee && user?.permissions.includes("performance.review") && (
                      <div className="flex gap-1">
                        <Button variant="ghost" className="h-9 text-red-600" disabled={review.isPending} onClick={() => review.mutate({ id: item._id, status: "REJECTED" })}>
                          Reject
                        </Button>
                        <Button variant="secondary" className="h-9" disabled={review.isPending} onClick={() => review.mutate({ id: item._id, status: "APPROVED" })}>
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="p-10 text-center text-sm text-slate-400">{isEmployee ? "You have not requested leave yet." : "No employee leave requests."}</p>
              )}
            </div>
          </section>
        )}

        {tab === "calendar" && (
          <section className="mt-5 rounded-2xl border bg-white shadow-soft">
            <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-600" />
                <div>
                  <h2 className="font-semibold">Team Leave Calendar</h2>
                  <p className="text-xs text-slate-400">View approved planned leaves across your team to coordinate project sprints.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-9 px-3" onClick={() => changeMonth(-1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="min-w-[120px] text-center text-sm font-semibold">
                  {new Date(`${calMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <Button variant="secondary" className="h-9 px-3" onClick={() => changeMonth(1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div className="p-5">
              {teamCal.isLoading ? (
                <p className="py-12 text-center text-sm text-slate-400">Loading schedule…</p>
              ) : teamCal.data?.items && teamCal.data.items.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teamCal.data.items.map((item) => (
                    <div key={item._id} className="rounded-xl border p-4 transition hover:border-brand-300">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{item.employee.firstName} {item.employee.lastName}</p>
                          <p className="text-xs text-slate-400">{item.employee.employeeId}</p>
                        </div>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-700">
                          {item.type.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span>{new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 italic">"{item.reason}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400">
                  <UserCheck size={28} className="mx-auto text-slate-300 mb-2" />
                  No approved team leaves scheduled for this month. Full team availability!
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "recognition" && (
          <section className="mt-5 rounded-2xl border bg-white shadow-soft">
            <div className="flex items-center border-b p-5">
              <Award size={17} className="text-violet-600"/>
              <h2 className="ml-2 font-semibold">{isEmployee ? "My recognition" : "Data-backed recognition"}</h2>
              {!isEmployee && user?.permissions.includes("performance.review") && (
                <Button className="ml-auto h-9" onClick={() => { create.reset(); setDialog("recognition"); }}>
                  <Plus size={14}/> Award
                </Button>
              )}
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {recognition.data?.items.length ? (
                recognition.data.items.map((item) => (
                  <article className="rounded-xl bg-violet-50 p-4" key={item._id}>
                    <p className="text-xs font-semibold text-violet-700">{item.badge.replaceAll("_", " ")}</p>
                    {!isEmployee && <p className="mt-2 text-sm font-semibold">{item.employee.firstName} {item.employee.lastName}</p>}
                    <p className="mt-2 text-xs leading-5 text-violet-600">{item.explanation}</p>
                  </article>
                ))
              ) : (
                <p className="col-span-full p-8 text-center text-sm text-slate-400">No recognition yet.</p>
              )}
            </div>
          </section>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4">
          <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold">{dialog === "leave" ? "Request leave" : "Award recognition"}</h2>
              <button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close" onClick={() => setDialog(null)}>
                <X size={17}/>
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {dialog === "leave" ? (
                <>
                  <label className="block text-sm font-medium">
                    Type
                    <select className="mt-2 h-11 w-full rounded-xl border px-3" value={leave.type} onChange={(event) => setLeave({ ...leave, type: event.target.value })}>
                      {["CASUAL_LEAVE", "SICK_LEAVE", "PAID_LEAVE", "WORK_FROM_HOME", "UNPAID_LEAVE", "OTHER"].map((item) => (
                        <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium">
                      From
                      <Input required type="date" className="mt-2" value={leave.startDate} onChange={(event) => setLeave({ ...leave, startDate: event.target.value })}/>
                    </label>
                    <label className="text-sm font-medium">
                      To
                      <Input required type="date" min={leave.startDate} className="mt-2" value={leave.endDate} onChange={(event) => setLeave({ ...leave, endDate: event.target.value })}/>
                    </label>
                  </div>
                  <label className="block text-sm font-medium">
                    Reason
                    <textarea required minLength={3} maxLength={2000} rows={3} className="mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50" placeholder="Briefly explain the reason for this leave request." value={leave.reason} onChange={(event) => setLeave({ ...leave, reason: event.target.value })}/>
                  </label>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium">
                    Employee
                    <select required className="mt-2 h-11 w-full rounded-xl border px-3" value={award.employee} onChange={(event) => setAward({ ...award, employee: event.target.value })}>
                      <option value="">Select employee</option>
                      {employees.data?.items.map((item) => (
                        <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Badge
                    <select className="mt-2 h-11 w-full rounded-xl border px-3" value={award.badge} onChange={(event) => setAward({ ...award, badge: event.target.value })}>
                      {["TOP_PERFORMER", "QUALITY_CHAMPION", "SKILL_MASTER", "FAST_LEARNER", "ON_TIME_DELIVERY", "CUSTOMER_CHAMPION", "MENTOR"].map((item) => (
                        <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Evidence-based explanation
                    <Input required minLength={5} className="mt-2" placeholder="Describe the achievement and supporting evidence." value={award.explanation} onChange={(event) => setAward({ ...award, explanation: event.target.value })}/>
                  </label>
                </>
              )}
            </div>
            {create.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button disabled={create.isPending}>{create.isPending ? "Saving..." : dialog === "leave" ? "Submit request" : "Save"}</Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};


