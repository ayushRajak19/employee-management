import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileSpreadsheet, ListChecks, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { LeadImportDialog } from "@/features/work/LeadImportDialog";
import { LeadWorkbench } from "@/features/work/LeadWorkbench";
import { workApi, type Task } from "@/features/work/workApi";

export const LeadWorkPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: workApi.tasks });
  const projects = useQuery({ queryKey: ["projects"], queryFn: workApi.projects });
  const employees = useQuery({ queryKey: ["employees", "lead-work"], queryFn: () => employeeApi.list(new URLSearchParams({ page: "1", limit: "100" })), enabled: importOpen });
  const canCreate = Boolean(user?.permissions.includes("task.create") && user.permissions.includes("task.assign"));
  const leadTasks = useMemo(() => (tasks.data?.items ?? []).filter((task) => (task as Task & { taskType?: string }).taskType === "LEAD_LIST" && task.name.toLowerCase().includes(search.trim().toLowerCase())), [tasks.data?.items, search]);
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["tasks"] }), queryClient.invalidateQueries({ queryKey: ["projects"] })]); };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1500px]">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-emerald-700">Sales execution</p><h1 className="mt-1 text-3xl font-semibold">Lead Work</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Import, assign and work lead lists in one accountable workspace. Every interaction, note and follow-up remains visible in history.</p></div>{canCreate && <Button onClick={() => setImportOpen(true)}><Plus size={17}/> New lead list</Button>}</header>
    <section className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 text-slate-500"><FileSpreadsheet size={17}/><span className="text-xs font-medium">Lead assignments</span></div><p className="mt-2 text-2xl font-semibold">{leadTasks.length}</p></div><div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 text-slate-500"><ListChecks size={17}/><span className="text-xs font-medium">Active tasks</span></div><p className="mt-2 text-2xl font-semibold">{leadTasks.filter((task) => !["COMPLETED", "CANCELLED"].includes(task.status)).length}</p></div><div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2 text-slate-500"><Users size={17}/><span className="text-xs font-medium">Your visible scope</span></div><p className="mt-2 text-sm font-semibold">{user?.role.replaceAll("_", " ")}</p></div></section>
    <label className="relative mt-6 block max-w-xl"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><Input className="pl-10" aria-label="Search lead assignments" placeholder="Search lead assignments" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
    {tasks.isLoading ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item) => <div className="h-52 animate-pulse rounded-2xl bg-slate-100" key={item}/>)}</div> : leadTasks.length ? <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{leadTasks.map((task) => <article className="flex min-h-56 flex-col rounded-2xl border bg-white p-5 shadow-sm" key={task._id}><div className="flex items-start justify-between gap-3"><div><span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">{task.taskId}</span><h2 className="mt-2 text-lg font-semibold leading-6">{task.name}</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{task.status.replaceAll("_", " ")}</span></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{task.description || "No instructions provided."}</p><div className="mt-auto flex items-end justify-between border-t pt-4"><div><p className="text-xs text-slate-400">Assigned to</p><p className="mt-1 text-sm font-medium">{task.assignedEmployee.firstName} {task.assignedEmployee.lastName}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarClock size={14}/>{new Date(task.deadline).toLocaleDateString()}</p></div><Button onClick={() => setActiveTask(task)}>Open workbench</Button></div></article>)}</section> : <section className="mt-6 rounded-2xl border border-dashed bg-white px-6 py-16 text-center"><FileSpreadsheet className="mx-auto text-slate-300" size={40}/><h2 className="mt-4 font-semibold">No lead assignments yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{canCreate ? "Create a lead list to import a spreadsheet and assign the work." : "No lead lists are currently assigned within your scope."}</p>{canCreate && <Button className="mt-5" onClick={() => setImportOpen(true)}><Plus size={16}/> New lead list</Button>}</section>}
  </div>
  {importOpen && <LeadImportDialog projects={projects.data?.items ?? []} employees={employees.data?.items ?? []} onClose={() => setImportOpen(false)} onCreated={async (task) => { await refresh(); setActiveTask(task); }}/>} 
  {activeTask && <LeadWorkbench task={activeTask} onClose={() => setActiveTask(null)}/>} 
  </main>;
};
