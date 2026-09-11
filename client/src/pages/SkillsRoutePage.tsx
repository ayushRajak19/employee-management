import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleSkillsAssessment } from "@/features/skills/RoleSkillsAssessment";
import { SkillsPage } from "@/pages/SkillsPage";

export const SkillsRoutePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (location.pathname.startsWith("/skills/builder")) {
    return <SkillsPage />;
  }
  return user?.role === "EMPLOYEE" ? <RoleSkillsAssessment/> : <SkillsPage/>;
};
