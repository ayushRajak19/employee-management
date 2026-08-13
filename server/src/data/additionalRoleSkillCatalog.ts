export interface AdditionalCatalogSkill {
  id: string; role: string; level: "Basic" | "Intermediate" | "Advanced"; category: string;
  name: string; tools: string; description: string; assessmentQuestion: string;
}
type RoleSpec = { prefix: string; category: string; tools: string; topics: readonly string[] };

const roleSpecs: Record<string, RoleSpec> = {
  "Executive Assistant": { prefix: "EXA", category: "Executive Support", tools: "Google Workspace, Microsoft 365, Notion", topics: [
    "Executive calendar prioritization", "Inbox triage and response drafting", "Meeting scheduling and logistics", "Meeting minutes and action tracking", "Multi-city travel planning", "Expense reporting and reconciliation", "Confidential information handling", "Stakeholder communication", "Executive briefing preparation", "Business document drafting", "Follow-up and deadline control", "Multi-time-zone coordination", "Access and gatekeeping judgment", "Executive event coordination", "Vendor and service coordination", "Cross-functional project tracking", "Board and leadership meeting packs", "Presentation preparation", "Spreadsheet reporting", "Administrative workflow automation", "Crisis calendar management", "Relationship and protocol management", "Executive support SOPs", "Budget and purchase tracking", "Professional discretion and compliance"
  ] },
  "Office Administration": { prefix: "OFA", category: "Office Operations", tools: "Microsoft 365, Google Workspace, Zoho, asset registers", topics: [
    "Front-desk operations", "Facilities coordination", "Vendor onboarding and management", "Office supply inventory", "Asset register maintenance", "Meeting-room and resource booking", "Visitor and access management", "Mail and courier administration", "Employee travel desk operations", "Internal event logistics", "Physical and digital record keeping", "Petty-cash reconciliation", "Invoice verification and routing", "Workplace health and safety", "Preventive maintenance scheduling", "Security and access-control coordination", "Housekeeping service management", "Contract and renewal tracking", "Procurement comparison and ordering", "Licences and insurance tracking", "Emergency response coordination", "Workspace and seating planning", "Vendor SLA monitoring", "Administration reporting", "Office policies and SOPs"
  ] },
  "Dynamic Associate": { prefix: "DYA", category: "Business Support", tools: "Google Workspace, Excel, CRM, project tools", topics: [
    "Rapid learning and adaptability", "Structured problem solving", "Professional written communication", "Business research", "Spreadsheet fundamentals", "Document preparation", "Presentation support", "Task prioritization", "Cross-functional coordination", "CRM record maintenance", "Accurate data entry", "Customer-query handling", "Sales-team support", "Operations-team support", "Marketing-campaign support", "Meeting notes and actions", "Follow-up discipline", "Process documentation", "Quality checking", "Time and workload management", "Knowledge-base maintenance", "Ownership and initiative", "Risk identification and escalation", "Stakeholder service mindset", "Routine-work automation"
  ] },
  "Digital Marketing Manager": { prefix: "DMM", category: "Digital Marketing", tools: "GA4, Google Ads, Meta Ads, Search Console, HubSpot", topics: [
    "Digital marketing strategy", "Audience personas and segmentation", "Search-engine optimization", "Paid-search campaign management", "Content marketing planning", "Organic social-media strategy", "Email marketing", "Marketing automation", "Paid social-media campaigns", "Campaign analytics", "GA4 measurement design", "Channel attribution", "Conversion-rate optimization", "Landing-page optimization", "A/B testing", "Media budget allocation", "Creative-brief development", "Influencer and creator programs", "Brand governance", "Full-funnel campaign planning", "Digital lead generation", "CRM and lifecycle marketing", "Competitor digital analysis", "Executive campaign reporting", "Privacy and consent compliance"
  ] },
  "Market Analyst": { prefix: "MKA", category: "Market Intelligence", tools: "Excel, Power BI, survey tools, SQL", topics: [
    "Market-research design", "TAM SAM SOM estimation", "Customer segmentation", "Competitor intelligence", "Survey design", "Customer interviews", "Secondary research", "Research-data cleaning", "Advanced spreadsheet analysis", "SQL for market data", "Descriptive statistics", "Market-trend analysis", "Pricing research", "Customer-behaviour analysis", "Product-market-fit analysis", "Demand forecasting", "Channel analysis", "Brand tracking", "Conjoint and preference analysis", "Market dashboards", "Insight synthesis", "Executive storytelling", "Research-vendor management", "Research ethics and privacy", "Evidence-based recommendations"
  ] },
  "Business Development Executive": { prefix: "BDE2", category: "Business Development", tools: "CRM, LinkedIn Sales Navigator, Apollo, email", topics: [
    "Prospect identification", "Ideal-customer-profile application", "Account research", "Multichannel outreach", "Cold calling", "Cold email writing", "LinkedIn prospecting", "Discovery conversations", "Lead qualification", "CRM hygiene", "Pipeline management", "Proposal preparation", "Objection handling", "Commercial negotiation", "Product demonstrations", "Relationship development", "Follow-up cadence", "Partnership identification", "Sales forecasting", "Target management", "Competitive positioning", "Qualified opportunity handoff", "Contract-process coordination", "Activity and conversion reporting", "Territory planning"
  ] },
  "Sales Development Representative": { prefix: "SDR2", category: "Sales Development", tools: "CRM, Outreach, Apollo, LinkedIn Sales Navigator", topics: [
    "Lead sourcing", "Contact enrichment", "ICP-based prioritization", "Personalized cold email", "Cold-call opening", "Social selling", "Outbound sequence execution", "Discovery-question basics", "BANT and needs qualification", "Early-stage objection handling", "Meeting booking", "CRM activity logging", "Cadence management", "Email deliverability", "Messaging A/B tests", "Intent-data prioritization", "Inbound-lead response", "Persistent follow-up", "AE opportunity handoff", "Activity KPI management", "Stage-conversion analysis", "Product knowledge", "Competitor talk tracks", "Daily time management", "Call review and coaching"
  ] },
  "Inside Sales": { prefix: "INS", category: "Inside Sales", tools: "CRM, video conferencing, dialer, quoting tools", topics: [
    "Product and solution knowledge", "Inbound-lead handling", "Outbound prospecting", "Consultative selling", "Needs discovery", "Remote product demonstrations", "Virtual presentation skills", "Objection handling", "Quotation preparation", "Pricing communication", "Cross-sell and upsell", "Remote closing", "Follow-up management", "CRM hygiene", "Pipeline discipline", "Sales forecasting", "Monthly target planning", "Customer retention conversations", "Phone and email communication", "Commercial negotiation", "Sales compliance", "Competitive positioning", "Conversion analytics", "Sales and delivery collaboration", "Remote sales-tool proficiency"
  ] },
  "Sales Operations Manager": { prefix: "SOM", category: "Sales Operations", tools: "Salesforce, HubSpot, Excel, Power BI", topics: [
    "CRM administration", "Pipeline-stage governance", "Sales-data quality", "Lead-routing design", "Territory management", "Quota planning", "Forecasting methodology", "Sales dashboards", "Incentive and commission operations", "Sales-process design", "Workflow automation", "Sales-tool administration", "Capacity and headcount planning", "Funnel analysis", "Conversion-rate analysis", "Sales SLA management", "Customer and account master data", "CRM integration coordination", "Sales enablement operations", "Process documentation", "Change management", "Sales audit and compliance", "Tool budget and vendor management", "Performance insight generation", "Executive sales reporting"
  ] },
  "Business Development Manager": { prefix: "BDM2", category: "Business Development Management", tools: "CRM, market intelligence, proposal and finance tools", topics: [
    "Business-development strategy", "New-market expansion", "ICP and segment strategy", "Strategic account planning", "Partnership development", "Executive networking", "High-value prospecting", "Consultative discovery", "Value-proposition design", "Business-case financials", "Complex proposal leadership", "Commercial negotiation", "Contract coordination", "Pipeline governance", "Revenue forecasting", "Team coaching", "Territory planning", "Key-account development", "Senior stakeholder management", "Cross-functional deal leadership", "Competitive strategy", "Pricing strategy", "Deal-risk management", "Revenue-target ownership", "Leadership reporting"
  ] },
  "SaaS Sales Executive": { prefix: "SAE", category: "SaaS Sales", tools: "CRM, product demo tools, Gong, CPQ", topics: [
    "SaaS business metrics", "SaaS discovery", "Product demonstration", "Solution selling", "Use-case mapping", "Opportunity qualification", "Account multi-threading", "Champion development", "Security-questionnaire coordination", "ROI and value modelling", "SaaS proposal writing", "Subscription pricing", "SaaS contract basics", "SaaS objection handling", "Commercial negotiation", "Opportunity closing", "CRM hygiene", "Pipeline coverage", "Forecast accuracy", "Renewal and expansion awareness", "Customer-success handoff", "Product-feedback capture", "Competitive differentiation", "Quota attainment planning", "Sales-technology utilization"
  ] },
  "Enterprise Business Development": { prefix: "EBD", category: "Enterprise Growth", tools: "CRM, ABM platforms, RFP tools, financial modelling", topics: [
    "Enterprise account targeting", "Enterprise account research", "Account-based marketing coordination", "Organization and influence mapping", "Executive outreach", "Enterprise multi-threading", "Complex discovery", "Enterprise solution alignment", "Executive business-case development", "RFP and RFI response", "Security and procurement coordination", "Legal-process coordination", "Enterprise commercial modelling", "Enterprise negotiation", "Strategic partnership design", "Long-cycle deal management", "Enterprise pipeline governance", "Enterprise forecast management", "Multi-stakeholder alignment", "Executive presentations", "Proof-of-concept coordination", "Enterprise deal-risk management", "Global and territory strategy", "Land-and-expand planning", "Enterprise account governance"
  ] }
};

const levelFor = (index: number): AdditionalCatalogSkill["level"] => index < 8 ? "Basic" : index < 17 ? "Intermediate" : "Advanced";
export const additionalRoleSkillCatalog: AdditionalCatalogSkill[] = Object.entries(roleSpecs).flatMap(([role, spec]) => {
  if (spec.topics.length !== 25) throw new Error(`${role} must define exactly 25 assessment topics`);
  return spec.topics.map((name, index) => ({ id: `${spec.prefix}-${String(index + 1).padStart(3, "0")}`, role, level: levelFor(index), category: spec.category, name, tools: spec.tools, description: `Apply ${name.toLowerCase()} effectively in the responsibilities of a ${role}.`, assessmentQuestion: `Describe a real work situation where you used ${name.toLowerCase()} as a ${role}. What did you do, which evidence shows the result, and what would you improve?` }));
});

export const additionalDesignationPresets = [
  { name: "Executive Assistant", code: "EXECA", department: "Administration", catalogRole: "Executive Assistant" },
  { name: "Office Administration", code: "OFFADM", department: "Administration", catalogRole: "Office Administration" },
  { name: "Dynamic Associate", code: "DYNASC", department: "Administration", catalogRole: "Dynamic Associate" },
  { name: "Digital Marketing Manager", code: "DGMKT", department: "Marketing", catalogRole: "Digital Marketing Manager" },
  { name: "Market Analyst", code: "MKTAN", department: "Marketing", catalogRole: "Market Analyst" },
  { name: "Business Development Executive", code: "BDEX", department: "Sales", catalogRole: "Business Development Executive" },
  { name: "Sales Development Representative", code: "SDREP", department: "Sales", catalogRole: "Sales Development Representative" },
  { name: "Inside Sales", code: "INSALE", department: "Sales", catalogRole: "Inside Sales" },
  { name: "Sales Operations Manager", code: "SLSOPS", department: "Sales", catalogRole: "Sales Operations Manager" },
  { name: "Business Development Manager", code: "BDEVM", department: "Sales", catalogRole: "Business Development Manager" },
  { name: "SaaS Sales Executive", code: "SAASE", department: "Sales", catalogRole: "SaaS Sales Executive" },
  { name: "Enterprise Business Development", code: "ENTBD", department: "Sales", catalogRole: "Enterprise Business Development" }
] as const;
