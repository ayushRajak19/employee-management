import { useEffect, useState, type ComponentType } from "react";
import logoMark from "@/assets/mobius-mark.png";
import { useMutation } from "@tanstack/react-query";
import type { CapabilityName, PermissionName, RoleName, SectionPermissionName } from "@mobius-ems/shared";
import {
  Award, BarChart3, Bot, BrainCircuit, BriefcaseBusiness, Building2, CalendarCheck2,
  ChevronLeft, CircleGauge, FileText, GraduationCap, ListTodo, LogOut, Menu,
  MailPlus, MapPinned, Route, ShieldCheck, Sparkles, Target, TrendingUp, UserCog, UserRound, Users, X,
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
  icon: ComponentType<{ size?: number }>;
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
  { label: "Overview", items: [
    { label: "Dashboard", icon: CircleGauge, path: "/", section: "section.dashboard" },
  ] },
  {
    label: "People operations", items: [
      { label: "Attendance", icon: CalendarCheck2, path: "/attendance", section: "section.attendance" },
      { label: "Leave & recognition", icon: Users, path: "/people-ops", section: "section.people_ops" },
    ],
  },
  { label: "My workspace", items: [
    { label: "AI Workspace", icon: Bot, path: "/ai-workspace", section: "section.ai_workspace" },
    { label: "My profile", icon: UserRound, path: "/me", section: "section.profile" },
  ] },
  {
    label: "People", items: [
      { label: "Employees", icon: Users, path: "/employees", section: "section.employees" },
      { label: "Organization", icon: Building2, path: "/organization", section: "section.organization" },
      { label: "Employee map", icon: MapPinned, path: "/employee-map", permissions: ["employee_map.self", "employee_map.team", "employee_map.all"], section: "section.employee_map" },
    ],
  },
  {
    label: "Sales setup", items: [
      { label: "Territories (ownership)", icon: Route, path: "/sales/territories", permission: "sales.territory.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Sales employees", icon: Users, path: "/sales/employees", permissions: ["sales.view.team", "sales.view.all"], capability: "SALES_MODULE", section: "section.sales" },
    ],
  },
  {
    label: "Sales workflow", items: [
      { label: "Sales dashboard", icon: TrendingUp, path: "/sales", permissions: ["sales.analytics.self", "sales.analytics.team", "sales.analytics.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "Country sales & map", icon: MapPinned, path: "/sales/geography", permissions: ["sales.map.self", "sales.map.team", "sales.map.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "My target & performance", icon: Target, path: "/sales/my-target", permission: "sales.analytics.self", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Leads", icon: Users, path: "/sales/leads", permissions: ["sales.view.self", "sales.view.team", "sales.view.all"], capability: "SALES_MODULE", section: "section.sales" },
      { label: "Customers", icon: UserRound, path: "/sales/customers", permission: "sales.customer.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Targets", icon: Target, path: "/sales/targets", permission: "sales.target.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Revenue", icon: TrendingUp, path: "/sales/revenue", permission: "sales.revenue.view", capability: "SALES_MODULE", section: "section.sales" },
      { label: "Channel partners", icon: Building2, path: "/sales/channel-partners", permission: "sales.channel_partner.view", capability: "SALES_MODULE", section: "section.sales" },
    ],
  },
  {
    label: "Capability", items: [
      { label: "Skills", icon: Award, path: "/skills", section: "section.skills" },
      { label: "AI Skill Builder", icon: Sparkles, path: "/skills/builder", section: "section.skills" },
      { label: "Skill matrix", icon: BarChart3, path: "/skill-matrix", section: "section.skill_matrix" },
      { label: "Assessments", icon: ShieldCheck, path: "/assessments", section: "section.assessments" },
    ],
  },
  { label: "Work", items: [
    { label: "Tasks & projects", icon: BriefcaseBusiness, path: "/work", section: "section.work" },
    { label: "Task tracker", icon: ListTodo, path: "/task-tracker", section: "section.task_tracker" },
  ] },
  {
    label: "Performance", items: [
      { label: "Goals & performance", icon: Target, path: "/performance", section: "section.performance" },
      { label: "Contribution & support", icon: TrendingUp, path: "/contribution", section: "section.contribution" },
    ],
  },
  { label: "Development", items: [{ label: "Learning & training", icon: GraduationCap, path: "/development", section: "section.development" }] },
  {
    label: "Records", items: [
      { label: "Resume library", icon: FileText, path: "/resumes", section: "section.resumes" },
      { label: "Applicants", icon: Users, path: "/applicants", section: "section.applicants" },
      { label: "Resume screener", icon: BrainCircuit, path: "/resume-screener", section: "section.resume_screener" },
      { label: "Documents & reports", icon: FileText, path: "/governance", section: "section.governance" },
    ],
  },
  {
    label: "Administration", items: [
      { label: "Administrators", icon: UserCog, path: "/administrators", roles: superAdminRole },
      { label: "Email automation", icon: MailPlus, path: "/email-automation", section: "section.email_automation" },
      { label: "Vendor organizations", icon: Building2, path: "/platform/tenants", platformOnly: true },
      { label: "Access & audit", icon: ShieldCheck, path: "/governance", permission: "audit.view", section: "section.governance" },
    ],
  },
];

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [location.pathname]);

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

  const sidebar = (
    <aside
      className={cn(
        "flex h-full max-w-[86vw] flex-col border-r bg-white transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      {/* Sidebar header */}
      <div className="flex h-16 items-center border-b px-4 sm:h-20 sm:px-5">
        <img
          src={logoMark}
          alt="MobiusEMS"
          className="h-10 w-8 shrink-0 rounded-lg object-contain"
        />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="truncate text-sm font-semibold">MobiusEMS</p>
            <p className="truncate text-[11px] text-slate-400">{user?.tenantName ?? "Employee management"}</p>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          className="ml-auto hidden size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:grid"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((v) => !v)}
        >
          <ChevronLeft size={16} className={cn("transition", collapsed && "rotate-180")} />
        </button>
        {/* Mobile close button */}
        <button
          className="ml-auto grid size-8 place-items-center lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        {visibleGroups.map((group) => (
          <div className="mb-5" key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.path === location.pathname;
              return (
                <button
                  key={`${item.label}-${item.path}`}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  title={item.label}
                  className={cn(
                    "mb-1 flex h-10 w-full items-center rounded-xl px-3 text-sm transition",
                    active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon size={17} />
                  {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / logout */}
      <div className="space-y-2 border-t p-3">
        <div
          className={cn(
            "flex w-full items-center rounded-xl p-2 text-left",
            collapsed && "justify-center"
          )}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-semibold">
            {user?.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
          </div>
          {!collapsed && (
            <>
              <div className="ml-2.5 min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-400">{user?.role.replaceAll("_", " ")}</p>
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
            "flex h-10 w-full items-center rounded-xl px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60",
            collapsed && "justify-center px-0"
          )}
          onClick={() => logout.mutate()}
        >
          <LogOut size={17} />
          {!collapsed && <span className="ml-3">{logout.isPending ? "Signing out…" : "Sign out"}</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-full overflow-x-clip">
      {/* Desktop sidebar — fixed */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebar}
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
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        className={cn(
          "flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip transition-[margin] duration-200",
          collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 max-w-full items-center gap-2 border-b bg-[#f6f8f7]/90 px-4 backdrop-blur-xl sm:h-20 sm:gap-3 sm:px-8">
          {/* Hamburger — mobile only */}
          <button
            className="grid size-10 shrink-0 place-items-center rounded-xl border bg-white lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>

          {/* Search bar — hidden on tiny screens, shown sm+ */}
          <div className="hidden min-w-0 flex-1 sm:block sm:max-w-md">
            <HeaderSearch />
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <NotificationsPopover />
            <div className="ml-1 hidden text-right sm:block">
              <p className="text-xs font-semibold">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{user?.role.replaceAll("_", " ")}</p>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              disabled={logout.isPending}
              className="ml-1 grid size-10 shrink-0 place-items-center rounded-xl border bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
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


