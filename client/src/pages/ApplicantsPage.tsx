import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus, Search, Trash2, Upload, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { governanceApi } from "@/features/governance/governanceApi";

const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const ApplicantsPage = () => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const applicants = useQuery({ queryKey: ["applicants"], queryFn: governanceApi.applicants });
  const create = useMutation({
    mutationFn: () => {
      const data = new FormData();
      files.forEach((file) => data.append("files", file));
      return governanceApi.createApplicant(data);
    },
    onSuccess: async () => {
      setOpen(false);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["applicants"] });
    }
  });
  const remove = useMutation({ mutationFn: governanceApi.deleteApplicant, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["applicants"] }); } });
  const filtered = applicants.data?.items.filter((item) => `${item.name} ${item.designation} ${item.originalName}`.toLowerCase().includes(search.trim().toLowerCase())) ?? [];
  const selectFiles = (selected: FileList | null) => {
    setFileError("");
    create.reset();
    const next = Array.from(selected ?? []);
    if (!next.length) return setFiles([]);
    if (next.length > 10) {
      setFiles([]);
      setFileError("Upload a maximum of 10 resumes at one time.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const invalid = next.find((file) => (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") || file.size > 10 * 1024 * 1024);
    if (invalid) {
      setFiles([]);
      setFileError(invalid.size > 10 * 1024 * 1024 ? `${invalid.name} is larger than 10 MB.` : `${invalid.name} is not a PDF file.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFiles(next);
  };
  const openCv = async (id: string) => { const result = await governanceApi.applicantCv(id); window.open(result.url, "_blank", "noopener,noreferrer"); };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1400px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-brand-700">Recruitment</p><h1 className="mt-1 text-3xl font-semibold">Applicant CVs</h1><p className="mt-2 text-sm text-slate-500">Upload resumes directly. AI reads the candidate name and role automatically.</p></div><Button onClick={() => setOpen(true)}><Plus size={16}/> Upload resumes</Button></div>
    <section className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-soft"><div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center"><div className="flex items-center"><div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserPlus size={18}/></div><div className="ml-3"><h2 className="font-semibold">Applicant register</h2><p className="text-xs text-slate-400">{applicants.data?.items.length ?? 0} applicant{applicants.data?.items.length === 1 ? "" : "s"}</p></div></div><label className="relative sm:ml-auto"><Search size={16} className="absolute left-3 top-3.5 text-slate-400"/><Input className="w-full pl-9 sm:w-72" placeholder="Search name or designation" value={search} onChange={(event) => setSearch(event.target.value)}/></label></div>
      {applicants.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-14"/><Skeleton className="h-14"/><Skeleton className="h-14"/></div> : applicants.error ? <div className="p-10 text-center text-sm text-red-600">{applicants.error.message}</div> : filtered.length === 0 ? <div className="grid min-h-56 place-items-center p-8 text-center"><div><FileText className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm font-medium">{search ? "No matching applicants" : "No applicants added yet"}</p><p className="mt-1 text-xs text-slate-400">{search ? "Try another name or designation." : "Use Upload resumes to add the first applicants."}</p></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Applicant name</th><th className="px-5 py-3 font-semibold">Designation</th><th className="px-5 py-3 font-semibold">CV document</th><th className="px-5 py-3 font-semibold">Uploaded by</th><th className="px-5 py-3 font-semibold">Added on</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((item) => <tr className="hover:bg-slate-50/70" key={item._id}><td className="px-5 py-4"><p className="text-sm font-semibold">{item.name}</p></td><td className="px-5 py-4"><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{item.designation}</span></td><td className="px-5 py-4"><div className="flex items-center"><div className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600"><FileText size={14}/></div><div className="ml-2 min-w-0"><p className="max-w-48 truncate text-xs font-medium">{item.originalName}</p><p className="text-[10px] text-slate-400">{formatSize(item.size)}</p></div></div></td><td className="px-5 py-4"><p className="text-xs font-medium">{item.uploadedBy?.name ?? "Authorized user"}</p><p className="text-[10px] text-slate-400">{item.uploadedBy?.email}</p></td><td className="px-5 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button variant="secondary" className="h-9" onClick={() => void openCv(item._id)}><Download size={14}/> View CV</Button><button type="button" aria-label={`Delete ${item.name} and CV`} className="grid size-9 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50" disabled={remove.isPending} onClick={() => { if (window.confirm(`Permanently delete ${item.name} and their CV? This cannot be undone.`)) remove.mutate(item._id); }}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
      {remove.error && <p role="alert" className="border-t bg-red-50 p-3 text-sm text-red-700">{remove.error.message}</p>}
    </section>
  </div>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm"><form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><div className="flex items-center"><div><h2 className="text-xl font-semibold">Upload applicant resumes</h2><p className="mt-1 text-xs text-slate-400">AI will identify each candidate and their current role.</p></div><button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close" onClick={() => setOpen(false)}><X size={17}/></button></div><label className="mt-6 block text-sm font-medium">Resume PDFs<input ref={inputRef} required multiple type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" onChange={(event) => selectFiles(event.target.files)}/><span className="mt-1 block text-xs font-normal text-slate-400">Up to 10 searchable PDFs, maximum 10 MB each. No applicant form is required.</span></label>{files.length > 0 && <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">{files.map((file, index) => <div className="flex items-center rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500" key={`${file.name}-${file.size}`}><Upload size={13} className="mr-1.5 shrink-0"/><span className="min-w-0 flex-1 truncate">{file.name} ({formatSize(file.size)})</span><button type="button" aria-label={`Remove ${file.name}`} className="ml-2 grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14}/></button></div>)}</div>}{fileError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{fileError}</p>}{create.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{create.error.message}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!files.length || create.isPending}>{create.isPending ? `Reading ${files.length} resume${files.length === 1 ? "" : "s"}...` : `Import ${files.length || ""} resume${files.length === 1 ? "" : "s"}`}</Button></div></form></div>}</main>;
};
