import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { OnboardingRoute, PasswordChangeRoute, ProtectedRoute, RoleRoute } from "@/routes/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((module) => ({ default: module.LoginPage })));
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
const PeopleOpsPage = lazy(() => import("@/pages/PeopleOpsPage").then((module) => ({ default: module.PeopleOpsPage })));
const MyProfilePage = lazy(() => import("@/pages/MyProfilePage").then((module) => ({ default: module.MyProfilePage })));
const AdministratorsPage = lazy(() => import("@/pages/AdministratorsPage").then((module) => ({ default: module.AdministratorsPage })));
const AttendancePage = lazy(() => import("@/pages/AttendancePage").then((module) => ({ default: module.AttendancePage })));

const PageLoader = () => <div className="space-y-4 p-8" aria-label="Loading page"><Skeleton className="h-9 w-64"/><Skeleton className="h-48 w-full"/><Skeleton className="h-48 w-full"/></div>;

export const App = () => <Suspense fallback={<PageLoader/>}><Routes>
  <Route path="/login" element={<LoginPage/>}/>
  <Route element={<PasswordChangeRoute/>}><Route path="/change-password" element={<ChangePasswordPage/>}/></Route>
  <Route element={<OnboardingRoute/>}><Route path="/onboarding" element={<OnboardingPage/>}/></Route>
  <Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>
    <Route index element={<DashboardPage/>}/><Route path="me" element={<MyProfilePage/>}/><Route path="employees/:id" element={<EmployeeProfilePage/>}/>
    <Route element={<RoleRoute roles={["SUPER_ADMIN","HR_ADMIN","DEPARTMENT_HEAD","MANAGER"]}/>}> <Route path="employees" element={<EmployeesPage/>}/><Route path="organization" element={<OrganizationPage/>}/><Route path="skill-matrix" element={<SkillMatrixPage/>}/></Route>
    <Route path="skills" element={<SkillsPage/>}/>
    <Route path="assessments" element={<AssessmentsPage/>}/><Route path="work" element={<WorkPage/>}/><Route path="attendance" element={<AttendancePage/>}/><Route path="performance" element={<PerformancePage/>}/>
    <Route path="development" element={<DevelopmentPage/>}/><Route path="governance" element={<GovernancePage/>}/><Route element={<RoleRoute roles={["SUPER_ADMIN","EMPLOYEE"]}/>}> <Route path="resumes" element={<ResumesPage/>}/></Route><Route element={<RoleRoute roles={["SUPER_ADMIN","HR_ADMIN"]}/>}> <Route path="applicants" element={<ApplicantsPage/>}/></Route><Route path="people-ops" element={<PeopleOpsPage/>}/><Route element={<RoleRoute roles={["SUPER_ADMIN"]}/>}> <Route path="administrators" element={<AdministratorsPage/>}/></Route>
  </Route></Route>
  <Route path="*" element={<div className="grid min-h-screen place-items-center"><p>Page not found</p></div>}/>
</Routes></Suspense>;
