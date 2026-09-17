import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, FileCheck2, FileText, GraduationCap, Sparkles, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { governanceApi } from "@/features/governance/governanceApi";
import { skillApi } from "@/features/skills/skillApi";

const steps = [{ label: "Personal information", icon: UserRound }, { label: "Professional information", icon: GraduationCap }, { label: "Previous experience", icon: GraduationCap }, { label: "Skills", icon: Sparkles }, { label: "Certifications", icon: FileCheck2 }, { label: "Documents", icon: FileText }, { label: "Review and complete", icon: Check }];

export const OnboardingPage = () => {
  const navigate = useNavigate(); const queryClient = useQueryClient(); const { user, setUser } = useAuth(); const [index, setIndex] = useState(0); const hydrated = useRef(false);
  const [data, setData] = useState({ personalEmail: "", address: "", emergencyContact: "", professionalSummary: "", company: "", experienceRole: "", startDate: "" });
  const [skill, setSkill] = useState({ skill: "", selfRating: 5, yearsOfExperience: 0, evidenceUrl: "" });
  const [certificate, setCertificate] = useState<File | null>(null); const [resume, setResume] = useState<File | null>(null); const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [roleRatings, setRoleRatings] = useState<Record<string, number>>({});
  const [roleNotes, setRoleNotes] = useState<Record<string, string>>({});
  const roleAssessment = useQuery({ queryKey: ["skills", "role-assessment"], queryFn: skillApi.roleAssessment, enabled: index >= 2 });
  const employee = useQuery({ queryKey: ["employee", "me"], queryFn: employeeApi.me });
  const skills = useQuery({ queryKey: ["skills"], queryFn: skillApi.list, enabled: index === 3 });
  const mine = useQuery({ queryKey: ["skills", "mine"], queryFn: skillApi.mine, enabled: index >= 3 });
  const documents = useQuery({ queryKey: ["documents"], queryFn: governanceApi.documents, enabled: index >= 4 });
  const removeDocument = useMutation({ mutationFn: governanceApi.deleteDocument, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["documents"] }), queryClient.invalidateQueries({ queryKey: ["employee", "me"] })]); } });
  useEffect(() => { const current = employee.data?.employee; if (!current || hydrated.current) return; hydrated.current = true; const experience = current.previousExperience?.[0]; setData({ personalEmail: current.personal?.personalEmail ?? "", address: current.personal?.address ?? "", emergencyContact: current.personal?.emergencyContact ?? "", professionalSummary: current.professionalSummary ?? "", company: experience?.company ?? "", experienceRole: experience?.role ?? "", startDate: experience?.startDate?.slice(0, 10) ?? "" }); }, [employee.data?.employee]);
  const hasDocument = (category: string) => Boolean(documents.data?.items.some((item) => item.category === category));
  const upload = async (file: File, category: string) => { const employeeId = employee.data?.employee._id; if (!employeeId) throw new Error("Employee profile is still loading"); const form = new FormData(); form.append("file", file); form.append("employee", employeeId); form.append("category", category); await governanceApi.upload(form); };
  const save = useMutation({ mutationFn: async () => {
    const step = index + 2;
    if (index === 0) { const personal = { ...(data.personalEmail.trim() ? { personalEmail: data.personalEmail.trim() } : {}), ...(data.address.trim() ? { address: data.address.trim() } : {}), ...(data.emergencyContact.trim() ? { emergencyContact: data.emergencyContact.trim() } : {}) }; await employeeApi.onboarding({ step, ...(Object.keys(personal).length ? { personal } : {}) }); }
    if (index === 1) await employeeApi.onboarding({ step, ...(data.professionalSummary.trim() ? { professionalSummary: data.professionalSummary.trim() } : {}) });
    if (index === 2) { const completeExperience = data.company.trim() && data.experienceRole.trim() && data.startDate; await employeeApi.onboarding({ step, ...(completeExperience ? { previousExperience: [{ company: data.company.trim(), role: data.experienceRole.trim(), startDate: data.startDate }] } : {}) }); }
    if (index === 3) {
      const catalog = roleAssessment.data?.catalog || [];
      if (catalog.length > 0 && !roleAssessment.data?.assessment) {
        const ratingsToSubmit = catalog.map((s) => ({
          skillId: s.id,
          rating: roleRatings[s.id] || 5,
          implementationNote: (roleNotes[s.id] || "Onboarding baseline skill self-assessment").trim()
        }));
        await skillApi.submitRoleAssessment({ ratings: ratingsToSubmit });
      } else if (skill.skill) {
        await skillApi.claim({ skill: skill.skill, selfRating: Number(skill.selfRating), yearsOfExperience: Number(skill.yearsOfExperience), evidence: skill.evidenceUrl ? [{ type: "PROJECT", url: skill.evidenceUrl }] : [] });
      }
      await employeeApi.onboarding({ step });
    }
    if (index === 4) { if (certificate) await upload(certificate, "CERTIFICATE"); await queryClient.invalidateQueries({ queryKey: ["documents"] }); await employeeApi.onboarding({ step }); }
    if (index === 5) { if (resume) await upload(resume, "RESUME"); if (identityDocument) await upload(identityDocument, "ID_DOCUMENT"); await queryClient.invalidateQueries({ queryKey: ["documents"] }); await employeeApi.onboarding({ step }); }
    if (index === 6) await employeeApi.onboarding({ step: 8, complete: true });
  }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["employee", "me"] }), queryClient.invalidateQueries({ queryKey: ["skills", "mine"] }), queryClient.invalidateQueries({ queryKey: ["skills", "role-assessment"] }), queryClient.invalidateQueries({ queryKey: ["documents"] })]); if (index === steps.length - 1 && user) { setUser({ ...user, onboardingComplete: true }); navigate("/", { replace: true }); } else setIndex((value) => Math.min(steps.length - 1, value + 1)); } });
  const current = steps[index]!; const Icon = current.icon; const completion = employee.data?.employee.profileCompletion ?? 35;
  return <main className="min-h-screen bg-[#faf8ff] px-4 py-6 sm:p-8"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><div><p className="text-sm font-semibold">MobiusEMS</p><p className="text-xs text-slate-400">Optional profile setup</p></div><div className="text-right"><p className="text-xs text-slate-500">Profile completion</p><p className="font-semibold text-brand-700">{completion}%</p></div></header><div className="mt-5 h-1.5 rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${completion}%` }}/></div><div className="mt-8 grid gap-6 lg:grid-cols-[250px_1fr]"><aside className="hidden rounded-2xl border bg-white p-3 lg:block">{steps.map((step, stepIndex) => <div key={step.label} className={`flex items-center rounded-xl p-3 text-sm ${stepIndex === index ? "bg-brand-50 font-medium text-brand-700" : "text-slate-400"}`}><span className="grid size-7 place-items-center rounded-lg bg-white">{stepIndex < index ? <Check size={14}/> : stepIndex + 2}</span><span className="ml-3">{step.label}</span></div>)}</aside><section className="min-h-[500px] rounded-3xl border bg-white p-6 shadow-soft sm:p-9"><div className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon size={20}/></div><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-brand-700">Step {index + 2} of 8</p><h1 className="mt-1 text-2xl font-semibold">{current.label}</h1><p className="mt-2 text-sm text-slate-500">All fields are optional. Continue now and update skipped details later from Edit my profile.</p><div className="mt-8">
    {index === 0 && <div className="space-y-4"><Field label="Personal email (optional)" type="email" value={data.personalEmail} onChange={(value) => setData({ ...data, personalEmail: value })}/><Field label="Address (optional)" value={data.address} onChange={(value) => setData({ ...data, address: value })}/><Field label="Emergency contact (optional)" value={data.emergencyContact} onChange={(value) => setData({ ...data, emergencyContact: value })}/></div>}
    {index === 1 && <label className="text-sm font-medium">Professional summary (optional)<textarea className="mt-2 min-h-40 w-full rounded-xl border p-3 text-sm" maxLength={2000} placeholder="Describe your experience, strengths, current role and career focus." value={data.professionalSummary} onChange={(event) => setData({ ...data, professionalSummary: event.target.value })}/><span className="mt-1 block text-xs font-normal text-slate-400">You can add or edit this later.</span></label>}
    {index === 2 && <div><div className="grid gap-4 sm:grid-cols-2"><Field label="Previous company (optional)" value={data.company} onChange={(value) => setData({ ...data, company: value })}/><Field label="Role (optional)" value={data.experienceRole} onChange={(value) => setData({ ...data, experienceRole: value })}/><Field label="Start date (optional)" type="date" value={data.startDate} onChange={(value) => setData({ ...data, startDate: value })}/></div><p className="mt-3 text-xs text-slate-400">Enter all three fields to save this job now, or leave them for later.</p></div>}
    {index === 3 && (
      <div>
        {roleAssessment.data?.assessment ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <Check className="mx-auto text-emerald-600 mb-2" size={32} />
            <h3 className="text-lg font-semibold text-emerald-900">Designation Skills Already Configured</h3>
            <p className="mt-1 text-sm text-emerald-700">
              {roleAssessment.data.assessment.scores.length} core skills assessed with an overall baseline score of {roleAssessment.data.assessment.averageRating}/10.
            </p>
            <p className="mt-2 text-xs text-emerald-600">
              Your task completion times and delivery quality will be monitored against these ratings.
            </p>
          </div>
        ) : roleAssessment.data?.catalog && roleAssessment.data.catalog.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm font-semibold text-brand-900">
                Designation Skills Assessment: {roleAssessment.data.designation?.name || "Your Role"}
              </p>
              <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                Honestly rate your mastery for each skill on a scale of 1 to 10. Our AI will benchmark your future task velocity and quality against these scores. High claims require fast delivery to maintain high internal rank!
              </p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {roleAssessment.data.catalog.map((catSkill) => (
                <div key={catSkill.id} className="rounded-xl border bg-slate-50/50 p-4 hover:bg-white transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{catSkill.name}</span>
                      <span className="ml-2 rounded bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">{catSkill.level}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{catSkill.description}</p>
                    </div>
                    <div className="text-sm font-bold text-brand-700 shrink-0">
                      {roleRatings[catSkill.id] ? `${roleRatings[catSkill.id]}/10` : "Self-Score: 5/10"}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                      <button
                        type="button"
                        key={rating}
                        className={`grid size-7 place-items-center rounded-lg border text-xs font-semibold transition ${
                          (roleRatings[catSkill.id] || 5) === rating
                            ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                        }`}
                        onClick={() => setRoleRatings((prev) => ({ ...prev, [catSkill.id]: rating }))}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="mt-2.5 h-8 w-full rounded-lg border bg-white px-2.5 text-xs placeholder:text-slate-400"
                    placeholder="Brief experience / evidence note (optional)..."
                    value={roleNotes[catSkill.id] || ""}
                    onChange={(e) => setRoleNotes((prev) => ({ ...prev, [catSkill.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">Skill (optional)
                <select className="mt-2 h-11 w-full rounded-xl border px-3" value={skill.skill} onChange={(event) => setSkill({ ...skill, skill: event.target.value })}>
                  <option value="">Skip for now</option>
                  {skills.data?.items.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.category}</option>)}
                </select>
              </label>
              <Field label="Self rating (1–10)" type="number" value={String(skill.selfRating)} onChange={(value) => setSkill({ ...skill, selfRating: Number(value) })}/>
              <Field label="Years of experience" type="number" value={String(skill.yearsOfExperience)} onChange={(value) => setSkill({ ...skill, yearsOfExperience: Number(value) })}/>
              <label className="text-sm font-medium sm:col-span-2">Evidence link (optional)
                <Input type="url" className="mt-2" placeholder="GitHub, portfolio or project URL" value={skill.evidenceUrl} onChange={(event) => setSkill({ ...skill, evidenceUrl: event.target.value })}/>
              </label>
            </div>
            <p className="mt-4 text-xs text-slate-400">{mine.data?.items.length ?? 0} skill claim(s) currently saved. You can add skills later.</p>
          </div>
        )}
      </div>
    )}
    {index === 4 && <div className="space-y-3"><UploadField label="Certificate file (optional)" file={certificate} onChange={setCertificate} help={hasDocument("CERTIFICATE") ? "Certificate already uploaded." : "You can skip this and upload it later."}/>{hasDocument("CERTIFICATE") && <DeleteExistingDocument label="certificate" pending={removeDocument.isPending} onDelete={() => { const item = documents.data?.items.find((document) => document.category === "CERTIFICATE"); if (item && window.confirm("Permanently delete the uploaded certificate?")) removeDocument.mutate(item._id); }}/>}</div>}
    {index === 5 && <div className="space-y-4"><div><UploadField label="Résumé (optional)" file={resume} onChange={setResume} help={hasDocument("RESUME") ? "Résumé already uploaded." : "You can upload it later from Resume library."}/>{hasDocument("RESUME") && <DeleteExistingDocument label="résumé" pending={removeDocument.isPending} onDelete={() => { const item = documents.data?.items.find((document) => document.category === "RESUME"); if (item && window.confirm("Permanently delete the uploaded résumé?")) removeDocument.mutate(item._id); }}/>}</div><div><UploadField label="Identity document (optional)" file={identityDocument} onChange={setIdentityDocument} help={hasDocument("ID_DOCUMENT") ? "Identity document already uploaded." : "You can upload it later from Documents & reports."}/>{hasDocument("ID_DOCUMENT") && <DeleteExistingDocument label="identity document" pending={removeDocument.isPending} onDelete={() => { const item = documents.data?.items.find((document) => document.category === "ID_DOCUMENT"); if (item && window.confirm("Permanently delete the uploaded identity document?")) removeDocument.mutate(item._id); }}/>}</div></div>}
    {index === 6 && <div className="rounded-2xl bg-brand-50 p-6"><h2 className="font-semibold">Finish profile setup</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Summary label="Profile completion" value={`${completion}%`}/><Summary label="Skills" value={String(mine.data?.items.length ?? 0)}/><Summary label="Documents" value={String(documents.data?.items.length ?? 0)}/></div><p className="mt-4 text-sm text-slate-600">Enter the workspace now. Any skipped details can be added later from Edit my profile, Skills, Resume library, or Documents & reports.</p></div>}
  </div>{save.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{save.error.message}</p>}<div className="mt-10 flex justify-between border-t pt-5"><Button variant="ghost" disabled={index === 0 || save.isPending} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={16}/> Back</Button><Button disabled={save.isPending || employee.isLoading} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : index === steps.length - 1 ? "Complete onboarding" : <>Save and continue <ArrowRight size={16}/></>}</Button></div></section></div></div></main>;
};
const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => <label className="block text-sm font-medium">{label}<Input type={type} className="mt-2" placeholder={type === "date" ? undefined : `Enter ${label.replace(" (optional)", "").toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)}/></label>;
const UploadField = ({ label, file, onChange, help }: { label: string; file: File | null; onChange: (file: File | null) => void; help: string }) => <label className="block rounded-2xl border border-dashed bg-slate-50 p-6 text-sm font-medium">{label}<input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.webp" className="mt-3 block w-full rounded-xl border bg-white p-2 text-sm" onChange={(event) => onChange(event.target.files?.[0] ?? null)}/><span className="mt-2 block text-xs font-normal text-slate-400">{file ? `Selected: ${file.name}` : help}</span></label>;
const DeleteExistingDocument = ({ label, pending, onDelete }: { label: string; pending: boolean; onDelete: () => void }) => <button type="button" className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50" disabled={pending} onClick={onDelete}><Trash2 size={14}/> Delete uploaded {label}</button>;
const Summary = ({ label, value }: { label: string; value: string }) => <div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold text-brand-700">{value}</p></div>;

