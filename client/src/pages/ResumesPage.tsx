import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Download, FileText, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { governanceApi, type ResumeItem } from "@/features/governance/governanceApi";
import { organizationApi } from "@/features/organization/organizationApi";

const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const ResumesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const isEmployee = user?.role === "EMPLOYEE";
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const profile = useQuery({ queryKey: ["employee", "me"], queryFn: employeeApi.me, enabled: isEmployee });
  const organization = useQuery({ queryKey: ["organization"], queryFn: organizationApi.list, enabled: !isEmployee });
  const resumes = useQuery({ queryKey: ["resumes", department], queryFn: () => governanceApi.resumes(department || undefined) });
  const upload = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("file", file!);
      data.append("employee", profile.data!.employee._id);
      return governanceApi.uploadResume(data);
    },
    onSuccess: async () => {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  const grouped = useMemo(() => resumes.data?.items.reduce<Record<string, ResumeItem[]>>((groups, item) => {
    const name = item.employee.department?.name ?? "Unassigned department";
    (groups[name] ??= []).push(item);
    return groups;
  }, {}) ?? {}, [resumes.data?.items]);

  const chooseFile = (selected?: File) => {
    upload.reset();
    setFileError("");
    if (!selected) return setFile(null);
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setFileError("Please select a PDF file.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError("The resume must be 10 MB or smaller.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(selected);
  };
  const openResume = async (id: string) => {
    const result = await governanceApi.download(id);
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  return <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1400px]">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-brand-700">Records</p><h1 className="mt-1 text-3xl font-semibold">{isEmployee ? "My resume" : "Resume library"}</h1><p className="mt-2 text-sm text-slate-500">{isEmployee ? "Keep your latest resume securely attached to your employee profile." : "Access employee resumes by department within your authorized scope."}</p></div>{!isEmployee && <label className="text-sm font-medium text-slate-600">Department<select className="mt-2 block h-11 min-w-64 rounded-xl border bg-white px-3 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{organization.data?.departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}</div>

    {isEmployee && <section className="mt-8 rounded-2xl border bg-white p-6 shadow-soft"><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Upload size={19}/></div><div><h2 className="font-semibold">Upload resume</h2><p className="mt-1 text-xs text-slate-400">PDF only, maximum 10 MB. Your file is stored privately and opened only after an authorization check.</p></div></div><form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={(event) => { event.preventDefault(); upload.mutate(); }}><input ref={inputRef} required type="file" accept="application/pdf,.pdf" className="block min-w-0 flex-1 rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" onChange={(event) => chooseFile(event.target.files?.[0])}/><Button disabled={!file || !profile.data || upload.isPending}>{upload.isPending ? "Uploading..." : "Upload securely"}</Button></form>{file && <p className="mt-2 text-xs text-slate-500">Selected: {file.name} ({formatSize(file.size)})</p>}{fileError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{fileError}</p>}{upload.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{upload.error.message}</p>}{upload.isSuccess && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Resume uploaded successfully.</p>}</section>}

    <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-soft"><div className="flex items-center border-b p-5"><div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">{isEmployee ? <FileText size={18}/> : <Users size={18}/>}</div><div className="ml-3"><h2 className="font-semibold">{isEmployee ? "Uploaded resumes" : department ? "Department resumes" : "All employee resumes"}</h2><p className="text-xs text-slate-400">{resumes.data?.items.length ?? 0} resume{resumes.data?.items.length === 1 ? "" : "s"} available</p></div></div>
      {resumes.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-16"/><Skeleton className="h-16"/></div> : resumes.error ? <div className="p-10 text-center text-sm text-red-600">{resumes.error.message}</div> : resumes.data?.items.length === 0 ? <div className="grid min-h-56 place-items-center p-8 text-center"><div><FileText className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm font-medium">No resumes uploaded yet</p><p className="mt-1 text-xs text-slate-400">{isEmployee ? "Choose your PDF above to add the first one." : "No employee resumes match this department."}</p></div></div> : isEmployee ? <div className="divide-y">{resumes.data?.items.map((item) => <ResumeRow item={item} key={item._id} onOpen={openResume} showEmployee={false}/>)}</div> : <div className="divide-y">{Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => <div key={name}><div className="flex items-center bg-slate-50 px-5 py-3"><Building2 size={15} className="text-brand-700"/><h3 className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{name}</h3><span className="ml-auto rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{items.length}</span></div><div className="divide-y">{items.map((item) => <ResumeRow item={item} key={item._id} onOpen={openResume} showEmployee/>)}</div></div>)}</div>}
    </section>
  </div></main>;
};

const ResumeRow = ({ item, onOpen, showEmployee }: { item: ResumeItem; onOpen: (id: string) => Promise<void>; showEmployee: boolean }) => <div className="flex items-center gap-3 p-5"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><FileText size={17}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.originalName}</p><p className="mt-1 text-xs text-slate-400">{showEmployee && `${item.employee.firstName} ${item.employee.lastName} · ${item.employee.employeeId} · `}{item.employee.designation?.name ? `${item.employee.designation.name} · ` : ""}{formatSize(item.size)} · {new Date(item.createdAt).toLocaleDateString()}</p></div><Button variant="secondary" className="ml-auto shrink-0" onClick={() => void onOpen(item._id)}><Download size={15}/> View PDF</Button></div>;
