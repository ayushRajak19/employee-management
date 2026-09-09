import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinned } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployeeMapCanvas, type EmployeeMapMode } from "../components/EmployeeMapCanvas";
import { salesApi } from "../salesApi";

const modes: { value: EmployeeMapMode; label: string }[] = [
  { value: "INDIVIDUAL", label: "Individual employee" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "DESIGNATION", label: "Designation" },
  { value: "MANAGER", label: "Manager" },
  { value: "DENSITY", label: "Employee density" },
  { value: "SALES_TERRITORY", label: "Sales territory" },
];
export const EmployeeMapPage = () => {
  const [mode, setMode] = useState<EmployeeMapMode>("INDIVIDUAL");
  const query = useQuery({ queryKey: ["employee-map"], queryFn: salesApi.employeeMap });
  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-medium text-brand-700">Workforce geography</p><h1 className="mt-1 text-3xl font-semibold">{query.data?.scope === "SELF" ? "My work location" : query.data?.scope === "TEAM" ? "Team map" : "Global employee map"}</h1><p className="mt-2 text-sm text-slate-500">Organizational work locations only. No live GPS tracking.</p></div><label className="text-sm font-medium">Color mode<select className="mt-2 block h-10 rounded-xl border bg-white px-3" value={mode} onChange={(event) => setMode(event.target.value as EmployeeMapMode)}>{modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>{query.isLoading ? <Skeleton className="mt-7 h-[500px]"/> : query.isError ? <p className="mt-7 rounded-xl bg-red-50 p-4 text-red-700">{query.error.message}</p> : query.data ? <><div className="mt-7"><EmployeeMapCanvas employees={query.data.employees} geography={query.data.geography} mode={mode}/></div><section className="mt-5 rounded-2xl border bg-white p-5 shadow-soft"><div className="flex items-center gap-2"><MapPinned size={17} className="text-brand-600"/><h2 className="font-semibold">Legend: {modes.find((item) => item.value === mode)?.label}</h2></div><p className="mt-2 text-sm text-slate-500">{query.data.employees.length} authorized employees. Low zoom uses count clusters; detailed zoom uses stable employee colors.</p></section></> : null}</div></main>;
};
