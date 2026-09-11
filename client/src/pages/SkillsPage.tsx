import { useState, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  Building2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthProvider";
import { skillApi, type SkillClaim } from "@/features/skills/skillApi";
import { organizationApi } from "@/features/organization/organizationApi";
import { DesignationSkillsModal } from "@/features/organization/DesignationSkillsModal";
import type { NamedEntity } from "@/features/organization/types";
import { ApiError } from "@/api/client";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  EXPERT_VERIFIED: "bg-violet-50 text-violet-700",
  REJECTED: "bg-red-50 text-red-700",
  REVIEW_REQUIRED: "bg-orange-50 text-orange-700",
};

export const SkillsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  // Determine active tab
  const isBuilderRoute = location.pathname === "/skills/builder";
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"builder" | "verifications" | "profile">(
    isBuilderRoute || urlTab === "builder" ? "builder" : "builder"
  );

  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [review, setReview] = useState<SkillClaim | null>(null);
  const [master, setMaster] = useState({ name: "", category: "", description: "" });
  const [claim, setClaim] = useState({ skill: "", selfRating: 5, yearsOfExperience: 0, description: "", evidenceUrl: "" });
  const [decision, setDecision] = useState({ status: "VERIFIED", verifiedRating: 5, method: "INTERVIEW", justification: "" });

  // AI Skill Builder state
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(isBuilderRoute);
  const [selectedDesignation, setSelectedDesignation] = useState<NamedEntity | null>(null);
  const [designationSearch, setDesignationSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Data queries
  const skills = useQuery({ queryKey: ["skills"], queryFn: skillApi.list });
  const hasProfile = user?.role !== "SUPER_ADMIN";
  const mine = useQuery({ queryKey: ["skills", "mine"], queryFn: skillApi.mine, enabled: hasProfile });
  const pending = useQuery({
    queryKey: ["skills", "pending"],
    queryFn: skillApi.pending,
    enabled: user?.permissions.includes("skill.verify"),
  });
  const orgQuery = useQuery({
    queryKey: ["organization"],
    queryFn: organizationApi.list,
  });

  // Filtered designations
  const filteredDesignations = useMemo(() => {
    const list = orgQuery.data?.designations || [];
    return list.filter((d) => {
      const matchSearch =
        !designationSearch.trim() ||
        d.name.toLowerCase().includes(designationSearch.toLowerCase()) ||
        d.code.toLowerCase().includes(designationSearch.toLowerCase());
      const matchDept = !deptFilter || d.department?._id === deptFilter;
      return matchSearch && matchDept;
    });
  }, [orgQuery.data?.designations, designationSearch, deptFilter]);

  const create = useMutation({
    mutationFn: skillApi.create,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["skills"] });
      setShowAdd(false);
    },
  });

  const submitClaim = useMutation({
    mutationFn: () =>
      skillApi.claim({
        skill: claim.skill,
        selfRating: Number(claim.selfRating),
        yearsOfExperience: Number(claim.yearsOfExperience),
        description: claim.description || undefined,
        evidence: claim.evidenceUrl ? [{ type: "PROJECT", url: claim.evidenceUrl }] : [],
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["skills", "mine"] });
      setShowClaim(false);
    },
  });

  const verify = useMutation({
    mutationFn: () =>
      skillApi.verify(review!._id, {
        ...decision,
        verifiedRating: ["VERIFIED", "EXPERT_VERIFIED"].includes(decision.status)
          ? Number(decision.verifiedRating)
          : undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["skills", "pending"] });
      setReview(null);
    },
  });

  const handleOpenBuilder = (target?: NamedEntity) => {
    setSelectedDesignation(target || null);
    setIsBuilderModalOpen(true);
  };

  const handleTabChange = (tab: "builder" | "verifications" | "profile") => {
    setActiveTab(tab);
    setSearchParams(tab === "builder" ? { tab: "builder" } : tab === "verifications" ? { tab: "verifications" } : {});
  };

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-brand-700">Capability</p>
            <h1 className="mt-1 text-3xl font-semibold">Skills & Verification</h1>
            <p className="mt-2 text-sm text-slate-500">
              Build evidence-backed capability profiles, AI role skill assessments from JDs, and structured verification workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct AI Skill Builder CTA */}
            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs"
              onClick={() => handleOpenBuilder()}
            >
              <Sparkles size={15} className="mr-1.5 text-amber-300" />
              ✨ AI Skill Builder (from JD)
            </Button>

            {user?.permissions.includes("skill.create") && (
              <Button variant="secondary" onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Skill master
              </Button>
            )}

            {hasProfile && (
              <Button variant="secondary" onClick={() => setShowClaim(true)}>
                <Sparkles size={16} /> Add my skill
              </Button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "builder"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => handleTabChange("builder")}
          >
            <Sparkles size={14} className={activeTab === "builder" ? "text-amber-300" : "text-brand-600"} />
            <span>AI Skill Builder & Role Assessments</span>
            {orgQuery.data?.designations && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeTab === "builder" ? "bg-brand-700 text-brand-100" : "bg-white text-slate-700"
                }`}
              >
                {orgQuery.data.designations.length} Roles
              </span>
            )}
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "verifications"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => handleTabChange("verifications")}
          >
            <ShieldCheck size={14} />
            <span>Verifications & Approvals</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "verifications" ? "bg-brand-700 text-brand-100" : "bg-white text-slate-700"
              }`}
            >
              {pending.data?.items.length ?? 0}
            </span>
          </button>

          {hasProfile && (
            <button
              type="button"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "profile"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => handleTabChange("profile")}
            >
              <Award size={14} />
              <span>My Capability Profile</span>
            </button>
          )}
        </div>

        {/* ──────── TAB 1: AI SKILL BUILDER & ROLE ASSESSMENTS ──────── */}
        {activeTab === "builder" && (
          <div className="mt-6 space-y-6">
            {/* Hero AI Skill Builder Card */}
            <div className="rounded-3xl border border-brand-200 bg-gradient-to-r from-brand-50/90 via-white to-sky-50/60 p-6 sm:p-8 shadow-soft">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    <Sparkles size={13} className="text-amber-500" /> AI Competency Architect
                  </span>
                  <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Generate Skills & Assessments with AI
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Feed any Job Description (JD), requirements document, or role title. The AI automatically creates structured skill tiers, tools & frameworks, and evidence-based assessment questions for employees holding that designation.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 text-sm font-semibold shadow-md"
                    onClick={() => handleOpenBuilder()}
                  >
                    <Sparkles size={16} className="mr-2 text-amber-300" />
                    Launch AI Skill Builder
                  </Button>
                </div>
              </div>
            </div>

            {/* Designations Roster with AI Skills Status */}
            <div className="rounded-2xl border bg-white shadow-soft overflow-hidden">
              <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Designation Competency Catalog</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Select any designation to generate, inspect, or edit skills assessment questions.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search roles..."
                      value={designationSearch}
                      onChange={(e) => setDesignationSearch(e.target.value)}
                      className="h-9 w-44 pl-8 text-xs sm:w-56"
                    />
                  </div>

                  {orgQuery.data?.departments && orgQuery.data.departments.length > 0 && (
                    <select
                      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {orgQuery.data.departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {orgQuery.isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredDesignations.length === 0 ? (
                <div className="p-12 text-center">
                  <Award className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm font-semibold text-slate-700">No designations found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {designationSearch ? "Try adjusting your search query." : "Create designations in Organization settings to start."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDesignations.map((designation) => {
                    const hasCustomSkills = designation.customSkills && designation.customSkills.length > 0;
                    return (
                      <div
                        key={designation._id}
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/80 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-slate-800 text-sm">{designation.name}</h4>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {designation.code}
                            </span>
                            {designation.department?.name && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Building2 size={12} /> {designation.department.name}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {hasCustomSkills ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <Sparkles size={10} /> {designation.customSkills!.length} Custom AI Skills Active
                              </span>
                            ) : designation.catalogRole ? (
                              <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[10px] font-medium text-brand-700">
                                Template: {designation.catalogRole}
                              </span>
                            ) : (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                                No assessment configured
                              </span>
                            )}

                            {/* Competencies preview chips */}
                            {hasCustomSkills && (
                              <div className="hidden md:flex flex-wrap items-center gap-1.5 ml-2">
                                {designation.customSkills!.slice(0, 3).map((s) => (
                                  <span
                                    key={s.id || s.name}
                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                                {designation.customSkills!.length > 3 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{designation.customSkills!.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            className="h-8 px-3 text-xs bg-brand-600 text-white hover:bg-brand-700 shadow-xs"
                            onClick={() => handleOpenBuilder(designation)}
                          >
                            <Sparkles size={12} className="mr-1 text-amber-300" />
                            {hasCustomSkills ? "Regenerate / Add AI Skills" : "✨ AI Skill Builder"}
                          </Button>
                          <Button
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleOpenBuilder(designation)}
                          >
                            <Pencil size={12} className="mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────── TAB 2: VERIFICATIONS & APPROVALS ──────── */}
        {activeTab === "verifications" && (
          <div className="mt-6 space-y-6">
            {user?.permissions.includes("skill.verify") && (
              <section className="rounded-2xl border bg-white shadow-soft">
                <div className="flex items-center border-b p-5">
                  <div className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="ml-3">
                    <h2 className="font-semibold">Pending verification</h2>
                    <p className="text-xs text-slate-400">Review evidence and record an explainable decision.</p>
                  </div>
                  <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {pending.data?.items.length ?? 0}
                  </span>
                </div>
                <div className="divide-y">
                  {pending.data?.items.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-400">No skill verifications are waiting.</p>
                  ) : (
                    pending.data?.items.map((item) => (
                      <div key={item._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                        <div className="grid size-9 place-items-center rounded-xl bg-slate-100">
                          <BadgeCheck size={16} />
                        </div>
                        <div className="sm:ml-2">
                          <p className="text-sm font-semibold">
                            {item.employee?.firstName} {item.employee?.lastName} · {item.skill.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Self rating {item.selfRating}/10 · {item.yearsOfExperience} years experience
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          className="sm:ml-auto"
                          onClick={() => {
                            setReview(item);
                            setDecision({ ...decision, verifiedRating: item.selfRating });
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ──────── TAB 3: MY CAPABILITY PROFILE ──────── */}
        {activeTab === "profile" && hasProfile && (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">My capability profile</h2>
                  <p className="mt-1 text-xs text-slate-400">Self-ratings remain separate from verified ratings.</p>
                </div>
                <div className="rounded-xl bg-brand-50 px-4 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase text-brand-700">Role match</p>
                  <p className="text-xl font-semibold text-brand-700">{mine.data?.gap.roleMatch ?? 0}%</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {mine.isLoading ? (
                  <Skeleton className="h-28" />
                ) : mine.data?.items.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-sm text-slate-400">
                    No skills yet. Add your first skill to build your profile.
                  </p>
                ) : (
                  mine.data?.items.map((item) => (
                    <article key={item._id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{item.skill.name}</p>
                          <p className="text-xs text-slate-400">{item.skill.category}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            statusStyle[item.verificationStatus]
                          }`}
                        >
                          {item.verificationStatus.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-5 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">Self</p>
                          <p className="font-semibold">{item.selfRating} / 10</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Verified</p>
                          <p className="font-semibold">
                            {item.verifiedRating ? `${item.verifiedRating} / 10` : "—"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* AI Skill Builder Modal */}
      <DesignationSkillsModal
        isOpen={isBuilderModalOpen}
        onClose={() => {
          setIsBuilderModalOpen(false);
          setSelectedDesignation(null);
        }}
        targetDesignation={selectedDesignation}
        allDesignations={orgQuery.data?.designations || []}
        catalogRoles={orgQuery.data?.skillCatalogRoles || []}
        onSaved={async () => {
          await qc.invalidateQueries({ queryKey: ["organization"] });
          await qc.invalidateQueries({ queryKey: ["skills"] });
        }}
      />

      {/* Existing Skill Master & Claim Modals */}
      {(showAdd || showClaim || review) && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              if (showAdd) create.mutate(master);
              else if (showClaim) submitClaim.mutate();
              else verify.mutate();
            }}
          >
            <h2 className="text-xl font-semibold">
              {showAdd ? "Create skill" : showClaim ? "Add a skill" : `Verify ${review?.skill.name}`}
            </h2>
            <div className="mt-5 space-y-4">
              {showAdd && (
                <>
                  <label className="block text-sm font-medium">
                    Skill name
                    <Input
                      required
                      className="mt-2"
                      placeholder="For example: Python"
                      value={master.name}
                      onChange={(e) => setMaster({ ...master, name: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Category
                    <Input
                      required
                      className="mt-2"
                      placeholder="For example: Software Development"
                      value={master.category}
                      onChange={(e) => setMaster({ ...master, category: e.target.value })}
                    />
                  </label>
                </>
              )}
              {showClaim && (
                <>
                  <label className="block text-sm font-medium">
                    Skill
                    <select
                      required
                      className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                      value={claim.skill}
                      onChange={(e) => setClaim({ ...claim, skill: e.target.value })}
                    >
                      <option value="">Select skill</option>
                      {skills.data?.items.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium">
                      Self rating
                      <Input
                        required
                        type="number"
                        min="1"
                        max="10"
                        className="mt-2"
                        placeholder="1-10"
                        value={claim.selfRating}
                        onChange={(e) => setClaim({ ...claim, selfRating: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Years
                      <Input
                        required
                        type="number"
                        min="0"
                        max="60"
                        step="0.5"
                        className="mt-2"
                        placeholder="For example: 2.5"
                        value={claim.yearsOfExperience}
                        onChange={(e) => setClaim({ ...claim, yearsOfExperience: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-medium">
                    Evidence link
                    <Input
                      type="url"
                      className="mt-2"
                      placeholder="https://github.com/... or a portfolio URL"
                      value={claim.evidenceUrl}
                      onChange={(e) => setClaim({ ...claim, evidenceUrl: e.target.value })}
                    />
                  </label>
                </>
              )}
              {review && (
                <>
                  <label className="block text-sm font-medium">
                    Decision
                    <select
                      className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                      value={decision.status}
                      onChange={(e) => setDecision({ ...decision, status: e.target.value })}
                    >
                      {["VERIFIED", "EXPERT_VERIFIED", "REJECTED", "REVIEW_REQUIRED"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {["VERIFIED", "EXPERT_VERIFIED"].includes(decision.status) && (
                    <label className="block text-sm font-medium">
                      Verified rating
                      <Input
                        required
                        type="number"
                        min="1"
                        max="10"
                        className="mt-2"
                        placeholder="1-10"
                        value={decision.verifiedRating}
                        onChange={(e) => setDecision({ ...decision, verifiedRating: Number(e.target.value) })}
                      />
                    </label>
                  )}
                  <label className="block text-sm font-medium">
                    Method
                    <select
                      className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                      value={decision.method}
                      onChange={(e) => setDecision({ ...decision, method: e.target.value })}
                    >
                      {[
                        "INTERVIEW",
                        "PRACTICAL_ASSESSMENT",
                        "CERTIFICATION",
                        "PROJECT_EVIDENCE",
                        "MANAGER_RECOMMENDATION",
                        "WORK_PERFORMANCE",
                      ].map((x) => (
                        <option key={x}>{x.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Justification
                    <textarea
                      required
                      minLength={5}
                      maxLength={2000}
                      className="mt-2 min-h-24 w-full rounded-xl border p-3 text-sm"
                      placeholder="Explain the evidence and reason for this verification decision."
                      value={decision.justification}
                      onChange={(e) => setDecision({ ...decision, justification: e.target.value })}
                    />
                  </label>
                </>
              )}
            </div>
            <MutationError error={showAdd ? create.error : showClaim ? submitClaim.error : verify.error} />
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAdd(false);
                  setShowClaim(false);
                  setReview(null);
                  create.reset();
                  submitClaim.reset();
                  verify.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || submitClaim.isPending || verify.isPending}
              >
                {create.isPending || submitClaim.isPending || verify.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

const MutationError = ({ error }: { error: Error | null }) => {
  if (!error) return null;
  const details = error instanceof ApiError ? Object.values(error.errors ?? {}).flat()[0] : undefined;
  return (
    <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {details ?? error.message}
    </p>
  );
};
