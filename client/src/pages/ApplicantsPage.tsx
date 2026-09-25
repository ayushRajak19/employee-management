import { useMemo, useRef, useState, type RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Download, FileText, MapPin, Plus, Search, Trash2, Upload, UserPlus, X, Columns, Table as TableIcon, UserCheck, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { governanceApi, type ApplicantItem } from "@/features/governance/governanceApi";
import { APPLICANT_STAGES, type ApplicantStage } from "@mobius-ems/shared";

const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const normalizeCategory = (value?: string) => {
  const cleaned = value?.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "General Uploads";
  return cleaned.toLocaleLowerCase().replace(/(^|[\s/(&-])\p{L}/gu, (letter) => letter.toLocaleUpperCase());
};
const categoryOf = (item: ApplicantItem) => normalizeCategory(item.jobCategory || item.designation);
const uniqueValues = (items: ApplicantItem[], key: "city" | "state") => [...new Set(items.map((item) => item[key]?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

const PIPELINE_COLUMNS: { stage: ApplicantStage; label: string; color: string }[] = [
  { stage: "SOURCED", label: "Sourced", color: "bg-slate-100 text-slate-700" },
  { stage: "SCREENED", label: "Screened", color: "bg-blue-100 text-blue-700" },
  { stage: "INTERVIEWING", label: "Interviewing", color: "bg-purple-100 text-purple-700" },
  { stage: "OFFER_EXTENDED", label: "Offer Extended", color: "bg-amber-100 text-amber-700" },
  { stage: "HIRED", label: "Hired", color: "bg-emerald-100 text-emerald-700" },
  { stage: "REJECTED", label: "Archived / Rejected", color: "bg-red-100 text-red-700" },
];

export const ApplicantsPage = () => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"pipeline" | "table">("pipeline");
  const [open, setOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const [state, setState] = useState("ALL");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  // Credentials dialog state
  const [convertedCreds, setConvertedCreds] = useState<{
    employeeName: string;
    employeeId: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const applicants = useQuery({ queryKey: ["applicants"], queryFn: governanceApi.applicants });
  const items = useMemo(() => applicants.data?.items ?? [], [applicants.data?.items]);
  const categories = useMemo(() => [...new Set(items.map(categoryOf))].sort((a, b) => a.localeCompare(b)), [items]);
  const cities = useMemo(() => uniqueValues(items, "city"), [items]);
  const states = useMemo(() => uniqueValues(items, "state"), [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "ALL" && categoryOf(item) !== category) return false;
      if (city !== "ALL" && item.city !== city) return false;
      if (state !== "ALL" && item.state !== state) return false;
      return !needle || [item.name, item.designation, categoryOf(item), item.matchScore === undefined ? "Not screened" : `${item.matchScore}/100`, item.city, item.state, item.originalName, item.uploadedBy?.name, item.uploadedBy?.email, new Date(item.createdAt).toLocaleDateString()].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [items, search, category, city, state]);

  const grouped = useMemo(() => categories.map((name) => ({ name, items: filtered.filter((item) => categoryOf(item) === name) })).filter((group) => group.items.length), [categories, filtered]);

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

  const remove = useMutation({
    mutationFn: governanceApi.deleteApplicant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applicants"] });
    }
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ApplicantStage }) => governanceApi.updateApplicantStage(id, stage),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applicants"] });
    }
  });

  const convertMutation = useMutation({
    mutationFn: async (applicant: ApplicantItem) => {
      const result = await governanceApi.convertApplicant(applicant._id);
      return { applicant, result };
    },
    onSuccess: async (data) => {
      setConvertedCreds({
        employeeName: data.applicant.name,
        employeeId: data.result.employee.employeeId,
        email: data.result.temporaryCredentials.email,
        password: data.result.temporaryCredentials.password,
      });
      await queryClient.invalidateQueries({ queryKey: ["applicants"] });
    }
  });

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

  const openCv = async (id: string) => {
    const result = await governanceApi.applicantCv(id);
    window.open(result.url, "_blank", "noopener,noreferrer");
  };

  const resetFilters = () => {
    setDraftSearch("");
    setSearch("");
    setCategory("ALL");
    setCity("ALL");
    setState("ALL");
  };

  const copyCreds = () => {
    if (!convertedCreds) return;
    const text = `MobiusEMS Credentials\nEmployee: ${convertedCreds.employeeName} (${convertedCreds.employeeId})\nEmail: ${convertedCreds.email}\nTemporary Password: ${convertedCreds.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700">Recruitment & Hiring</p>
            <h1 className="mt-1 text-3xl font-semibold">Applicant Pipeline & CVs</h1>
            <p className="mt-2 text-sm text-slate-500">
              5-stage recruitment funnel with automated resume parsing and 1-click employee provisioning.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "pipeline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                onClick={() => setViewMode("pipeline")}
              >
                <Columns size={14} /> Pipeline Funnel
              </button>
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                onClick={() => setViewMode("table")}
              >
                <TableIcon size={14} /> Table View
              </button>
            </div>
            <Button onClick={() => setOpen(true)}><Plus size={16}/> Upload resumes</Button>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border bg-white p-4 shadow-soft">
          <form className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_170px_170px_auto]" onSubmit={(event) => { event.preventDefault(); setSearch(draftSearch); }}>
            <label className="relative">
              <Search size={16} className="absolute left-3 top-3.5 text-slate-400"/>
              <Input className="pl-9" placeholder="Search any candidate, role, city..." value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)}/>
            </label>
            <Filter label="All JD categories" value={category} onChange={setCategory} options={categories}/>
            <Filter label="All cities" value={city} onChange={setCity} options={cities}/>
            <Filter label="All states" value={state} onChange={setState} options={states}/>
            <div className="flex gap-2">
              <Button className="flex-1 lg:flex-none" type="submit"><Search size={15}/> Search</Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>Clear</Button>
            </div>
          </form>
        </section>

        {applicants.isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : applicants.error ? (
          <div className="mt-6 p-10 text-center text-sm text-red-600">{applicants.error.message}</div>
        ) : viewMode === "pipeline" ? (
          /* Kanban 5-Stage Funnel */
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {PIPELINE_COLUMNS.map((col) => {
              const colItems = filtered.filter((item) => (item.stage || "SOURCED") === col.stage);
              return (
                <div key={col.stage} className="flex flex-col rounded-2xl border bg-slate-50/70 p-3 shadow-soft min-h-[500px]">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{colItems.length}</span>
                  </div>

                  <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
                    {colItems.map((candidate) => (
                      <div key={candidate._id} className="rounded-xl border bg-white p-3.5 shadow-sm transition hover:shadow">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-sm text-slate-900">{candidate.name}</p>
                          {candidate.matchScore !== undefined && (
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${candidate.matchScore >= 80 ? "bg-emerald-50 text-emerald-700" : candidate.matchScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                              {candidate.matchScore}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-brand-700">{candidate.designation}</p>
                        {candidate.city && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin size={11} /> {candidate.city}{candidate.state ? `, ${candidate.state}` : ""}
                          </p>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => void openCv(candidate._id)}
                            className="text-brand-600 hover:text-brand-800 font-medium text-[11px]"
                          >
                            View CV
                          </button>
                          
                          <select
                            value={candidate.stage || "SOURCED"}
                            onChange={(e) => updateStage.mutate({ id: candidate._id, stage: e.target.value as ApplicantStage })}
                            className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 outline-none"
                            disabled={updateStage.isPending}
                          >
                            {APPLICANT_STAGES.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
                        </div>

                        {/* 1-Click Convert to Employee Button */}
                        {candidate.convertedEmployeeId ? (
                          <div className="mt-2 rounded-lg bg-emerald-50 px-2 py-1 text-center text-[10px] font-bold text-emerald-700">
                            ✓ Converted ({candidate.convertedEmployeeId.employeeId})
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="mt-2.5 w-full inline-flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                            onClick={() => convertMutation.mutate(candidate)}
                            disabled={convertMutation.isPending}
                          >
                            <UserCheck size={12} /> Convert to Employee
                          </button>
                        )}
                      </div>
                    ))}
                    {colItems.length === 0 && (
                      <p className="py-8 text-center text-xs text-slate-400">Empty stage</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View grouped by Category */
          <section className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-soft">
            <div className="border-b p-5">
              <div className="flex items-center">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <UserPlus size={18}/>
                </div>
                <div className="ml-3">
                  <h2 className="font-semibold">Applicant register</h2>
                  <p className="text-xs text-slate-400">{items.length} applicant{items.length === 1 ? "" : "s"} across {categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
                </div>
              </div>
            </div>
            {grouped.length === 0 ? (
              <div className="grid min-h-56 place-items-center p-8 text-center">
                <div>
                  <FileText className="mx-auto text-slate-300" size={32}/>
                  <p className="mt-3 text-sm font-medium">No matching applicants</p>
                  <p className="mt-1 text-xs text-slate-400">Try a different search, JD, city or state.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {grouped.map((group) => (
                  <Category
                    key={group.name}
                    name={group.name}
                    items={group.items}
                    expanded={expandedCategory === group.name}
                    onToggle={() => setExpandedCategory((current) => current === group.name ? null : group.name)}
                    openCv={openCv}
                    remove={(item) => remove.mutate(item)}
                    onStageChange={(id, stage) => updateStage.mutate({ id, stage })}
                    onConvert={(cand) => convertMutation.mutate(cand)}
                  />
                ))}
              </div>
            )}
            {remove.error && <p role="alert" className="border-t bg-red-50 p-3 text-sm text-red-700">{remove.error.message}</p>}
          </section>
        )}

        {/* Temporary Credentials Modal after Conversion */}
        {convertedCreds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Employee Created!</h3>
                  <p className="text-xs text-slate-500">Applicant successfully provisioned into the organization.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border bg-slate-50 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-semibold">{convertedCreds.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-semibold text-brand-700">{convertedCreds.employeeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Work Email:</span>
                  <span className="font-mono font-medium">{convertedCreds.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Temporary Password:</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{convertedCreds.password}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" className="h-9 px-3 text-xs" onClick={copyCreds}>
                  {copied ? <><Check size={14} className="text-emerald-600"/> Copied!</> : <><Copy size={14}/> Copy credentials</>}
                </Button>
                <Button className="h-9 px-4 text-xs" onClick={() => setConvertedCreds(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <UploadDialog
          files={files}
          inputRef={inputRef}
          fileError={fileError}
          pending={create.isPending}
          error={create.error?.message}
          onClose={() => setOpen(false)}
          onSelect={selectFiles}
          onRemove={(index) => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          onSubmit={() => create.mutate()}
        />
      )}
    </main>
  );
};

const Filter = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => (
  <label className="relative">
    <select aria-label={label} className="h-11 w-full appearance-none rounded-xl border bg-white px-3 pr-9 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="ALL">{label}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3.5 text-slate-400"/>
  </label>
);

const Category = ({
  name,
  items,
  expanded,
  onToggle,
  openCv,
  remove,
  onStageChange,
  onConvert
}: {
  name: string;
  items: ApplicantItem[];
  expanded: boolean;
  onToggle: () => void;
  openCv: (id: string) => Promise<void>;
  remove: (id: string) => void;
  onStageChange: (id: string, stage: ApplicantStage) => void;
  onConvert: (cand: ApplicantItem) => void;
}) => (
  <section>
    <button type="button" aria-expanded={expanded} className="flex w-full items-center justify-between bg-brand-50/60 px-5 py-4 text-left transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500" onClick={onToggle}>
      <div>
        <h3 className="text-sm font-semibold text-brand-900">{name}</h3>
        <p className="text-[11px] text-brand-600">JD category · {items.length} candidate{items.length === 1 ? "" : "s"}</p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm">
        {expanded ? "Hide candidates" : "View candidates"}
        <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`}/>
      </span>
    </button>
    {expanded && (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1440px] text-left">
          <thead className="border-y bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {["Applicant name","Designation","Stage","Match /100","City","State","CV document","Uploaded by","Added on","Actions"].map((label) => (
                <th className={`px-5 py-3 ${label === "Actions" ? "text-right" : ""}`} key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr className="hover:bg-slate-50/70" key={item._id}>
                <td className="px-5 py-4 text-sm font-semibold">{item.name}</td>
                <td className="px-5 py-4">
                  <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{item.designation}</span>
                </td>
                <td className="px-5 py-4">
                  <select
                    value={item.stage || "SOURCED"}
                    onChange={(e) => onStageChange(item._id, e.target.value as ApplicantStage)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    {APPLICANT_STAGES.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4">
                  {item.matchScore === undefined ? (
                    <span className="text-xs text-slate-400">Not screened</span>
                  ) : (
                    <span className={`inline-flex min-w-14 justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${item.matchScore >= 80 ? "bg-emerald-50 text-emerald-700" : item.matchScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {item.matchScore}/100
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  {item.city ? <span className="inline-flex items-center gap-1"><MapPin size={12}/>{item.city}</span> : "Not stated"}
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">{item.state || "Not stated"}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600"><FileText size={14}/></div>
                    <div className="ml-2 min-w-0">
                      <p className="max-w-44 truncate text-xs font-medium">{item.originalName}</p>
                      <p className="text-[10px] text-slate-400">{formatSize(item.size)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs font-medium">{item.uploadedBy?.name ?? "Authorized user"}</p>
                  <p className="text-[10px] text-slate-400">{item.uploadedBy?.email}</p>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end items-center gap-2">
                    {item.convertedEmployeeId ? (
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                        EMP: {item.convertedEmployeeId.employeeId}
                      </span>
                    ) : (
                      <Button className="h-9 px-3 text-xs" onClick={() => onConvert(item)}>
                        <UserCheck size={14}/> Convert
                      </Button>
                    )}
                    <Button variant="secondary" className="h-9" onClick={() => void openCv(item._id)}>
                      <Download size={14}/> View CV
                    </Button>
                    <button
                      type="button"
                      aria-label={`Delete ${item.name} and CV`}
                      className="grid size-9 place-items-center rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                      onClick={() => {
                        if (window.confirm(`Permanently delete ${item.name} and their CV? This cannot be undone.`)) remove(item._id);
                      }}
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const UploadDialog = ({ files, inputRef, fileError, pending, error, onClose, onSelect, onRemove, onSubmit }: { files: File[]; inputRef: RefObject<HTMLInputElement | null>; fileError: string; pending: boolean; error?: string; onClose: () => void; onSelect: (files: FileList | null) => void; onRemove: (index: number) => void; onSubmit: () => void }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
    <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <div className="flex items-center">
        <div>
          <h2 className="text-xl font-semibold">Upload applicant resumes</h2>
          <p className="mt-1 text-xs text-slate-400">AI identifies name, role, city and state automatically.</p>
        </div>
        <button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close" onClick={onClose}>
          <X size={17}/>
        </button>
      </div>
      <label className="mt-6 block text-sm font-medium">
        Resume PDFs
        <input ref={inputRef} required multiple type="file" accept="application/pdf,.pdf" className="mt-2 block w-full rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" onChange={(event) => onSelect(event.target.files)}/>
        <span className="mt-1 block text-xs font-normal text-slate-400">Up to 10 searchable PDFs, maximum 10 MB each.</span>
      </label>
      {files.length > 0 && (
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {files.map((file, index) => (
            <div className="flex items-center rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500" key={`${file.name}-${file.size}`}>
              <Upload size={13} className="mr-1.5 shrink-0"/>
              <span className="min-w-0 flex-1 truncate">{file.name} ({formatSize(file.size)})</span>
              <button type="button" aria-label={`Remove ${file.name}`} className="ml-2 grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50" onClick={() => onRemove(index)}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
      {fileError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{fileError}</p>}
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!files.length || pending}>
          {pending ? `Reading ${files.length} resume${files.length === 1 ? "" : "s"}...` : `Import ${files.length || ""} resume${files.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  </div>
);
