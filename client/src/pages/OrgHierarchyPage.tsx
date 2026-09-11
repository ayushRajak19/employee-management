import { useState, useMemo, useRef, type FC } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChevronsDown,
  ChevronsUp,
  CornerDownRight,
  Focus,
  Layers3,
  Mail,
  Minus,
  Network,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  Workflow,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { organizationApi } from "@/features/organization/organizationApi";
import type { HierarchyEmployeeNode } from "@/features/organization/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ViewMode = "REPORTING_FLOW" | "DEPARTMENT_FLOW";

export const OrgHierarchyPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("REPORTING_FLOW");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<HierarchyEmployeeNode | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["organization-hierarchy-flow"],
    queryFn: organizationApi.getHierarchyFlow,
  });

  const employees = data?.employees || [];
  const departments = data?.departments || [];
  const teams = data?.teams || [];
  const stats = data?.stats;

  // Identify current logged-in employee node
  const myEmployee = useMemo(() => {
    if (!user) return null;
    return (
      employees.find(
        (e) => e.userId === user.id || e.officialEmail?.toLowerCase() === user.email?.toLowerCase()
      ) || null
    );
  }, [employees, user]);

  // Build employee lookup maps
  const employeeMap = useMemo(() => {
    const map = new Map<string, HierarchyEmployeeNode>();
    for (const emp of employees) {
      map.set(emp._id, emp);
    }
    return map;
  }, [employees]);

  // Direct reports map: managerId -> direct reports array
  const directReportsMap = useMemo(() => {
    const map = new Map<string, HierarchyEmployeeNode[]>();
    for (const emp of employees) {
      const mgrId = emp.reportingManager?._id;
      if (mgrId) {
        const existing = map.get(mgrId) || [];
        existing.push(emp);
        map.set(mgrId, existing);
      }
    }
    return map;
  }, [employees]);

  // Root employees (those without a reporting manager or manager not in active list)
  const rootEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.reportingManager?._id) return true;
      return !employeeMap.has(emp.reportingManager._id);
    });
  }, [employees, employeeMap]);

  // Search filter
  const matchingEmployeeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const matches = new Set<string>();
    for (const emp of employees) {
      if (
        emp.name.toLowerCase().includes(q) ||
        emp.officialEmail.toLowerCase().includes(q) ||
        emp.designation?.name?.toLowerCase().includes(q) ||
        emp.department?.name?.toLowerCase().includes(q) ||
        emp.team?.name?.toLowerCase().includes(q)
      ) {
        matches.add(emp._id);
      }
    }
    return matches;
  }, [searchQuery, employees]);

  // Toggle node collapse
  const toggleCollapse = (id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedNodeIds(new Set());
  };

  const collapseAll = () => {
    const allManagerIds = new Set<string>();
    for (const emp of employees) {
      if (emp.directReportsCount > 0) {
        allManagerIds.add(emp._id);
      }
    }
    setCollapsedNodeIds(allManagerIds);
  };

  // Focus on current user
  const handleFocusOnMe = () => {
    if (!myEmployee) return;
    setHighlightedId(myEmployee._id);
    setSelectedEmployee(myEmployee);

    // Ensure all ancestors are uncollapsed so the user's card is visible
    let currMgrId = myEmployee.reportingManager?._id;
    if (currMgrId) {
      setCollapsedNodeIds((prev) => {
        const next = new Set(prev);
        while (currMgrId) {
          next.delete(currMgrId);
          const mgr = employeeMap.get(currMgrId);
          currMgrId = mgr?.reportingManager?._id;
        }
        return next;
      });
    }

    setTimeout(() => {
      const el = document.getElementById(`org-node-${myEmployee._id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 120);
  };

  // Calculate chain of command for selected employee
  const reportingChain = useMemo(() => {
    if (!selectedEmployee) return [];
    const chain: HierarchyEmployeeNode[] = [];
    let curr: HierarchyEmployeeNode | undefined = selectedEmployee;
    const visited = new Set<string>();

    while (curr && !visited.has(curr._id)) {
      visited.add(curr._id);
      chain.unshift(curr);
      if (curr.reportingManager?._id) {
        curr = employeeMap.get(curr.reportingManager._id);
      } else {
        curr = undefined;
      }
    }
    return chain;
  }, [selectedEmployee, employeeMap]);

  return (
    <main className="flex-1 overflow-x-hidden bg-[#f8fafc] px-4 py-6 sm:px-8 sm:py-8 min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-600">
              <Workflow size={20} className="text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Organization Structure
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Public Organization View
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Visual Hierarchy Flow
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Explore the organizational reporting tree, leadership flow, and departmental structure across the company.
            </p>
          </div>

          {/* Mode Switcher & Focus on Me */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("REPORTING_FLOW")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "REPORTING_FLOW"
                    ? "bg-brand-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Network size={14} />
                Reporting Hierarchy
              </button>
              <button
                type="button"
                onClick={() => setViewMode("DEPARTMENT_FLOW")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  viewMode === "DEPARTMENT_FLOW"
                    ? "bg-brand-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Building2 size={14} />
                Departments & Teams
              </button>
            </div>

            {myEmployee && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleFocusOnMe}
                className="h-9 text-xs font-semibold shadow-2xs"
                title="Locate my position in the organization tree"
              >
                <Focus size={14} className="mr-1.5 text-brand-600" />
                Focus on Me
              </Button>
            )}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Workforce</p>
                <p className="text-lg font-bold text-slate-900">{stats?.totalEmployees ?? employees.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Departments</p>
                <p className="text-lg font-bold text-slate-900">{stats?.totalDepartments ?? departments.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Layers3 size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Teams</p>
                <p className="text-lg font-bold text-slate-900">{stats?.totalTeams ?? teams.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Managers & Leads</p>
                <p className="text-lg font-bold text-slate-900">{stats?.totalManagers ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action & Control Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name, role, department..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tree Controls */}
          {viewMode === "REPORTING_FLOW" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={expandAll}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium text-slate-600 hover:bg-white transition"
                  title="Expand all branches"
                >
                  <ChevronsDown size={13} />
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium text-slate-600 hover:bg-white transition"
                  title="Collapse all branches"
                >
                  <ChevronsUp size={13} />
                  Collapse All
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
                  className="grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-1 text-[11px] font-bold text-slate-600 select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
                  className="grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white transition"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white transition"
                  title="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-soft min-h-[550px] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="size-12 rounded-2xl bg-brand-50 text-brand-600 grid place-items-center mb-3 animate-bounce">
                <Network size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800">Building Organization Hierarchy...</p>
              <p className="mt-1 text-xs text-slate-400">Rendering visual reporting tree & structure</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <p className="text-sm font-semibold text-red-600">Failed to load organization hierarchy flow.</p>
              <Button onClick={() => refetch()} variant="secondary" className="mt-3 text-xs">
                Retry
              </Button>
            </div>
          ) : viewMode === "REPORTING_FLOW" ? (
            /* REPORTING HIERARCHY TREE VIEW */
            <div
              ref={containerRef}
              className="w-full overflow-auto p-4 sm:p-8"
              style={{ minHeight: "500px" }}
            >
              {rootEmployees.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-slate-500">No active employees found in the organization.</p>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center transition-transform origin-top duration-200 pb-12"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {/* Organization Root Hub */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-2 rounded-2xl border-2 border-brand-500 bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-3 text-white shadow-lg">
                      <Building2 size={20} className="text-amber-300" />
                      <div>
                        <h2 className="text-sm font-bold tracking-tight">
                          {user?.tenantName ?? "MobiusEMS Organization"}
                        </h2>
                        <p className="text-[10px] text-brand-100 font-medium">Executive & Operational Structure</p>
                      </div>
                    </div>
                    {/* Trunk vertical line */}
                    <div className="h-6 w-0.5 bg-slate-300" />
                  </div>

                  {/* Level 1 Leaders / Roots */}
                  <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                    {rootEmployees.map((root) => (
                      <ReportingTreeNode
                        key={root._id}
                        node={root}
                        directReportsMap={directReportsMap}
                        collapsedNodeIds={collapsedNodeIds}
                        toggleCollapse={toggleCollapse}
                        onSelectEmployee={setSelectedEmployee}
                        selectedId={selectedEmployee?._id}
                        highlightedId={highlightedId}
                        myUserId={user?.id}
                        matchingEmployeeIds={matchingEmployeeIds}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* DEPARTMENT & TEAM FLOW VIEW */
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departments.map((dept) => {
                  const deptTeams = teams.filter((t) => (t.department as any)?._id === dept._id);
                  const deptEmployees = employees.filter((e) => e.department?._id === dept._id);

                  return (
                    <div
                      key={dept._id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-2xs hover:border-brand-300 transition"
                    >
                      <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                            {dept.code && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                {dept.code}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">
                          {deptEmployees.length} {deptEmployees.length === 1 ? "Member" : "Members"}
                        </span>
                      </div>

                      {/* Teams in department */}
                      <div className="mt-4 space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Teams ({deptTeams.length})
                        </p>
                        {deptTeams.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No teams configured in this department.</p>
                        ) : (
                          deptTeams.map((team) => {
                            const teamEmployees = deptEmployees.filter((e) => e.team?._id === team._id);
                            return (
                              <div
                                key={team._id}
                                className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Layers3 size={13} className="text-slate-400" />
                                    {team.name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {teamEmployees.length} members
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {teamEmployees.map((e) => (
                                    <button
                                      key={e._id}
                                      type="button"
                                      onClick={() => setSelectedEmployee(e)}
                                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                                    >
                                      <span className="size-1.5 rounded-full bg-brand-500" />
                                      {e.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Direct Dept Members without a team */}
                        {deptEmployees.filter((e) => !e.team).length > 0 && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-3">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                              General Department Members:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {deptEmployees
                                .filter((e) => !e.team)
                                .map((e) => (
                                  <button
                                    key={e._id}
                                    type="button"
                                    onClick={() => setSelectedEmployee(e)}
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                                  >
                                    <span className="size-1.5 rounded-full bg-slate-400" />
                                    {e.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Employee Detail Slide-Out Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-md flex-col bg-white p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedEmployee(null)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 border-b pb-5 pt-2">
              {selectedEmployee.profilePhotoUrl ? (
                <img
                  src={selectedEmployee.profilePhotoUrl}
                  alt={selectedEmployee.name}
                  className="size-16 rounded-2xl object-cover ring-2 ring-brand-100"
                />
              ) : (
                <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-lg font-bold text-white shadow-xs">
                  {selectedEmployee.firstName[0]}
                  {selectedEmployee.lastName[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-lg font-bold text-slate-900">{selectedEmployee.name}</h3>
                  {selectedEmployee.userId === user?.id && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      YOU
                    </span>
                  )}
                </div>
                <p className="truncate text-xs font-semibold text-brand-600">
                  {selectedEmployee.designation?.name || "Team Member"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono">{selectedEmployee.employeeId}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedEmployee.status.toLowerCase()}</span>
                </div>
              </div>
            </div>

            {/* Details List */}
            <div className="mt-5 space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Contact & Communication
                </span>
                <div className="mt-2 space-y-2">
                  <a
                    href={`mailto:${selectedEmployee.officialEmail}`}
                    className="flex items-center gap-2 text-slate-700 hover:text-brand-600"
                  >
                    <Mail size={14} className="text-slate-400" />
                    <span>{selectedEmployee.officialEmail}</span>
                  </a>
                  {selectedEmployee.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={14} className="text-slate-400" />
                      <span>{selectedEmployee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Organization Placement
                </span>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50/80 p-2.5">
                    <span className="text-slate-500">Department</span>
                    <span className="font-bold text-slate-800">{selectedEmployee.department?.name || "General"}</span>
                  </div>
                  {selectedEmployee.team && (
                    <div className="flex items-center justify-between rounded-xl border bg-slate-50/80 p-2.5">
                      <span className="text-slate-500">Team</span>
                      <span className="font-bold text-slate-800">{selectedEmployee.team.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50/80 p-2.5">
                    <span className="text-slate-500">Employment Type</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {selectedEmployee.employmentType.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chain of Command (Reporting Line) */}
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Chain of Command (Reporting Hierarchy)
                </span>
                <div className="mt-2 rounded-2xl border border-brand-100 bg-brand-50/40 p-3 space-y-2">
                  {reportingChain.length === 1 ? (
                    <p className="text-slate-500 italic text-xs">Top of organizational reporting structure (No superior).</p>
                  ) : (
                    reportingChain.map((node, idx) => {
                      const isTarget = node._id === selectedEmployee._id;
                      return (
                        <div key={node._id} className="flex items-center gap-2">
                          <span className="grid size-5 place-items-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-800 shrink-0">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(node)}
                            className={cn(
                              "text-left truncate hover:underline",
                              isTarget ? "font-bold text-brand-700" : "text-slate-700 font-medium"
                            )}
                          >
                            {node.name}
                            <span className="ml-1.5 text-[10px] text-slate-400">
                              ({node.designation?.name || "Staff"})
                            </span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Direct Reports */}
              {selectedEmployee.directReportsCount > 0 && (
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Direct Subordinates ({selectedEmployee.directReportsCount})
                  </span>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                    {(directReportsMap.get(selectedEmployee._id) || []).map((sub) => (
                      <button
                        key={sub._id}
                        type="button"
                        onClick={() => setSelectedEmployee(sub)}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                      >
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{sub.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{sub.designation?.name || "Member"}</p>
                        </div>
                        <CornerDownRight size={14} className="text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6">
              <Button
                variant="secondary"
                className="w-full text-xs font-semibold"
                onClick={() => setSelectedEmployee(null)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

/* RECURSIVE REPORTING TREE NODE COMPONENT */
interface ReportingTreeNodeProps {
  node: HierarchyEmployeeNode;
  directReportsMap: Map<string, HierarchyEmployeeNode[]>;
  collapsedNodeIds: Set<string>;
  toggleCollapse: (id: string) => void;
  onSelectEmployee: (emp: HierarchyEmployeeNode) => void;
  selectedId?: string;
  highlightedId?: string | null;
  myUserId?: string;
  matchingEmployeeIds?: Set<string> | null;
}

const ReportingTreeNode: FC<ReportingTreeNodeProps> = ({
  node,
  directReportsMap,
  collapsedNodeIds,
  toggleCollapse,
  onSelectEmployee,
  selectedId,
  highlightedId,
  myUserId,
  matchingEmployeeIds,
}) => {
  const directReports = directReportsMap.get(node._id) || [];
  const hasChildren = directReports.length > 0;
  const isCollapsed = collapsedNodeIds.has(node._id);
  const isMe = node.userId === myUserId;
  const isSelected = selectedId === node._id;
  const isHighlighted = highlightedId === node._id;
  const isSearchMatch = matchingEmployeeIds?.has(node._id);

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        id={`org-node-${node._id}`}
        className={cn(
          "group relative flex w-64 flex-col rounded-2xl border bg-white p-3.5 shadow-soft transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-soft-lg",
          isSelected
            ? "border-brand-500 ring-3 ring-brand-200"
            : isHighlighted
            ? "border-brand-500 ring-4 ring-brand-400 animate-pulse bg-brand-50/20"
            : isMe
            ? "border-amber-400 ring-2 ring-amber-300/70"
            : isSearchMatch
            ? "border-emerald-500 ring-3 ring-emerald-200 bg-emerald-50/20"
            : "border-slate-200 hover:border-brand-300"
        )}
        onClick={() => onSelectEmployee(node)}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-2">
          {isMe ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs">
              ★ YOU
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {node.department?.code || node.department?.name || "Staff"}
            </span>
          )}

          {node.directReportsCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
              👥 {node.directReportsCount} reports
            </span>
          )}
        </div>

        {/* Avatar & Name */}
        <div className="flex items-center gap-3">
          {node.profilePhotoUrl ? (
            <img
              src={node.profilePhotoUrl}
              alt={node.name}
              className="size-11 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
              {node.firstName[0]}
              {node.lastName[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xs font-bold text-slate-900 group-hover:text-brand-600 transition">
              {node.name}
            </h4>
            <p className="truncate text-[11px] font-medium text-slate-500">
              {node.designation?.name || "Team Member"}
            </p>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
          <span className="truncate max-w-[140px]">{node.officialEmail}</span>
          <span className="font-mono text-[9px] font-semibold text-slate-500">{node.employeeId}</span>
        </div>

        {/* Expand / Collapse Button if has children */}
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(node._id);
            }}
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 grid size-6 place-items-center rounded-full border shadow-2xs text-white transition",
              isCollapsed
                ? "bg-brand-600 border-brand-700 hover:bg-brand-700"
                : "bg-slate-700 border-slate-800 hover:bg-slate-900"
            )}
            title={isCollapsed ? `Expand ${directReports.length} direct reports` : "Collapse direct reports"}
          >
            {isCollapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
        )}
      </div>

      {/* Children Subtree */}
      {hasChildren && !isCollapsed && (
        <div className="flex flex-col items-center">
          {/* Vertical line from parent to horizontal connector */}
          <div className="h-6 w-0.5 bg-slate-300" />

          {/* Children container with connecting branch lines */}
          <div className="relative flex gap-6 pt-0">
            {/* Horizontal connector bar covering all children except when single child */}
            {directReports.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-slate-300"
                style={{
                  left: "calc(130px)",
                  right: "calc(130px)",
                }}
              />
            )}

            {directReports.map((child) => (
              <div key={child._id} className="relative flex flex-col items-center">
                {/* Vertical drop line down into each child card */}
                <div className="h-6 w-0.5 bg-slate-300" />
                <ReportingTreeNode
                  node={child}
                  directReportsMap={directReportsMap}
                  collapsedNodeIds={collapsedNodeIds}
                  toggleCollapse={toggleCollapse}
                  onSelectEmployee={onSelectEmployee}
                  selectedId={selectedId}
                  highlightedId={highlightedId}
                  myUserId={myUserId}
                  matchingEmployeeIds={matchingEmployeeIds}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
