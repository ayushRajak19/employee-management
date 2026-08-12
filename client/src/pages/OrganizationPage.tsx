import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Layers3, Plus, Shapes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { organizationApi } from "@/features/organization/organizationApi";

type Kind = "department" | "team" | "designation";
const emptyForm = () => ({ name: "", code: "", department: "", description: "", level: "", catalogRole: "" });

export const OrganizationPage = () => {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["organization"], queryFn: organizationApi.list });
  const [kind, setKind] = useState<Kind | null>(null);
  const [form, setForm] = useState(emptyForm);
  const mutation = useMutation({
    mutationFn: () => kind === "department"
      ? organizationApi.createDepartment(form)
      : kind === "team"
        ? organizationApi.createTeam({ ...form, department: form.department })
        : organizationApi.createDesignation({ ...form, department: form.department || undefined, catalogRole: form.catalogRole }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["organization"] }); setKind(null); setForm(emptyForm()); },
  });
  const sections = [
    { key: "departments" as const, label: "Departments", icon: Building2, kind: "department" as Kind },
    { key: "teams" as const, label: "Teams", icon: Layers3, kind: "team" as Kind },
    { key: "designations" as const, label: "Designations", icon: Shapes, kind: "designation" as Kind },
  ];

  return <main className="flex-1 px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-[1400px]">
      <p className="text-sm font-medium text-brand-700">People</p>
      <h1 className="mt-1 text-3xl font-semibold">Organization structure</h1>
      <p className="mt-2 text-sm text-slate-500">Create designations and connect each one to the skills employees must assess.</p>
      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {sections.map(({ key, label, icon: Icon, kind: sectionKind }) => <section key={key} className="rounded-2xl border bg-white shadow-soft">
          <div className="flex items-center border-b p-5">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={17}/></div>
            <div className="ml-3"><h2 className="text-sm font-semibold">{label}</h2><p className="text-xs text-slate-400">{query.data?.[key].length ?? 0} active</p></div>
            <Button variant="secondary" className="ml-auto h-9 px-3" onClick={() => setKind(sectionKind)}><Plus size={15}/> Add</Button>
          </div>
          <div className="p-3">
            {query.isLoading ? <Skeleton className="h-32"/> : !query.data?.[key].length ? <div className="grid h-36 place-items-center text-center"><div><p className="text-sm font-medium">No {label.toLowerCase()} yet</p><p className="mt-1 text-xs text-slate-400">Create the first one to get started.</p></div></div> : <div className="space-y-1">
              {query.data[key].map((item) => <div key={item._id} className="rounded-xl p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between"><p className="text-sm font-medium">{item.name}</p><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{item.code}</span></div>
                {item.department && <p className="mt-1 text-xs text-slate-400">{item.department.name}</p>}
                {item.catalogRole && <p className="mt-1 text-xs font-medium text-brand-700">Skills: {item.catalogRole}</p>}
              </div>)}
            </div>}
          </div>
        </section>)}
      </div>
    </div>
    {kind && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
      <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <h2 className="text-xl font-semibold">Add {kind}</h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Name<Input required className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
          <label className="block text-sm font-medium">Code<Input required className="mt-2 uppercase" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })}/></label>
          {kind !== "department" && <label className="block text-sm font-medium">Department<select required={kind === "team"} className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="">Company-wide</option>{query.data?.departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>}
          {kind === "designation" && <label className="block text-sm font-medium">Skills for this designation<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.catalogRole} onChange={(event) => setForm({ ...form, catalogRole: event.target.value })}><option value="">Select skill catalogue</option>{query.data?.skillCatalogRoles.map((item) => <option key={item.role} value={item.role}>{item.role} ({item.skillCount} skills)</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">Employees receive these skills automatically. They cannot change this selection.</span></label>}
          <label className="block text-sm font-medium">Description<Input className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
        </div>
        {mutation.error && <p className="mt-3 text-sm text-red-600">{mutation.error.message}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setKind(null)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create"}</Button></div>
      </form>
    </div>}
  </main>;
};
