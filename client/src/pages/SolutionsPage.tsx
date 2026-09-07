import { useEffect, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Bot, BriefcaseBusiness, Check, FileSearch, Fingerprint, MailCheck, Mic, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import logo from "@/assets/mobius-mark.png";
import { useAuth } from "@/features/auth/AuthProvider";
import "./solutions.css";

type Solution = {
  slug: string;
  number: string;
  name: string;
  label: string;
  title: string;
  summary: string;
  features: string[];
  value: string;
  accent: string;
  soft: string;
  Icon: LucideIcon;
  visualTitle: string;
  visualRows: string[];
  visualMetric: string;
  visualMetricLabel: string;
};

const solutions: Solution[] = [
  { slug:"employee-360", number:"01", name:"Employee 360", label:"THE COMPLETE EMPLOYEE RECORD", title:"One person. One living story.", summary:"Connect every employee record to the work, growth, support, and progress happening around it—without hunting through separate systems.", features:["Personal and professional profiles","Organization placement and career timeline","Attendance, leave and recognition","Skills, goals, KPIs and training","Tasks, projects and performance history","Private documents and resumes"], value:"Every authorized team sees the right context. Every employee sees a record that grows with them.", accent:"#e8623c", soft:"#fff0e9", Icon:Users, visualTitle:"Employee story", visualRows:["Role & organization","Current work","Skills & growth","Contribution evidence"], visualMetric:"92%", visualMetricLabel:"PROFILE READINESS" },
  { slug:"work-attendance", number:"02", name:"Work & Attendance", label:"WORK, TIME, AND OWNERSHIP", title:"Know what is moving—and who needs help.", summary:"Bring delivery and attendance into one operating view, so managers understand commitments without resorting to invasive monitoring.", features:["Projects and task boards","Deadlines, blockers and workload alerts","Quality reviews, rework and completion evidence","Geofenced office check-in and check-out","Organization attendance register","Personal and organization task trackers"], value:"Live visibility for every employee—without screen, mouse, or webcam surveillance.", accent:"#136f63", soft:"#e6f3ef", Icon:BriefcaseBusiness, visualTitle:"Today’s operating pulse", visualRows:["Launch campaign · In review","Client onboarding · On track","Quarterly report · Needs support","18 of 21 checked in"], visualMetric:"86%", visualMetricLabel:"ON-TIME DELIVERY" },
  { slug:"skills-development", number:"03", name:"Skills & Development", label:"VERIFIED CAPABILITY", title:"Turn skills into a workforce advantage.", summary:"Move beyond self-declared skill lists. Connect role expectations, evidence, verification, learning, and staffing recommendations.", features:["Designation-based skill assessments","Skill claims with supporting evidence","Independent verification and assessment results","Verified skill matrix and organizational heatmaps","Role-gap and growth analysis","Training assignments and progress","Recommendations based on skill fit, availability and performance evidence"], value:"See capability clearly, close gaps deliberately, and staff work with explainable evidence.", accent:"#6557d9", soft:"#eeecff", Icon:Sparkles, visualTitle:"Capability map", visualRows:["Analysis · Verified","Planning · Growth target","Communication · Verified","Leadership · In development"], visualMetric:"14", visualMetricLabel:"VERIFIED SKILLS" },
  { slug:"performance-contribution", number:"04", name:"Performance & Contribution", label:"FAIRER PERFORMANCE CONTEXT", title:"Review the work—not the loudest story.", summary:"Build performance conversations from goals, outcomes, support, and evidence while keeping missing information separate from poor performance.", features:["Employee goals and configurable KPIs","Self reviews and manager reviews","Weekly outcome updates and support requests","Private one-to-one check-ins","Explainable performance and contribution snapshots","Department analytics and evidence-coverage reporting"], value:"Managers get clearer context. Employees get reviews grounded in visible outcomes and support.", accent:"#bd7a16", soft:"#fff5dc", Icon:Target, visualTitle:"Evidence coverage", visualRows:["Goals & KPIs · Ready","Weekly outcomes · Ready","Quality evidence · Ready","Manager context · Review"], visualMetric:"88%", visualMetricLabel:"EVIDENCE COVERAGE" },
  { slug:"mobius-ems-ai", number:"05", name:"MobiusEMS AI", label:"PERMISSION-AWARE INTELLIGENCE", title:"Ask the workplace. Get the next useful move.", summary:"MobiusEMS AI answers from current, permitted workforce data and helps organize evidence without taking employment decisions away from people.", features:["Answers permission-aware workforce questions","Works across dashboards, profiles, tasks and performance","Generates evidence-based contribution and performance reports","Identifies missing evidence without treating it as poor performance","Keeps promotion, salary, discipline and termination decisions with people"], value:"Immediate clarity from live records, with role boundaries and human judgment preserved.", accent:"#5142cb", soft:"#eceaff", Icon:Bot, visualTitle:"MobiusEMS AI", visualRows:["2 overdue tasks","1 review waiting","Operations workload above range","Suggested next actions"], visualMetric:"LIVE", visualMetricLabel:"GROUNDED ANSWERS" },
  { slug:"ai-recruitment", number:"06", name:"AI Recruitment", label:"ADVISORY CANDIDATE INTELLIGENCE", title:"Find documented fit. Keep hiring human.", summary:"Turn resume libraries and job requirements into transparent shortlists that show why a candidate matches—and what is missing.", features:["Extracts candidate name, role and location from resumes","Stores applicants in a searchable CV library","Screens multiple PDF or DOCX resumes against saved job descriptions","Ranks candidates by documented job fit","Shows matched and missing requirements with evidence","Treats every result as advisory for human review"], value:"Spend less time sorting files and more time evaluating qualified people with context.", accent:"#1478a3", soft:"#e7f5fb", Icon:FileSearch, visualTitle:"Candidate fit review", visualRows:["Requirements matched · 8","Evidence found · 12","Requirements missing · 2","Human review · Required"], visualMetric:"84%", visualMetricLabel:"DOCUMENTED FIT" },
  { slug:"voice-task-assistant", number:"07", name:"Voice Task Assistant", label:"MULTILINGUAL WORK CONTROL", title:"Say the work. Review it. Put it in motion.", summary:"Turn natural speech into editable task actions across English and ten Indian languages, with local transcription and confirmation before change.", features:["Creates, updates, starts, blocks and completes tasks through speech","Supports English and ten Indian languages","Calculates elapsed task time after a spoken start command","Shows an editable transcript before confirmation","Uses local Whisper transcription with no per-minute fee","Deletes recorded audio after transcription and keeps an audit history"], value:"Capture work at conversation speed without sacrificing accuracy, control, or privacy.", accent:"#d84b69", soft:"#ffeaf0", Icon:Mic, visualTitle:"Voice command preview", visualRows:["Transcript detected","2 assignees matched","Deadline interpreted","Ready for confirmation"], visualMetric:"11", visualMetricLabel:"SUPPORTED LANGUAGES" },
  { slug:"email-automation", number:"08", name:"Email Automation", label:"RESPONSIBLE OUTREACH", title:"Automate the follow-up. Respect the relationship.", summary:"Run personalized, consent-based vendor outreach with reusable workflows, delivery visibility, and automatic stopping conditions.", features:["Runs personalized Brevo outreach for consented vendor contacts","Supports reusable workflows and scheduled follow-ups","Stops after a reply, unsubscribe or delivery problem","Tracks accepted, delivered, opened, clicked, bounced and blocked emails","Provides contact status, workflow control and delivery history"], value:"Scale consistent outreach while keeping consent, deliverability, and conversation state visible.", accent:"#a84f19", soft:"#fff0df", Icon:MailCheck, visualTitle:"Outreach workflow", visualRows:["Introduction · Delivered","Follow-up · Scheduled","Reply received · Stopped","Delivery health · Clear"], visualMetric:"96%", visualMetricLabel:"DELIVERED" },
  { slug:"secure-operations", number:"09", name:"Secure Operations", label:"ENTERPRISE CONTROL", title:"Control the platform without slowing the people.", summary:"Protect sensitive employee information with identity, permissions, auditability, and strict separation between organizations.", features:["Invitation-only accounts and forced password replacement","Role-based permissions and administrator controls","In-app notifications, global search and structured reports","Private employee documents with authorized access","Immutable audit logs for sensitive actions","Isolated multi-organization workspaces with provisioning and suspension controls"], value:"Scalable administration with traceable sensitive actions and organization-level isolation.", accent:"#233e3a", soft:"#e8efec", Icon:Fingerprint, visualTitle:"Security posture", visualRows:["Role scope · Enforced","Private files · Authorized","Sensitive actions · Logged","Tenant isolation · Active"], visualMetric:"100%", visualMetricLabel:"TENANT ISOLATION" }
];

const MarketingHeader = () => {
  const { user } = useAuth();
  return <header className="sol-nav"><Link to="/welcome" className="sol-brand"><img src={logo} alt=""/><span>MobiusEMS</span><small>BY MOBIUS BLOOM</small></Link><nav><Link to="/solutions">All capabilities</Link><Link to="/solutions/employee-360">Employee intelligence</Link><Link to="/solutions/mobius-ems-ai">AI & automation</Link></nav><div><Link to={user ? "/" : "/login"}>{user ? "Workspace" : "Sign in"}</Link><Link className="sol-nav-cta" to={user ? "/" : "/register"}>Start building <ArrowRight size={15}/></Link></div></header>;
};

const MarketingFooter = () => <footer className="sol-footer"><Link to="/welcome" className="sol-brand"><img src={logo} alt=""/><span>MobiusEMS</span></Link><p>A flagship product of Mobius Bloom Venture Pvt Ltd</p><Link to="/solutions">Explore all capabilities ↗</Link></footer>;

export const SolutionsIndexPage = () => {
  useEffect(() => { window.scrollTo(0, 0); document.title = "MobiusEMS Capabilities — Complete Workforce OS"; }, []);
  return <div className="sol"><MarketingHeader/><main><section className="sol-index-hero"><p>THE COMPLETE MOBIUSEMS PLATFORM</p><h1>Nine capabilities.<br/><em>One workforce story.</em></h1><div>Explore every part of the employee lifecycle individually—from the employee record and daily delivery to responsible AI and enterprise control.</div></section><section className="sol-directory">{solutions.map(({slug,number,name,label,title,Icon,accent}) => <Link to={`/solutions/${slug}`} style={{"--accent":accent} as CSSProperties} key={slug}><span>{number}</span><Icon size={23}/><small>{label}</small><h2>{name}</h2><p>{title}</p><i><ArrowRight size={17}/></i></Link>)}</section><section className="sol-index-value"><p>THE BUSINESS VALUE</p><h2>One current source of employee information.</h2><div><span>Less manual administration.</span><span>Earlier workload and skill-gap visibility.</span><span>Fairer evidence-based reviews.</span><span>Management that scales across organizations.</span></div></section></main><MarketingFooter/></div>;
};

export const SolutionDetailPage = () => {
  const { slug } = useParams();
  const solution = solutions.find(item => item.slug === slug);
  const { user } = useAuth();
  useEffect(() => { window.scrollTo(0, 0); if (solution) document.title = `${solution.name} — MobiusEMS`; }, [slug, solution]);
  if (!solution) return <Navigate to="/solutions" replace/>;
  const index = solutions.indexOf(solution);
  const next = solutions[(index + 1) % solutions.length];
  const { Icon } = solution;
  return <div className="sol" style={{"--accent":solution.accent,"--soft":solution.soft} as CSSProperties}>
    <MarketingHeader/>
    <main>
      <section className="sol-detail-hero"><div className="sol-hero-copy"><Link to="/solutions" className="sol-back"><ArrowLeft size={14}/> All capabilities</Link><p><span>{solution.number}</span>{solution.label}</p><h1>{solution.title}</h1><div>{solution.summary}</div><Link to={user ? "/" : "/register"} className="sol-primary">Explore it in your workspace <ArrowRight size={17}/></Link></div><ProductVisual solution={solution} index={index}/></section>
      <section className="sol-detail-body"><div className="sol-sticky"><Icon size={27}/><p>WHAT IT BRINGS TOGETHER</p><h2>{solution.name},<br/>completely connected.</h2></div><div className="sol-feature-list">{solution.features.map((feature,featureIndex) => <article key={feature}><span>{String(featureIndex + 1).padStart(2,"0")}</span><Check size={17}/><p>{feature}</p></article>)}</div></section>
      <section className="sol-value"><ShieldCheck size={28}/><p>WHY IT MATTERS</p><h2>{solution.value}</h2></section>
      <section className="sol-next"><p>NEXT CAPABILITY · {next.number}</p><Link to={`/solutions/${next.slug}`}><span>{next.name}</span><strong>{next.title}</strong><i><ArrowRight size={24}/></i></Link></section>
    </main>
    <MarketingFooter/>
  </div>;
};

const ProductVisual = ({ solution, index }: { solution: Solution; index: number }) => <div className={`sol-visual visual-${index % 3}`}>
  <span className="sol-orbit orbit-a"/><span className="sol-orbit orbit-b"/>
  <div className="sol-window"><div className="sol-window-head"><i/><i/><i/><p>MobiusEMS · {solution.name}</p></div><div className="sol-window-body"><div className="sol-window-title"><span><solution.Icon size={16}/>{solution.visualTitle}</span><small>Illustrative workspace</small></div><div className="sol-metric"><small>{solution.visualMetricLabel}</small><strong>{solution.visualMetric}</strong><i/></div><div className="sol-rows">{solution.visualRows.map((row,rowIndex) => <p key={row}><span>{String(rowIndex + 1).padStart(2,"0")}</span><strong>{row}</strong><i className={rowIndex === solution.visualRows.length - 1 ? "pending" : ""}>{rowIndex === solution.visualRows.length - 1 ? "Review" : "Ready"}</i></p>)}</div></div></div>
  <div className="sol-float"><Sparkles size={15}/><span><small>CONNECTED SIGNAL</small><strong>{solution.value.split(".")[0]}</strong></span></div>
</div>;



