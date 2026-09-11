import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Building2, Download, Layers3, Pencil, Plus, Shapes, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { organizationApi } from "@/features/organization/organizationApi";
import type { DesignationSkillItem, NamedEntity } from "@/features/organization/types";

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
  const [targetSkills, setTargetSkills] = useState<DesignationSkillItem[]>([]);
  const [selectedTemplateRole, setSelectedTemplateRole] = useState<string>("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

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

  const saveSkillsMutation = useMutation({
    mutationFn: () => {
      if (!skillsTarget) throw new Error("No designation selected");
      for (let i = 0; i < targetSkills.length; i++) {
        const s = targetSkills[i];
        if (!s.name.trim()) throw new Error(`Skill #${i + 1} requires a name.`);
        if (!s.description.trim()) throw new Error(`Skill "${s.name || `#${i + 1}`}" requires a description.`);
      }
      return organizationApi.updateDesignationSkills(skillsTarget._id, {
        skills: targetSkills,
        catalogRole: selectedTemplateRole || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["organization"] });
      setSkillsTarget(null);
    },
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
    setTargetSkills(item.customSkills ? JSON.parse(JSON.stringify(item.customSkills)) : []);
    setSelectedTemplateRole(item.catalogRole ?? "");
  };

  const handleAddCustomSkill = () => {
    const newSkill: DesignationSkillItem = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      category: "Technical",
      level: "Basic",
      tools: "",
      description: "",
      assessmentQuestion: "",
    };
    setTargetSkills((prev) => [...prev, newSkill]);
  };

  const handleSkillChange = (index: number, field: keyof DesignationSkillItem, value: string) => {
    setTargetSkills((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteSkill = (index: number) => {
    setTargetSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadTemplate = async () => {
    if (!selectedTemplateRole) return;
    if (targetSkills.length > 0 && !window.confirm(`Replace the current ${targetSkills.length} skills with the "${selectedTemplateRole}" catalog template?`)) {
      return;
    }
    try {
      setIsLoadingTemplate(true);
      const res = await organizationApi.getSkillCatalogForRole(selectedTemplateRole);
      setTargetSkills(res.items || []);
    } catch {
      alert("Failed to load catalog template");
    } finally {
      setIsLoadingTemplate(false);
    }
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
    {skillsTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Award size={18} />
              </span>
              <h2 className="text-xl font-semibold text-slate-900">
                Skill Assessment: {skillsTarget.name}
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {skillsTarget.code}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Define the specific skills and assessment questions for this designation. Employees holding this title will self-rate against these criteria.
            </p>
          </div>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            onClick={() => setSkillsTarget(null)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Import Template & Add Custom Skill */}
        <div className="border-b bg-slate-50/80 px-6 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-xl border bg-white px-3 text-xs text-slate-700 shadow-xs focus:border-brand-500 focus:outline-hidden"
                value={selectedTemplateRole}
                onChange={(e) => setSelectedTemplateRole(e.target.value)}
              >
                <option value="">Choose Catalog Template...</option>
                {query.data?.skillCatalogRoles.map((c) => (
                  <option key={c.role} value={c.role}>
                    {c.role} ({c.skillCount} skills)
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                className="h-9 text-xs"
                disabled={!selectedTemplateRole || isLoadingTemplate}
                onClick={handleLoadTemplate}
              >
                <Download size={13} className="mr-1" />
                {isLoadingTemplate ? "Loading..." : "Import Template"}
              </Button>
            </div>

            <Button
              type="button"
              className="h-9 text-xs"
              onClick={handleAddCustomSkill}
            >
              <Plus size={14} className="mr-1" />
              Add Custom Skill
            </Button>
          </div>
        </div>

        {/* Scrollable Skills List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {targetSkills.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
                <Sparkles size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Assessment Skills Configured</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Add custom skills or import from one of our pre-built role templates above to establish the skills assessment.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="secondary" className="h-8 px-3 text-xs" onClick={handleAddCustomSkill}>
                  <Plus size={13} className="mr-1" /> Add First Skill
                </Button>
              </div>
            </div>
          ) : (
            targetSkills.map((skill, index) => (
              <div
                key={skill.id || index}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:border-brand-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Skill Specification
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Remove Skill"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    onClick={() => handleDeleteSkill(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Skill Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Distributed Systems Architecture"
                      className="mt-1 text-sm font-medium"
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      Category
                    </label>
                    <Input
                      placeholder="e.g. Backend, Leadership, Domain"
                      className="mt-1 text-sm"
                      value={skill.category}
                      onChange={(e) => handleSkillChange(index, "category", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      Proficiency Level
                    </label>
                    <select
                      className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm"
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, "level", e.target.value as "Basic" | "Intermediate" | "Advanced")}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600">
                      Tools & Frameworks (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Docker, Kubernetes, AWS ECS, Terraform"
                      className="mt-1 text-sm"
                      value={skill.tools || ""}
                      onChange={(e) => handleSkillChange(index, "tools", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Skill Description & Behavioral Standard <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe what this skill entails and what is expected of the employee..."
                    className="mt-1 w-full rounded-xl border bg-slate-50/50 p-2.5 text-xs leading-5 text-slate-700 focus:bg-white focus:outline-hidden focus:border-brand-500"
                    value={skill.description}
                    onChange={(e) => handleSkillChange(index, "description", e.target.value)}
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Assessment Prompt / Question (Visible to Employee during Self-Assessment)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Provide a concrete example where you architected a microservice handling high-throughput traffic..."
                    className="mt-1 w-full rounded-xl border border-brand-100 bg-brand-50/30 p-2.5 text-xs leading-5 text-slate-700 focus:bg-white focus:outline-hidden focus:border-brand-500"
                    value={skill.assessmentQuestion || ""}
                    onChange={(e) => handleSkillChange(index, "assessmentQuestion", e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50/80 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">
                {targetSkills.length} skill{targetSkills.length === 1 ? "" : "s"} configured for {skillsTarget.name}
              </p>
              {saveSkillsMutation.error && (
                <p className="mt-1 text-xs text-red-600">
                  {saveSkillsMutation.error.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSkillsTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saveSkillsMutation.isPending}
                onClick={() => saveSkillsMutation.mutate()}
              >
                {saveSkillsMutation.isPending ? "Saving Skills..." : "Save Assessment Skills"}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>}

  </main>;
};
