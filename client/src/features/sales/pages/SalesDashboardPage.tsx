import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Map, Route, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { SalesMetricCards } from "../components/SalesMetricCards";
import { SalesTrendChart } from "../components/SalesTrendChart";
import { salesApi } from "../salesApi";

const salesFlow = [
  { label: "1. Lead", text: "Capture a potential buyer", path: "/sales/leads" },
  { label: "2. Customer", text: "Created when the lead converts", path: "/sales/customers" },
  { label: "3. Pipeline", text: "Track the customer's active deal", path: "/sales/pipeline" },
  { label: "4. Revenue", text: "Created when the deal is won", path: "/sales/revenue" },
];

export const SalesDashboardPage = () => {
  const { user } = useAuth();
  const all = user?.permissions.includes("sales.analytics.all");
  const team = user?.permissions.includes("sales.analytics.team");
  const isHrView = user?.role === "HR_ADMIN";
  const isManagementView = Boolean(all || ["HR_ADMIN", "DEPARTMENT_HEAD", "MANAGER"].includes(user?.role ?? ""));
  const query = useQuery({
    queryKey: ["sales", "analytics", all ? "all" : team ? "team" : "self"],
    queryFn: all ? salesApi.overviewAnalytics : team ? salesApi.teamAnalytics : salesApi.selfAnalytics,
  });

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]">
    <p className="text-sm font-medium text-brand-700">Sales Intelligence</p>
    <h1 className="mt-1 text-3xl font-semibold">{all ? "Company sales" : team ? "Team sales" : "My sales"}</h1>
    <p className="mt-2 text-sm text-slate-500">One connected view from prospect and customer ownership to pipeline and realized revenue.</p>

    <section className={`mt-5 rounded-2xl border p-5 ${isHrView ? "border-blue-100 bg-blue-50" : "border-emerald-100 bg-emerald-50"}`}>
      <h2 className="font-semibold">{isHrView ? "HR responsibility" : isManagementView ? "Company sales flow" : "Your daily sales flow"}</h2>
      <p className="mt-1 text-xs text-slate-600">{isHrView ? "Use coverage, workload, capacity and outcome trends for workforce planning. Sales records remain read-only for HR." : isManagementView ? "Review the complete Lead → Customer → Pipeline → Revenue flow. Use Geography and Territories only for reporting and ownership." : "Start with a lead. Geography and territory are optional reporting setup; do not create the same buyer again in Customers or Pipeline."}</p>
      {!isHrView && <div className="mt-4 grid gap-2 md:grid-cols-4">{salesFlow.map((step, index) => <Link key={step.path} to={step.path} className="relative rounded-xl border border-emerald-100 bg-white p-3 hover:border-brand-300"><p className="text-sm font-semibold text-brand-700">{step.label}</p><p className="mt-1 text-xs text-slate-500">{step.text}</p>{index < salesFlow.length - 1 && <ArrowRight className="absolute -right-3 top-7 z-10 hidden rounded-full bg-white text-brand-500 md:block" size={20}/>}</Link>)}</div>}
    </section>

    {query.isLoading ? <Skeleton className="mt-7 h-64"/> : query.isError ? <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{query.error.message}</div> : query.data ? <>
      <div className="mt-7"><SalesMetricCards data={query.data}/></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-soft"><h2 className="font-semibold">Revenue trend</h2><p className="mt-1 text-xs text-slate-400">Last six calendar months</p><div className="mt-4"><SalesTrendChart items={query.data.trend ?? []}/></div></section>
        <section className="space-y-3">
          <div className="rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center gap-2"><Users size={17} className="text-brand-600"/><h2 className="font-semibold">Capacity</h2></div><p className="mt-4 text-3xl font-semibold">{query.data.capacityUtilization}%</p><p className="mt-1 text-sm text-slate-500">{query.data.activeHeadcount} active / {query.data.requiredHeadcount} required</p>{query.data.headcountGap > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-amber-700"><AlertTriangle size={15}/>{query.data.headcountGap} employee capacity gap</p>}</div>
          <div className="rounded-2xl border bg-white p-5 shadow-soft"><h2 className="font-semibold">White-space opportunity</h2><p className="mt-3 text-3xl font-semibold">{query.data.opportunityScore}<span className="text-base text-slate-400"> / 100</span></p><p className="mt-1 text-sm text-slate-500">{query.data.opportunityBand.replaceAll("_", " ")} opportunity</p><p className="mt-3 text-xs text-slate-400">Estimated opportunity is deterministic, not guaranteed revenue.</p></div>
        </section>
      </div>
    </> : null}

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {isManagementView && <Link className="rounded-2xl border bg-white p-5 shadow-soft transition hover:border-brand-300" to="/sales/geography"><Map className="text-brand-600"/><p className="mt-3 font-semibold">Geographic intelligence</p><p className="mt-1 text-sm text-slate-400">Define real countries, states and cities.</p></Link>}
      {isManagementView && <Link className="rounded-2xl border bg-white p-5 shadow-soft transition hover:border-brand-300" to="/sales/territories"><Route className="text-brand-600"/><p className="mt-3 font-semibold">Sales territories</p><p className="mt-1 text-sm text-slate-400">Assign business ownership over geography.</p></Link>}
      <Link className="rounded-2xl border bg-white p-5 shadow-soft transition hover:border-brand-300" to="/sales/leads"><Users className="text-brand-600"/><p className="mt-3 font-semibold">Start with a lead</p><p className="mt-1 text-sm text-slate-400">Capture a prospect and move it forward.</p></Link>
    </div>
  </div></main>;
};
