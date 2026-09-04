import { useMemo, useState } from "react";
import {
  ArrowRight, CheckCircle2, ChevronRight, Clock3, GitBranch, Mail,
  MailPlus, MoreHorizontal, Pause, Play, Plus, Send, Sparkles, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type WorkflowStatus = "DRAFT" | "ACTIVE" | "PAUSED";
type Workflow = {
  id: string;
  name: string;
  audience: string;
  subject: string;
  message: string;
  delayDays: number;
  followUp: boolean;
  status: WorkflowStatus;
  createdAt: string;
};

const storageKey = "mobius-email-automation-workflows";
const brevoConnected = import.meta.env.VITE_BREVO_ENABLED === "true";

const blankForm = {
  name: "Vendor introduction sequence",
  audience: "Approved vendor contacts",
  subject: "A partnership opportunity for {{company_name}}",
  message: "Hi {{vendor_name}},\n\nI’m reaching out from {{our_company}} to explore a potential partnership with {{company_name}}.",
  delayDays: 3,
  followUp: true,
};

const readWorkflows = (): Workflow[] => {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as Workflow[] : [];
  } catch {
    return [];
  }
};

const persist = (items: Workflow[]) => window.localStorage.setItem(storageKey, JSON.stringify(items));

const StepCard = ({ icon: Icon, eyebrow, title, detail, tone = "violet" }: {
  icon: typeof Mail;
  eyebrow: string;
  title: string;
  detail: string;
  tone?: "violet" | "blue" | "amber" | "emerald";
}) => {
  const tones = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
  return <div className="relative rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start gap-3">
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1", tones[tone])}><Icon size={18}/></div>
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">{eyebrow}</p><p className="mt-1 text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p></div>
    </div>
  </div>;
};

export const EmailAutomationPage = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(readWorkflows);
  const [selectedId, setSelectedId] = useState<string | null>(() => readWorkflows()[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = workflows.find((item) => item.id === selectedId) ?? null;
  const activeCount = workflows.filter((item) => item.status === "ACTIVE").length;
  const summary = useMemo(() => [
    { label: "Workflows", value: workflows.length, icon: GitBranch, tone: "bg-violet-50 text-violet-700" },
    { label: "Active", value: activeCount, icon: Play, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Emails sent", value: 0, icon: Send, tone: "bg-blue-50 text-blue-700" },
    { label: "Replies", value: 0, icon: Mail, tone: "bg-amber-50 text-amber-700" },
  ], [activeCount, workflows.length]);

  const updateStatus = (workflow: Workflow) => {
    if (!brevoConnected && workflow.status !== "ACTIVE") {
      setNotice("Connect Brevo on the server before activating a workflow.");
      return;
    }
    const status: WorkflowStatus = workflow.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const next = workflows.map((item) => item.id === workflow.id ? { ...item, status } : item);
    setWorkflows(next);
    persist(next);
    setNotice(status === "ACTIVE" ? "Workflow activated." : "Workflow paused.");
  };

  const createWorkflow = () => {
    const workflow: Workflow = {
      ...form,
      id: crypto.randomUUID(),
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };
    const next = [workflow, ...workflows];
    setWorkflows(next);
    setSelectedId(workflow.id);
    persist(next);
    setOpen(false);
    setForm(blankForm);
    setNotice("Workflow draft created.");
  };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1280px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-brand-700">Super Admin · Automation</p><h1 className="mt-1 text-3xl font-semibold">Email automation</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Build vendor outreach journeys with triggers, delays, conditions, and personalized email steps.</p></div>
      <Button onClick={() => setOpen(true)}><Plus size={16}/> New workflow</Button>
    </div>

    {notice && <div className="mt-5 flex items-center rounded-xl border bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"><CheckCircle2 size={16} className="mr-2 text-brand-600"/><span>{notice}</span><button className="ml-auto text-slate-400" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15}/></button></div>}

    <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center"><div className={cn("grid size-10 place-items-center rounded-xl", tone)}><Icon size={18}/></div><p className="ml-auto text-2xl font-semibold">{value}</p></div><p className="mt-4 text-xs font-medium text-slate-500">{label}</p></div>)}
    </section>

    <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-soft">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="grid size-11 place-items-center rounded-2xl bg-[#0b996e]/10 text-[#087958]"><MailPlus size={20}/></div>
        <div><div className="flex items-center gap-2"><h2 className="font-semibold">Brevo delivery</h2><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", brevoConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{brevoConnected ? "CONNECTED" : "SETUP REQUIRED"}</span></div><p className="mt-1 text-xs text-slate-500">{brevoConnected ? "The delivery service is enabled. Workflows can be activated." : "Add the Brevo API key, verify a sender, and configure delivery webhooks before activation."}</p></div>
        <div className="sm:ml-auto"><Button variant="secondary" onClick={() => setNotice("Brevo credentials must be stored in the server environment, never in this browser.")}>Connection guide <ArrowRight size={15}/></Button></div>
      </div>
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border bg-white shadow-soft">
        <div className="flex items-center border-b p-5"><div><h2 className="font-semibold">Workflows</h2><p className="mt-1 text-xs text-slate-400">Select a workflow to inspect its journey</p></div></div>
        {workflows.length === 0 ? <div className="px-6 py-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><GitBranch size={21}/></div><p className="mt-4 text-sm font-semibold">No workflows yet</p><p className="mx-auto mt-2 max-w-[240px] text-xs leading-5 text-slate-500">Create your first vendor outreach sequence. It will remain a draft until Brevo is connected.</p><Button className="mt-5" variant="secondary" onClick={() => setOpen(true)}><Plus size={15}/> Create workflow</Button></div> : <div className="divide-y">{workflows.map((workflow) => <button key={workflow.id} className={cn("flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50", selectedId === workflow.id && "bg-brand-50/60")} onClick={() => setSelectedId(workflow.id)}><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Mail size={17}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{workflow.name}</p><p className="mt-1 truncate text-xs text-slate-400">{workflow.audience}</p></div><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", workflow.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : workflow.status === "PAUSED" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500")}>{workflow.status}</span><ChevronRight size={15} className="text-slate-300"/></button>)}</div>}
      </section>

      <section className="min-h-[430px] overflow-hidden rounded-2xl border bg-white shadow-soft">
        {!selected ? <div className="grid min-h-[430px] place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-slate-300" size={28}/><p className="mt-3 text-sm font-medium text-slate-500">Your workflow canvas will appear here</p></div></div> : <><div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate font-semibold">{selected.name}</p><p className="mt-1 text-xs text-slate-400">Created {new Date(selected.createdAt).toLocaleDateString()}</p></div><div className="flex gap-2 sm:ml-auto"><Button variant="ghost" className="px-3" aria-label="More workflow options"><MoreHorizontal size={17}/></Button><Button variant="secondary" onClick={() => updateStatus(selected)}>{selected.status === "ACTIVE" ? <Pause size={15}/> : <Play size={15}/>} {selected.status === "ACTIVE" ? "Pause" : "Activate"}</Button></div></div>
          <div className="bg-slate-50/70 p-5 sm:p-7"><div className="mx-auto max-w-xl space-y-3">
            <StepCard icon={Users} eyebrow="Trigger" title="Vendor enters audience" detail={selected.audience} tone="violet"/>
            <div className="mx-auto h-6 w-px bg-violet-200"/>
            <StepCard icon={Mail} eyebrow="Action" title={selected.subject} detail={selected.message} tone="blue"/>
            {selected.followUp && <><div className="mx-auto h-6 w-px bg-violet-200"/><StepCard icon={Clock3} eyebrow="Delay" title={`Wait ${selected.delayDays} day${selected.delayDays === 1 ? "" : "s"}`} detail="Continue only if the vendor has not replied." tone="amber"/><div className="mx-auto h-6 w-px bg-violet-200"/><StepCard icon={GitBranch} eyebrow="Condition" title="Has the vendor replied?" detail="Stop the sequence on reply; otherwise send a polite follow-up." tone="emerald"/></>}
          </div></div></>}
      </section>
    </div>
  </div>

  {open && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm"><form className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); createWorkflow(); }}><div className="flex items-start"><div><h2 className="text-xl font-semibold">Create vendor workflow</h2><p className="mt-1 text-sm text-slate-500">Start with a safe draft, then connect Brevo before activation.</p></div><button type="button" aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => setOpen(false)}><X size={17}/></button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Workflow name<Input required minLength={3} className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label className="block text-sm font-medium">Audience<Input required className="mt-2" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}/></label></div>
    <label className="mt-4 block text-sm font-medium">Email subject<Input required className="mt-2" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}/></label>
    <label className="mt-4 block text-sm font-medium">Message<textarea required rows={6} className="mt-2 w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm leading-6" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })}/></label>
    <div className="mt-4 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"><label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-4" checked={form.followUp} onChange={(event) => setForm({ ...form, followUp: event.target.checked })}/> Add reply-aware follow-up</label>{form.followUp && <label className="flex items-center gap-2 text-sm text-slate-600 sm:ml-auto">Wait<Input type="number" min={1} max={30} className="h-9 w-20" value={form.delayDays} onChange={(event) => setForm({ ...form, delayDays: Number(event.target.value) })}/> days</label>}</div>
    <p className="mt-4 text-xs leading-5 text-slate-500">Use only vendor contacts you are permitted to email. Variables such as <code className="rounded bg-slate-100 px-1 py-0.5">{"{{vendor_name}}"}</code> and <code className="rounded bg-slate-100 px-1 py-0.5">{"{{company_name}}"}</code> will be personalized when sending is connected.</p>
    <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button>Create draft</Button></div>
  </form></div>}
  </main>;
};
