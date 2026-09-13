import { useEffect, useState, type ComponentType } from "react";
import logoMark from "@/assets/mobius-mark.png";
import { useMutation } from "@tanstack/react-query";
import type { CapabilityName, PermissionName, RoleName, SectionPermissionName } from "@mobius-ems/shared";
import {
  BarChart3, Bot, BrainCircuit, BriefcaseBusiness, Building2, CalendarCheck2,
  ChevronLeft, CircleGauge, FileText, GraduationCap, ListTodo, LogOut, Menu,
  MailPlus, MapPinned, Route, ShieldCheck, Sparkles, Target, TrendingUp, UserCog, UserPlus, UserRound, Users, Workflow, X,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { HeaderSearch } from "@/components/HeaderSearch";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { MobiusEmsAiFloating } from "@/features/ai/AiWorkspacePanels";
import { authApi } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  path: string;
  roles?: RoleName[];
  permission?: PermissionName;
  permissions?: PermissionName[];
  capability?: CapabilityName;
  platformOnly?: boolean;
  section?: SectionPermissionName;
};

const superAdminRole: RoleName[] = ["SUPER_ADMIN"];

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: CircleGauge, path: "/", section: "section.dashboard" },
      { label: "My profile", icon: UserRound, path: "/me", section: "section.profile" },
      { label: "AI Workspace", icon: Bot, path: "/ai-workspace", section: "section.ai_workspace" },
    ],
  },
  {
    label: "People & HR",
    items: [
      { label: "Employees", icon: Users, path: "/employees", section: "section.employees" },
      { label: "Org hierarchy", icon: Workflow, path: "/hierarchy" },
      { label: "Organization", icon: Building2, path: "/organization", section: "section.organization" },
      { label: "Attendance", icon: CalendarCheck2, path: "/attendance", section: "section.attendance" },
      { label: "Leave & recognition", icon: Users, path: "/people-ops", section: "section.people_ops" },
    ],
  },
  {
    label: "Talent acquisition",
    items: [
      { label: "Applicants", icon: UserPlus, path: "/applicants", section: "section.applicants" },
      { label: "Resume library", icon: FileText, path: "/resumes", section: "section.resumes" },
      { label: "Resume screener", icon: BrainCircuit, path: "/resume-screener", section: "section.resume_screener" },
    ],
  },
  {
    label: "Performance & growth",
    items: [
      { label: "Goals & performance", icon: Target, path: "/performance", section: "section.performance" },
      { label: "AI Skill Builder", icon: Sparkles, path: "/skills/builder", section: "section.skills" },
      { label: "Skill matrix", icon: BarChart3, path: "/skill-matrix", section: "section.skill_matrix" },
      { label: "Assessments", icon: ShieldCheck, path: "/assessments", section: "section.assessments" },
      { label: "Learning & training", icon: GraduationCap, path: "/development", section: "section.development" },
      { label: "Contribution & support", icon: TrendingUp, path: "/contribution", section: "section.contribution" },
    ],
  },
  {
    label: "Work & projects",
    items: [
      { label: "Tasks & projects", icon: BriefcaseBusiness, path: "/work", section: "section.work" },
      { label: "Task tracker", icon: ListTodo, path: "/task-tracker", section: "section.task_tracker" },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { label: "Sales dashboard", icon: TrendingUp, path: "/sales", permissions: ["sales.analytics.self", "sales.analytics.team", "sales.analytics.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "My target & performance", icon: Target, path: "/sales/my-target", permission: "sales.analytics.self", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Leads", icon: Users, path: "/sales/leads", permissions: ["sales.view.self", "sales.view.team", "sales.view.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "Customers", icon: UserRound, path: "/sales/customers", permission: "sales.customer.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Targets", icon: Target, path: "/sales/targets", permission: "sales.target.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Revenue", icon: TrendingUp, path: "/sales/revenue", permission: "sales.revenue.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Country sales & map", icon: MapPinned, path: "/sales/geography", permissions: ["sales.map.self", "sales.map.team", "sales.map.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "Territories (ownership)", icon: Route, path: "/sales/territories", permission: "sales.territory.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Channel partners", icon: Building2, path: "/sales/channel-partners", permission: "sales.channel_partner.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Sales employees", icon: Users, path: "/sales/employees", permissions: ["sales.view.team", "sales.view.all"], capability: "SALES_MODULE", section: "section.sales" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Administrators", icon: UserCog, path: "/administrators", roles: superAdminRole },
      { label: "Documents & reports", icon: FileText, path: "/governance", section: "section.governance" },
      { label: "Access & audit", icon: ShieldCheck, path: "/governance", permission: "audit.view", section: "section.governance" },
      { label: "Email automation", icon: MailPlus, path: "/email-automation", section: "section.email_automation" },
    ],
  },
];

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("mobius-sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navHint, setNavHint] = useState<{ label: string; top: number } | null>(null);
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("mobius-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setUser(null);
      window.location.replace("/login");
    },
  });

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.roles || item.roles.includes(user!.role)) &&
          (!item.section || user!.permissions.includes(item.section)) &&
          (!item.permission || user!.permissions.includes(item.permission)) &&
          (!item.permissions || item.permissions.some((permission) => user!.permissions.includes(permission))) &&
          (!item.capability || user!.capabilities.includes(item.capability)) &&
          (!item.platformOnly || user!.isPlatformAdmin)
      ),
    }))
    .filter((group) => group.items.length);

  const allVisiblePaths = visibleGroups.flatMap((g) => g.items.map((i) => i.path));

  const isItemActive = (itemPath: string) => {
    if (itemPath === "/") {
      return location.pathname === "/";
    }
    if (location.pathname === itemPath) {
      return true;
    }
    if (location.pathname.startsWith(`${itemPath}/`)) {
      const hasMoreSpecific = allVisiblePaths.some(
        (p) => p !== itemPath && p.startsWith(itemPath) && (location.pathname === p || location.pathname.startsWith(`${p}/`))
      );
      return !hasMoreSpecific;
    }
    return false;
  };

  const activeItem = visibleGroups.flatMap((group) => group.items).find((item) => isItemActive(item.path));

  const sidebar = (isCollapsed = collapsed) => (
    <aside
      className={cn(
        "app-sidebar flex h-full max-w-[86vw] flex-col border-r border-slate-800/70 bg-[#0c1c2c] text-white shadow-[12px_0_40px_rgba(8,22,38,.08)] transition-[width] duration-300",
        isCollapsed ? "w-[84px]" : "w-[280px]"
      )}
    >
      {/* Sidebar header */}
      <div className="relative flex h-20 items-center border-b border-white/10 px-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white shadow-lg shadow-black/20">
          <img src={logoMark} alt="MobiusEMS" className="h-8 w-7 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="ml-3 min-w-0 overflow-hidden">
            <p className="truncate text-[15px] font-bold tracking-tight">MobiusEMS</p>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[.14em] text-slate-400">{user?.tenantName ?? "Employee management"}</p>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          className={cn(
            "hidden size-8 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:grid",
            isCollapsed ? "absolute -right-4 top-6 z-10 bg-[#13283d] shadow-md" : "ml-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          onClick={() => setCollapsed((v) => !v)}
        >
          <ChevronLeft size={16} className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} />
        </button>
        {/* Mobile close button */}
        <button
          className="ml-auto grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="sidebar-scroll flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-5" aria-label="Primary navigation">
        {visibleGroups.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? "pt-1" : ""}>
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">
                {group.label}
              </p>
            )}
            {isCollapsed && groupIdx > 0 && (
              <div className="mx-auto my-3 h-px w-8 bg-white/10" />
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);
                return (
                  <button
                    key={`${item.label}-${item.path}`}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    onMouseEnter={(event) => isCollapsed && setNavHint({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 20 })}
                    onMouseLeave={() => setNavHint(null)}
                    onFocus={(event) => isCollapsed && setNavHint({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 20 })}
                    onBlur={() => setNavHint(null)}
                    title={item.label}
                    className={cn(
                      "group/nav relative flex h-10 w-full items-center rounded-xl px-3 text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 font-semibold text-white shadow-lg shadow-brand-950/20"
                        : "text-slate-400 hover:bg-white/[.07] hover:text-white",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    {active && !isCollapsed && <span className="absolute -left-3 h-5 w-1 rounded-r-full bg-brand-300" />}
                    <Icon size={17} className={cn("shrink-0 transition-transform group-hover/nav:scale-110", active ? "text-white" : "text-slate-400 group-hover/nav:text-brand-300")} />
                    {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {isCollapsed && navHint && (
        <div className="pointer-events-none fixed left-[98px] z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#10263a] px-3 py-2 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10" style={{ top: navHint.top }}>
          {navHint.label}
        </div>
      )}

      {/* User / logout */}
      <div className="space-y-2 border-t border-white/10 bg-black/10 p-3">
        <div
          className={cn(
            "flex w-full items-center rounded-xl p-2 text-left",
            isCollapsed && "justify-center"
          )}
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white shadow-lg shadow-black/20">
            {user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
          </div>
          {!isCollapsed && (
            <>
              <div className="ml-2.5 min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
                <p className="truncate text-[9px] font-medium uppercase tracking-wider text-slate-500">{user?.role.replaceAll("_", " ")}</p>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          disabled={logout.isPending}
          className={cn(
            "flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-60",
            isCollapsed && "justify-center px-0"
          )}
          onClick={() => logout.mutate()}
        >
          <LogOut size={17} />
          {!isCollapsed && <span className="ml-3">{logout.isPending ? "Signing out…" : "Sign out"}</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-full overflow-x-clip">
      {/* Desktop sidebar — fixed */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebar()}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <button
            aria-label="Close navigation backdrop"
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative h-full w-[min(280px,86vw)] shadow-2xl">
            {sidebar(false)}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip transition-[margin] duration-200",
          collapsed ? "lg:ml-[84px]" : "lg:ml-[280px]"
        )}
      >
        {/* Top header */}
        <header className="app-header sticky top-0 z-30 flex h-16 min-w-0 max-w-full items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl sm:h-20 sm:px-8">
          {/* Hamburger — mobile only */}
          <button
            className="grid size-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-700 shadow-sm lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Search bar — hidden on tiny screens, shown sm+ */}
          <div className="hidden min-w-0 flex-1 sm:block sm:max-w-lg">
            <HeaderSearch />
          </div>

          <div className="hidden h-8 w-px bg-slate-200 xl:block" />
          <div className="hidden min-w-0 xl:block">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Current workspace</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">{activeItem?.label ?? "MobiusEMS"}</p>
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <NotificationsPopover />
            <div className="ml-1 hidden text-right sm:block">
              <p className="text-xs font-semibold text-ink">{user?.name}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{user?.role.replaceAll("_", " ")}</p>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              disabled={logout.isPending}
              className="ml-1 grid size-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
              onClick={() => logout.mutate()}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Mobile search bar — shown only below sm */}
        <div className="border-b bg-white px-4 py-2 sm:hidden">
          <HeaderSearch />
        </div>

        {/* Page content */}
        <Outlet />
        <MobiusEmsAiFloating />
      </div>
    </div>
  );
};


