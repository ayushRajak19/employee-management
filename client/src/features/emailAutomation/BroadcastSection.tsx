import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { emailAutomationApi, type BroadcastInput, type VendorContactItem } from "./emailAutomationApi";

type Props = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onQueued: (message: string) => void;
  onError: (message: string) => void;
  contacts: VendorContactItem[];
  senderName: string;
  dailyLimit: number;
};

const initialForm = () => ({
  clientRequestId: crypto.randomUUID(),
  name: "",
  source: "",
  subject: "",
  message: "",
  timing: "now" as "now" | "scheduled",
  scheduledAt: "",
});

export const BroadcastSection = ({ open, onOpen, onClose, onQueued, onError, contacts, senderName, dailyLimit }: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const sources = useMemo(() => [...new Set(contacts.filter((contact) => contact.status === "ACTIVE").map((contact) => contact.source))].sort(), [contacts]);
  const broadcasts = useQuery({ queryKey: ["email-automation", "broadcasts"], queryFn: emailAutomationApi.broadcasts, refetchInterval: 30_000 });
  const audience = useQuery({ queryKey: ["email-automation", "broadcast-audience", form.source], queryFn: () => emailAutomationApi.broadcastAudience(form.source || undefined), enabled: open });
  const queue = useMutation({
    mutationFn: (input: BroadcastInput) => emailAutomationApi.createBroadcast(input),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["email-automation", "broadcasts"] });
      onQueued(`${data.recipientCount} contacts queued for ${data.item.scheduledAt && new Date(data.item.scheduledAt) > new Date() ? "scheduled" : "immediate"} delivery.`);
      setForm(initialForm());
      setReviewing(false);
      setError("");
      onClose();
    },
    onError: (failure: Error) => setError(failure.message),
  });
  const cancel = useMutation({
    mutationFn: emailAutomationApi.cancelBroadcast,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["email-automation", "broadcasts"] });
      onQueued(`Broadcast cancelled. ${data.stopped} queued emails were stopped; emails already accepted by Brevo cannot be recalled.`);
    },
    onError: (failure: Error) => onError(failure.message),
  });

  useEffect(() => { if (!open) { setReviewing(false); setError(""); } }, [open]);
  const scheduledDate = form.timing === "scheduled" && form.scheduledAt ? new Date(form.scheduledAt) : null;
  const invalidSchedule = form.timing === "scheduled" && (!scheduledDate || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date());
  const canReview = Boolean(form.name.trim().length >= 3 && form.subject.trim().length >= 2 && form.message.trim().length >= 5 && audience.data?.count && !audience.isFetching && !invalidSchedule);
  const sample = audience.data?.sample[0];
  const preview = (value: string) => value
    .replaceAll("{{vendor_name}}", sample?.name ?? "Contact name")
    .replaceAll("{{company_name}}", sample?.companyName ?? "Company")
    .replaceAll("{{our_company}}", senderName || "Your company");

  return <>
    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
      <section className="rounded-2xl border bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div><h2 className="font-semibold">Broadcast campaigns</h2><p className="mt-1 text-sm text-slate-500">One message to a chosen audience, sent through the existing queue.</p></div>
          <Button onClick={() => { setForm(initialForm()); setReviewing(false); queue.reset(); onOpen(); }}><Send size={16}/> Create broadcast</Button>
        </div>
        {broadcasts.isLoading ? <p className="p-8 text-sm text-slate-500">Loading broadcasts…</p> : broadcasts.data?.items.length ? <div className="divide-y">{broadcasts.data.items.map((item) => {
          const finished = item.progress.pending === 0 && item.progress.accepted + item.progress.failed + item.progress.stopped >= item.recipientCount;
          const scheduled = item.progress.accepted === 0 && new Date(item.scheduledAt) > new Date();
          return <div key={item._id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.audience} · {item.recipientCount} recipients</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.status === "PAUSED" ? "Cancelled" : scheduled ? "Scheduled" : finished ? "Completed" : "Sending"}</span>{item.status === "ACTIVE" && item.progress.pending > 0 && <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" disabled={cancel.isPending} onClick={() => { if (window.confirm("Stop emails that have not been sent yet? Emails already accepted by Brevo cannot be recalled.")) cancel.mutate(item._id); }}>Cancel remaining</button>}</div></div>
            <p className="mt-3 truncate text-sm text-slate-700">{item.subject}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4"><span>Queued <strong>{item.progress.pending}</strong></span><span>Accepted <strong>{item.progress.accepted}</strong></span><span>Delivered <strong>{item.progress.delivered}</strong></span><span>Failed <strong>{item.progress.failed}</strong></span></div>
          </div>;
        })}</div> : <div className="p-10 text-center"><Mail className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-medium">No broadcasts yet</p><p className="mt-1 text-sm text-slate-500">Choose an audience and write one message to get started.</p></div>}
      </section>
      <aside className="rounded-2xl border bg-white p-5 shadow-soft"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Users size={19}/></div><h2 className="mt-4 font-semibold">How sending works</h2><ol className="mt-4 space-y-4 text-sm text-slate-600"><li><strong>1. Choose contacts.</strong> Select every active contact or one import source.</li><li><strong>2. Review the message.</strong> Variables personalize each email and every message includes an unsubscribe link.</li><li><strong>3. Queue or schedule.</strong> Delivery follows your configured limit{dailyLimit ? ` of ${dailyLimit} emails per day` : ""} and appears in campaign progress.</li></ol></aside>
    </div>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm" role="presentation"><div className="flex min-h-full items-center justify-center"><form role="dialog" aria-modal="true" aria-labelledby="broadcast-title" className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onSubmit={(event) => { event.preventDefault(); if (!reviewing) { setReviewing(true); return; } if (!canReview) return; setError(""); queue.mutate({ clientRequestId: form.clientRequestId, name: form.name, subject: form.subject, message: form.message, ...(form.source && { source: form.source }), ...(scheduledDate && form.timing === "scheduled" && { scheduledAt: scheduledDate.toISOString() }) }); }}>
      <div className="flex items-start gap-4 border-b p-6"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Send size={20}/></div><div><h2 id="broadcast-title" className="text-xl font-semibold">{reviewing ? "Review broadcast" : "Create broadcast"}</h2><p className="mt-1 text-sm text-slate-500">{reviewing ? "Check the audience and message before queuing." : "Build one message for a saved, consented audience."}</p></div><button type="button" className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close broadcast composer" onClick={onClose}><X size={19}/></button></div>
      {!reviewing ? <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Campaign name<Input required minLength={3} maxLength={160} className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="September partner update"/></label><label className="text-sm font-medium">Audience<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}><option value="">All active contacts</option>{sources.map((source) => <option key={source} value={source}>{source}</option>)}</select></label></div>
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-brand-800"><Users size={16}/>{audience.isFetching ? "Checking audience…" : `${audience.data?.count ?? 0} eligible contacts`}</div><p className="mt-1 text-xs text-slate-600">Only active contacts with recorded consent or an existing relationship are included. The audience is checked again when queued.</p>{audience.data?.sample.length ? <p className="mt-2 text-xs text-slate-600">Sample: {audience.data.sample.map((contact) => contact.name).join(", ")}</p> : null}{audience.error && <p role="alert" className="mt-2 text-xs text-red-700">{audience.error.message}</p>}</div>
        <label className="block text-sm font-medium">Subject<Input required minLength={2} maxLength={250} className="mt-2" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="An update for {{company_name}}"/></label><label className="block text-sm font-medium">Message<textarea required minLength={5} maxLength={20000} rows={7} className="mt-2 w-full rounded-xl border p-3 text-sm leading-6" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Hi {{vendor_name}},\n\n..."/></label><p className="text-xs text-slate-500">Personalize with {"{{vendor_name}}"}, {"{{company_name}}"}, and {"{{our_company}}"}.</p>
        <fieldset><legend className="text-sm font-semibold">Delivery time</legend><div className="mt-2 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={form.timing === "now"} onChange={() => setForm({ ...form, timing: "now" })}/> Queue now</label><label className="flex items-center gap-2"><input type="radio" checked={form.timing === "scheduled"} onChange={() => setForm({ ...form, timing: "scheduled" })}/> Schedule</label></div>{form.timing === "scheduled" && <label className="mt-3 block text-sm">Local date and time<Input type="datetime-local" required className="mt-2 max-w-xs" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}/>{invalidSchedule && form.scheduledAt && <span className="mt-1 block text-xs text-red-700">Choose a future time.</span>}</label>}</fieldset>
      </div> : <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Audience</p><p className="mt-1 text-sm font-semibold">{form.source || "All active contacts"}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Recipients</p><p className="mt-1 text-sm font-semibold">{audience.data?.count ?? 0}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Delivery</p><p className="mt-1 text-sm font-semibold">{scheduledDate ? scheduledDate.toLocaleString() : "Queue now"}</p></div></div><div className="rounded-xl border p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Example for {sample?.name ?? "a contact"}</p><p className="mt-3 font-semibold">{preview(form.subject)}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview(form.message)}</p><p className="mt-4 border-t pt-3 text-xs text-slate-500">An unsubscribe link is appended to each delivered message.</p></div><p className="text-sm text-slate-600">Recipients are frozen when this broadcast is queued. New contacts added later will not receive it.</p></div>}
      {error && <p role="alert" className="mx-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t p-5"><Button type="button" variant="ghost" onClick={reviewing ? () => setReviewing(false) : onClose}>{reviewing ? "Back to editing" : "Cancel"}</Button><Button disabled={!canReview || queue.isPending}>{queue.isPending ? "Queuing…" : reviewing ? `Queue ${audience.data?.count ?? 0} emails` : "Review broadcast"}</Button></div>
    </form></div></div>}
  </>;
};
