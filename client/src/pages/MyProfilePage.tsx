import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { employeeApi } from "@/features/employees/employeeApi";
export const MyProfilePage = () => { const query = useQuery({ queryKey: ["employee", "me"], queryFn: employeeApi.me }); if (query.isLoading) return <main className="p-8"><Skeleton className="h-56"/></main>; if (!query.data?.employee._id) return <main className="grid min-h-96 place-items-center text-sm text-slate-500">Your employee profile is unavailable.</main>; return <Navigate to={`/employees/${query.data.employee._id}`} replace/>; };
