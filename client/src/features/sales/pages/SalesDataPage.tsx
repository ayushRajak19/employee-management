import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionName } from "@mobius-ems/shared";
import { Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { salesApi, type SalesRecord } from "../salesApi";

type SalesDataPath = "leads" | "customers" | "pipeline" | "targets" | "revenue" | "channel-partners";
type Column = { label: string; align?: "right"; render: (item: SalesRecord) => ReactNode };

const managePermissions: Record<SalesDataPath, PermissionName[]> = {
  leads: ["sales.lead.manage.self", "sales.lead.manage.team", "sales.lead.manage.all"],
  customers: ["sales.configuration.manage"],
  pipeline: ["sales.pipeline.manage"],
  targets: ["sales.target.manage"],
  revenue: ["sales.revenue.manage"],
  "channel-partners": ["sales.channel_partner.manage", "sales.channel_partner.manage.self"],
};

const sectionCopy: Record<SalesDataPath, { description: string; empty: string }> = {
  leads: { description: "Capture prospects, their source, owner, territory, status and expected business value.", empty: "No leads have been captured in your scope." },
  customers: { description: "Manage converted accounts, customer type, ownership and lifetime revenue.", empty: "No customers are available in your scope." },
  pipeline: { description: "Track active sales opportunities by stage, probability, expected close date and value.", empty: "No opportunities are currently in your pipeline." },
  targets: { description: "Review revenue and lead goals assigned to employees or territories for each period.", empty: "No targets have been assigned in your scope." },
  revenue: { description: "Record realized sales transactions with their date, source, reference and territory.", empty: "No revenue transactions are available in your scope." },
  "channel-partners": { description: "Manage distributors, dealers, resellers and other partners operating in your territories.", empty: "No channel partners are available in your scope." },
};

const labelOf = (value: unknown) => {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const item = value as { firstName?: string; lastName?: string; name?: string; code?: string };
    return item.name ?? ([item.firstName, item.lastName].filter(Boolean).join(" ") || item.code || "—");
  }
  return String(value);
};
const money = (currency = "INR", value?: number) => `${currency} ${(value ?? 0).toLocaleString("en-IN")}`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN") : "—";
const monthEnd = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10); };
const initialForm = () => ({
  name: "", code: "", employee: "", territory: "", value: "0", probability: "50",
  source: "MANUAL", date: new Date().toISOString().slice(0, 10), endDate: monthEnd(),
  stage: "QUALIFIED", type: "OTHER", customerType: "", reference: "", leadTarget: "0", conversionTarget: "0",
});

const columnsFor = (path: SalesDataPath): Column[] => {
  if (path === "leads") return [
    { label: "Lead", render: (item) => item.name ?? "—" }, { label: "Status", render: (item) => item.status ?? "—" },
    { label: "Source", render: (item) => item.source ?? "—" }, { label: "Owner", render: (item) => labelOf(item.ownerEmployee) },
    { label: "Territory", render: (item) => labelOf(item.territory) }, { label: "Estimated value", align: "right", render: (item) => money(item.currency, item.estimatedValue) },
  ];
  if (path === "customers") return [
    { label: "Customer", render: (item) => item.name ?? "—" }, { label: "Status", render: (item) => item.status ?? "—" },
    { label: "Customer type", render: (item) => item.customerType ?? "—" }, { label: "Owner", render: (item) => labelOf(item.ownerEmployee) },
    { label: "Territory", render: (item) => labelOf(item.territory) }, { label: "Lifetime revenue", align: "right", render: (item) => money(item.currency, item.lifetimeRevenue) },
  ];
  if (path === "pipeline") return [
    { label: "Opportunity", render: (item) => item.name ?? "—" }, { label: "Stage", render: (item) => item.stage ?? "—" },
    { label: "Probability", render: (item) => `${item.probability ?? 0}%` }, { label: "Expected close", render: (item) => date(item.expectedCloseDate) },
    { label: "Owner", render: (item) => labelOf(item.ownerEmployee) }, { label: "Territory", render: (item) => labelOf(item.territory) },
    { label: "Estimated value", align: "right", render: (item) => money(item.currency, item.estimatedValue) },
  ];
  if (path === "targets") return [
    { label: "Period", render: (item) => `${date(item.periodStart)} – ${date(item.periodEnd)}` }, { label: "Status", render: (item) => item.status ?? "—" },
    { label: "Employee", render: (item) => labelOf(item.employee) }, { label: "Territory", render: (item) => labelOf(item.territory) },
    { label: "Lead target", align: "right", render: (item) => (item.leadTarget ?? 0).toLocaleString("en-IN") },
    { label: "Revenue target", align: "right", render: (item) => money(item.currency, item.revenueTarget) },
  ];
  if (path === "revenue") return [
    { label: "Transaction date", render: (item) => date(item.transactionDate) }, { label: "Source", render: (item) => item.source ?? "—" },
    { label: "Reference", render: (item) => item.reference ?? "—" }, { label: "Employee", render: (item) => labelOf(item.employee) },
    { label: "Territory", render: (item) => labelOf(item.territory) }, { label: "Amount", align: "right", render: (item) => money(item.currency, item.amount) },
  ];
  return [
    { label: "Partner", render: (item) => item.name ?? "—" }, { label: "Code", render: (item) => item.code ?? "—" },
    { label: "Partner type", render: (item) => item.type?.replaceAll("_", " ") ?? "—" }, { label: "Status", render: (item) => item.status ?? "—" },
    { label: "Owner", render: (item) => labelOf(item.ownerEmployee) }, { label: "Territory", render: (item) => labelOf(item.territory) },
    { label: "Effective from", render: (item) => date(item.effectiveFrom) },
  ];
};

export const SalesDataPage = ({ path, title }: { path: SalesDataPath; title: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const canManage = managePermissions[path].some((permission) => user?.permissions.includes(permission));
  const query = useQuery({ queryKey: ["sales", path], queryFn: () => salesApi.records(path) });
  const employees = useQuery({ queryKey: ["sales", "employees", "form"], queryFn: salesApi.employees, enabled: open });
  const territories = useQuery({ queryKey: ["sales", "territories", "form"], queryFn: salesApi.territories, enabled: open });
  const columns = columnsFor(path);
  useEffect(() => {
    if (!open) return;
    setForm((current) => ({ ...current, employee: current.employee || employees.data?.items[0]?._id || "", territory: current.territory || territories.data?.items[0]?._id || "" }));
  }, [employees.data, open, territories.data]);

  const create = useMutation({
    mutationFn: () => {
      const value = Number(form.value);
      const common = { ownerEmployee: form.employee || undefined, territory: form.territory, currency: "INR" };
      if (path === "leads") return salesApi.createRecord(path, { ...common, name: form.name, status: "NEW", estimatedValue: value, source: form.source });
      if (path === "customers") return salesApi.createRecord(path, { ...common, name: form.name, status: "ACTIVE", customerType: form.customerType || undefined, lifetimeRevenue: value });
      if (path === "pipeline") return salesApi.createRecord(path, { ...common, name: form.name, stage: form.stage, status: "OPEN", estimatedValue: value, probability: Number(form.probability), expectedCloseDate: form.date });
      if (path === "targets") return salesApi.createRecord(path, { employee: form.employee || undefined, territory: form.territory || undefined, periodType: "MONTHLY", periodStart: form.date, periodEnd: form.endDate, revenueTarget: value, leadTarget: Number(form.leadTarget), conversionTarget: Number(form.conversionTarget), currency: "INR", status: "ACTIVE" });
      if (path === "revenue") return salesApi.createRecord(path, { employee: form.employee || undefined, territory: form.territory, amount: value, currency: "INR", transactionDate: form.date, source: form.source, reference: form.reference || undefined });
      return salesApi.createRecord(path, { name: form.name, code: form.code, type: form.type, territory: form.territory, ownerEmployee: form.employee || undefined, status: "ACTIVE", effectiveFrom: form.date });
    },
    onSuccess: async () => { setOpen(false); setForm(initialForm()); await queryClient.invalidateQueries({ queryKey: ["sales", path] }); },
  });

  const commonOwnership = <><label className="text-sm font-medium">Employee<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })}><option value="">My employee</option>{employees.data?.items.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</option>)}</select></label><label className="text-sm font-medium">Territory<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.territory} onChange={(event) => setForm({ ...form, territory: event.target.value })}><option value="">Select territory</option>{territories.data?.items.map((territory) => <option key={territory._id} value={territory._id}>{territory.name}</option>)}</select></label></>;

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand-700">Sales Intelligence</p><h1 className="mt-1 text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-slate-500">{sectionCopy[path].description}</p></div>{canManage && <Button onClick={() => setOpen(true)}><Plus size={16}/> Add {title === "Pipeline" ? "opportunity" : title.toLowerCase().replace(/s$/, "")}</Button>}</div><section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-soft">{query.isLoading ? <div className="p-5"><Skeleton className="h-64"/></div> : query.isError ? <p className="p-5 text-sm text-red-700">{query.error.message}</p> : !query.data?.items.length ? <div className="grid min-h-64 place-items-center text-center"><div><Database className="mx-auto text-slate-300"/><p className="mt-3 font-medium">Nothing here yet</p><p className="mt-1 text-sm text-slate-400">{sectionCopy[path].empty}</p></div></div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{columns.map((column) => <th key={column.label} className={`px-5 py-3 ${column.align === "right" ? "text-right" : ""}`}>{column.label}</th>)}</tr></thead><tbody className="divide-y">{query.data.items.map((item) => <tr key={item._id}>{columns.map((column) => <td key={column.label} className={`whitespace-nowrap px-5 py-4 ${column.align === "right" ? "text-right font-medium" : "text-slate-600 first:font-medium first:text-ink"}`}>{column.render(item)}</td>)}</tr>)}</tbody></table></div>}</section></div>{open && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm"><form className="my-6 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><h2 className="text-xl font-semibold">Add {title === "Pipeline" ? "opportunity" : title.toLowerCase().replace(/s$/, "")}</h2><p className="mt-1 text-sm text-slate-500">{sectionCopy[path].description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{["leads", "customers", "pipeline", "channel-partners"].includes(path) && <label className="text-sm font-medium sm:col-span-2">{path === "channel-partners" ? "Partner name" : path === "pipeline" ? "Opportunity name" : path === "customers" ? "Customer name" : "Lead name"}<Input required className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>}{path === "channel-partners" && <><label className="text-sm font-medium">Partner code<Input required className="mt-2" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}/></label><label className="text-sm font-medium">Partner type<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{["DISTRIBUTOR", "DEALER", "RESELLER", "RETAILER", "SERVICE_PARTNER", "OTHER"].map((type) => <option key={type}>{type.replaceAll("_", " ")}</option>)}</select></label></>}{commonOwnership}{path === "leads" && <><label className="text-sm font-medium">Lead source<Input required className="mt-2" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}/></label><label className="text-sm font-medium">Estimated value<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label></>}{path === "customers" && <><label className="text-sm font-medium">Customer type<Input className="mt-2" value={form.customerType} onChange={(event) => setForm({ ...form, customerType: event.target.value })}/></label><label className="text-sm font-medium">Lifetime revenue<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label></>}{path === "pipeline" && <><label className="text-sm font-medium">Stage<Input required className="mt-2" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}/></label><label className="text-sm font-medium">Win probability %<Input required type="number" min="0" max="100" className="mt-2" value={form.probability} onChange={(event) => setForm({ ...form, probability: event.target.value })}/></label><label className="text-sm font-medium">Estimated value<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label><label className="text-sm font-medium">Expected close date<Input required type="date" className="mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label></>}{path === "targets" && <><label className="text-sm font-medium">Period start<Input required type="date" className="mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label><label className="text-sm font-medium">Period end<Input required type="date" min={form.date} className="mt-2" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })}/></label><label className="text-sm font-medium">Revenue target<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label><label className="text-sm font-medium">Lead target<Input required type="number" min="0" className="mt-2" value={form.leadTarget} onChange={(event) => setForm({ ...form, leadTarget: event.target.value })}/></label><label className="text-sm font-medium">Conversion target %<Input required type="number" min="0" max="100" className="mt-2" value={form.conversionTarget} onChange={(event) => setForm({ ...form, conversionTarget: event.target.value })}/></label></>}{path === "revenue" && <><label className="text-sm font-medium">Amount<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label><label className="text-sm font-medium">Transaction date<Input required type="date" className="mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label><label className="text-sm font-medium">Revenue source<Input required className="mt-2" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}/></label><label className="text-sm font-medium">Invoice/reference<Input className="mt-2" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })}/></label></>}{path === "channel-partners" && <label className="text-sm font-medium">Effective from<Input required type="date" className="mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label>}</div>{create.error && <p className="mt-4 text-sm text-red-600">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={create.isPending}>{create.isPending ? "Saving..." : "Save"}</Button></div></form></div>}</main>;
};
