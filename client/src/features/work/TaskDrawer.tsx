import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, History, RotateCcw, Trash2, UserRoundCog, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { workApi, type Task } from "./workApi";

const normalizeOptionalUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const TaskDrawer = ({ task, onClose, onRefresh }: { task: Task; onClose: () => void; onRefresh: () => Promise<unknown> }) => {
  const { user } = useAuth();
  const canReview = user?.permissions.includes("task.review");
  const canManage = user?.permissions.includes("task.assign") ?? false;
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [actualHours, setActualHours] = useState(task.actualHours ?? task.estimatedHours);
  const [completionNote, setCompletionNote] = useState(task.completionNote ?? "");
  const [deliverableUrl, setDeliverableUrl] = useState(task.deliverableUrl ?? "");
  const [businessImpact, setBusinessImpact] = useState(task.businessImpact ?? "");
  const [showReassign, setShowReassign] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [nextAssignee, setNextAssignee] = useState(task.assignedEmployee._id);

  const activity = useQuery({ queryKey: ["task", task._id, "activity"], queryFn: () => workApi.activity(task._id) });
  const employees = useQuery({
    queryKey: ["employees", "task-reassignment"],
    queryFn: () => employeeApi.list(new URLSearchParams({ page: "1", limit: "100" })),
    enabled: canManage
  });
  const action = useMutation({
    mutationFn: (body: { status: string; actualHours?: number; completionNote?: string; deliverableUrl?: string; businessImpact?: string }) => workApi.transition(task._id, body),
    onSuccess: async () => { await onRefresh(); onClose(); }
  });
  const review = useMutation({
    mutationFn: (approve: boolean) => workApi.review(task._id, { qualityRating: Number(rating), reviewComment: comment || undefined, approve }),
    onSuccess: async () => { await onRefresh(); onClose(); }
  });
  const reassign = useMutation({
    mutationFn: () => workApi.reassign(task._id, nextAssignee),
    onSuccess: async () => { await onRefresh(); onClose(); }
  });
  const remove = useMutation({
    mutationFn: () => workApi.remove(task._id),
    onSuccess: async () => { await onRefresh(); onClose(); }
  });

  return <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex min-w-0 items-start border-b bg-white/95 p-4 backdrop-blur sm:p-6">
        <div className="min-w-0"><p className="text-xs font-semibold text-brand-700">{task.taskId}</p><h2 className="mt-1 break-words text-lg font-semibold sm:text-xl">{task.name}</h2><p className="mt-1 break-words text-sm text-slate-400">{task.project.name}</p></div>
        <button className="ml-auto grid size-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100" aria-label="Close task" onClick={onClose}><X size={18}/></button>
      </header>
      <div className="min-w-0 p-4 sm:p-6">
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">{[
          { label: "Status", value: task.status.replaceAll("_", " ") },
          { label: "Priority", value: task.priority },
          { label: "Estimate", value: `${task.estimatedHours}h` },
          { label: "Reopens", value: task.reopenCount }
        ].map((item) => <div className="min-w-0 overflow-hidden rounded-xl bg-slate-50 p-3" key={item.label}><p className="text-[10px] uppercase text-slate-400">{item.label}</p><p className="mt-1 break-words text-xs font-semibold">{item.value}</p></div>)}</div>
        <p className="mt-4 text-sm text-slate-500">Assigned to <span className="font-semibold text-slate-700">{task.assignedEmployee.firstName} {task.assignedEmployee.lastName}</span></p>
        {task.description && <p className="mt-6 text-sm leading-6 text-slate-600">{task.description}</p>}

        <section className="mt-7 rounded-2xl border p-5">
          <h3 className="font-semibold">Task actions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {task.status === "NOT_STARTED" && <Button onClick={() => action.mutate({ status: "IN_PROGRESS" })}>Start task</Button>}
            {task.status === "BLOCKED" && <Button onClick={() => action.mutate({ status: "IN_PROGRESS" })}>Resume task</Button>}
            {task.status === "COMPLETED" && <Button variant="secondary" onClick={() => action.mutate({ status: "REOPENED" })}><RotateCcw size={15}/>Reopen</Button>}
            {canManage && <Button variant="secondary" onClick={() => { setShowReassign((value) => !value); setShowDelete(false); }}><UserRoundCog size={16}/>Reassign</Button>}
            {canManage && <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { setShowDelete((value) => !value); setShowReassign(false); }}><Trash2 size={16}/>Delete task</Button>}
          </div>

          {showReassign && <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <label className="block text-sm font-medium">Reassign to
              <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-400" value={nextAssignee} onChange={(event) => setNextAssignee(event.target.value)} disabled={employees.isLoading || reassign.isPending}>
                <option value={task.assignedEmployee._id}>Current: {task.assignedEmployee.firstName} {task.assignedEmployee.lastName}</option>
                {employees.data?.items.filter((employee) => employee._id !== task.assignedEmployee._id).map((employee) => <option value={employee._id} key={employee._id}>{employee.firstName} {employee.lastName} ({employee.employeeId})</option>)}
              </select>
            </label>
            {employees.error && <p role="alert" className="mt-3 text-sm text-red-700">{employees.error.message}</p>}
            {reassign.error && <p role="alert" className="mt-3 text-sm text-red-700">{reassign.error.message}</p>}
            <div className="mt-3 flex flex-wrap gap-2"><Button disabled={nextAssignee === task.assignedEmployee._id || reassign.isPending || employees.isLoading} onClick={() => reassign.mutate()}>{reassign.isPending ? "Reassigning..." : "Confirm reassignment"}</Button><Button variant="ghost" onClick={() => setShowReassign(false)}>Cancel</Button></div>
          </div>}

          {showDelete && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-800">Delete this task?</p>
            <p className="mt-1 text-sm leading-5 text-red-700">It will disappear from active boards and metrics. Its audit history is retained for accountability.</p>
            {remove.error && <p role="alert" className="mt-3 text-sm font-medium text-red-800">{remove.error.message}</p>}
            <div className="mt-3 flex flex-wrap gap-2"><Button className="bg-red-600 shadow-red-200 hover:bg-red-700" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? "Deleting..." : "Yes, delete task"}</Button><Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button></div>
          </div>}

          {["IN_PROGRESS", "REOPENED"].includes(task.status) && <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">Actual hours<Input type="number" min="0" step=".25" className="mt-2" placeholder="For example: 4.5" value={actualHours} onChange={(event) => setActualHours(Number(event.target.value))}/><span className="mt-1 block text-xs font-normal text-slate-400">Hours are estimation evidence only; they never raise a score by themselves.</span></label>
            <label className="block text-sm font-medium">Completion note<textarea className="mt-2 min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Describe what was delivered and how you verified it." value={completionNote} onChange={(event) => setCompletionNote(event.target.value)}/></label>
            <label className="block text-sm font-medium">Deliverable link (optional)<Input type="url" className="mt-2" placeholder="https://employee.whalexy.com or a GitHub URL" value={deliverableUrl} onChange={(event) => setDeliverableUrl(event.target.value)}/><span className="mt-1 block text-xs font-normal text-slate-400">You may paste a domain without https://; the portal will add it automatically.</span></label>
            <label className="block text-sm font-medium">Business/customer impact (optional)<textarea className="mt-2 min-h-20 w-full rounded-xl border p-3 text-sm" placeholder="Explain the business result, customer benefit or measurable improvement." value={businessImpact} onChange={(event) => setBusinessImpact(event.target.value)}/></label>
            {action.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{action.error.message}</p>}
            <Button disabled={completionNote.trim().length < 10 || action.isPending} onClick={() => action.mutate({ status: "IN_REVIEW", actualHours: Number(actualHours), completionNote, deliverableUrl: normalizeOptionalUrl(deliverableUrl), businessImpact })}>{action.isPending ? "Submitting..." : "Submit evidence for review"}</Button>
          </div>}
          {task.completionNote && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><p className="font-medium">Completion evidence</p><p className="mt-2 text-slate-600">{task.completionNote}</p>{task.deliverableUrl && <a className="mt-2 block text-brand-700 underline" href={task.deliverableUrl} target="_blank" rel="noreferrer">Open deliverable</a>}{task.businessImpact && <p className="mt-2 text-slate-600">Impact: {task.businessImpact}</p>}</div>}
          {task.status === "IN_REVIEW" && canReview && <div className="mt-5 border-t pt-5"><div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]"><label className="text-sm font-medium">Quality<Input type="number" min="1" max="5" className="mt-2" placeholder="1-5" value={rating} onChange={(event) => setRating(Number(event.target.value))}/></label><label className="min-w-0 text-sm font-medium">Review comment<Input className="mt-2" placeholder="Explain approval or required rework" value={comment} onChange={(event) => setComment(event.target.value)}/></label></div>{review.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{review.error.message}</p>}<div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => review.mutate(false)}><RotateCcw size={15}/>Request rework</Button><Button onClick={() => review.mutate(true)}><CheckCircle2 size={15}/>Approve</Button></div></div>}
          {task.status === "IN_REVIEW" && !canReview && <p className="mt-5 break-words rounded-xl bg-blue-50 p-3 text-sm text-blue-700">Submitted successfully. Waiting for a manager or reviewer.</p>}
        </section>

        <section className="mt-7"><div className="flex items-center"><History size={17} className="text-brand-600"/><h3 className="ml-2 font-semibold">Activity timeline</h3></div><div className="mt-4">{activity.data?.items.map((item, index) => <div className="relative flex gap-3 pb-5" key={item._id}>{index < (activity.data?.items.length ?? 0) - 1 && <div className="absolute left-3 top-6 h-full w-px bg-slate-200"/>}<div className="relative grid size-6 shrink-0 place-items-center rounded-full border bg-white"><Clock3 size={11}/></div><div><p className="text-sm font-medium">{item.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-400">{item.performedBy?.name ?? "System"} · {new Date(item.createdAt).toLocaleString()}</p></div></div>)}</div></section>
      </div>
    </aside>
  </div>;
};
