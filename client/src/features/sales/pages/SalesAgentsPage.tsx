import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { SalesMetricCards } from "../components/SalesMetricCards";
import { salesApi } from "../salesApi";

export const SalesAgentsPage = () => {
  const [selectedId, setSelectedId] = useState<string>();
  const employees = useQuery({ queryKey: ["sales", "employees"], queryFn: salesApi.employees });
  useEffect(() => { if (!selectedId && employees.data?.items.length) setSelectedId(employees.data.items[0]._id); }, [employees.data, selectedId]);
  const analytics = useQuery({ queryKey: ["sales", "employees", selectedId, "analytics"], queryFn: () => salesApi.employeeAnalytics(selectedId!), enabled: Boolean(selectedId) });
  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><p className="text-sm font-medium text-brand-700">Sales Intelligence</p><h1 className="mt-1 text-3xl font-semibold">Sales employees</h1><p className="mt-2 text-sm text-slate-500">Employee comparison remains limited to your resolved management and territory scope.</p><div className="mt-7 grid gap-5 lg:grid-cols-[340px_1fr]"><section className="overflow-hidden rounded-2xl border bg-white shadow-soft">{employees.isLoading ? <div className="p-4"><Skeleton className="h-64"/></div> : employees.data?.items.map((employee) => <button key={employee._id} onClick={() => setSelectedId(employee._id)} className={`flex w-full items-center border-b p-4 text-left last:border-0 ${selectedId === employee._id ? "bg-brand-50" : "hover:bg-slate-50"}`}><span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-xs font-semibold">{employee.firstName[0]}{employee.lastName[0]}</span><span className="ml-3"><span className="block text-sm font-medium">{employee.firstName} {employee.lastName}</span><span className="block text-xs text-slate-400">{employee.designation?.name ?? employee.employeeId}</span></span></button>)}</section><section>{analytics.isLoading ? <Skeleton className="h-64"/> : analytics.isError ? <p className="rounded-xl bg-red-50 p-4 text-red-700">{analytics.error.message}</p> : analytics.data ? <><SalesMetricCards data={analytics.data}/><Link to={`/employees/${selectedId}`} className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:underline">Open Employee 360</Link></> : <p className="rounded-2xl border bg-white p-8 text-sm text-slate-400">No sales employee selected.</p>}</section></div></div></main>;
};
