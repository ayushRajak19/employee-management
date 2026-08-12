import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Search, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { employeeApi, type CreateEmployeeInput } from "@/features/employees/employeeApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { organizationApi } from "@/features/organization/organizationApi";
const initial = (): CreateEmployeeInput => ({ firstName: "", lastName: "", officialEmail: "", phone: "", department: "", team: "", designation: "", dateOfJoining: new Date().toISOString().slice(0, 10), employmentType: "FULL_TIME", officeLocation: "", role: "EMPLOYEE", status: "ONBOARDING" });
export const EmployeesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(initial);
    const [credentials, setCredentials] = useState<{
        email: string;
        password: string;
    } | null>(null);
    const params = useMemo(() => { const p = new URLSearchParams({ page: "1", limit: "50" }); if (search)
        p.set("search", search); if (department)
        p.set("department", department); return p; }, [search, department]);
    const employees = useQuery({ queryKey: ["employees", params.toString()], queryFn: () => employeeApi.list(params) });
    const org = useQuery({ queryKey: ["organization"], queryFn: organizationApi.list });
    const create = useMutation({ mutationFn: employeeApi.create, onSuccess: async (data) => { setCredentials(data.temporaryCredentials); setOpen(false); setForm(initial()); await qc.invalidateQueries({ queryKey: ["employees"] }); } });
    const teams = org.data?.teams.filter((t) => !form.department || t.department?._id === form.department) ?? [];
    const canCreate = user?.permissions.includes("employee.create");
    const field = (key: keyof CreateEmployeeInput) => ({ value: form[key] ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value }) });
    return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand-700">People</p><h1 className="mt-1 text-3xl font-semibold">Employees</h1><p className="mt-2 text-sm text-slate-500">Manage accounts, organization placement and onboarding progress.</p></div>{canCreate && <Button onClick={() => setOpen(true)}><Plus size={16}/> Create employee</Button>}</div><div className="mt-7 flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-3 text-slate-400" size={17}/><Input className="pl-10 shadow-none" placeholder="Search name, ID or email" value={search} onChange={(e) => setSearch(e.target.value)}/></div><select aria-label="Filter by department" className="h-11 rounded-xl border bg-white px-3 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">All departments</option>{org.data?.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></div><section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-soft">{employees.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-12"/><Skeleton className="h-12"/><Skeleton className="h-12"/></div> : employees.data?.items.length === 0 ? <div className="grid min-h-72 place-items-center text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Users /></div><h2 className="mt-4 font-semibold">No employees found</h2><p className="mt-1 text-sm text-slate-400">Create an employee or adjust your filters.</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400"><tr>{["Employee", "Employee ID", "Department", "Designation", "Profile", "Status"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y">{employees.data?.items.map((employee) => <tr key={employee._id} tabIndex={0} onClick={() => navigate(`/employees/${employee._id}`)} onKeyDown={(e) => { if (e.key === "Enter")
        navigate(`/employees/${employee._id}`); }} className="cursor-pointer hover:bg-slate-50/60"><td className="px-5 py-4"><div className="flex items-center"><div className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserRound size={16}/></div><div className="ml-3"><p className="text-sm font-semibold">{employee.firstName} {employee.lastName}</p><p className="text-xs text-slate-400">{employee.officialEmail}</p></div></div></td><td className="px-5 py-4 text-sm font-medium">{employee.employeeId}</td><td className="px-5 py-4 text-sm text-slate-600">{employee.department.name}{employee.team && <span className="block text-xs text-slate-400">{employee.team.name}</span>}</td><td className="px-5 py-4 text-sm text-slate-600">{employee.designation.name}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-brand-500" style={{ width: `${employee.profileCompletion}%` }}/></div><span className="text-xs text-slate-500">{employee.profileCompletion}%</span></div></td><td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{employee.status.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div>}</section></div>
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm"><form className="mx-auto my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}><h2 className="text-xl font-semibold">Create employee account</h2><p className="mt-1 text-sm text-slate-500">Temporary credentials are shown once after creation.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">
<label className="text-sm font-medium">First name<Input required className="mt-2" {...field("firstName")}/></label>

<label className="text-sm font-medium">Last name<Input required className="mt-2" {...field("lastName")}/></label>

<label className="text-sm font-medium">Official email<Input required type="email" className="mt-2" {...field("officialEmail")}/></label>

<label className="text-sm font-medium">Phone<Input className="mt-2" {...field("phone")}/></label>

<label className="text-sm font-medium">Department<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" {...field("department")}><option value="">Select department</option>{org.data?.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>

<label className="text-sm font-medium">Team<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" {...field("team")}><option value="">No team</option>{teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></label>

<label className="text-sm font-medium">Designation<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" {...field("designation")}><option value="">Select designation</option>{org.data?.designations.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label>

<label className="text-sm font-medium">Date of joining<Input required type="date" className="mt-2" {...field("dateOfJoining")}/></label>

<label className="text-sm font-medium">Employment type<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" {...field("employmentType")}>{["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "CONSULTANT"].map((x) => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}</select></label>


<label className="text-sm font-medium sm:col-span-2">Office location<Input className="mt-2" {...field("officeLocation")}/></label>
</div>{create.error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={create.isPending}>{create.isPending ? "Creating…" : "Create account"}</Button></div></form></div>}
    {credentials && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-semibold">Employee account created</h2><p className="mt-2 text-sm leading-6 text-slate-500">Share these credentials through a secure channel. The password will not be displayed again.</p><div className="mt-5 rounded-xl border bg-slate-50 p-4 font-mono text-sm"><p>{credentials.email}</p><p className="mt-2 font-semibold">{credentials.password}</p></div><Button variant="secondary" className="mt-3 w-full" onClick={() => void navigator.clipboard.writeText(`${credentials.email}\n${credentials.password}`)}><Copy size={15}/> Copy credentials</Button><Button className="mt-2 w-full" onClick={() => setCredentials(null)}>I have saved them securely</Button></div></div>}
  </main>;
};
