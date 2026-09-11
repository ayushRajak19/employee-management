import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Building2, Layers3, Pencil, Plus, Shapes, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { organizationApi } from "@/features/organization/organizationApi";
import { DesignationSkillsModal } from "@/features/organization/DesignationSkillsModal";
import type { NamedEntity } from "@/features/organization/types";

type Kind = "department" | "team" | "designation";
const emptyForm = () => ({ name: "", code: "", department: "", description: "", level: "", catalogRole: "", salesEnabled: false });

export const OrganizationPage = () => {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["organization"], queryFn: organizationApi.list });
  const [kind, setKind] = useState<Kind | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState<{ kind: Kind; item: NamedEntity } | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // Skills Assessment Modal State
  const [skillsTarget, setSkillsTarget] = useState<NamedEntity | null>(null);

  const mutation = useMutation({
    mutationFn: () => kind === "department"
      ? organizationApi.createDepartment({ ...form, capabilities: form.salesEnabled ? ["SALES_MODULE"] : [] })
      : kind === "team"
        ? organizationApi.createTeam({ ...form, department: form.department })
        : organizationApi.createDesignation({ ...form, department: form.department || undefined, catalogRole: form.catalogRole || undefined }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["organization"] }); setKind(null); setForm(emptyForm()); },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error("No item selected");
      const body: Record<string, unknown> = {};
      if (editForm.name) body.name = editForm.name;
      if (editForm.code) body.code = editForm.code;
      if (editForm.description) body.description = editForm.description;
      if (editTarget.kind === "department") { body.capabilities = editForm.salesEnabled ? ["SALES_MODULE"] : []; return organizationApi.updateDepartment(editTarget.item._id, body); }
      if (editForm.department) body.department = editForm.department;
      if (editTarget.kind === "team") return organizationApi.updateTeam(editTarget.item._id, body);
      body.catalogRole = editForm.catalogRole || "";
      return organizationApi.updateDesignation(editTarget.item._id, body);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["organization"] }); setEditTarget(null); setEditForm(emptyForm()); },
  });

  const openEdit = (sectionKind: Kind, item: NamedEntity) => {
    setEditTarget({ kind: sectionKind, item });
    setEditForm({
      name: item.name,
      code: item.code,
      department: item.department?._id ?? "",
      description: item.description ?? "",
      level: "",
      catalogRole: item.catalogRole ?? "",
      salesEnabled: item.capabilities?.includes("SALES_MODULE") ?? false,
    });
  };

  const openSkillsModal = (item: NamedEntity) => {
    setSkillsTarget(item);
  };

  const sections = [
    { key: "departments" as const, label: "Departments", icon: Building2, kind: "department" as Kind },
    { key: "teams" as const, label: "Teams", icon: Layers3, kind: "team" as Kind },
    { key: "designations" as const, label: "Designations", icon: Shapes, kind: "designation" as Kind },
  ];

  return <main className="flex-1 px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-[1400px]">
      <p className="text-sm font-medium text-brand-700">People</p>
      <h1 className="mt-1 text-3xl font-semibold">Organization structure</h1>
      <p className="mt-2 text-sm text-slate-500">Create departments, teams, and designations. Define custom skill assessments for each designation that employees can evaluate.</p>
      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {sections.map(({ key, label, icon: Icon, kind: sectionKind }) => <section key={key} className="rounded-2xl border bg-white shadow-soft">
          <div className="flex items-center border-b p-5">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={17}/></div>
            <div className="ml-3"><h2 className="text-sm font-semibold">{label}</h2><p className="text-xs text-slate-400">{query.data?.[key].length ?? 0} active</p></div>
            <Button variant="secondary" className="ml-auto h-9 px-3" onClick={() => setKind(sectionKind)}><Plus size={15}/> Add</Button>
          </div>
          <div className="p-3">
            {query.isLoading ? <Skeleton className="h-32"/> : !query.data?.[key].length ? <div className="grid h-36 place-items-center text-center"><div><p className="text-sm font-medium">No {label.toLowerCase()} yet</p><p className="mt-1 text-xs text-slate-400">Create the first one to get started.</p></div></div> : <div className="space-y-1">
              {query.data[key].map((item) => <div key={item._id} className="group rounded-xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sectionKind === "designation" && (
                      <button
                        type="button"
                        title="Configure Skills Assessment"
                        className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 transition"
                        onClick={() => openSkillsModal(item)}
                      >
                        <Award size={13} />
                        <span>Skills</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                      onClick={() => openEdit(sectionKind, item)}
                    >
                      <Pencil size={13}/>
                    </button>
                  </div>
                </div>
                {item.department && <p className="mt-1 text-xs text-slate-400">{item.department.name}</p>}
                {sectionKind === "designation" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.customSkills && item.customSkills.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Sparkles size={10} /> {item.customSkills.length} Assessment Skills
                      </span>
                    ) : item.catalogRole ? (
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[10px] font-medium text-brand-700">
                        Catalog: {item.catalogRole}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                        No assessment configured
                      </span>
                    )}
                  </div>
                )}
                {item.capabilities?.includes("SALES_MODULE") && <p className="mt-1 text-xs font-medium text-emerald-700">Sales enabled</p>}
              </div>)}
            </div>}
          </div>
        </section>)}
      </div>
    </div>

    {/* Create entity modal */}
    {kind && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
      <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <h2 className="text-xl font-semibold">Add {kind}</h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Name<Input required className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
          <label className="block text-sm font-medium">Code<Input required className="mt-2 uppercase" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })}/></label>
          {kind !== "department" && <label className="block text-sm font-medium">Department<select required={kind === "team"} className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}><option value="">Company-wide</option>{query.data?.departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>}
          {kind === "designation" && <label className="block text-sm font-medium">Skill Catalog Template (Optional)<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.catalogRole} onChange={(event) => setForm({ ...form, catalogRole: event.target.value })}><option value="">None (Custom skills / define later)</option>{query.data?.skillCatalogRoles.map((item) => <option key={item.role} value={item.role}>{item.role} ({item.skillCount} skills)</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">You can also configure custom skills and assessment questions anytime.</span></label>}
          {kind === "department" && <label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium"><input type="checkbox" checked={form.salesEnabled} onChange={(event) => setForm({ ...form, salesEnabled: event.target.checked })}/> Enable Sales Intelligence</label>}
          <label className="block text-sm font-medium">Description<Input className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
        </div>
        {mutation.error && <p className="mt-3 text-sm text-red-600">{mutation.error.message}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setKind(null)}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create"}</Button></div>
      </form>
    </div>}

    {/* Edit entity modal */}
    {editTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
      <form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }}>
        <h2 className="text-xl font-semibold">Edit {editTarget.kind}</h2>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Name<Input required className="mt-2" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}/></label>
          <label className="block text-sm font-medium">Code<Input required className="mt-2 uppercase" value={editForm.code} onChange={(event) => setEditForm({ ...editForm, code: event.target.value })}/></label>
          {editTarget.kind !== "department" && <label className="block text-sm font-medium">Department<select required={editTarget.kind === "team"} className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={editForm.department} onChange={(event) => setEditForm({ ...editForm, department: event.target.value })}><option value="">Company-wide</option>{query.data?.departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label>}
          {editTarget.kind === "designation" && <label className="block text-sm font-medium">Skills for this designation<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={editForm.catalogRole} onChange={(event) => setEditForm({ ...editForm, catalogRole: event.target.value })}><option value="">None / Custom skills</option>{query.data?.skillCatalogRoles.map((item) => <option key={item.role} value={item.role}>{item.role} ({item.skillCount} skills)</option>)}</select></label>}
          {editTarget.kind === "department" && <label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium"><input type="checkbox" checked={editForm.salesEnabled} onChange={(event) => setEditForm({ ...editForm, salesEnabled: event.target.checked })}/> Enable Sales Intelligence</label>}
          <label className="block text-sm font-medium">Description<Input className="mt-2" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}/></label>
        </div>
        {updateMutation.error && <p className="mt-3 text-sm text-red-600">{updateMutation.error.message}</p>}
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button><Button disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save changes"}</Button></div>
      </form>
    </div>}

    {/* Skills Assessment Configuration Modal */}
    <DesignationSkillsModal
      isOpen={!!skillsTarget}
      onClose={() => setSkillsTarget(null)}
      targetDesignation={skillsTarget}
      allDesignations={query.data?.designations || []}
      catalogRoles={query.data?.skillCatalogRoles || []}
      onSaved={async () => {
        await qc.invalidateQueries({ queryKey: ["organization"] });
      }}
    />

  </main>;
};
