import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import type { CreateGeographyInput } from "../components/GeographyCreateDialog";
import { GeoSalesMap } from "../components/GeoSalesMap";
import { SalesMetricCards } from "../components/SalesMetricCards";
import { salesApi } from "../salesApi";

const metricOptions = ["Revenue", "Target Achievement", "Leads", "Customers", "Pipeline", "Conversion", "Employee Coverage", "Response Time", "Capacity Gap", "Opportunity"] as const;
const GeographyCreateDialog = lazy(() => import("../components/GeographyCreateDialog").then((module) => ({ default: module.GeographyCreateDialog })));

export const GeographicSalesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [metric, setMetric] = useState<typeof metricOptions[number]>("Revenue");
  const [createOpen, setCreateOpen] = useState(false);
  const isHrView = user?.role === "HR_ADMIN";
  const canCreate = user?.permissions.includes("sales.configuration.manage") || user?.permissions.includes("sales.geography.create.self");
  const tree = useQuery({ queryKey: ["sales", "geography"], queryFn: salesApi.geography });
  const create = useMutation({
    mutationFn: (input: CreateGeographyInput) => salesApi.createGeography({ ...input }),
    onSuccess: async (result) => {
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["sales", "geography"] });
      setSelectedId(result.item._id);
    },
  });

  useEffect(() => {
    if (!selectedId && tree.data?.items.length) setSelectedId(tree.data.items.find((node) => node.type === "GLOBAL")?._id ?? tree.data.items[0]._id);
  }, [selectedId, tree.data]);

  const analytics = useQuery({ queryKey: ["sales", "geography", selectedId, "analytics"], queryFn: () => salesApi.geoAnalytics(selectedId!), enabled: Boolean(selectedId) });
  const selected = tree.data?.items.find((node) => node._id === selectedId);
  const children = tree.data?.items.filter((node) => node.parent === selectedId) ?? [];
  const breadcrumbs = useMemo(() => selected && tree.data ? [...selected.ancestors.map((id) => tree.data.items.find((node) => node._id === id)).filter(Boolean), selected] : [], [selected, tree.data]);
  const metricValue = analytics.data ? ({
    Revenue: `${analytics.data.currency} ${analytics.data.actualRevenue.toLocaleString("en-IN")}`,
    "Target Achievement": `${analytics.data.targetAchievement}%`,
    Leads: analytics.data.leadCount.toString(),
    Customers: analytics.data.customerCount.toString(),
    Pipeline: `${analytics.data.currency} ${analytics.data.pipelineValue.toLocaleString("en-IN")}`,
    Conversion: `${analytics.data.conversionRate}%`,
    "Employee Coverage": `${analytics.data.coveragePercentage}%`,
    "Response Time": `${analytics.data.avgFirstResponseMinutes} min`,
    "Capacity Gap": analytics.data.headcountGap.toString(),
    Opportunity: analytics.data.opportunityScore.toString(),
  } as const)[metric] : undefined;

  return <main className="flex-1 px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-medium text-brand-700">Sales Intelligence</p><h1 className="mt-1 text-3xl font-semibold">Geographic intelligence</h1><p className="mt-2 text-sm text-slate-500">Explore configured sales coverage and performance from country down to local area.</p></div>
        <div className="flex flex-wrap items-end gap-3">{canCreate && <Button onClick={() => setCreateOpen(true)}><Plus size={16}/> Add geography</Button>}<label className="text-sm font-medium">Map metric<select className="mt-2 block h-10 rounded-xl border bg-white px-3" value={metric} onChange={(event) => setMetric(event.target.value as typeof metric)}>{metricOptions.map((option) => <option key={option}>{option}</option>)}</select></label></div>
      </div>
      {isHrView ? <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-medium">HR coverage view · Read only</p><p className="mt-1 text-xs text-blue-700">Use employee coverage, capacity gap and territory headcount to identify hiring or reassignment needs. Sales master data remains controlled by Sales and Super Admin.</p></div> : <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-medium">Setup step 1 · Geography means location</p><p className="mt-1 text-xs text-emerald-800">Add a country, state or city only when it is missing. Geography describes where business happens; it does not assign ownership. Create a territory next.</p></div>}
      {tree.isLoading ? <Skeleton className="mt-7 h-[420px]"/> : tree.isError ? <p className="mt-7 rounded-xl bg-red-50 p-4 text-red-700">{tree.error.message}</p> : <>
        <div className="mt-6 flex flex-wrap items-center gap-1 text-sm">{breadcrumbs.map((node, index) => node && <span className="flex items-center gap-1" key={node._id}><button className="rounded-lg px-2 py-1 hover:bg-white" onClick={() => setSelectedId(node._id)}>{node.name}</button>{index < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-slate-400"/>}</span>)}</div>
        <div className="mt-3"><GeoSalesMap nodes={tree.data?.items ?? []} selectedId={selectedId} onSelect={setSelectedId} metricLabel={metric} metricValue={metricValue}/></div>
        <section className="mt-5 rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center gap-2"><MapPinned size={17} className="text-brand-600"/><h2 className="font-semibold">Configured locations below {selected?.name ?? "geography"}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children.length ? children.map((node) => <button key={node._id} className="rounded-xl border p-4 text-left transition hover:border-brand-300 hover:bg-brand-50" onClick={() => setSelectedId(node._id)}><p className="font-medium">{node.name}</p><p className="mt-1 text-xs text-slate-400">{node.type}</p></button>) : <p className="col-span-full py-4 text-sm text-slate-400">No configured child locations yet. Use Add geography to expand coverage.</p>}</div></section>
      </>}
      {analytics.data && <div className="mt-5"><SalesMetricCards data={analytics.data}/></div>}
    </div>
    {createOpen && <Suspense fallback={<div className="fixed inset-0 z-[2000] grid place-items-center bg-ink/45 text-white">Loading country master…</div>}><GeographyCreateDialog open nodes={tree.data?.items ?? []} pending={create.isPending} error={create.error?.message} onClose={() => setCreateOpen(false)} onSubmit={(input) => create.mutate(input)}/></Suspense>}
  </main>;
};
