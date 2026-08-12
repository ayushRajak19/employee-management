import { useMutation } from "@tanstack/react-query";
import { Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "./employeeApi";

export const EmployeeLifecycleActions = ({ employeeId }: { employeeId: string }) => { const { user } = useAuth(); const navigate = useNavigate(); const deactivate = useMutation({ mutationFn: () => employeeApi.deactivate(employeeId), onSuccess: () => navigate("/employees", { replace: true }) }); if (!user?.permissions.includes("employee.deactivate")) return null; return <div className="sm:ml-auto"><Button variant="secondary" disabled={deactivate.isPending} onClick={() => { if (window.confirm("Deactivate this employee? Their account will be locked and business history will be retained.")) deactivate.mutate(); }}><Archive size={15}/>{deactivate.isPending ? "Deactivating…" : "Deactivate"}</Button>{deactivate.error && <p className="mt-2 max-w-52 text-xs text-red-600">{deactivate.error.message}</p>}</div>; };
