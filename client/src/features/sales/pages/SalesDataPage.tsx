import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionName } from "@mobius-ems/shared";
import { Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { salesApi } from "../salesApi";

const labelOf = (value: unknown) => {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const item = value as { firstName?: string; lastName?: string; name?: string; code?: string };
    return item.name ?? ([item.firstName, item.lastName].filter(Boolean).join(" ") || item.code || "—");
  }
  return String(value);
};

const managePermissions: Record<string, PermissionName[]> = {
  leads: ["sales.lead.manage.self", "sales.lead.manage.team", "sales.lead.manage.all"],
  customers: ["sales.configuration.manage"],
  pipeline: ["sales.pipeline.manage"],
  targets: ["sales.target.manage"],
  revenue: ["sales.revenue.manage"],
  "channel-partners": ["sales.channel_partner.manage"],
};
const initialForm = () => ({ name: "", employee: "", territory: "", value: "0", probability: "50", source: "MANUAL", date: new Date().toISOString().slice(0, 10) });

export const SalesDataPage = ({ path, title }: { path: string; title: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const canManage = managePermissions[path]?.some((permission) => user?.permissions.includes(permission)) ?? false;
  const query = useQuery({ queryKey: ["sales", path], queryFn: () => salesApi.records(path) });
  const employees = useQuery({ queryKey: ["sales", "employees", "form"], queryFn: salesApi.employees, enabled: open });
  const territories = useQuery({ queryKey: ["sales", "territories", "form"], queryFn: salesApi.territories, enabled: open });
  useEffect(() => {
    if (!open) return;
    setForm((current) => ({ ...current, employee: current.employee || employees.data?.items[0]?._id || "", territory: current.territory || territories.data?.items[0]?._id || "" }));
  }, [employees.data, open, territories.data]);
  const create = useMutation({
    mutationFn: () => {
      const value = Number(form.value);
      const common = { ownerEmployee: form.employee || undefined, territory: form.territory, currency: "INR" };
      const body = path === "leads" ? { ...common, name: form.name, status: "NEW", estimatedValue: value, source: form.source }
        : path === "customers" ? { ...common, name: form.name, status: "ACTIVE", lifetimeRevenue: value }
        : path === "pipeline" ? { ...common, name: form.name, stage: "QUALIFIED", status: "OPEN", estimatedValue: value, probability: Number(form.probability) }
        : path === "targets" ? { employee: form.employee, territory: form.territory, periodType: "MONTHLY", periodStart: `${form.date.slice(0, 7)}-01`, periodEnd: new Date(Number(form.date.slice(0, 4)), Number(form.date.slice(5, 7)), 0).toISOString(), revenueTarget: value, currency: "INR", status: "ACTIVE" }
        : path === "revenue" ? { employee: form.employee || undefined, territory: form.territory, amount: value, currency: "INR", transactionDate: form.date, source: form.source }
        : { name: form.name, code: form.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40), type: "OTHER", territory: form.territory, ownerEmployee: form.employee || undefined, status: "ACTIVE", effectiveFrom: form.date };
      return salesApi.createRecord(path, body);
    },
    onSuccess: async () => { setOpen(false); setForm(initialForm()); await queryClient.invalidateQueries({ queryKey: ["sales", path] }); },
  });

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand-700">Sales Intelligence</p><h1 className="mt-1 text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-slate-500">Only records inside your resolved employee and territory scope appear.</p></div>{canManage && <Button onClick={() => setOpen(true)}><Plus size={16}/> Add</Button>}</div><section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-soft">{query.isLoading ? <div className="p-5"><Skeleton className="h-64"/></div> : query.isError ? <p className="p-5 text-sm text-red-700">{query.error.message}</p> : !query.data?.items.length ? <div className="grid min-h-64 place-items-center text-center"><div><Database className="mx-auto text-slate-300"/><p className="mt-3 font-medium">No {title.toLowerCase()} yet</p><p className="mt-1 text-sm text-slate-400">Records appear here after authorized entry or import.</p></div></div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Record</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Territory</th><th className="px-5 py-3 text-right">Value</th></tr></thead><tbody className="divide-y">{query.data.items.map((item) => <tr key={item._id}><td className="px-5 py-4 font-medium">{item.name ?? item.code ?? item._id}</td><td className="px-5 py-4 text-slate-500">{item.status ?? item.stage ?? "—"}</td><td className="px-5 py-4 text-slate-500">{labelOf(item.ownerEmployee ?? item.employee)}</td><td className="px-5 py-4 text-slate-500">{labelOf(item.territory)}</td><td className="px-5 py-4 text-right font-medium">{item.currency ? `${item.currency} ${(item.amount ?? item.estimatedValue ?? item.revenueTarget ?? 0).toLocaleString("en-IN")}` : "—"}</td></tr>)}</tbody></table></div>}</section></div>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><h2 className="text-xl font-semibold">Add {title.toLowerCase()}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{!["targets", "revenue"].includes(path) && <label className="text-sm font-medium sm:col-span-2">Name<Input required className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>}<label className="text-sm font-medium">Employee<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.employee} onChange={(event) => setForm({ ...form, employee: event.target.value })}><option value="">My employee</option>{employees.data?.items.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</option>)}</select></label><label className="text-sm font-medium">Territory<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={form.territory} onChange={(event) => setForm({ ...form, territory: event.target.value })}><option value="">Select territory</option>{territories.data?.items.map((territory) => <option key={territory._id} value={territory._id}>{territory.name}</option>)}</select></label>{path !== "channel-partners" && <label className="text-sm font-medium">{path === "targets" ? "Target" : "Value"}<Input required type="number" min="0" className="mt-2" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })}/></label>}{path === "pipeline" && <label className="text-sm font-medium">Probability %<Input required type="number" min="0" max="100" className="mt-2" value={form.probability} onChange={(event) => setForm({ ...form, probability: event.target.value })}/></label>}{["targets", "revenue", "channel-partners"].includes(path) && <label className="text-sm font-medium">Date<Input required type="date" className="mt-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })}/></label>}</div>{create.error && <p className="mt-4 text-sm text-red-600">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={create.isPending}>{create.isPending ? "Saving..." : "Save"}</Button></div></form></div>}</main>;
};
