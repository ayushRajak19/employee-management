import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { LandingPage } from "@/pages/LandingPage";
import { OnboardingRoute, PasswordChangeRoute, PermissionRoute, PlatformRoute, ProtectedRoute, RoleRoute } from "@/routes/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const SolutionsIndexPage = lazy(() => import("@/pages/SolutionsPage").then((module) => ({ default: module.SolutionsIndexPage })));
const SolutionDetailPage = lazy(() => import("@/pages/SolutionsPage").then((module) => ({ default: module.SolutionDetailPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage").then((module) => ({ default: module.ChangePasswordPage })));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage").then((module) => ({ default: module.OnboardingPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const EmployeesPage = lazy(() => import("@/pages/EmployeesPage").then((module) => ({ default: module.EmployeesPage })));
const EmployeeProfilePage = lazy(() => import("@/pages/EmployeeProfilePage").then((module) => ({ default: module.EmployeeProfilePage })));
const OrganizationPage = lazy(() => import("@/pages/OrganizationPage").then((module) => ({ default: module.OrganizationPage })));
const SkillsPage = lazy(() => import("@/pages/SkillsRoutePage").then((module) => ({ default: module.SkillsRoutePage })));
const SkillMatrixPage = lazy(() => import("@/pages/SkillMatrixPage").then((module) => ({ default: module.SkillMatrixPage })));
const AssessmentsPage = lazy(() => import("@/pages/AssessmentsPage").then((module) => ({ default: module.AssessmentsPage })));
const WorkPage = lazy(() => import("@/pages/WorkPage").then((module) => ({ default: module.WorkPage })));
const PerformancePage = lazy(() => import("@/pages/PerformancePage").then((module) => ({ default: module.PerformancePage })));
const DevelopmentPage = lazy(() => import("@/pages/DevelopmentPage").then((module) => ({ default: module.DevelopmentPage })));
const GovernancePage = lazy(() => import("@/pages/GovernancePage").then((module) => ({ default: module.GovernancePage })));
const ResumesPage = lazy(() => import("@/pages/ResumesPage").then((module) => ({ default: module.ResumesPage })));
const ApplicantsPage = lazy(() => import("@/pages/ApplicantsPage").then((module) => ({ default: module.ApplicantsPage })));
const ResumeScreenerPage = lazy(() => import("@/pages/ResumeScreenerPage").then((module) => ({ default: module.ResumeScreenerPage })));
const PeopleOpsPage = lazy(() => import("@/pages/PeopleOpsPage").then((module) => ({ default: module.PeopleOpsPage })));
const MyProfilePage = lazy(() => import("@/pages/MyProfilePage").then((module) => ({ default: module.MyProfilePage })));
const AdministratorsPage = lazy(() => import("@/pages/AdministratorsPage").then((module) => ({ default: module.AdministratorsPage })));
const EmailAutomationPage = lazy(() => import("@/pages/EmailAutomationPage").then((module) => ({ default: module.EmailAutomationPage })));
const AttendancePage = lazy(() => import("@/pages/AttendancePage").then((module) => ({ default: module.AttendancePage })));
const ContributionPage = lazy(() => import("@/pages/ContributionPage").then((module) => ({ default: module.ContributionPage })));
const AiWorkspacePage = lazy(() => import("@/pages/AiWorkspacePage").then((module) => ({ default: module.AiWorkspacePage })));
const TaskTrackerPage = lazy(() => import("@/pages/TaskTrackerPage").then((module) => ({ default: module.TaskTrackerPage })));
const TenantsPage = lazy(() => import("@/pages/TenantsPage").then((module) => ({ default: module.TenantsPage })));
const SalesDashboardPage = lazy(() => import("@/features/sales/pages/SalesDashboardPage").then((module) => ({ default: module.SalesDashboardPage })));
const GeographicSalesPage = lazy(() => import("@/features/sales/pages/GeographicSalesPage").then((module) => ({ default: module.GeographicSalesPage })));
const SalesTerritoriesPage = lazy(() => import("@/features/sales/pages/SalesTerritoriesPage").then((module) => ({ default: module.SalesTerritoriesPage })));
const SalesDataPage = lazy(() => import("@/features/sales/pages/SalesDataPage").then((module) => ({ default: module.SalesDataPage })));
const EmployeeMapPage = lazy(() => import("@/features/sales/pages/EmployeeMapPage").then((module) => ({ default: module.EmployeeMapPage })));
const SalesAgentsPage = lazy(() => import("@/features/sales/pages/SalesAgentsPage").then((module) => ({ default: module.SalesAgentsPage })));
const TargetPerformancePage = lazy(() => import("@/features/sales/pages/TargetPerformancePage").then((module) => ({ default: module.TargetPerformancePage })));

const PageLoader = () => <div className="space-y-4 p-8" aria-label="Loading page"><Skeleton className="h-9 w-64"/><Skeleton className="h-48 w-full"/><Skeleton className="h-48 w-full"/></div>;

export const App = () => <Suspense fallback={<PageLoader/>}><Routes>
  <Route path="/welcome" element={<LandingPage/>}/>
  <Route path="/solutions" element={<SolutionsIndexPage/>}/>
  <Route path="/solutions/:slug" element={<SolutionDetailPage/>}/>
  <Route path="/login" element={<LoginPage/>}/>
  <Route path="/register" element={<RegisterPage/>}/>
  <Route element={<PasswordChangeRoute/>}><Route path="/change-password" element={<ChangePasswordPage/>}/></Route>
  <Route element={<OnboardingRoute/>}><Route path="/onboarding" element={<OnboardingPage/>}/></Route>
  <Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>
    <Route index element={<DashboardPage/>}/><Route path="ai-workspace" element={<AiWorkspacePage/>}/><Route path="me" element={<MyProfilePage/>}/><Route path="employees/:id" element={<EmployeeProfilePage/>}/>
    <Route element={<RoleRoute roles={["SUPER_ADMIN","HR_ADMIN","DEPARTMENT_HEAD","MANAGER"]}/>}> <Route path="employees" element={<EmployeesPage/>}/><Route path="organization" element={<OrganizationPage/>}/><Route path="skill-matrix" element={<SkillMatrixPage/>}/></Route>
    <Route path="skills" element={<SkillsPage/>}/>
    <Route path="assessments" element={<AssessmentsPage/>}/><Route path="work" element={<WorkPage/>}/><Route path="attendance" element={<AttendancePage/>}/><Route path="performance" element={<PerformancePage/>}/><Route path="contribution" element={<ContributionPage/>}/>
    <Route element={<RoleRoute roles={["SUPER_ADMIN","EMPLOYEE"]}/>}> <Route path="task-tracker" element={<TaskTrackerPage/>}/></Route>
    <Route path="development" element={<DevelopmentPage/>}/><Route path="governance" element={<GovernancePage/>}/><Route element={<RoleRoute roles={["SUPER_ADMIN","EMPLOYEE"]}/>}> <Route path="resumes" element={<ResumesPage/>}/></Route><Route element={<RoleRoute roles={["SUPER_ADMIN","HR_ADMIN"]}/>}> <Route path="applicants" element={<ApplicantsPage/>}/></Route><Route path="people-ops" element={<PeopleOpsPage/>}/><Route element={<RoleRoute roles={["SUPER_ADMIN"]}/>}> <Route path="resume-screener" element={<ResumeScreenerPage/>}/><Route path="administrators" element={<AdministratorsPage/>}/><Route path="email-automation" element={<EmailAutomationPage/>}/></Route><Route element={<PlatformRoute/>}><Route path="platform/tenants" element={<TenantsPage/>}/></Route>
    <Route element={<PermissionRoute permissions={["sales.analytics.self","sales.analytics.team","sales.analytics.all"]}/>}> <Route path="sales" element={<SalesDashboardPage/>}/></Route>
    <Route element={<RoleRoute roles={["EMPLOYEE"]}/>}> <Route element={<PermissionRoute permissions={["sales.analytics.self"]}/>}> <Route path="sales/my-target" element={<TargetPerformancePage/>}/></Route></Route>
    <Route element={<PermissionRoute permissions={["sales.map.self","sales.map.team","sales.map.all"]}/>}> <Route path="sales/geography" element={<GeographicSalesPage/>}/></Route>
    <Route element={<PermissionRoute permissions={["sales.territory.view"]}/>}> <Route path="sales/territories" element={<SalesTerritoriesPage/>}/></Route>
    <Route element={<PermissionRoute permissions={["sales.view.self","sales.view.team","sales.view.all"]}/>}> <Route path="sales/employees" element={<SalesAgentsPage/>}/><Route path="sales/leads" element={<SalesDataPage path="leads" title="Leads"/>}/><Route path="sales/customers" element={<SalesDataPage path="customers" title="Customers"/>}/><Route path="sales/pipeline" element={<Navigate to="/sales/leads" replace/>}/><Route path="sales/targets" element={<SalesDataPage path="targets" title="Targets"/>}/><Route path="sales/revenue" element={<SalesDataPage path="revenue" title="Revenue"/>}/><Route path="sales/channel-partners" element={<SalesDataPage path="channel-partners" title="Channel partners"/>}/></Route>
    <Route element={<PermissionRoute permissions={["employee_map.self","employee_map.team","employee_map.all"]}/>}> <Route path="employee-map" element={<EmployeeMapPage/>}/></Route>
  </Route></Route>
  <Route path="*" element={<div className="grid min-h-screen place-items-center"><p>Page not found</p></div>}/>
</Routes></Suspense>;
