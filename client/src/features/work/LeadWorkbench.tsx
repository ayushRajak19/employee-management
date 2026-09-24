import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Phone,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { workApi, type LeadWorkItem, type Task } from "./workApi";
const statuses = [
  "NOT_STARTED",
  "ATTEMPTED",
  "CONNECTED",
  "FOLLOW_UP",
  "INTERESTED",
  "QUALIFIED",
  "CONVERTED",
  "NOT_INTERESTED",
  "INVALID",
];
const originalValue = (item: LeadWorkItem, candidates: string[]) => {
  const entry = Object.entries(item.originalData).find(([header]) =>
    candidates.includes(header.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
  return entry?.[1]?.trim() ?? "";
};
const leadName = (item: LeadWorkItem) => {
  const splitName = [
    originalValue(item, ["firstname", "givenname", "contactfirstname"]),
    originalValue(item, ["lastname", "surname", "familyname", "contactlastname"]),
  ].filter(Boolean).join(" ");
  return splitName || originalValue(item, ["name", "fullname", "customername", "leadname", "contactname"]) || item.lead.name;
};
export const LeadWorkbench = ({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LeadWorkItem>();
  const params = new URLSearchParams({
    limit: "50",
    ...(status && { status }),
    ...(search && { search }),
  });
  const items = useQuery({
    queryKey: ["lead-items", task._id, status, search],
    queryFn: () => workApi.leadItems(task._id, params),
  });
  const summary = useQuery({
    queryKey: ["lead-summary", task._id],
    queryFn: () => workApi.leadSummary(task._id),
  });
  const close = () => (selected ? setSelected(undefined) : onClose());
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <button
            aria-label="Back"
            className="grid size-11 place-items-center rounded-xl hover:bg-slate-100"
            onClick={close}
          >
            <ArrowLeft />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Lead workbench
            </p>
            <h1 className="text-lg font-semibold sm:text-2xl">{task.name}</h1>
          </div>
          <button
            aria-label="Close workbench"
            className="ml-auto grid size-11 place-items-center rounded-xl hover:bg-slate-100"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-8">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ["Total", summary.data?.total],
            ["Worked", summary.data?.worked],
            ["Remaining", summary.data?.untouched],
            ["Attempts", summary.data?.attempts],
            ["Follow-ups", summary.data?.statuses.FOLLOW_UP],
            ["Converted", summary.data?.statuses.CONVERTED],
          ].map(([label, value]) => (
            <div className="rounded-xl border bg-white p-4" key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value ?? "—"}</p>
            </div>
          ))}
        </section>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <Input
              aria-label="Search leads"
              className="pl-10"
              placeholder="Search name, company or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter by status"
            className="h-11 rounded-xl border bg-white px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((x) => (
              <option key={x} value={x}>
                {x.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 hidden overflow-hidden rounded-2xl border bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Lead",
                  "Phone",
                  "Company",
                  "Status",
                  "Attempts",
                  "Next follow-up",
                  "Action",
                ].map((x) => (
                  <th className="p-4" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.data?.items.map((item) => (
                <tr className="border-t hover:bg-slate-50" key={item._id}>
                  <td className="p-4 font-medium">{leadName(item)}</td>
                  <td className="p-4">{item.lead.phone || "—"}</td>
                  <td className="p-4">{item.lead.companyName || "—"}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">{item.attemptCount}</td>
                  <td className="p-4">
                    {item.nextFollowUpAt
                      ? new Date(item.nextFollowUpAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-4">
                    <button
                      className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                      aria-label={`Open ${leadName(item)}`}
                      onClick={() => setSelected(item)}
                    >
                      <ChevronRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 space-y-3 md:hidden">
          {items.data?.items.map((item) => (
            <button
              onClick={() => setSelected(item)}
              className="w-full rounded-2xl border bg-white p-4 text-left"
              key={item._id}
            >
              <div className="flex justify-between">
                <strong>{leadName(item)}</strong>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Phone size={15} />
                {item.lead.phone || "No phone"}
              </p>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Attempts: {item.attemptCount}</span>
                <span className="flex gap-1">
                  <CalendarClock size={14} />
                  {item.nextFollowUpAt
                    ? new Date(item.nextFollowUpAt).toLocaleDateString()
                    : "No follow-up"}
                </span>
              </div>
            </button>
          ))}
        </div>
        {!items.isLoading && !items.data?.items.length && (
          <p className="mt-10 text-center text-sm text-slate-500">
            No leads match the selected filters.
          </p>
        )}
      </main>
      {selected && (
        <LeadPanel
          taskId={task._id}
          item={selected}
          onClose={() => setSelected(undefined)}
          onSaved={async () => {
            setSelected(undefined);
            await Promise.all([
              qc.invalidateQueries({ queryKey: ["lead-items", task._id] }),
              qc.invalidateQueries({ queryKey: ["lead-summary", task._id] }),
            ]);
          }}
        />
      )}
    </div>
  );
};
const LeadPanel = ({
  taskId,
  item,
  onClose,
  onSaved,
}: {
  taskId: string;
  item: LeadWorkItem;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) => {
  const detail = useQuery({
    queryKey: ["lead-item", item._id],
    queryFn: () => workApi.leadItem(taskId, item._id),
  });
  const [form, setForm] = useState({
    interactionType: "PHONE_CALL",
    outcome: "CONNECTED",
    status: item.status,
    note: "",
    nextFollowUpAt: "",
    version: item.version,
  });
  const save = useMutation({
    mutationFn: () =>
      workApi.logLeadActivity(taskId, item._id, {
        ...form,
        nextFollowUpAt: form.nextFollowUpAt || undefined,
      }),
    onSuccess: onSaved,
  });
  return (
    <aside className="fixed inset-0 z-20 flex justify-end bg-slate-950/35">
      <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl sm:p-7">
        <div className="flex">
          <div>
            <p className="text-xs font-semibold text-brand-700">Lead detail</p>
            <h2 className="mt-1 text-2xl font-semibold">{leadName(item)}</h2>
          </div>
          <button
            aria-label="Close lead"
            className="ml-auto grid size-11 place-items-center rounded-xl hover:bg-slate-100"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <section className="mt-6 rounded-2xl border p-4">
          <h3 className="font-semibold">Lead information</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Phone", item.lead.phone],
              ["Email", item.lead.email],
              ["Company", item.lead.companyName],
              ["CRM status", item.lead.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-1">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="mt-4 rounded-2xl border p-4">
          <h3 className="font-semibold">Imported information</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(item.originalData).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-1 break-words text-sm">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
        <form
          className="mt-4 rounded-2xl border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <h3 className="font-semibold">Log activity</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Interaction
              <select
                className="mt-1 h-11 w-full rounded-xl border px-3"
                value={form.interactionType}
                onChange={(e) =>
                  setForm({ ...form, interactionType: e.target.value })
                }
              >
                {[
                  "PHONE_CALL",
                  "WHATSAPP",
                  "EMAIL",
                  "MEETING",
                  "VIDEO_CALL",
                  "OTHER",
                ].map((x) => (
                  <option key={x}>{x.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Outcome
              <select
                className="mt-1 h-11 w-full rounded-xl border px-3"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              >
                {[
                  "NO_ANSWER",
                  "BUSY",
                  "WRONG_NUMBER",
                  "CONNECTED",
                  "REQUESTED_CALLBACK",
                  "INTERESTED",
                  "QUALIFIED",
                  "NOT_INTERESTED",
                  "CONVERTED",
                  "OTHER",
                ].map((x) => (
                  <option key={x}>{x.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              New status
              <select
                className="mt-1 h-11 w-full rounded-xl border px-3"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {statuses.map((x) => (
                  <option key={x}>{x.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Next follow-up
              <Input
                type="datetime-local"
                className="mt-1"
                value={form.nextFollowUpAt}
                onChange={(e) =>
                  setForm({ ...form, nextFollowUpAt: e.target.value })
                }
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Note
              <textarea
                required
                minLength={3}
                maxLength={2000}
                className="mt-1 min-h-24 w-full rounded-xl border p-3"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="What happened during this interaction?"
              />
            </label>
          </div>
          {save.error && (
            <p className="mt-3 text-sm text-red-700">{save.error.message}</p>
          )}
          <Button className="mt-4 w-full" disabled={save.isPending}>
            {save.isPending ? "Saving evidence…" : "Save activity"}
          </Button>
        </form>
        <section className="mt-4">
          <h3 className="font-semibold">Activity history</h3>
          <div className="mt-3 space-y-3">
            {detail.data?.activities.map((a) => (
              <article className="rounded-xl border p-3" key={a._id}>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {a.interactionType.replaceAll("_", " ")} ·{" "}
                    {a.outcome.replaceAll("_", " ")}
                  </span>
                  <time>{new Date(a.createdAt).toLocaleString()}</time>
                </div>
                <p className="mt-2 text-sm">{a.note}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {a.performedBy?.name} · {a.fromStatus.replaceAll("_", " ")} →{" "}
                  {a.toStatus.replaceAll("_", " ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};
