import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, FileText, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { employeeApi } from "@/features/employees/employeeApi";

type ExperienceForm = { company: string; role: string; startDate: string; endDate: string; summary: string };
const blankExperience = (): ExperienceForm => ({ company: "", role: "", startDate: "", endDate: "", summary: "" });
const isPartialExperience = (item: ExperienceForm) => Boolean(item.company || item.role || item.startDate || item.endDate || item.summary) && !(item.company && item.role && item.startDate);

export const MyProfilePage = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["employee", "me"], queryFn: employeeApi.me });
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", personalEmail: "", address: "", emergencyContact: "", professionalSummary: "" });
  const [experiences, setExperiences] = useState<ExperienceForm[]>([]);

  useEffect(() => {
    const employee = query.data?.employee;
    if (!employee) return;
    setForm({ firstName: employee.firstName, lastName: employee.lastName, phone: employee.phone ?? "", personalEmail: employee.personal?.personalEmail ?? "", address: employee.personal?.address ?? "", emergencyContact: employee.personal?.emergencyContact ?? "", professionalSummary: employee.professionalSummary ?? "" });
    setExperiences(employee.previousExperience?.map((item) => ({ company: item.company, role: item.role, startDate: item.startDate?.slice(0, 10) ?? "", endDate: item.endDate?.slice(0, 10) ?? "", summary: item.summary ?? "" })) ?? []);
  }, [query.data?.employee]);

  const hasPartialExperience = experiences.some(isPartialExperience);
  const save = useMutation({
    mutationFn: () => employeeApi.updateMe({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      professionalSummary: form.professionalSummary || undefined,
      personal: { personalEmail: form.personalEmail || undefined, address: form.address || undefined, emergencyContact: form.emergencyContact || undefined },
      previousExperience: experiences.filter((item) => item.company && item.role && item.startDate).map((item) => ({ company: item.company, role: item.role, startDate: item.startDate, ...(item.endDate ? { endDate: item.endDate } : {}), ...(item.summary ? { summary: item.summary } : {}) }))
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee"] })
  });
  const photo = useMutation({ mutationFn: employeeApi.uploadProfilePhoto, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["employee"] }); } });

  if (query.isLoading) return <main className="p-8"><Skeleton className="h-96"/></main>;
  const employee = query.data?.employee;
  if (!employee) return <main className="grid min-h-96 place-items-center text-sm text-slate-500">Your employee profile is unavailable.</main>;
  const message = save.error?.message ?? photo.error?.message;

  const updateExperience = (index: number, key: keyof ExperienceForm, value: string) => setExperiences((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));

  return <main className="p-4 sm:p-8"><div className="mx-auto max-w-4xl">
    <div><p className="text-sm font-medium text-brand-700">Employee profile</p><h1 className="mt-1 text-3xl font-semibold">Edit my profile</h1><p className="mt-2 text-sm text-slate-500">Add skipped onboarding details now or update them whenever needed.</p></div>
    <section className="mt-7 rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-center"><div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-brand-50 text-2xl font-semibold text-brand-700">{employee.profilePhotoUrl ? <img src={employee.profilePhotoUrl} alt={`${employee.firstName} ${employee.lastName}`} className="size-full object-cover"/> : `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`}</div><div><h2 className="text-xl font-semibold">Profile picture</h2><p className="mt-1 text-sm text-slate-500">Upload a JPG, PNG or WebP image up to 5 MB.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"><Camera size={16}/>{photo.isPending ? "Uploading..." : "Upload picture"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={photo.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) photo.mutate(file); }}/></label></div></div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="First name" required value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })}/><Field label="Last name" required value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })}/><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })}/><Field label="Personal email" type="email" value={form.personalEmail} onChange={(value) => setForm({ ...form, personalEmail: value })}/><Field label="Emergency contact" value={form.emergencyContact} onChange={(value) => setForm({ ...form, emergencyContact: value })}/><Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })}/><label className="text-sm font-medium sm:col-span-2">Professional summary<textarea className="mt-2 min-h-36 w-full rounded-xl border p-3 text-sm" maxLength={2000} placeholder="Describe your experience, strengths, responsibilities and career interests." value={form.professionalSummary} onChange={(event) => setForm({ ...form, professionalSummary: event.target.value })}/></label></div>

      <div className="mt-8 border-t pt-7"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Previous experience</h2><p className="mt-1 text-xs text-slate-400">Optional. Company, role and start date are needed only when saving an experience.</p></div><Button type="button" variant="secondary" onClick={() => setExperiences((items) => [...items, blankExperience()])}><Plus size={15}/> Add experience</Button></div><div className="mt-5 space-y-4">{experiences.length ? experiences.map((item, index) => <div className="rounded-2xl border bg-slate-50 p-4" key={index}><div className="grid gap-4 sm:grid-cols-2"><Field label="Company" value={item.company} onChange={(value) => updateExperience(index, "company", value)}/><Field label="Role" value={item.role} onChange={(value) => updateExperience(index, "role", value)}/><Field label="Start date" type="date" value={item.startDate} onChange={(value) => updateExperience(index, "startDate", value)}/><Field label="End date" type="date" value={item.endDate} onChange={(value) => updateExperience(index, "endDate", value)}/><label className="text-sm font-medium sm:col-span-2">Summary<textarea className="mt-2 min-h-24 w-full rounded-xl border bg-white p-3 text-sm" maxLength={1000} placeholder="Summarize your responsibilities, achievements and technologies used." value={item.summary} onChange={(event) => updateExperience(index, "summary", event.target.value)}/></label></div><button type="button" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-red-600" onClick={() => setExperiences((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14}/> Remove experience</button></div>) : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-400">No previous experience added. You can leave this blank.</p>}</div></div>

      <div className="mt-8 border-t pt-7"><h2 className="font-semibold">Skills and documents</h2><p className="mt-1 text-xs text-slate-400">These private records have their own secure update pages.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><ProfileLink to="/skills" icon={<Sparkles size={17}/>} label="Update skills"/><ProfileLink to="/resumes" icon={<FileText size={17}/>} label="Update résumé"/><ProfileLink to="/governance" icon={<FileText size={17}/>} label="Update documents"/></div></div>

      {hasPartialExperience && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">Complete company, role and start date for each experience, or remove the incomplete entry.</p>}
      {message && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      {save.isSuccess && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Your profile has been updated.</p>}
      <div className="mt-7 flex justify-end"><Button onClick={() => save.mutate()} disabled={save.isPending || hasPartialExperience || !form.firstName.trim() || !form.lastName.trim()}><Save size={16}/>{save.isPending ? "Saving..." : "Save profile"}</Button></div>
    </section>
  </div></main>;
};

const Field = ({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) => <label className="text-sm font-medium">{label}{required && <span className="text-red-500"> *</span>}<Input className="mt-2" type={type} required={required} placeholder={type === "date" ? undefined : `Enter ${label.toLowerCase()}`} value={value} onChange={(event) => onChange(event.target.value)}/></label>;
const ProfileLink = ({ to, icon, label }: { to: string; icon: ReactNode; label: string }) => <Link to={to} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">{icon}{label}</Link>;
