import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus, Search, Upload, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { governanceApi } from "@/features/governance/governanceApi";
import { organizationApi } from "@/features/organization/organizationApi";

const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const ApplicantsPage = () => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", designation: "" });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const applicants = useQuery({ queryKey: ["applicants"], queryFn: governanceApi.applicants });
  const organization = useQuery({ queryKey: ["organization"], queryFn: organizationApi.list });
  const create = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("name", form.name);
      data.append("designation", form.designation);
      data.append("file", file!);
      return governanceApi.createApplicant(data);
    },
    onSuccess: async () => {
      setOpen(false);
      setForm({ name: "", designation: "" });
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["applicants"] });
    }
  });
  const filtered = applicants.data?.items.filter((item) => `${item.name} ${item.designation} ${item.originalName}`.toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  const selectFile = (selected?: File) => {
    setFileError("");
    create.reset();
    if (!selected) return setFile(null);
    if ((!selected.name.toLowerCase().endsWith(".pdf") && selected.type !== "application/pdf") || selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError(selected.size > 10 * 1024 * 1024 ? "The CV must be 10 MB or smaller." : "Please select a PDF file.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(selected);
  };
  const openCv = async (id: string) => { const result = await governanceApi.applicantCv(id); window.open(result.url, "_blank", "noopener,noreferrer"); };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1400px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-brand-700">Recruitment</p><h1 className="mt-1 text-3xl font-semibold">Applicant CVs</h1><p className="mt-2 text-sm text-slate-500">A secure applicant register shared by authorized HR and Super Admin users.</p></div><Button onClick={() => setOpen(true)}><Plus size={16}/> Add applicant</Button></div>
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-soft"><div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center"><div className="flex items-center"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserPlus size={18}/></div><div className="ml-3"><h2 className="font-semibold">Applicant register</h2><p className="text-xs text-slate-400">{applicants.data?.items.length ?? 0} applicant{applicants.data?.items.length === 1 ? "" : "s"}</p></div></div><label className="relative sm:ml-auto"><Search size={16} className="absolute left-3 top-3.5 text-slate-400"/><Input className="w-full pl-9 sm:w-72" placeholder="Search name or designation" value={search} onChange={(event) => setSearch(event.target.value)}/></label></div>
      {applicants.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-14"/><Skeleton className="h-14"/><Skeleton className="h-14"/></div> : applicants.error ? <div className="p-10 text-center text-sm text-red-600">{applicants.error.message}</div> : filtered.length === 0 ? <div className="grid min-h-56 place-items-center p-8 text-center"><div><FileText className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm font-medium">{search ? "No matching applicants" : "No applicants added yet"}</p><p className="mt-1 text-xs text-slate-400">{search ? "Try another name or designation." : "Use Add applicant to upload the first CV."}</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Applicant name</th><th className="px-5 py-3 font-semibold">Designation</th><th className="px-5 py-3 font-semibold">CV document</th><th className="px-5 py-3 font-semibold">Uploaded by</th><th className="px-5 py-3 font-semibold">Added on</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y">{filtered.map((item) => <tr className="hover:bg-slate-50/70" key={item._id}><td className="px-5 py-4"><p className="text-sm font-semibold">{item.name}</p></td><td className="px-5 py-4"><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{item.designation}</span></td><td className="px-5 py-4"><div className="flex items-center"><div className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600"><FileText size={14}/></div><div className="ml-2 min-w-0"><p className="max-w-48 truncate text-xs font-medium">{item.originalName}</p><p className="text-[10px] text-slate-400">{formatSize(item.size)}</p></div></div></td><td className="px-5 py-4"><p className="text-xs font-medium">{item.uploadedBy?.name ?? "Authorized user"}</p><p className="text-[10px] text-slate-400">{item.uploadedBy?.email}</p></td><td className="px-5 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><Button variant="secondary" className="h-9" onClick={() => void openCv(item._id)}><Download size={14}/> View CV</Button></td></tr>)}</tbody></table></div>}
    </section>
  </div>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><div className="flex items-center"><div><h2 className="text-xl font-semibold">Add new applicant</h2><p className="mt-1 text-xs text-slate-400">Enter the candidate details and attach their CV.</p></div><button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close" onClick={() => setOpen(false)}><X size={17}/></button></div><div className="mt-6 space-y-4"><label className="block text-sm font-medium">Applicant name<Input required minLength={2} className="mt-2" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label className="block text-sm font-medium">Applied designation<Input required minLength={2} list="applicant-designations" className="mt-2" placeholder="For example: Software Engineer" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })}/><datalist id="applicant-designations">{organization.data?.designations.map((item) => <option value={item.name} key={item._id}/>)}</datalist></label><label className="block text-sm font-medium">CV document<input ref={inputRef} required type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" onChange={(event) => selectFile(event.target.files?.[0])}/><span className="mt-1 block text-xs font-normal text-slate-400">PDF only, maximum 10 MB.</span></label></div>{file && <p className="mt-3 flex items-center text-xs text-slate-500"><Upload size={13} className="mr-1.5"/>{file.name} ({formatSize(file.size)})</p>}{fileError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{fileError}</p>}{create.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!file || create.isPending}>{create.isPending ? "Adding..." : "Add applicant"}</Button></div></form></div>}</main>;
};
