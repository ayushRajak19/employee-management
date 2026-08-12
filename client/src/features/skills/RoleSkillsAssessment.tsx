import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { skillApi, type CatalogSkill, type RoleSkillAssessment } from "@/features/skills/skillApi";

const levelStyle: Record<string, string> = { Basic: "bg-sky-50 text-sky-700", Intermediate: "bg-amber-50 text-amber-700", Advanced: "bg-violet-50 text-violet-700" };
const groupByLevel = <T extends { level: string }>(items: T[]) => Object.entries(items.reduce<Record<string, T[]>>((groups, item) => { (groups[item.level] ??= []).push(item); return groups; }, {}));

const Results = ({ assessment }: { assessment: RoleSkillAssessment }) => {
  const groups = useMemo(() => groupByLevel(assessment.scores), [assessment.scores]);
  return <div className="mx-auto max-w-[1440px]">
    <section className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={24}/></div>
        <div><p className="text-sm font-medium text-emerald-700">Assessment completed</p><h1 className="mt-1 text-3xl font-semibold">{assessment.role}</h1><p className="mt-2 text-sm text-slate-500">Submitted {new Date(assessment.submittedAt).toLocaleString()} · Your answers are locked and cannot be edited.</p></div>
        <div className="sm:ml-auto sm:text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Overall self-score</p><p className="mt-1 text-3xl font-semibold text-brand-700">{assessment.averageRating}<span className="text-base text-slate-400"> / 10</span></p></div>
      </div>
    </section>
    <div className="mt-5 space-y-5">{groups.map(([level, skills]) => <section className="rounded-2xl border bg-white shadow-soft" key={level}>
      <div className="flex items-center border-b p-5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelStyle[level] ?? "bg-slate-100 text-slate-700"}`}>{level}</span><span className="ml-auto text-xs text-slate-400">{skills.length} skills</span></div>
      <div className="divide-y">{skills.map((skill) => <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center" key={skill.skillId}><div className="min-w-0 flex-1"><p className="font-semibold">{skill.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{skill.description}</p><p className="mt-1 text-[11px] text-slate-400">{skill.category} · {skill.tools}</p></div><div className="shrink-0 rounded-xl bg-brand-50 px-4 py-2 text-center"><p className="text-xl font-semibold text-brand-700">{skill.rating}/10</p><p className="text-[10px] text-brand-600">Self-score</p></div></div>)}</div>
    </section>)}</div>
  </div>;
};

const RatingButtons = ({ skill, value, onChange }: { skill: CatalogSkill; value?: number; onChange: (rating: number) => void }) => <fieldset className="shrink-0">
  <legend className="mb-2 text-xs font-medium text-slate-500">How good are you? <span className="text-brand-700">{value ? `${value}/10` : "Not rated"}</span></legend>
  <div className="flex flex-wrap gap-1.5">{Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => <button type="button" aria-label={`${skill.name}: ${rating} out of 10`} className={`grid size-9 place-items-center rounded-lg border text-xs font-semibold transition ${value === rating ? "border-brand-600 bg-brand-600 text-white" : "bg-white text-slate-500 hover:border-brand-300 hover:bg-brand-50"}`} key={rating} onClick={() => onChange(rating)}>{rating}</button>)}</div>
</fieldset>;

export const RoleSkillsAssessment = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["skills", "role-assessment"], queryFn: skillApi.roleAssessment });
  const [selectedRole, setSelectedRole] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const roleSkills = useMemo(() => query.data?.catalog.filter((skill) => skill.role === selectedRole) ?? [], [query.data?.catalog, selectedRole]);
  const grouped = useMemo(() => groupByLevel(roleSkills), [roleSkills]);
  const answered = roleSkills.filter((skill) => ratings[skill.id]).length;
  const submit = useMutation({ mutationFn: () => skillApi.submitRoleAssessment({ role: selectedRole, ratings: roleSkills.map((skill) => ({ skillId: skill.id, rating: ratings[skill.id]! })) }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["skills", "role-assessment"] }); } });
  const chooseRole = (role: string) => { setSelectedRole(role); setRatings({}); submit.reset(); };
  const confirmSubmit = () => { if (answered === roleSkills.length && window.confirm(`Submit all ${roleSkills.length} ratings for ${selectedRole}? This is a one-time form and cannot be edited after submission.`)) submit.mutate(); };

  if (query.isLoading) return <main className="flex-1 px-5 py-8 sm:px-8"><Skeleton className="h-72"/></main>;
  if (query.isError || !query.data) return <main className="grid min-h-96 flex-1 place-items-center text-sm text-red-600">Unable to load the role skill catalog.</main>;
  if (query.data.assessment) return <main className="flex-1 px-5 py-8 sm:px-8"><Results assessment={query.data.assessment}/></main>;

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]">
    <div><p className="text-sm font-medium text-brand-700">One-time employee form</p><h1 className="mt-1 text-3xl font-semibold">Role skill self-assessment</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Select the role that best matches your work. You will then rate every listed skill from 1 to 10. Submit only when complete; your response is permanent and cannot be edited.</p></div>
    <section className="mt-7 rounded-2xl border bg-white p-5 shadow-soft">
      <label className="block text-sm font-semibold" htmlFor="catalog-role">Your role</label>
      <select id="catalog-role" className="mt-2 h-12 w-full max-w-xl rounded-xl border bg-white px-3 text-sm" value={selectedRole} onChange={(event) => chooseRole(event.target.value)}><option value="">Select a role to view its skills</option>{query.data.roles.map((item) => <option key={item.role} value={item.role}>{item.role} ({item.skillCount} skills)</option>)}</select>
      {selectedRole && <div className="mt-5 flex flex-col gap-2 border-t pt-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex justify-between text-xs"><span className="font-medium">Assessment progress</span><span>{answered} of {roleSkills.length} rated</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${roleSkills.length ? answered / roleSkills.length * 100 : 0}%` }}/></div></div><div className="flex items-center gap-2 text-xs text-slate-500 sm:ml-6"><LockKeyhole size={14}/> Locks after submission</div></div>}
    </section>
    {selectedRole && <div className="mt-5 space-y-5">
      {grouped.map(([level, skills]) => <section className="rounded-2xl border bg-white shadow-soft" key={level}><div className="flex items-center border-b p-5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelStyle[level] ?? "bg-slate-100 text-slate-700"}`}>{level}</span><span className="ml-auto text-xs text-slate-400">{skills.length} skills</span></div><div className="divide-y">{skills.map((skill) => <div className="p-5" key={skill.id}><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{skill.name}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{skill.category}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{skill.description}</p><p className="mt-1 text-[11px] text-slate-400">Tools: {skill.tools}</p></div><RatingButtons skill={skill} value={ratings[skill.id]} onChange={(rating) => setRatings((current) => ({ ...current, [skill.id]: rating }))}/></div></div>)}</div></section>)}
      <section className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Sparkles size={18}/></div><div><p className="text-sm font-semibold">{answered === roleSkills.length ? "Ready to submit" : `${roleSkills.length - answered} ratings remaining`}</p><p className="text-xs text-slate-400">Submission is final and cannot be changed.</p></div></div><Button className="sm:ml-auto" disabled={answered !== roleSkills.length || submit.isPending} onClick={confirmSubmit}>{submit.isPending ? "Submitting..." : `Submit ${roleSkills.length} ratings`}</Button>{submit.isError && <p className="text-xs text-red-600">{submit.error.message}</p>}</section>
    </div>}
  </div></main>;
};
