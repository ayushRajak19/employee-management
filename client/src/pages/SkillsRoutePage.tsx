import { useAuth } from "@/features/auth/AuthProvider";
import { RoleSkillsAssessment } from "@/features/skills/RoleSkillsAssessment";
import { SkillsPage } from "@/pages/SkillsPage";

export const SkillsRoutePage = () => {
  const { user } = useAuth();
  return user?.role === "EMPLOYEE" ? <RoleSkillsAssessment/> : <SkillsPage/>;
};
