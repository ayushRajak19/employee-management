import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CalendarDays, Plus, X, Calendar, ChevronLeft, ChevronRight, UserCheck, Clock, Pencil, Trash2 } from "lucide-react";
import type { LeaveBalanceItem } from "@mobius-ems/shared";
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
  const canManagePolicies = Boolean(
    user?.permissions?.includes("settings.manage") ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "HR_ADMIN"
  );
  const [tab, setTab] = useState<Tab>("leave");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [leave, setLeave] = useState({ type: "CASUAL_LEAVE", startDate: "", endDate: "", reason: "" });
  const [award, setAward] = useState({ employee: "", badge: "QUALITY_CHAMPION", explanation: "", evidence: [] as string[] });

  // Policy modal state
  const [policyDialog, setPolicyDialog] = useState<"add" | "edit" | null>(null);
  const [policyForm, setPolicyForm] = useState<{
    id?: string;
    name: string;
    code: string;
    quotaDays: number;
    isPaid: boolean;
    description: string;
    isSystem?: boolean;
  }>({
    name: "",
    code: "",
    quotaDays: 12,
    isPaid: true,
    description: "",
  });
  const [policyError, setPolicyError] = useState<string | null>(null);

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

  const createPolicyMutation = useMutation({
    mutationFn: (data: { name: string; code?: string; quotaDays: number; isPaid?: boolean; description?: string }) =>
      peopleOpsApi.createPolicy(data),
    onSuccess: async () => {
      setPolicyDialog(null);
      setPolicyError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      ]);
    },
    onError: (err: Error) => {
      setPolicyError(err.message || "Failed to create leave policy");
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; quotaDays?: number; isPaid?: boolean; description?: string } }) =>
      peopleOpsApi.updatePolicy(id, data),
    onSuccess: async () => {
      setPolicyDialog(null);
      setPolicyError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      ]);
    },
    onError: (err: Error) => {
      setPolicyError(err.message || "Failed to update leave policy");
    },
  });

  const deletePolicyMutation = useMutation({
    mutationFn: (id: string) => peopleOpsApi.deletePolicy(id),
    onSuccess: async () => {
      setPolicyDialog(null);
      setPolicyError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaveBalances"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves"] }),
      ]);
    },
    onError: (err: Error) => {
      setPolicyError(err.message || "Failed to deactivate leave policy");
    },
  });

  const openEditModal = (item: LeaveBalanceItem) => {
    setPolicyError(null);
    setPolicyForm({
      id: item.id,
      name: item.name || item.type.replaceAll("_", " "),
      code: item.type,
      quotaDays: item.quotaDays,
      isPaid: item.isPaid ?? true,
      description: item.description || "",
      isSystem: item.isSystem ?? false,
    });
    setPolicyDialog("edit");
  };

  const openAddModal = () => {
    setPolicyError(null);
    setPolicyForm({
      name: "",
      code: "",
      quotaDays: 12,
      isPaid: true,
      description: "",
      isSystem: false,
    });
    setPolicyDialog("add");
  };

  const openLeaveRequestDialog = () => {
    create.reset();
    const defaultType = balances.data?.items?.[0]?.type || "CASUAL_LEAVE";
    setLeave({ type: defaultType, startDate: "", endDate: "", reason: "" });
    setDialog("leave");
  };

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

        {/* Balance cards for employees and quota management for admins */}
        <div className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Leave Quotas & Balances</h2>
              <p className="text-xs text-slate-400">
                {canManagePolicies
                  ? "Configurable company leave quotas. Click any card or icon to edit quotas or add custom policies."
                  : "Your active annual leave allowances and tracked usage for the current year."}
              </p>
            </div>
            {canManagePolicies && (
              <Button
                variant="secondary"
                className="h-8 gap-1.5 px-3 text-xs self-start sm:self-auto"
                onClick={openAddModal}
              >
                <Plus size={14} /> Add Leave Policy
              </Button>
            )}
          </div>

          {balances.data?.items && balances.data.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {balances.data.items.map((b) => {
                const isUnlimited = b.quotaDays >= 999 || b.type === "UNPAID_LEAVE";
                return (
                  <div
                    key={b.type}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-soft transition hover:border-brand-300 hover:shadow-md ${
                      canManagePolicies && b.id ? "cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      if (canManagePolicies && b.id) {
                        openEditModal(b);
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-700 truncate pr-1" title={b.name || b.type.replaceAll("_", " ")}>
                          {b.name || b.type.replaceAll("_", " ")}
                        </p>
                        {canManagePolicies && b.id && (
                          <button
                            type="button"
                            className="text-slate-300 opacity-60 group-hover:opacity-100 hover:text-brand-600 transition p-0.5"
                            title="Edit Quota Policy"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(b);
                            }}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900">
                          {isUnlimited ? b.usedDays : b.remainingDays}
                        </span>
                        <span className="text-xs text-slate-400">
                          {isUnlimited ? "days taken" : `left of ${b.quotaDays}`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {!isUnlimited && (
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              b.remainingDays === 0
                                ? "bg-red-500"
                                : b.remainingDays <= 3
                                ? "bg-amber-500"
                                : "bg-brand-600"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((b.usedDays / Math.max(1, b.quotaDays)) * 100))}%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{isUnlimited ? "Unlimited policy" : `${b.usedDays} days utilized`}</span>
                        {b.isPaid === false && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                            Unpaid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">
              No leave policies configured.
              {canManagePolicies && (
                <div className="mt-2">
                  <Button variant="secondary" className="h-8 text-xs" onClick={openAddModal}>
                    <Plus size={14} /> Add First Leave Policy
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

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
                <Button className="ml-auto h-9" onClick={openLeaveRequestDialog}>
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
                    <select
                      className="mt-2 h-11 w-full rounded-xl border px-3"
                      value={leave.type}
                      onChange={(event) => setLeave({ ...leave, type: event.target.value })}
                    >
                      {balances.data?.items && balances.data.items.length > 0 ? (
                        balances.data.items.map((b) => (
                          <option key={b.type} value={b.type}>
                            {b.name || b.type.replaceAll("_", " ")} {b.quotaDays >= 999 ? "(Unlimited)" : `(${b.remainingDays !== undefined ? `${b.remainingDays} days left` : `${b.quotaDays} days`})`}
                          </option>
                        ))
                      ) : (
                        ["CASUAL_LEAVE", "SICK_LEAVE", "PAID_LEAVE", "WORK_FROM_HOME", "UNPAID_LEAVE", "OTHER"].map((item) => (
                          <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                        ))
                      )}
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

      {policyDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              setPolicyError(null);
              if (policyDialog === "add") {
                createPolicyMutation.mutate({
                  name: policyForm.name.trim(),
                  code: policyForm.code ? policyForm.code.trim().toUpperCase().replace(/\s+/g, "_") : undefined,
                  quotaDays: Number(policyForm.quotaDays),
                  isPaid: policyForm.isPaid,
                  description: policyForm.description ? policyForm.description.trim() : undefined,
                });
              } else if (policyDialog === "edit" && policyForm.id) {
                updatePolicyMutation.mutate({
                  id: policyForm.id,
                  data: {
                    name: policyForm.name.trim(),
                    quotaDays: Number(policyForm.quotaDays),
                    isPaid: policyForm.isPaid,
                    description: policyForm.description ? policyForm.description.trim() : undefined,
                  },
                });
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {policyDialog === "add" ? "Add Leave Policy" : "Edit Leave Quota"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {policyDialog === "add"
                    ? "Create a new company leave type and define annual employee quota."
                    : `Adjust quota days and settings for ${policyForm.name || "this policy"}.`}
                </p>
              </div>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
                onClick={() => setPolicyDialog(null)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Policy Name
                <Input
                  required
                  placeholder="e.g. Maternity Leave, Paternity Leave, Comp-Off"
                  className="mt-1.5"
                  value={policyForm.name}
                  onChange={(event) => setPolicyForm({ ...policyForm, name: event.target.value })}
                />
              </label>

              {policyDialog === "add" && (
                <label className="block text-sm font-medium text-slate-700">
                  Policy Code <span className="text-xs font-normal text-slate-400">(Optional, auto-generated if blank)</span>
                  <Input
                    placeholder="e.g. MATERNITY_LEAVE"
                    className="mt-1.5 font-mono text-xs uppercase"
                    value={policyForm.code}
                    onChange={(event) => setPolicyForm({ ...policyForm, code: event.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Annual Quota (Days)
                  <Input
                    required
                    type="number"
                    min={0}
                    max={999}
                    placeholder="e.g. 15"
                    className="mt-1.5"
                    value={policyForm.quotaDays}
                    onChange={(event) => setPolicyForm({ ...policyForm, quotaDays: Number(event.target.value) })}
                  />
                  <span className="mt-1 block text-[10px] text-slate-400">Set 999 for unlimited</span>
                </label>

                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 select-none">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={policyForm.isPaid}
                      onChange={(event) => setPolicyForm({ ...policyForm, isPaid: event.target.checked })}
                    />
                    <span>Paid Leave</span>
                  </label>
                  <span className="mt-1 pl-6 text-[10px] text-slate-400">
                    {policyForm.isPaid ? "Deducted with full pay" : "Unpaid leave"}
                  </span>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Description <span className="text-xs font-normal text-slate-400">(Optional)</span>
                <textarea
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
                  placeholder="Provide context or eligibility criteria for this leave."
                  value={policyForm.description}
                  onChange={(event) => setPolicyForm({ ...policyForm, description: event.target.value })}
                />
              </label>

              {policyDialog === "edit" && !policyForm.isSystem && (
                <div className="border-t pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
                    disabled={deletePolicyMutation.isPending}
                    onClick={() => {
                      if (policyForm.id && confirm(`Are you sure you want to deactivate "${policyForm.name}"?`)) {
                        deletePolicyMutation.mutate(policyForm.id);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                    Deactivate this leave policy
                  </Button>
                </div>
              )}
            </div>

            {(policyError || createPolicyMutation.error || updatePolicyMutation.error || deletePolicyMutation.error) && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {policyError ||
                  createPolicyMutation.error?.message ||
                  updatePolicyMutation.error?.message ||
                  deletePolicyMutation.error?.message}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPolicyDialog(null)}>
                Cancel
              </Button>
              <Button
                disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending || deletePolicyMutation.isPending}
              >
                {createPolicyMutation.isPending || updatePolicyMutation.isPending ? "Saving..." : policyDialog === "add" ? "Add Policy" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};


