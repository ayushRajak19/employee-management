import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  skillApi,
  type RoleSkillSubmissionItem,
  type CatalogSkill,
} from "@/features/skills/skillApi";
import { organizationApi } from "@/features/organization/organizationApi";
import { cn } from "@/lib/cn";

export const SuperAdminSkillSubmissions = () => {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Inspection Modal state
  const [inspectItem, setInspectItem] = useState<RoleSkillSubmissionItem | null>(null);

  // Admin Submit / Test Modal state
  const [submitEmployee, setSubmitEmployee] = useState<RoleSkillSubmissionItem | null>(null);
  const [adminRatings, setAdminRatings] = useState<Record<string, number>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Interactive Simulation Modal state
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simDesignationId, setSimDesignationId] = useState<string>("");
  const [simRatings, setSimRatings] = useState<Record<string, number>>({});
  const [simVelocity, setSimVelocity] = useState<number>(1.0);

  // Data Queries
  const submissionsQuery = useQuery({
    queryKey: ["skills", "submissions"],
    queryFn: skillApi.submissions,
  });

  const orgQuery = useQuery({
    queryKey: ["organization"],
    queryFn: organizationApi.list,
  });

  // Query for employee catalog when submit modal is open
  const employeeCatalogQuery = useQuery({
    queryKey: ["skills", "role-assessment", "employee", submitEmployee?.employee._id],
    queryFn: () => skillApi.getEmployeeRoleAssessment(submitEmployee!.employee._id),
    enabled: Boolean(submitEmployee),
  });

  // Prepopulate existing ratings only if the employee actually submitted before
  useEffect(() => {
    const scores = employeeCatalogQuery.data?.assessment?.scores;
    if (scores && scores.length > 0) {
      const existingRatings: Record<string, number> = {};
      const existingNotes: Record<string, string> = {};
      scores.forEach((s) => {
        existingRatings[s.skillId] = s.rating;
        existingNotes[s.skillId] = s.implementationNote || "";
      });
      setAdminRatings(existingRatings);
      setAdminNotes(existingNotes);
    }
  }, [employeeCatalogQuery.data?.assessment]);

  // Query for designation skills when simulation modal is open
  const simDesignation = useMemo(() => {
    if (!simDesignationId || !orgQuery.data?.designations) return null;
    return orgQuery.data.designations.find((d) => d._id === simDesignationId) || null;
  }, [simDesignationId, orgQuery.data?.designations]);

  const handleApplyAverageToAll = (average: number) => {
    const skills = employeeCatalogQuery.data?.catalog || [];
    const rounded = Math.max(1, Math.min(10, Math.round(average)));
    const updatedRatings = { ...adminRatings };
    const updatedNotes = { ...adminNotes };
    skills.forEach((s) => {
      if (updatedRatings[s.id] === undefined) {
        updatedRatings[s.id] = rounded;
        updatedNotes[s.id] = updatedNotes[s.id] || "Calibrated from employee claimed baseline";
      }
    });
    setAdminRatings(updatedRatings);
    setAdminNotes(updatedNotes);
  };

  // Submit Mutation
  const adminSubmitMutation = useMutation({
    mutationFn: () => {
      const skills = employeeCatalogQuery.data?.catalog || [];
      const defaultRating = Math.round(submitEmployee?.claimedAverage || 5);
      const payload = skills.map((s) => ({
        skillId: s.id,
        rating: adminRatings[s.id] ?? defaultRating,
        implementationNote: adminNotes[s.id]?.trim() || "Calibrated via Super Admin skill manager.",
      }));
      return skillApi.adminSubmitRoleAssessment(submitEmployee!.employee._id, { ratings: payload });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["skills", "submissions"] });
      await qc.invalidateQueries({ queryKey: ["skills", "leaderboard"] });
      setSubmitEmployee(null);
      setAdminRatings({});
      setAdminNotes({});
    },
  });

  // Filtered Items
  const filteredItems = useMemo(() => {
    const list = submissionsQuery.data?.items || [];
    return list.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase().includes(q) ||
        item.employee.employeeId.toLowerCase().includes(q) ||
        item.employee.designation?.name.toLowerCase().includes(q);

      const matchDept = deptFilter === "ALL" || item.employee.department?._id === deptFilter;

      let matchStatus = true;
      if (statusFilter === "SUBMITTED") matchStatus = item.isSubmitted;
      if (statusFilter === "PENDING") matchStatus = !item.isSubmitted;
      if (statusFilter === "REALITY_GAP") matchStatus = item.realityGapsCount > 0;
      if (statusFilter === "MASTERY") matchStatus = item.masteryCount > 0;

      return matchSearch && matchDept && matchStatus;
    });
  }, [submissionsQuery.data?.items, searchQuery, deptFilter, statusFilter]);

  const stats = submissionsQuery.data?.stats;

  const handleOpenSubmitModal = (item: RoleSkillSubmissionItem) => {
    setSubmitEmployee(item);
    // Prepopulate existing ratings if any
    const initialRatings: Record<string, number> = {};
    const initialNotes: Record<string, string> = {};
    if (item.scores && item.scores.length > 0) {
      item.scores.forEach((s) => {
        initialRatings[s.skillId] = s.rating;
        initialNotes[s.skillId] = s.implementationNote || "";
      });
    }
    setAdminRatings(initialRatings);
    setAdminNotes(initialNotes);
  };

  return (
    <div className="space-y-6">
      {/* ────── SECTION 1: METHODOLOGY & CALIBRATION FRAMEWORK ────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                <Target size={13} className="text-brand-600" />
                Competency Calibration
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Super Admin
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Workforce Skill Verification & Calibration
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Objective competency framework correlating employee self-assessments with task delivery velocity and peer benchmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="h-8 text-xs font-medium px-3"
            >
              {showHowItWorks ? "Hide Process Guide" : "Methodology Guide"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSimulationOpen(true);
                if (orgQuery.data?.designations?.[0]) {
                  setSimDesignationId(orgQuery.data.designations[0]._id);
                }
              }}
              className="h-8 text-xs font-medium px-3 gap-1.5"
            >
              <SlidersHorizontal size={13} className="text-brand-600" />
              Calibration Simulator
            </Button>
          </div>
        </div>

        {showHowItWorks && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-6 place-items-center rounded-md bg-blue-100 text-xs font-bold text-blue-700">
                  1
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Onboarding</span>
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-ink">Designation Skill Matrix</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                When an employee is assigned a role, the system loads all required technical, domain, and tool competencies.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-6 place-items-center rounded-md bg-brand-100 text-xs font-bold text-brand-700">
                  2
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Evaluation</span>
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-ink">1 to 10 Self-Rating</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                The employee declares their self-assessed proficiency scale across role competencies as an initial baseline.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-6 place-items-center rounded-md bg-violet-100 text-xs font-bold text-violet-700">
                  3
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Execution</span>
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-ink">Task Delivery Velocity</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Tasks tagged with tested skills benchmark real execution speed:
                <span className="mt-1 block font-mono text-[10px] text-brand-700 font-semibold">
                  Velocity = Estimated / Actual Hours
                </span>
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-6 place-items-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">
                  4
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Calibration</span>
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-ink">Competency Calibration</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Self-ratings are correlated with delivery velocity and peer benchmarks to establish verified organizational rankings.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ────── SECTION 2: TOP METRICS RIBBON ────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalEmployees ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Active employees</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluations Submitted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats?.submittedCount ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {stats ? Math.round((stats.submittedCount / (stats.totalEmployees || 1)) * 100) : 0}% completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Evaluation</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats?.pendingCount ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Awaiting self-rating</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Calibration Gaps</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats?.totalRealityGaps ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Delivery lagged claims</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mastery Confirmed</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{stats?.totalMastery ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">High speed & quality</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credibility Index</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{stats?.averageCredibility ?? 100}%</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Company-wide accuracy</p>
        </div>
      </div>

      {/* ────── SECTION 3: EMPLOYEE SUBMISSIONS ROSTER ────── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        {/* Table Header / Filters */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-ink sm:text-lg">Workforce Skill Evaluations & Calibration</h3>
            <p className="text-xs text-slate-500">
              Audit employee self-assessments, task delivery velocity benchmarks, and calibrated competency ratings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search employee or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            {/* Department Filter */}
            <select
              aria-label="Filter by department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:border-brand-500 focus:outline-hidden"
            >
              <option value="ALL">All Departments</option>
              {orgQuery.data?.departments?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by submission status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:border-brand-500 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted Claims</option>
              <option value="PENDING">Pending Onboarding Claim</option>
              <option value="REALITY_GAP">Reality Gaps Flagged</option>
              <option value="MASTERY">Mastery Confirmed</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {submissionsQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No employee skill records found</p>
              <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filter options.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Role / Designation</th>
                  <th className="px-4 py-3.5 text-center">Claim Status</th>
                  <th className="px-4 py-3.5 text-center">Claimed Avg</th>
                  <th className="px-4 py-3.5 text-center">Verified Avg</th>
                  <th className="px-4 py-3.5 text-center">Velocity</th>
                  <th className="px-4 py-3.5 text-center">Credibility</th>
                  <th className="px-4 py-3.5 text-center">Internal Rank</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isSubmitted = item.isSubmitted;
                  const cred = item.overallCredibilityScore ?? 100;
                  return (
                    <tr key={item.employee._id} className="transition hover:bg-slate-50/60">
                      {/* Employee Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                            {item.employee.firstName[0]}
                            {item.employee.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">
                              {item.employee.firstName} {item.employee.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">{item.employee.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Dept */}
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800">
                          {item.employee.designation?.name || "Unassigned"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.employee.department?.name || "No department"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {isSubmitted ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 size={11} />
                              Submitted
                            </span>
                            {item.submissionType === "SKILL_CLAIMS" && (
                              <span className="text-[9px] font-semibold text-brand-600 bg-brand-50 rounded px-1.5 py-0.2">
                                Capability Profile
                              </span>
                            )}
                            {item.submissionType === "ASSESSMENT_TEST" && (
                              <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 rounded px-1.5 py-0.2">
                                Assessment Test
                              </span>
                            )}
                            {item.submissionType === "ROLE_ASSESSMENT" && (
                              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.2">
                                Role Assessment
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700" title="Employee must submit first during onboarding on a 1–10 scale">
                            <Clock size={11} />
                            Waiting for Employee
                          </span>
                        )}
                      </td>

                      {/* Claimed Avg */}
                      <td className="px-4 py-4 text-center">
                        {item.claimedAverage !== null ? (
                          <span className="font-bold text-slate-700">{item.claimedAverage.toFixed(1)} / 10</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Verified Avg */}
                      <td className="px-4 py-4 text-center">
                        {item.demonstratedAverage !== null ? (
                          <span
                            className={cn(
                              "font-bold",
                              item.realityGapsCount > 0 ? "text-red-600" : "text-brand-700"
                            )}
                          >
                            {item.demonstratedAverage.toFixed(1)} / 10
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Velocity */}
                      <td className="px-4 py-4 text-center">
                        {item.averageVelocity !== undefined ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                            {item.averageVelocity.toFixed(2)}x
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Credibility */}
                      <td className="px-4 py-4 text-center">
                        {isSubmitted ? (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                              cred >= 80
                                ? "bg-emerald-100 text-emerald-800"
                                : cred >= 65
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {Math.round(cred)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-4 text-center">
                        {item.companyRank ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                              #{item.companyRank} All
                            </span>
                            {item.departmentRank && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                #{item.departmentRank} Dept
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSubmitted ? (
                            <>
                              <Button
                                variant="secondary"
                                className="h-8 text-[11px] px-2.5"
                                onClick={() => setInspectItem(item)}
                              >
                                <Eye size={12} className="mr-1" />
                                Inspect
                              </Button>
                              <Button
                                variant="secondary"
                                className="h-8 text-[11px] px-2.5 border-brand-200 text-brand-700 hover:bg-brand-50"
                                onClick={() => handleOpenSubmitModal(item)}
                              >
                                <Target size={12} className="mr-1" />
                                Calibrate
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              className="h-8 text-[11px] px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              onClick={() => handleOpenSubmitModal(item)}
                            >
                              <Target size={12} className="mr-1 text-slate-500" />
                              Review / Assist
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ────── MODAL 1: SUBMIT / TEST SKILL ASSESSMENT ON BEHALF OF EMPLOYEE ────── */}
      {submitEmployee && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-brand-50 via-white to-violet-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200">
                  <Target size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {submitEmployee.isSubmitted
                      ? "Review & Calibrate Employee Claims (1–10 Scale)"
                      : "Designation Skills & Baseline Input"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Employee: <strong>{submitEmployee.employee.firstName} {submitEmployee.employee.lastName}</strong> ({submitEmployee.employee.employeeId}) · Role: <strong>{submitEmployee.employee.designation?.name || "Designation"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubmitEmployee(null)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
              {employeeCatalogQuery.isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : employeeCatalogQuery.data?.catalog.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
                  <p className="font-semibold text-slate-700">No skills configured for this designation</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Please use the AI Skill Builder to generate required skills for designation{" "}
                    <strong>{submitEmployee.employee.designation?.name}</strong>.
                  </p>
                </div>
              ) : (
                <>
                  {employeeCatalogQuery.data?.submittedSkills && employeeCatalogQuery.data.submittedSkills.length > 0 ? (
                    <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-4">
                      <div className="flex items-start gap-2.5">
                        <Sparkles size={18} className="text-brand-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-brand-950 leading-relaxed flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="font-semibold text-brand-900">
                              Employee Capability Profile Found ({employeeCatalogQuery.data.submittedSkills.length} skills submitted):
                            </strong>
                            {submitEmployee.claimedAverage !== null && (
                              <button
                                type="button"
                                onClick={() => handleApplyAverageToAll(submitEmployee.claimedAverage!)}
                                className="rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-700 shadow-2xs transition"
                              >
                                Pre-fill Remaining with Claimed Avg ({submitEmployee.claimedAverage.toFixed(1)}/10)
                              </button>
                            )}
                          </div>
                          <span className="block mt-1 text-slate-600">
                            {submitEmployee.employee.firstName} {submitEmployee.employee.lastName} previously submitted capability skills. Specific matches have been pre-filled into this role&apos;s catalog below:
                          </span>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {employeeCatalogQuery.data.submittedSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-brand-200 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs"
                              >
                                <span>{s.name}</span>
                                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                                  {s.selfRating}/10
                                </span>
                                {s.verificationStatus === "VERIFIED" && (
                                  <span className="text-emerald-600 text-[10px]" title="Verified">✓</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : submitEmployee.isSubmitted ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-900 leading-relaxed">
                          <strong className="font-semibold">Submitted by Employee:</strong> Baseline claimed average is <strong>{submitEmployee.claimedAverage?.toFixed(1) ?? "-"}/10</strong>.
                          <span className="block mt-1 text-emerald-700">
                            These are the honest self-ratings submitted by the employee. You can inspect them or calibrate individual ratings below.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                      <div className="flex items-start gap-2.5">
                        <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                          <strong className="font-semibold">Waiting for Employee Submission:</strong> The employee submits their self-evaluation during onboarding or in their skills portal.
                          <span className="block mt-1 text-amber-700">
                            No ratings are preset. You can review this designation&apos;s required skills here, or optionally calibrate a baseline on their behalf if needed.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {employeeCatalogQuery.data?.catalog.map((skill: CatalogSkill) => {
                    const currentRating = adminRatings[skill.id];
                    const currentNote = adminNotes[skill.id] ?? "";
                    return (
                      <div key={skill.id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-3">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-ink text-sm">{skill.name}</h4>
                              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {skill.level} · {skill.category}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{skill.description}</p>
                            {skill.tools && (
                              <p className="mt-0.5 text-[11px] text-slate-400 font-mono">Tools: {skill.tools}</p>
                            )}
                          </div>

                          {/* 1 to 10 Scale Buttons */}
                          <div className="shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-semibold text-slate-500">Rating Scale:</span>
                              {currentRating !== undefined ? (
                                <span className="text-xs font-bold text-brand-700">{currentRating} / 10</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-400 italic">Not rated yet</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setAdminRatings((prev) => ({ ...prev, [skill.id]: val }))}
                                  className={cn(
                                    "grid size-7 place-items-center rounded-lg text-xs font-bold transition",
                                    currentRating === val
                                      ? "bg-brand-600 text-white shadow-sm scale-110"
                                      : "border bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                                  )}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Optional Implementation Notes */}
                        <div>
                          <input
                            type="text"
                            placeholder="Optional note / evidence of how skill is demonstrated..."
                            value={currentNote}
                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [skill.id]: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t bg-slate-50 p-5">
              <div>
                <p className="text-xs text-slate-500">
                  Total Skills: <strong>{employeeCatalogQuery.data?.catalog.length || 0}</strong>
                  {Object.keys(adminRatings).length > 0 && (
                    <span className="ml-2 font-medium text-brand-700">
                      ({Object.keys(adminRatings).length} rated)
                    </span>
                  )}
                </p>
                {adminSubmitMutation.isError && (
                  <p className="mt-1 text-xs text-red-600">{(adminSubmitMutation.error as Error)?.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setSubmitEmployee(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => adminSubmitMutation.mutate()}
                  disabled={
                    adminSubmitMutation.isPending ||
                    !employeeCatalogQuery.data?.catalog.length
                  }
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs text-xs"
                >
                  {adminSubmitMutation.isPending
                    ? "Saving..."
                    : submitEmployee.isSubmitted
                    ? "Save Calibration"
                    : employeeCatalogQuery.data?.submittedSkills && employeeCatalogQuery.data.submittedSkills.length > 0
                    ? "Save Baseline from Employee Submission"
                    : Object.keys(adminRatings).length < (employeeCatalogQuery.data?.catalog.length || 0)
                    ? `Save Baseline (${Object.keys(adminRatings).length}/${employeeCatalogQuery.data?.catalog.length || 0} Rated)`
                    : "Save Baseline On Behalf of Employee"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────── MODAL 2: INSPECT DETAILS MODAL ────── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 via-white to-brand-50/40 p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand-600 text-white shadow-md shadow-brand-200">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {inspectItem.employee.firstName} {inspectItem.employee.lastName} · Skill Claims Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectItem.employee.designation?.name} · {inspectItem.employee.department?.name} · ID: {inspectItem.employee.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics Header */}
            <div className="grid grid-cols-2 gap-3 border-b bg-slate-50/50 p-5 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Claimed Avg</p>
                <p className="text-xl font-bold text-slate-700 mt-0.5">{inspectItem.claimedAverage?.toFixed(1) ?? "-"} / 10</p>
              </div>
              <div className="rounded-xl border bg-white p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-brand-600">Demonstrated Avg</p>
                <p className="text-xl font-bold text-brand-700 mt-0.5">{inspectItem.demonstratedAverage?.toFixed(1) ?? "-"} / 10</p>
              </div>
              <div className="rounded-xl border bg-white p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-emerald-600">Credibility Index</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{Math.round(inspectItem.overallCredibilityScore ?? 100)}%</p>
              </div>
              <div className="rounded-xl border bg-white p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-purple-600">Internal Rank</p>
                <p className="text-xl font-bold text-purple-700 mt-0.5">
                  #{inspectItem.companyRank ?? "-"} Org · #{inspectItem.departmentRank ?? "-"} Dept
                </p>
              </div>
            </div>

            {/* Individual Skills List */}
            <div className="max-h-[60vh] overflow-y-auto p-6 divide-y divide-slate-100">
              {inspectItem.scores.map((s) => {
                const status = s.credibilityStatus ?? "UNTESTED";
                const demonstrated = s.demonstratedRating ?? s.rating;
                return (
                  <div key={s.skillId} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-ink text-sm">{s.name}</h4>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {s.level} · {s.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {s.tasksEvaluatedCount && s.tasksEvaluatedCount > 0
                            ? `Benchmarked in ${s.tasksEvaluatedCount} tasks · Velocity ratio ${s.velocityRatio ? s.velocityRatio.toFixed(2) + "x" : "1.00x"}`
                            : "No completed tasks evaluated for this skill yet"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-center">
                          <p className="text-xs font-bold text-slate-700">{s.rating}/10</p>
                          <p className="text-[9px] text-slate-400">Claimed</p>
                        </div>
                        <div className="rounded-xl bg-brand-50 px-3 py-1.5 text-center border border-brand-100">
                          <p className="text-xs font-bold text-brand-700">{demonstrated.toFixed(1)}/10</p>
                          <p className="text-[9px] text-brand-500">Demonstrated</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                            status === "EXCEEDED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "GAP_DETECTED"
                              ? "bg-red-100 text-red-700 animate-pulse"
                              : status === "JUSTIFIED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {status === "GAP_DETECTED"
                            ? "⚠️ Reality Gap"
                            : status === "EXCEEDED"
                            ? "⚡ Mastery"
                            : status === "JUSTIFIED"
                            ? "✓ Justified"
                            : "Untested"}
                        </span>
                      </div>
                    </div>
                    {s.implementationNote && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 italic">
                        &quot;{s.implementationNote}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t bg-slate-50 p-4">
              <Button variant="secondary" onClick={() => setInspectItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────── MODAL 3: INTERACTIVE SIMULATION / DEMONSTRATION TOOL ────── */}
      {simulationOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-slate-50/70 p-6">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand-50 border border-brand-100 text-brand-700 shadow-xs">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">Skill Calibration Model Simulator</h3>
                  <p className="text-xs text-slate-500">
                    Preview how employee self-ratings and task delivery velocity ratios correlate to compute calibrated scores.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulationOpen(false)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Designation Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Select Designation to Test:
                </label>
                <select
                  aria-label="Select Designation to Test"
                  value={simDesignationId}
                  onChange={(e) => {
                    setSimDesignationId(e.target.value);
                    setSimRatings({});
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-brand-500 focus:outline-hidden"
                >
                  {orgQuery.data?.designations?.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Simulation Controls: Velocity Ratio Slider */}
              <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    Simulated Task Delivery Speed (Velocity Ratio):
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-700">
                    {simVelocity.toFixed(2)}x ({simVelocity < 0.8 ? "Delayed / Lagged" : simVelocity >= 1.25 ? "Exceeding Benchmark" : "On-Time Delivery"})
                  </span>
                </div>
                <input
                  aria-label="Simulated Task Delivery Speed"
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={simVelocity}
                  onChange={(e) => setSimVelocity(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0.3x (Significant Delay / Delivery Lag)</span>
                  <span>1.0x (Standard Target)</span>
                  <span>2.0x (High Velocity Benchmark)</span>
                </div>
              </div>

              {/* Skills Interactive Preview */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive 1–10 Rating Preview (Designation Skills):
                </p>
                {simDesignation?.customSkills && simDesignation.customSkills.length > 0 ? (
                  simDesignation.customSkills.map((s, idx) => {
                    const skillId = s.id || `skill-${idx}`;
                    const rating = simRatings[skillId] ?? 8;
                    // Compute simulated demonstrated score based on formula
                    let demonstrated = rating;
                    let status = "JUSTIFIED";
                    if (rating >= 8) {
                      if (simVelocity >= 0.9) {
                        demonstrated = Math.min(10, Math.round(rating * (1 + (simVelocity - 1) * 0.1)));
                        status = simVelocity >= 1.25 ? "MASTERY" : "JUSTIFIED";
                      } else {
                        status = "REALITY_GAP";
                        demonstrated = Math.max(1, rating - 2);
                      }
                    } else if (rating <= 4 && simVelocity >= 1.1) {
                      status = "FAST_LEARNER";
                      demonstrated = Math.min(10, rating + 2);
                    }

                    return (
                      <div key={skillId} className="rounded-xl border bg-slate-50/50 p-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">{s.name}</span>
                            <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">{s.level}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.description || "Required skill"}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* 1-10 selector */}
                          <div className="flex gap-1">
                            {[1, 3, 5, 8, 10].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setSimRatings((prev) => ({ ...prev, [skillId]: v }))}
                                className={cn(
                                  "size-6 rounded text-[10px] font-bold transition",
                                  rating === v ? "bg-brand-600 text-white shadow-xs" : "bg-white border text-slate-600"
                                )}
                              >
                                {v}
                              </button>
                            ))}
                          </div>

                          {/* Live Simulated Result */}
                          <div className="text-right">
                            <p className="text-xs font-bold text-ink">{demonstrated} / 10</p>
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase",
                                status === "REALITY_GAP" ? "text-red-600" : status === "MASTERY" ? "text-emerald-600" : "text-blue-600"
                              )}
                            >
                              {status === "REALITY_GAP" ? "Calibration Gap" : status === "MASTERY" ? "Mastery Met" : status === "FAST_LEARNER" ? "High Velocity" : "Verified"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic p-4 text-center border rounded-xl">
                    This designation does not currently have custom skills configured.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t bg-slate-50 p-4">
              <Button variant="secondary" onClick={() => setSimulationOpen(false)}>
                Close Simulator
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
