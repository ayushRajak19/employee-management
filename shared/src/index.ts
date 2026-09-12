export const ROLES = ["SUPER_ADMIN", "HR_ADMIN", "DEPARTMENT_HEAD", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "APPLICANT"] as const;
export type RoleName = (typeof ROLES)[number];

export const SECTION_ACCESS = [
  { key: "section.dashboard", label: "Dashboard", group: "Overview" },
  { key: "section.ai_workspace", label: "AI Workspace", group: "Overview" },
  { key: "section.attendance", label: "Attendance", group: "People operations" },
  { key: "section.people_ops", label: "Leave & recognition", group: "People operations" },
  { key: "section.profile", label: "My profile", group: "People operations" },
  { key: "section.employees", label: "Employees", group: "People" },
  { key: "section.organization", label: "Organization", group: "People" },
  { key: "section.employee_map", label: "Employee map", group: "People" },
  { key: "section.sales", label: "Sales", group: "Sales" },
  { key: "section.skills", label: "Skills", group: "Capability" },
  { key: "section.skill_matrix", label: "Skill matrix", group: "Capability" },
  { key: "section.assessments", label: "Assessments", group: "Capability" },
  { key: "section.work", label: "Tasks & projects", group: "Work" },
  { key: "section.task_tracker", label: "Task tracker", group: "Work" },
  { key: "section.performance", label: "Goals & performance", group: "Performance" },
  { key: "section.contribution", label: "Contribution", group: "Performance" },
  { key: "section.development", label: "Learning & training", group: "Development" },
  { key: "section.resumes", label: "Resume library", group: "Records" },
  { key: "section.applicants", label: "Applicants", group: "Records" },
  { key: "section.resume_screener", label: "Resume screener", group: "Records" },
  { key: "section.governance", label: "Documents & audit", group: "Records" },
  { key: "section.email_automation", label: "Email automation", group: "Administration" },
] as const;
export type SectionPermissionName = (typeof SECTION_ACCESS)[number]["key"];
export const SECTION_PERMISSIONS = SECTION_ACCESS.map((section) => section.key) as unknown as readonly [SectionPermissionName, ...SectionPermissionName[]];

export const PERMISSIONS = [
  "employee.view", "employee.create", "employee.update", "employee.deactivate",
  "department.view", "department.create", "department.update",
  "skill.create", "skill.update", "skill.verify", "skill.reject",
  "task.create", "task.assign", "task.update", "task.review",
  "performance.view", "performance.review", "goal.create", "goal.update",
  "kpi.create", "kpi.evaluate", "document.view", "document.upload",
  "report.view", "audit.view", "settings.manage",
  "sales.view.self", "sales.view.team", "sales.view.all",
  "sales.analytics.self", "sales.analytics.team", "sales.analytics.all",
  "sales.lead.manage.self", "sales.lead.manage.team", "sales.lead.manage.all",
  "sales.territory.view", "sales.territory.manage", "sales.territory.create.self", "sales.geography.create.self",
  "sales.target.view", "sales.target.manage", "sales.customer.view", "sales.customer.manage.self", "sales.customer.manage.team", "sales.customer.manage.all",
  "sales.pipeline.view", "sales.pipeline.manage", "sales.revenue.view",
  "sales.revenue.manage",
  "sales.channel_partner.view", "sales.channel_partner.manage", "sales.channel_partner.manage.self", "sales.configuration.manage",
  "employee_map.self", "employee_map.team", "employee_map.all",
  "sales.map.self", "sales.map.team", "sales.map.all",
  ...SECTION_PERMISSIONS,
] as const;
export type PermissionName = (typeof PERMISSIONS)[number];

export const CAPABILITIES = ["SALES_MODULE"] as const;
export type CapabilityName = (typeof CAPABILITIES)[number];

const HR_SALES_PERMISSIONS: readonly PermissionName[] = [
  "sales.view.all", "sales.analytics.all", "sales.territory.view", "sales.target.view",
  "sales.customer.view", "sales.pipeline.view", "sales.revenue.view", "sales.channel_partner.view",
  "employee_map.all", "sales.map.all",
];
const TEAM_SALES_PERMISSIONS: readonly PermissionName[] = [
  "sales.view.self", "sales.view.team", "sales.analytics.self", "sales.analytics.team",
  "sales.lead.manage.self", "sales.lead.manage.team", "sales.territory.view", "sales.territory.manage", "sales.target.view", "sales.target.manage",
  "sales.customer.view", "sales.customer.manage.self", "sales.customer.manage.team", "sales.pipeline.view", "sales.pipeline.manage", "sales.revenue.view",
  "sales.channel_partner.view", "sales.channel_partner.manage.self", "employee_map.team", "sales.map.team",
];
const SELF_SALES_PERMISSIONS: readonly PermissionName[] = [
  "sales.view.self", "sales.analytics.self", "sales.lead.manage.self",
  "sales.target.view", "sales.customer.view", "sales.customer.manage.self", "sales.pipeline.view", "sales.pipeline.manage",
  "sales.revenue.view", "sales.channel_partner.view", "sales.channel_partner.manage.self", "employee_map.self", "sales.map.self",
];

export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionName[]> = {
  SUPER_ADMIN: PERMISSIONS,
  HR_ADMIN: [...PERMISSIONS.filter((permission) => !permission.startsWith("section.") && !["settings.manage", "skill.verify"].includes(permission) && !permission.startsWith("sales.") && !permission.startsWith("employee_map.")), ...HR_SALES_PERMISSIONS, ...SECTION_PERMISSIONS.filter((permission) => !["section.attendance", "section.profile", "section.task_tracker", "section.resumes", "section.resume_screener", "section.email_automation"].includes(permission))],
  DEPARTMENT_HEAD: ["employee.view", "department.view", "skill.verify", "task.create", "task.assign", "task.update", "task.review", "performance.view", "performance.review", "goal.create", "goal.update", "kpi.evaluate", "document.view", "report.view", ...TEAM_SALES_PERMISSIONS, ...SECTION_PERMISSIONS.filter((permission) => !["section.attendance", "section.profile", "section.task_tracker", "section.resumes", "section.applicants", "section.resume_screener", "section.email_automation"].includes(permission))],
  MANAGER: ["employee.view", "department.view", "task.create", "task.assign", "task.update", "task.review", "performance.view", "performance.review", "goal.create", "goal.update", "kpi.evaluate", "document.view", "report.view", ...TEAM_SALES_PERMISSIONS, ...SECTION_PERMISSIONS.filter((permission) => !["section.attendance", "section.profile", "section.task_tracker", "section.resumes", "section.applicants", "section.resume_screener", "section.email_automation"].includes(permission))],
  TEAM_LEAD: ["employee.view", "department.view", "task.create", "task.assign", "task.update", "task.review", "performance.view", "performance.review", "goal.create", "goal.update", "document.view", "report.view", ...TEAM_SALES_PERMISSIONS, ...SECTION_PERMISSIONS.filter((permission) => !["section.attendance", "section.profile", "section.task_tracker", "section.resumes", "section.applicants", "section.resume_screener", "section.email_automation"].includes(permission))],
  EMPLOYEE: ["employee.view", "department.view", "task.update", "performance.view", "goal.update", "document.view", "document.upload", ...SELF_SALES_PERMISSIONS, ...SECTION_PERMISSIONS.filter((permission) => !["section.employees", "section.organization", "section.skill_matrix", "section.applicants", "section.resume_screener", "section.email_automation"].includes(permission))],
  APPLICANT: ["section.assessments"]
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  isPlatformAdmin: boolean;
  role: RoleName;
  permissions: PermissionName[];
  capabilities: CapabilityName[];
  forcePasswordChange: boolean;
  onboardingComplete: boolean;
}

export interface ApiResponse<T> { success: boolean; message: string; data?: T; errors?: Record<string, string[]> }

export type SalesScopeLevel = "SELF" | "TEAM" | "ALL";
export type OpportunityBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SalesTrendPoint { _id: string; revenue: number }
export interface SalesAnalytics {
  generatedAt: string;
  scope: SalesScopeLevel;
  period: { start: string; end: string };
  currency: string;
  targetRevenue: number;
  actualRevenue: number;
  targetAchievement: number;
  leadCount: number;
  qualifiedLeadCount: number;
  convertedLeadCount: number;
  conversionRate: number;
  customerCount: number;
  pipelineValue: number;
  weightedPipeline: number;
  employeeCount: number;
  channelPartnerCount: number;
  avgFirstResponseMinutes: number;
  delayedLeadCount: number;
  currentLeadLoad: number;
  configuredLeadCapacity: number;
  requiredHeadcount: number;
  activeHeadcount: number;
  headcountGap: number;
  capacityUtilization: number;
  coveragePercentage: number;
  leadDemandScore: number;
  coverageGapScore: number;
  customerWhiteSpaceScore: number;
  pipelinePotentialScore: number;
  growthScore: number;
  conversionPotentialScore: number;
  opportunityScore: number;
  opportunityBand: OpportunityBand;
  estimatedLostConversions: number;
  estimatedOpportunityLost: number;
  isEstimate: true;
  trend?: SalesTrendPoint[];
}

export interface GeoNodeDto {
  _id: string;
  name: string;
  code: string;
  type: "GLOBAL" | "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "AREA" | "PINCODE";
  parent?: string;
  ancestors: string[];
  depth: number;
  location?: { type: "Point"; coordinates: [number, number] };
  children?: string[];
}

export interface SalesEmployeeDto {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: { _id: string; name: string; code: string };
  designation?: { _id: string; name: string; code: string };
  reportingManager?: { _id: string; firstName: string; lastName: string; employeeId: string };
  workLocation?: { geoNode?: string; coordinates?: { type: "Point"; coordinates: [number, number] } };
}

export type CapacityStatus = "HEALTHY" | "APPROACHING" | "CRITICAL";

export interface GeographicRollupNode {
  _id: string;
  name: string;
  code: string;
  type: "GLOBAL" | "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "AREA" | "PINCODE" | "TERRITORY";
  depth: number;
  parent?: string;
  ancestors: string[];
  location?: { type: "Point"; coordinates: [number, number] };
  assignedTarget: number;
  actualRevenue: number;
  targetPacingPercentage: number;
  pipelineValue: number;
  leadCount: number;
  leadConversionRate: number;
  customerCount: number;
  activeHeadcount: number;
  channelPartnerCount: number;
  configuredCapacityPerRep: number;
  requiredHeadcount: number;
  headcountGap: number;
  isCapacityBottleneck: boolean;
  estimatedOpportunityLost: number;
  whiteSpaceRecommendation: string;
  capacityUtilization: number;
  capacityStatus: CapacityStatus;
  managerName?: string;
  territoryCount?: number;
}

export interface GeographicAnalyticsResponse extends SalesAnalytics {
  node: GeographicRollupNode;
  children: GeographicRollupNode[];
  ancestors: Array<{ _id: string; name: string; code: string; type: string }>;
  hierarchyLevel: "GLOBAL" | "COUNTRY" | "STATE" | "DISTRICT" | "CITY" | "AREA" | "PINCODE" | "TERRITORY";
  territories?: Array<{ _id: string; name: string; code: string; managerName?: string; activeHeadcount: number }>;
}

export type HeatmapPointTuple = [number, number, number]; // [lat, lng, intensity]

export interface HeatmapPointsResponse {
  type: "leads" | "customers";
  points: HeatmapPointTuple[];
}
