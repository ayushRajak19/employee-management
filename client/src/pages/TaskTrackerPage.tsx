import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, CirclePlus, ClipboardList, Clock3, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { todoApi, type DailyTodo, type TrackerInput, type TrackerPriority, type TrackerStatus, type TrackerType } from "@/features/todos/todoApi";
import { cn } from "@/lib/cn";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const defaultDeadline = (date: string) => `${date}T18:00`;
const blankDraft = (date: string): TrackerInput & { deadlineLocal: string } => ({ date, title: "", type: "WORK", priority: "MEDIUM", durationMinutes: 30, deadlineLocal: defaultDeadline(date) });
const itemStatus = (item: DailyTodo): TrackerStatus => item.status ?? (item.completed ? "COMPLETED" : "TODO");
const itemType = (item: DailyTodo): TrackerType => item.type ?? "WORK";
const itemPriority = (item: DailyTodo): TrackerPriority => item.priority ?? "MEDIUM";
const duration = (minutes = 30) => minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : `${minutes}m`;
const deadlineText = (value?: string) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not set";
const priorityStyle: Record<TrackerPriority, string> = { LOW: "bg-slate-100 text-slate-600", MEDIUM: "bg-blue-50 text-blue-700", HIGH: "bg-amber-50 text-amber-700", URGENT: "bg-red-50 text-red-700" };
const statusStyle: Record<TrackerStatus, string> = { TODO: "bg-slate-100 text-slate-700", IN_PROGRESS: "bg-violet-50 text-violet-700", COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-red-50 text-red-700" };

export const TaskTrackerPage = () => {
  const { user } = useAuth();
  const employeeView = user?.role === "EMPLOYEE";
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState<TrackerStatus | "">("");
  const [editing, setEditing] = useState<DailyTodo | null | "new">(null);
  const [draft, setDraft] = useState(blankDraft(date));
  const query = useQuery({ queryKey: ["task-tracker", date, status], queryFn: () => todoApi.list({ date, ...(status ? { status } : {}) }) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["task-tracker"] });
  const save = useMutation({
    mutationFn: () => {
      const body: TrackerInput = { date: draft.date, title: draft.title.trim(), type: draft.type, priority: draft.priority, durationMinutes: Number(draft.durationMinutes), ...(draft.deadlineLocal ? { deadline: new Date(draft.deadlineLocal).toISOString() } : {}) };
      return editing === "new" ? todoApi.create(body) : todoApi.update(editing!._id, body);
    },
    onSuccess: async () => { setEditing(null); await refresh(); }
  });
  const updateStatus = useMutation({ mutationFn: ({ id, next }: { id: string; next: TrackerStatus }) => todoApi.update(id, { status: next }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: todoApi.remove, onSuccess: refresh });
  const items = query.data?.items ?? [];
  const summary = { total: items.length, open: items.filter((item) => ["TODO", "IN_PROGRESS"].includes(itemStatus(item))).length, completed: items.filter((item) => itemStatus(item) === "COMPLETED").length, urgent: items.filter((item) => itemPriority(item) === "URGENT").length };
  const openNew = () => { setDraft(blankDraft(date)); setEditing("new"); save.reset(); };
  const openEdit = (item: DailyTodo) => { setDraft({ date: item.date, title: item.title, type: itemType(item), priority: itemPriority(item), durationMinutes: item.durationMinutes ?? 30, deadlineLocal: item.deadline ? new Date(new Date(item.deadline).getTime() - new Date(item.deadline).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "" }); setEditing(item); save.reset(); };

  return <main className="flex-1 px-4 py-7 sm:px-8 sm:py-9">
    <div className="mx-auto flex max-w-[1500px] flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">{employeeView ? "My workspace" : "Employee oversight"}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{employeeView ? "My task tracker" : "Employee task tracker"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{employeeView ? "Plan and update your day in one structured place. Tracker completion and deadlines appear in Super Admin planning analytics; formal scores still require reviewed evidence." : "Read-only visibility into employee-created planning activity, completion, urgency and overdue signals alongside formal performance evidence."}</p></div>
        {employeeView && <Button onClick={openNew}><CirclePlus size={17}/> Add task</Button>}
      </div>

      <section className="order-3 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Total tasks", value: summary.total, icon: ClipboardList, color: "text-brand-700 bg-brand-50" }, { label: "Open", value: summary.open, icon: Clock3, color: "text-violet-700 bg-violet-50" }, { label: "Completed", value: summary.completed, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50" }, { label: "Urgent", value: summary.urgent, icon: CalendarClock, color: "text-red-700 bg-red-50" }].map(({ label, value, icon: Icon, color }) => <article className="rounded-2xl border bg-white p-4 shadow-soft" key={label}><div className={cn("grid size-9 place-items-center rounded-xl", color)}><Icon size={17}/></div><p className="mt-3 text-2xl font-bold">{value}</p><p className="text-xs text-slate-400">{label}</p></article>)}
      </section>

      <section className="order-2 mt-6 overflow-hidden rounded-2xl border bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-2"><ClipboardList size={18} className="text-brand-600"/><h2 className="font-semibold">Master task tracker</h2></div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <Input aria-label="Tracker date" type="date" value={date} onChange={(event) => setDate(event.target.value)}/>
            <select aria-label="Filter by status" className="h-11 rounded-xl border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as TrackerStatus | "")}><option value="">All statuses</option>{["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-white"><tr><th className="w-12 px-4 py-3 text-center">#</th><th className="px-4 py-3">Task</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Status</th>{employeeView && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead>
            <tbody className="divide-y">
              {items.map((item, index) => { const currentStatus = itemStatus(item); const employee = item.employee; return <tr key={item._id} className="transition hover:bg-slate-50/80"><td className="px-4 py-4 text-center text-xs font-semibold text-slate-400">{index + 1}</td><td className="max-w-xs px-4 py-4"><p className="font-semibold text-ink">{item.title}</p><p className="mt-1 text-[10px] text-slate-400">Created {new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p></td><td className="px-4 py-4"><span className="text-xs font-medium text-slate-600">{itemType(item).replaceAll("_", " ")}</span></td><td className="px-4 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", priorityStyle[itemPriority(item)])}>{itemPriority(item)}</span></td><td className="px-4 py-4"><p className="text-xs font-semibold">{employee ? `${employee.firstName} ${employee.lastName}` : user?.name}</p><p className="mt-1 text-[10px] text-slate-400">{employee?.employeeId ?? "My task"}{employee?.department?.name ? ` · ${employee.department.name}` : ""}</p></td><td className="px-4 py-4 text-xs font-medium">{duration(item.durationMinutes)}</td><td className="px-4 py-4 text-xs"><p className="font-medium">{deadlineText(item.deadline)}</p></td><td className="px-4 py-4">{employeeView ? <select aria-label={`Status for ${item.title}`} className={cn("h-9 rounded-lg border-0 px-2 text-[10px] font-bold", statusStyle[currentStatus])} value={currentStatus} disabled={updateStatus.isPending} onChange={(event) => updateStatus.mutate({ id: item._id, next: event.target.value as TrackerStatus })}>{["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select> : <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", statusStyle[currentStatus])}>{currentStatus.replaceAll("_", " ")}</span>}</td>{employeeView && <td className="px-4 py-4"><div className="flex justify-end gap-1"><button type="button" aria-label={`Edit ${item.title}`} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => openEdit(item)}><Pencil size={14}/></button><button type="button" aria-label={`Delete ${item.title}`} className="grid size-9 place-items-center rounded-lg text-red-500 hover:bg-red-50" onClick={() => { if (window.confirm(`Delete “${item.title}”?`)) remove.mutate(item._id); }}><Trash2 size={14}/></button></div></td>}</tr>; })}
              {!query.isLoading && !items.length && <tr><td colSpan={employeeView ? 9 : 8} className="px-6 py-16 text-center"><ClipboardList className="mx-auto text-slate-300" size={34}/><p className="mt-3 font-medium text-slate-500">No tracker items for this date</p><p className="mt-1 text-xs text-slate-400">{employeeView ? "Add your first task to start planning the day." : "Employees have not added tasks for the selected date."}</p></td></tr>}
            </tbody>
          </table>
        </div>
        {(query.error || updateStatus.error || remove.error) && <p role="alert" className="border-t bg-red-50 px-5 py-3 text-sm text-red-700">{(query.error || updateStatus.error || remove.error)?.message}</p>}
      </section>
    </div>

    {employeeView && editing && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
      <form className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); if (draft.title.trim()) save.mutate(); }}>
        <div className="flex items-start"><div><p className="text-sm font-semibold text-brand-700">Personal planning</p><h2 className="mt-1 text-2xl font-bold">{editing === "new" ? "Add tracker task" : "Edit tracker task"}</h2></div><button type="button" aria-label="Close task editor" className="ml-auto grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100" onClick={() => setEditing(null)}><X size={18}/></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-semibold">Task<Input className="mt-2" maxLength={240} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="What needs to be done?"/></label>
          <label className="text-sm font-semibold">Type<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as TrackerType }))}>{["WORK", "MEETING", "LEARNING", "FOLLOW_UP", "PERSONAL", "OTHER"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <label className="text-sm font-semibold">Priority<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as TrackerPriority }))}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="text-sm font-semibold">Duration (minutes)<Input className="mt-2" type="number" min={5} max={1440} step={5} value={draft.durationMinutes} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}/></label>
          <label className="text-sm font-semibold">Deadline<Input className="mt-2" type="datetime-local" required value={draft.deadlineLocal} onChange={(event) => setDraft((current) => ({ ...current, deadlineLocal: event.target.value }))}/></label>
        </div>
        {save.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{save.error.message}</p>}
        <div className="mt-7 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!draft.title.trim() || save.isPending}>{save.isPending ? "Saving…" : editing === "new" ? "Add task" : "Save changes"}</Button></div>
      </form>
    </div>}
  </main>;
};
