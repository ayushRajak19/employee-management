import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileLock2, FileText, ShieldCheck, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { employeeApi } from "@/features/employees/employeeApi";
import { governanceApi } from "@/features/governance/governanceApi";

type Tab = "documents" | "reports" | "audit";
const documentCategories = ["RESUME", "OFFER_LETTER", "JOINING_LETTER", "NDA", "EMPLOYMENT_AGREEMENT", "ID_DOCUMENT", "CERTIFICATE", "EXPERIENCE_LETTER", "APPRAISAL_LETTER", "OTHER"] as const;

export const GovernancePage = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === "EMPLOYEE";
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("documents");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [employee, setEmployee] = useState("");
  const [category, setCategory] = useState<(typeof documentCategories)[number]>("RESUME");
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState("EMPLOYEE");
  const [reportRows, setReportRows] = useState<unknown[]>([]);

  const documents = useQuery({ queryKey: ["documents"], queryFn: governanceApi.documents, enabled: tab === "documents" });
  const audit = useQuery({ queryKey: ["audit"], queryFn: governanceApi.audit, enabled: tab === "audit" && user?.permissions.includes("audit.view") });
  const profile = useQuery({ queryKey: ["employee", "me"], queryFn: employeeApi.me, enabled: uploadOpen && isEmployee });
  const employees = useQuery({ queryKey: ["employees", "documents"], queryFn: () => employeeApi.list(new URLSearchParams({ page: "1", limit: "100" })), enabled: uploadOpen && !isEmployee });
  const targetEmployee = isEmployee ? profile.data?.employee._id ?? "" : employee;

  const upload = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("file", file!);
      data.append("employee", targetEmployee);
      data.append("category", category);
      return governanceApi.upload(data);
    },
    onSuccess: async () => {
      setUploadOpen(false);
      setFile(null);
      await qc.invalidateQueries({ queryKey: ["documents"] });
    }
  });
  const archive = useMutation({ mutationFn: governanceApi.archive, onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }) });
  const report = useMutation({ mutationFn: () => governanceApi.report(reportType), onSuccess: (data) => setReportRows(data.rows) });
  const openDocument = async (id: string) => { const result = await governanceApi.download(id); window.open(result.url, "_blank", "noopener,noreferrer"); };

  return <main className="flex-1 px-5 py-8 sm:px-8">
    <div className="mx-auto max-w-[1440px]">
      <div>
        <p className="text-sm font-medium text-brand-700">{isEmployee ? "My records" : "Organization"}</p>
        <h1 className="mt-1 text-3xl font-semibold">{isEmployee ? "My documents" : "Documents, reports & audit"}</h1>
        <p className="mt-2 text-sm text-slate-500">Private employee records and traceable management actions stay authorization-scoped.</p>
      </div>
      <div className="mt-7 flex gap-1 rounded-xl border bg-white p-1">
        {(["documents", ...(user?.permissions.includes("report.view") ? ["reports"] : []), ...(user?.permissions.includes("audit.view") ? ["audit"] : [])] as Tab[]).map((key) =>
          <button key={key} className={`h-10 rounded-lg px-4 text-sm capitalize ${tab === key ? "bg-ink text-white" : "text-slate-500"}`} onClick={() => setTab(key)}>{key}</button>
        )}
      </div>
      {tab === "documents" && <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-soft">
        <div className="flex items-center border-b p-5">
          <FileLock2 size={18} className="text-brand-600"/>
          <div className="ml-3"><h2 className="font-semibold">Authorized documents</h2><p className="text-xs text-slate-400">Storage keys are private; downloads use authorized signed URLs.</p></div>
          {user?.permissions.includes("document.upload") && <Button className="ml-auto" onClick={() => { upload.reset(); setUploadOpen(true); }}><Upload size={15}/> Upload</Button>}
        </div>
        <div className="divide-y">
          {documents.data?.items.length ? documents.data.items.map((item) => <div className="flex items-center p-5" key={item._id}>
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100"><FileText size={17}/></div>
            <div className="ml-3"><p className="text-sm font-semibold">{item.originalName}</p><p className="text-xs text-slate-400">{item.employee.firstName} {item.employee.lastName} · {item.category.replaceAll("_", " ")} · {(item.size / 1024).toFixed(0)} KB</p></div>
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" className="size-9 px-0" aria-label="Download document" onClick={() => void openDocument(item._id)}><Download size={15}/></Button>
              {user?.permissions.includes("document.upload") && <Button variant="ghost" className="size-9 px-0 text-red-600" aria-label="Archive document" onClick={() => { if (window.confirm("Archive this document?")) archive.mutate(item._id); }}><Trash2 size={15}/></Button>}
            </div>
          </div>) : <div className="p-12 text-center text-sm text-slate-400">No authorized documents are available.</div>}
        </div>
      </section>}
      {tab === "reports" && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="h-11 flex-1 rounded-xl border px-3 text-sm" value={reportType} onChange={(event) => setReportType(event.target.value)}>
            {["EMPLOYEE", "DEPARTMENT", "SKILL", "SKILL_GAP", "TASK_PERFORMANCE", "PROJECT", "PERFORMANCE", "KPI", "GOAL", "TRAINING"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
          </select>
          <Button onClick={() => report.mutate()} disabled={report.isPending}>Generate report</Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Report results use reusable structured rows ready for CSV, Excel or PDF exporters.</p>
        {reportRows.length > 0 && <div className="mt-5 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200"><pre>{JSON.stringify(reportRows.slice(0, 20), null, 2)}</pre></div>}
      </section>}
      {tab === "audit" && <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-soft">
        <div className="flex items-center border-b p-5"><ShieldCheck size={18} className="text-brand-600"/><h2 className="ml-3 font-semibold">Immutable audit trail</h2></div>
        <div className="divide-y">{audit.data?.items.map((item) => <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center" key={item._id}>
          <div><p className="text-sm font-semibold">{item.action.replaceAll("_", " ")}</p><p className="text-xs text-slate-400">{item.entityType} · {item.entityId ?? "—"}</p></div>
          <div className="sm:ml-auto sm:text-right"><p className="text-xs font-medium">{item.user?.name ?? "System"}</p><p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div>
        </div>)}</div>
      </section>}
    </div>
    {uploadOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4">
      <form className="w-full max-w-md rounded-2xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); upload.mutate(); }}>
        <h2 className="text-xl font-semibold">Upload private document</h2>
        <div className="mt-5 space-y-4">
          {isEmployee ? <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">This document will be saved to your employee record.</p> : <label className="block text-sm font-medium">Employee
            <select required className="mt-2 h-11 w-full rounded-xl border px-3" value={employee} onChange={(event) => setEmployee(event.target.value)}>
              <option value="">Select employee</option>
              {employees.data?.items.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}
            </select>
          </label>}
          <label className="block text-sm font-medium">Category
            <select className="mt-2 h-11 w-full rounded-xl border px-3" value={category} onChange={(event) => setCategory(event.target.value as (typeof documentCategories)[number])}>
              {documentCategories.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">File
            <input required type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.webp" className="mt-2 block w-full rounded-xl border p-2 text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/>
            <span className="mt-1 block text-xs font-normal text-slate-400">PDF, DOCX or image; maximum 10 MB.</span>
          </label>
        </div>
        {profile.error && <p className="mt-3 text-sm text-red-600">{profile.error.message}</p>}
        {upload.error && <p className="mt-3 text-sm text-red-600">{upload.error.message}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button disabled={!file || !targetEmployee || upload.isPending}>{profile.isLoading ? "Loading profile…" : upload.isPending ? "Uploading…" : "Upload securely"}</Button>
        </div>
      </form>
    </div>}
  </main>;
};
