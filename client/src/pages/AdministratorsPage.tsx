import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus, ShieldCheck, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { peopleOpsApi, type AdministratorCredentials } from "@/features/peopleOps/peopleOpsApi";

const initialForm = { name: "", email: "", role: "HR_ADMIN" as "SUPER_ADMIN" | "HR_ADMIN" };

export const AdministratorsPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [credentials, setCredentials] = useState<AdministratorCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const administrators = useQuery({ queryKey: ["administrators"], queryFn: peopleOpsApi.administrators });
  const create = useMutation({
    mutationFn: () => peopleOpsApi.createAdministrator(form),
    onSuccess: async (data) => {
      setCredentials(data.temporaryCredentials);
      setForm(initialForm);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["administrators"] });
    },
  });
  const copyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary password: ${credentials.password}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1200px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-brand-700">Administration</p><h1 className="mt-1 text-3xl font-semibold">Administrators</h1><p className="mt-2 text-sm text-slate-500">Create and review privileged accounts. Only Super Admins can access this area.</p></div><Button onClick={() => { create.reset(); setOpen(true); }}><Plus size={16}/> Create administrator</Button></div>
    <div className="mt-7 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><div><p className="text-sm font-semibold">Use the least privilege needed</p><p className="mt-1 text-xs leading-5 text-amber-800">Choose Admin for day-to-day people administration. Super Admin grants full settings, role, audit, and administrator-account access.</p></div></div>
    <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-soft"><div className="flex items-center border-b p-5"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserCog size={18}/></div><div className="ml-3"><h2 className="font-semibold">Privileged accounts</h2><p className="text-xs text-slate-400">{administrators.data?.items.length ?? 0} administrator accounts</p></div></div>
      {administrators.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-14"/><Skeleton className="h-14"/></div> : administrators.error ? <p className="p-8 text-center text-sm text-red-600">{administrators.error.message}</p> : <div className="divide-y">{administrators.data?.items.map((item) => <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center" key={item._id}><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">{item.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.email}</p></div><div className="sm:ml-auto sm:text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.role.name === "SUPER_ADMIN" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{item.role.name === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}</span><p className="mt-2 text-[11px] text-slate-400">{item.forcePasswordChange ? "Password change pending" : item.lastLoginAt ? `Last login ${new Date(item.lastLoginAt).toLocaleDateString()}` : "Not signed in yet"}</p></div></div>)}{administrators.data?.items.length === 0 && <p className="p-10 text-center text-sm text-slate-400">No administrator accounts found.</p>}</div>}
    </section>
  </div>
  {open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><div className="flex items-center"><div><h2 className="text-xl font-semibold">Create administrator</h2><p className="mt-1 text-sm text-slate-500">Temporary credentials will be shown once.</p></div><button type="button" aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => setOpen(false)}><X size={17}/></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Full name<Input required minLength={2} className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label className="block text-sm font-medium">Email address<Input required type="email" className="mt-2" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label className="block text-sm font-medium">Access role<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as typeof form.role })}><option value="HR_ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>{form.role === "SUPER_ADMIN" && <p className="rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-700">This account will have the same full administrative access as you, including permission to create more administrators.</p>}</div>{create.error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={create.isPending}>{create.isPending ? "Creating..." : "Create account"}</Button></div></form></div>}
  {credentials && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Check size={20}/></div><h2 className="mt-4 text-xl font-semibold">Administrator created</h2><p className="mt-1 text-sm text-slate-500">Copy these credentials now. The password is not shown again.</p><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Email</p><p className="mt-1 break-all text-sm font-medium">{credentials.email}</p><p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Temporary password</p><p className="mt-1 break-all font-mono text-sm font-semibold">{credentials.password}</p></div><p className="mt-3 text-xs text-slate-500">The administrator must change this password at first sign-in.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => void copyCredentials()}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy credentials"}</Button><Button onClick={() => setCredentials(null)}>Done</Button></div></div></div>}
  </main>;
};
