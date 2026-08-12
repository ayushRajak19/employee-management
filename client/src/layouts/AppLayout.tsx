import { useState, type ComponentType } from "react";
import { useMutation } from "@tanstack/react-query";
import type { PermissionName, RoleName } from "@mobiusbloom/shared";
import { Activity, BarChart3, BriefcaseBusiness, Building2, CalendarCheck2, ChevronLeft, CircleGauge, FileText, GraduationCap, LogOut, Menu, Settings, ShieldCheck, Sparkles, Target, UserCog, UserRound, Users, X } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { HeaderSearch } from "@/components/HeaderSearch";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { authApi } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

type NavItem = { label: string; icon: ComponentType<{ size?: number }>; path: string; roles?: RoleName[]; permission?: PermissionName };
const managementRoles: RoleName[] = ["SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "MANAGER"];
const employeeRole: RoleName[] = ["EMPLOYEE"];
const superAdminRole: RoleName[] = ["SUPER_ADMIN"];
const applicantRoles: RoleName[] = ["SUPER_ADMIN", "HR_ADMIN"];
const groups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", icon: CircleGauge, path: "/" }] },
  { label: "My workspace", items: [{ label: "My profile", icon: UserRound, path: "/me", roles: employeeRole }] },
  { label: "People", items: [{ label: "Employees", icon: Users, path: "/employees", roles: managementRoles }, { label: "Organization", icon: Building2, path: "/organization", roles: managementRoles }] },
  { label: "Capability", items: [{ label: "Skills", icon: Sparkles, path: "/skills" }, { label: "Skill matrix", icon: BarChart3, path: "/skill-matrix", roles: managementRoles }, { label: "Assessments", icon: ShieldCheck, path: "/assessments" }] },
  { label: "Work", items: [{ label: "Tasks & projects", icon: BriefcaseBusiness, path: "/work" }] },
  { label: "Performance", items: [{ label: "Goals & performance", icon: Target, path: "/performance", roles: employeeRole }, { label: "Goals, KPIs & reviews", icon: Activity, path: "/performance", roles: managementRoles }] },
  { label: "Development", items: [{ label: "Learning & training", icon: GraduationCap, path: "/development" }] },
  { label: "Records", items: [{ label: "My resume", icon: FileText, path: "/resumes", roles: employeeRole }, { label: "My documents", icon: FileText, path: "/governance", roles: employeeRole }, { label: "Applicants", icon: Users, path: "/applicants", roles: applicantRoles }, { label: "Resume library", icon: FileText, path: "/resumes", roles: superAdminRole }, { label: "Documents & reports", icon: FileText, path: "/governance", roles: managementRoles }] },
  { label: "People operations", items: [{ label: "My attendance", icon: CalendarCheck2, path: "/attendance", roles: employeeRole }, { label: "Attendance register", icon: CalendarCheck2, path: "/attendance", roles: superAdminRole }, { label: "Leave & recognition", icon: Users, path: "/people-ops", roles: employeeRole }, { label: "People operations", icon: Users, path: "/people-ops", roles: managementRoles }] },
  { label: "Administration", items: [{ label: "Administrators", icon: UserCog, path: "/administrators", roles: superAdminRole }, { label: "Access & audit", icon: ShieldCheck, path: "/governance", permission: "audit.view" }, { label: "Settings", icon: Settings, path: "/people-ops", permission: "settings.manage" }] }
];

export const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  const { user, setUser } = useAuth(); const location = useLocation(); const navigate = useNavigate();
  const logout = useMutation({ mutationFn: authApi.logout, onSettled: () => { setUser(null); navigate("/login", { replace: true }); } });
  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.filter((item) => (!item.roles || item.roles.includes(user!.role)) && (!item.permission || user!.permissions.includes(item.permission))) })).filter((group) => group.items.length);
  const sidebar = <aside className={cn("flex h-full flex-col border-r bg-white transition-[width] duration-200", collapsed ? "w-[76px]" : "w-[260px]")}>
    <div className="flex h-20 items-center border-b px-5"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white"><Sparkles size={18}/></div>{!collapsed && <div className="ml-3 overflow-hidden"><p className="truncate text-sm font-semibold">MobiusBloom</p><p className="text-[11px] text-slate-400">Employee intelligence</p></div>}<button className="ml-auto hidden size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}><ChevronLeft size={16} className={cn("transition", collapsed && "rotate-180")}/></button><button className="ml-auto grid size-8 place-items-center lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
    <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">{visibleGroups.map((group) => <div className="mb-5" key={group.label}>{!collapsed && <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">{group.label}</p>}{group.items.map((item) => { const Icon = item.icon; const active = item.path === location.pathname; return <button key={`${item.label}-${item.path}`} onClick={() => { navigate(item.path); setMobileOpen(false); }} title={item.label} className={cn("mb-1 flex h-10 w-full items-center rounded-xl px-3 text-sm transition", active ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-50", collapsed && "justify-center px-0")}><Icon size={17}/>{!collapsed && <span className="ml-3 truncate">{item.label}</span>}</button>; })}</div>)}</nav>
    <div className="border-t p-3"><button className={cn("flex w-full items-center rounded-xl p-2 text-left hover:bg-slate-50", collapsed && "justify-center")} onClick={() => logout.mutate()}><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-semibold">{user?.name.split(" ").map((part) => part[0]).slice(0,2).join("")}</div>{!collapsed && <><div className="ml-2.5 min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user?.name}</p><p className="truncate text-[10px] text-slate-400">{user?.role.replaceAll("_", " ")}</p></div><LogOut size={15} className="text-slate-400"/></>}</button></div>
  </aside>;
  return <div className="flex min-h-screen"><div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation backdrop" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/><div className="relative h-full w-[280px]">{sidebar}</div></div>}<div className={cn("flex min-w-0 flex-1 flex-col transition-[margin] duration-200", collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]")}><header className="sticky top-0 z-30 flex h-20 items-center border-b bg-[ff6f8f7]/90 px-5 backdrop-blur-xl sm:px-8"><button className="mr-3 grid size-10 place-items-center rounded-xl border bg-white lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={18}/></button><HeaderSearch/><div className="ml-auto flex items-center gap-2"><NotificationsPopover/><div className="ml-1 hidden text-right sm:block"><p className="text-xs font-semibold">{user?.name}</p><p className="text-[10px] text-slate-400">{user?.role.replaceAll("_", " ")}</p></div></div></header><Outlet/></div></div>;
};
