import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  FileSearch,
  Mic,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import logo from "@/assets/mobius-mark.png";
import teamImg from "@/assets/team-collaboration.jpg";
import engineeringImg from "@/assets/engineering-delivery.jpg";
import talentImg from "@/assets/talent-interview.jpg";
import { useAuth } from "@/features/auth/AuthProvider";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import {
  Particles,
  BorderBeam,
  FlipWords,
  NumberTicker,
  CardSpotlight,
  Marquee,
  ShimmerButton,
  SparklesText,
} from "@/components/inspira";
import "./landing.css";

type ShowroomKey =
  | "Command center"
  | "Executive analytics"
  | "Sales & CRM"
  | "AI Resume Screener"
  | "Skill matrix & gaps"
  | "Global workforce";

const showroom: Record<
  ShowroomKey,
  { eyebrow: string; title: string; body: string; proof: string[]; accent: string }
> = {
  "Command center": {
    eyebrow: "Hierarchical surveillance",
    title: "See reporting lines and unblock work live.",
    body: "Subordinate tree filtering, review queues, and live blocker alerts with worker quotes so leadership unblocks delivery before standups.",
    proof: ["Subtree reporting line", "Live blocker callouts", "Review queue triage"],
    accent: "#e8623c",
  },
  "Executive analytics": {
    eyebrow: "Leadership telemetry",
    title: "30s live metrics and burnout radar.",
    body: "Measure on-time delivery rates, completion velocity, and remaining estimated hours per person to defend employee wellbeing.",
    proof: ["30s auto-refresh telemetry", "On-time delivery %", "Workload capacity radar"],
    accent: "#13896b",
  },
  "Sales & CRM": {
    eyebrow: "Revenue operations",
    title: "Pipelines, territories, and quota pacing.",
    body: "Connect deal acquisition with delivery. Track deal stages, geographic territory ownership, country revenue maps, and sales rep quota pacing.",
    proof: ["Deal stages Kanban", "Country revenue map", "Quota attainment tracking"],
    accent: "#6557d9",
  },
  "AI Resume Screener": {
    eyebrow: "Advisory recruitment",
    title: "Automated CV fit and qualification scoring.",
    body: "Parse PDF and DOCX resumes against saved Job Descriptions with transparent fit scoring, matched skills, and human decision governance.",
    proof: ["Resume library & ATS", "Documented fit score", "Human-in-the-loop decisions"],
    accent: "#0284c7",
  },
  "Skill matrix & gaps": {
    eyebrow: "Organizational capability",
    title: "Department matrices and competency gaps.",
    body: "Map team capability heatmaps to uncover critical organizational gaps, evaluate verified skills, and recommend targeted training paths.",
    proof: ["Capability matrix heatmap", "Critical gap detection", "Targeted training paths"],
    accent: "#b45309",
  },
  "Global workforce": {
    eyebrow: "Enterprise governance",
    title: "Interactive geo-map and compliance control.",
    body: "Visualize hybrid and remote employee hubs, track geofenced attendance, and enforce section-level RBAC with immutable audit logs.",
    proof: ["Interactive employee map", "Section-level permissions", "Multi-tenant isolation"],
    accent: "#1e293b",
  },
};
type HumanStoryKey = "leadership" | "engineering" | "recruitment";

interface HumanStoryItem {
  id: HumanStoryKey;
  tabLabel: string;
  role: string;
  badgeIcon: typeof Users;
  headline: string;
  highlightText: string;
  story: string;
  image: string;
  imageAlt: string;
  liveTag: string;
  stat1: { value: number; suffix?: string; label: string };
  stat2: { value: string; label: string };
  ctaText: string;
}

const humanStories: Record<HumanStoryKey, HumanStoryItem> = {
  leadership: {
    id: "leadership",
    tabLabel: "Executive Leadership",
    role: "Operational Governance",
    badgeIcon: Users,
    headline: "Behind every great metric is a",
    highlightText: "trusted team",
    story: "Traditional software treats employees like rows in a database. MobiusEMS gives leadership grounded operational evidence, defends focus time against burnout, and ensures high-stakes decisions remain 100% human-led.",
    image: teamImg,
    imageAlt: "Executive leadership and engineering managers reviewing real-time telemetry together",
    liveTag: "Executive Operations · Real-Time Telemetry",
    stat1: { value: 94, suffix: "%", label: "Review satisfaction score" },
    stat2: { value: "100%", label: "Human-led decisions (Zero black-box AI)" },
    ctaText: "Explore leadership telemetry",
  },
  engineering: {
    id: "engineering",
    tabLabel: "Engineering & Delivery",
    role: "Subordinate Blocker Triage",
    badgeIcon: AlertOctagon,
    headline: "Unblock critical sprints without",
    highlightText: "status chasing",
    story: "Engineers shouldn't spend half their week in standup meetings just to say they're blocked. With subtree surveillance, task blockers flag immediately with root-cause tags so leads clear roadblocks in minutes.",
    image: engineeringImg,
    imageAlt: "Software engineering lead and developers collaborating around dual monitors to resolve an architecture blocker",
    liveTag: "Engineering Sprint · 3.4x Faster Resolution",
    stat1: { value: 86, suffix: "%", label: "On-time delivery rate" },
    stat2: { value: "0", label: "Status update meetings required" },
    ctaText: "Explore blocker triage",
  },
  recruitment: {
    id: "recruitment",
    tabLabel: "Talent & People Ops",
    role: "Empathetic Candidate Screening",
    badgeIcon: FileSearch,
    headline: "AI screens the resumes.",
    highlightText: "Humans hire the talent.",
    story: "Our recruitment engine parses candidate resumes against job descriptions in seconds and flags missing criteria. But our strict governance ensures algorithms never reject people autonomously—final interviews remain deeply human.",
    image: talentImg,
    imageAlt: "HR director and hiring manager conducting an authentic candidate interview in a modern conference room",
    liveTag: "People Ops · Explainable Fit Scoring",
    stat1: { value: 94, suffix: "%", label: "JD match explanation precision" },
    stat2: { value: "100%", label: "Panel-verified interview decisions" },
    ctaText: "Explore recruitment ATS",
  },
};

const taskRows = [["Launch campaign", "Design", "In review"], ["Client onboarding", "Success", "On track"], ["Quarterly forecast", "Operations", "Attention"]];

export const LandingPage = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ShowroomKey>("Command center");
  const [activeStory, setActiveStory] = useState<HumanStoryKey>("leadership");
  const active = showroom[activeView];
  const currentStory = humanStories[activeStory];
  const destination = user ? "/" : "/register";
  useEffect(() => {
    document.title = "MobiusEMS — Complete Operating System for Modern Companies";
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    }
  }, []);

  return <div className="lp">
    <a className="sr-only focus:not-sr-only" href="#main-content">Skip to content</a>
    <MarketingNavbar />

    <main id="main-content">
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <p className="lp-kicker"><span>01</span> THE COMPLETE WORKFORCE & REVENUE OPERATING SYSTEM</p>
          <h1>
            Run the company.<br/>
            <em>
              Not the{" "}
              <FlipWords
                words={["chaos.", "tool sprawl.", "friction.", "blindspots.", "burnout."]}
                className="text-[#e8623c]"
              />
            </em>
          </h1>
          <p>People, project delivery, sales pipeline, skills, and AI—connected in one unified operating system so leadership and teams move in sync without tool sprawl.</p>
          <div className="lp-hero-actions">
            <Link to={destination}>
              <ShimmerButton
                background="#e8623c"
                shimmerColor="#ffffff"
                className="text-sm font-bold py-3.5 px-6 gap-2.5 shadow-xl shadow-orange-900/20"
              >
                Create your workspace <ArrowRight size={18}/>
              </ShimmerButton>
            </Link>
            <a href="#product" className="lp-play-link"><span>↘</span> See MobiusEMS in action</a>
          </div>
          <div className="lp-hero-note"><ShieldCheck size={15}/> Built for human decisions. AI assists and organizes evidence; your people decide.</div>
        </div>

        <div className="lp-product-world relative overflow-hidden" aria-label="Illustrative MobiusEMS product preview">
          {/* Mature Ambient Aurora Glow */}
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-gradient-to-b from-emerald-400/20 via-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none animate-aurora-glow" aria-hidden="true" />
          <Particles className="opacity-20" quantity={20} color="#b6e0c6" />
          <span className="lp-world-label">YOUR COMPANY, IN MOTION</span><span className="lp-world-orbit orbit-one"/><span className="lp-world-orbit orbit-two"/>
          <div className="lp-app-shell relative">
            <BorderBeam size={35} duration={12} borderWidth={1.5} colorFrom="#34d399" colorTo="#e8623c" borderRadius={14} />
            <aside className="lp-app-rail"><b className="lp-rail-mark">8</b>{["⌂", "◎", "✓", "◌", "↗"].map((item, index) => <span className={index === 0 ? "active" : ""} key={index}>{item}</span>)}</aside>
            <div className="lp-app-main">
              <div className="lp-app-top"><div><small>MONDAY · COMMAND CENTER</small><strong>Good morning, team.</strong></div><span>Live Executive Surveillance</span></div>
              <div className="lp-app-grid">
                <div className="lp-app-focus">
                  <p>THIS WEEK</p>
                  <h2>Work is moving.<br/><em>Three things need you.</em></h2>
                  <div className="lp-app-stats">
                    <span><small>OPEN WORK</small><strong><NumberTicker value={24} /></strong></span>
                    <span><small>ON-TIME</small><strong><NumberTicker value={86} suffix="%" /></strong></span>
                    <span><small>IN REVIEW</small><strong><NumberTicker value={5} /></strong></span>
                  </div>
                  <div className="lp-mini-chart"><div><strong>Delivery rhythm</strong><small>Last 7 days</small></div><div>{[36, 52, 44, 70, 58, 82, 66].map((height, index) => <i key={index} style={{ height: `${height}%` }}/>)}</div></div>
                </div>
                <div className="lp-app-side">
                  <div className="lp-ai-pulse">
                    <span><Sparkles size={15}/> <SparklesText text="MOBIUSEMS AI" colors={{ first: "#a7d9c3", second: "#f5c94b" }} /></span>
                    <strong>What deserves attention?</strong>
                    <p>Two reviews are waiting, 1 task has a client blocker, and Operations workload is above its range.</p>
                    <button type="button">Open insight <ArrowRight size={13}/></button>
                  </div>
                  <div className="lp-team-pulse">
                    <span>TEAM PULSE</span>
                    <strong><NumberTicker value={18} /> of 21</strong>
                    <small>people checked in today</small>
                    <div><i/><i/><i/><i/></div>
                  </div>
                </div>
              </div>
              <div className="lp-task-strip">{taskRows.map(([task, team, state]) => <div key={task}><span>{task[0]}</span><p><strong>{task}</strong><small>{team}</small></p><em className={state === "Attention" ? "warn" : ""}>{state}</em></div>)}</div>
            </div>
          </div>
          <div className="lp-float-card lp-float-left"><Mic size={16}/><span><small>VOICE → TASK</small><strong>2 assignments ready</strong></span></div>
          <div className="lp-float-card lp-float-right"><AlertOctagon size={16} className="text-red-500"/><span><small>BLOCKER ALERT</small><strong>Client API pending</strong></span></div>
        </div>
      </section>

      <section className="lp-ribbon" aria-label="Platform capabilities">
        <p className="shrink-0 font-bold tracking-widest text-[9px] mr-6">ONE UNIFIED ENGINE FOR</p>
        <Marquee pauseOnHover repeat={4} duration="28s" className="py-0 flex-1">
          {["People 360", "Subordinate Surveillance", "Live Blockers", "Executive Analytics", "Burnout Radar", "Sales CRM", "Territory Maps", "AI Resume Screener", "Skill Matrix", "Voice Tasks", "Email Automation"].map(item => (
            <span key={item} className="flex items-center gap-4 text-sm font-semibold tracking-wide font-serif whitespace-nowrap">
              {item} <i className="not-italic text-amber-200">✦</i>
            </span>
          ))}
        </Marquee>
      </section>

      {/* Editorial Human Collaboration Showcase */}
      <section className="lp-human-story max-w-[1360px] mx-auto px-4 sm:px-8 mt-20 sm:mt-28 mb-20 sm:mb-28 scroll-mt-32" id="human-advantage" aria-label="Human-first workforce collaboration">
        {/* Section Framing Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-800/10 px-4 py-1.5 text-xs font-semibold text-emerald-900 mb-3.5">
            <Users size={14} /> The Human Advantage
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#102d2c] leading-[1.12]">
            Software built around <em className="text-[#e8623c] font-serif not-italic">real people</em>, not spreadsheets.
          </h2>
          <p className="mt-3.5 text-xs sm:text-sm md:text-base text-[#5c6c67] leading-relaxed max-w-2xl mx-auto">
            Technology should elevate human judgment, not replace it. Explore how MobiusEMS equips every role—from frontline engineers and hiring directors to executive leadership.
          </p>

          {/* Interactive Perspective Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-7">
            {(Object.keys(humanStories) as HumanStoryKey[]).map((key) => {
              const story = humanStories[key];
              const Icon = story.badgeIcon;
              const isActive = activeStory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveStory(key)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#102d2c] text-white shadow-md ring-2 ring-[#102d2c]/20 scale-105"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-[#d9ddd3] hover:border-slate-400 shadow-xs"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-emerald-400" : "text-slate-500"} />
                  {story.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* The Grand & Spacious Dark Emerald Showcase Card */}
        <div className="relative rounded-3xl overflow-hidden border border-[#102d2c]/15 bg-[#102d2c] text-white shadow-2xl min-h-[580px] lg:min-h-[640px] transition-all duration-300">
          <div className="grid lg:grid-cols-12 items-stretch min-h-[580px] lg:min-h-[640px]">
            {/* Big, Majestic Image Column */}
            <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[460px] lg:min-h-full overflow-hidden group">
              <img
                key={currentStory.image}
                src={currentStory.image}
                alt={currentStory.imageAlt}
                className="absolute inset-0 h-full w-full object-cover object-center transform group-hover:scale-105 transition-all duration-700 animate-human-fade"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102d2c] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#102d2c]" />
              <div className="absolute bottom-6 left-6 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 px-4 py-2.5 text-xs sm:text-sm text-white z-10 shadow-xl">
                <span className="font-semibold text-emerald-400">● {currentStory.liveTag}</span>
              </div>
            </div>

            {/* Spacious, Beautifully Padded Content Column */}
            <div className="lg:col-span-5 p-8 sm:p-10 lg:p-14 flex flex-col justify-between z-10">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 w-fit">
                  <currentStory.badgeIcon size={14} /> {currentStory.role}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  {currentStory.headline}{" "}
                  <em className="text-[#34d399] font-serif not-italic">{currentStory.highlightText}.</em>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-slate-300">
                  {currentStory.story}
                </p>
              </div>

              <div className="pt-8 mt-8 border-t border-white/15">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <strong className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                      <NumberTicker value={currentStory.stat1.value} suffix={currentStory.stat1.suffix} />
                    </strong>
                    <small className="text-xs text-slate-400 leading-tight block mt-1">{currentStory.stat1.label}</small>
                  </div>
                  <div>
                    <strong className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-400">
                      {currentStory.stat2.value}
                    </strong>
                    <small className="text-xs text-slate-400 leading-tight block mt-1">{currentStory.stat2.label}</small>
                  </div>
                </div>

                <div>
                  <Link to={destination}>
                    <ShimmerButton
                      background="#ffffff"
                      shimmerColor="#e8623c"
                      className="text-[#102d2c] font-bold text-xs sm:text-sm py-3.5 px-6 gap-2 rounded-full shadow-lg hover:shadow-xl"
                    >
                      {currentStory.ctaText} <ArrowRight size={15} />
                    </ShimmerButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-opening" id="product"><div className="lp-opening-number">02</div><div><p className="lp-kicker">YOUR COMPANY SHOULD NOT FEEL LIKE 12 DIFFERENT TOOLS</p><h2>From the first check-in<br/>to the final review—<br/><em>one shared story.</em></h2></div><p className="lp-opening-copy">MobiusEMS connects the records that usually live apart. A task informs workload. Completed work becomes evidence. Evidence shapes a better growth conversation. Nothing important disappears between tools.</p></section>

      <section className="lp-showroom">
        <div className="lp-showroom-tabs" role="tablist" aria-label="Explore MobiusEMS">{(Object.keys(showroom) as ShowroomKey[]).map((key, index) => <button type="button" role="tab" aria-selected={activeView === key} className={activeView === key ? "active" : ""} onClick={() => setActiveView(key)} key={key}><span>0{index + 1}</span>{key}</button>)}</div>
        <div className="lp-showroom-scene" style={{ "--scene-accent": active.accent } as CSSProperties}>
          <div className="lp-showroom-copy"><p>{active.eyebrow}</p><h3>{active.title}</h3><div>{active.body}</div><ul>{active.proof.map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul></div>
          <div className="lp-showroom-ui" aria-live="polite"><div className="lp-ui-head"><span/><span/><span/><p>mobius-ems / {activeView.toLowerCase().replace(/[\s&]+/g, "-")}</p></div>
            {activeView === "Command center" && <div className="lp-scene-surveillance">
              <div className="lp-scene-title"><span>Subordinate Surveillance Hub</span><strong>Engineering Subtree · 3 Reports Active</strong></div>
              <div className="lp-surv-roster">
                <div className="lp-surv-chip"><span className="avatar">SK</span><div><strong>Sarah Kowalski</strong><small>Senior Lead</small></div><span className="badge-warn">1 BLOCKED</span></div>
                <div className="lp-surv-chip"><span className="avatar">AM</span><div><strong>Alex Miller</strong><small>Backend Eng</small></div><span className="font-bold text-slate-500">5 Open</span></div>
                <div className="lp-surv-chip"><span className="avatar">DR</span><div><strong>David Ramos</strong><small>UI Specialist</small></div><span className="font-bold text-purple-600">1 In Review</span></div>
              </div>
              <div className="lp-blocker-card">
                <div className="lp-blocker-head"><AlertOctagon size={13}/> LIVE TASK BLOCKER · CRITICAL</div>
                <p className="lp-blocker-title">OAuth2 Single Sign-On Integration</p>
                <p className="lp-blocker-quote">&ldquo;Waiting for client IT security to whitelist staging IP addresses. Cannot test handshake.&rdquo;</p>
                <div className="lp-blocker-footer"><span>Owner: Sarah Kowalski · Due today</span><button type="button">Resolve Blocker ↗</button></div>
              </div>
            </div>}

            {activeView === "Executive analytics" && <div className="lp-scene-exec">
              <div className="lp-exec-telemetry">
                <span className="lp-telemetry-pill"><span className="inline-block size-2 animate-ping rounded-full bg-emerald-500"/> Live 30s Polling Telemetry</span>
                <span><strong><NumberTicker value={86.4} decimalPlaces={1} suffix="%" /></strong> On-Time Delivery Rate</span>
              </div>
              <table className="lp-radar-table">
                <thead><tr><th>Employee</th><th>Tasks</th><th>Remaining Hours</th><th>Burnout Status</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Alex Miller</strong><br/><small>Backend</small></td>
                    <td>6 tasks</td>
                    <td><span>46h</span><div className="lp-load-bar"><div className="lp-load-bar-fill bg-red-500" style={{ width: "92%" }}/></div></td>
                    <td><span className="lp-status-pill lp-status-red">Overloaded</span></td>
                  </tr>
                  <tr>
                    <td><strong>Sarah Kowalski</strong><br/><small>Lead</small></td>
                    <td>3 tasks</td>
                    <td><span>28h</span><div className="lp-load-bar"><div className="lp-load-bar-fill bg-amber-500" style={{ width: "56%" }}/></div></td>
                    <td><span className="lp-status-pill lp-status-amber">High Load</span></td>
                  </tr>
                  <tr>
                    <td><strong>Elena Rostova</strong><br/><small>Design</small></td>
                    <td>2 tasks</td>
                    <td><span>14h</span><div className="lp-load-bar"><div className="lp-load-bar-fill bg-emerald-500" style={{ width: "28%" }}/></div></td>
                    <td><span className="lp-status-pill lp-status-green">Balanced</span></td>
                  </tr>
                </tbody>
              </table>
              <small className="italic text-[10px] text-slate-500">Workload hours radar protects staff from burnout; strictly separated from review scores.</small>
            </div>}

            {activeView === "Sales & CRM" && <div className="lp-scene-sales">
              <div className="lp-sales-pacing">
                <div><small className="text-[9px] text-slate-300">Q3 GLOBAL REVENUE PACING</small><strong className="block text-sm">$<NumberTicker value={1140000} /> / $1,250,000 (91.2%)</strong></div>
                <span className="text-[10px] font-semibold text-emerald-400">14 Active Territories</span>
              </div>
              <div className="lp-sales-kanban">
                <div className="lp-sales-col">
                  <div className="lp-sales-col-title"><span>QUALIFIED</span><strong>$210K</strong></div>
                  <div className="lp-sales-deal"><strong>Acme Global</strong><small>Cloud Migration</small><span className="amount">$95,000</span></div>
                </div>
                <div className="lp-sales-col">
                  <div className="lp-sales-col-title"><span>NEGOTIATION</span><strong>$440K</strong></div>
                  <div className="lp-sales-deal"><strong>Vertex Group</strong><small>EMS Enterprise</small><span className="amount">$220,000</span></div>
                </div>
                <div className="lp-sales-col">
                  <div className="lp-sales-col-title"><span>CLOSED WON</span><strong>$820K</strong></div>
                  <div className="lp-sales-deal"><strong>Helios Retail</strong><small>3-Yr Rollout</small><span className="amount">$310,000</span></div>
                </div>
              </div>
            </div>}

            {activeView === "AI Resume Screener" && <div className="lp-scene-screener">
              <div className="lp-screener-card">
                <div className="lp-screener-header">
                  <div>
                    <strong className="block text-xs">Sarah Lin, M.Tech</strong>
                    <small className="text-[9px] text-slate-500">JD-104 · Lead Distributed Systems Architect</small>
                  </div>
                  <span className="lp-score-badge"><Check size={12}/> <NumberTicker value={94} suffix="%" /> Fit</span>
                </div>
                <div className="lp-skill-chips">
                  <span className="lp-chip-match"><Check size={10}/> Distributed Consensus (Raft)</span>
                  <span className="lp-chip-match"><Check size={10}/> Go & High-Throughput Services</span>
                  <span className="lp-chip-match"><Check size={10}/> Kubernetes Orchestration</span>
                  <span className="lp-chip-miss">! ISO 27001 Security Lead</span>
                </div>
                <div className="lp-human-advisory">
                  <strong>Human-in-the-loop:</strong> Algorithmic scores are advisory. Employment decisions require human interview panels.
                </div>
              </div>
            </div>}

            {activeView === "Skill matrix & gaps" && <div className="lp-scene-matrix">
              <div className="lp-matrix-preview">
                <div className="lp-matrix-row border-b pb-1 font-bold text-slate-500"><span>Capability</span><span>Lead</span><span>Senior</span><span>Staff</span></div>
                <div className="lp-matrix-row"><span>Distributed Arch</span><span className="lp-matrix-badge lp-matrix-expert">Expert</span><span className="lp-matrix-badge lp-matrix-proficient">Proficient</span><span className="lp-matrix-badge lp-matrix-expert">Expert</span></div>
                <div className="lp-matrix-row"><span>Cloud Infra</span><span className="lp-matrix-badge lp-matrix-proficient">Proficient</span><span className="lp-matrix-badge lp-matrix-gap">CRITICAL GAP</span><span className="lp-matrix-badge lp-matrix-gap">GAP</span></div>
                <div className="lp-matrix-row"><span>Security & RBAC</span><span className="lp-matrix-badge lp-matrix-expert">Expert</span><span className="lp-matrix-badge lp-matrix-proficient">Proficient</span><span className="lp-matrix-badge lp-matrix-proficient">Proficient</span></div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-800">
                <AlertTriangle size={14} className="shrink-0 text-amber-600"/><span>2 team gaps detected in Cloud Infra · Suggested training auto-assigned</span>
              </div>
            </div>}

            {activeView === "Global workforce" && <div className="lp-scene-geo">
              <div className="lp-geo-grid">
                <div className="lp-geo-card"><small>San Francisco Hub</small><strong><NumberTicker value={22} /> Employees</strong><span>20 Checked In (91%)</span></div>
                <div className="lp-geo-card"><small>London Branch</small><strong><NumberTicker value={28} /> Employees</strong><span>26 Checked In (93%)</span></div>
                <div className="lp-geo-card"><small>Bengaluru Tech Hub</small><strong><NumberTicker value={24} /> Employees</strong><span>23 Checked In (96%)</span></div>
                <div className="lp-geo-card"><small>Remote Global</small><strong><NumberTicker value={14} /> Employees</strong><span>13 Active Today</span></div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-100 p-2 text-[10px] text-slate-500"><span>Tenant: Multi-Org Isolated</span><span>Audit Logging: 100% Immutable</span></div>
            </div>}
          </div>
        </div>
      </section>

      <section className="lp-ai-story" id="intelligence">
        <div className="lp-ai-heading"><span className="lp-section-number">03</span><p className="lp-kicker"><SparklesText text="INTELLIGENCE, WITH STRICT BOUNDARIES" colors={{ first: "#6557d9", second: "#e8623c" }} /></p><h2>AI that knows the work.<br/><em>And knows its place.</em></h2></div>
        <div className="lp-ai-conversation">
          <div className="lp-ai-avatar"><Bot size={31}/><i/></div>
          <p className="lp-ai-question">“What should I pay attention to before the executive review?”</p>
          <div className="lp-ai-answer"><Sparkles size={18}/><div><strong>Here is the short version.</strong><p>Two tasks are overdue, 1 client blocker requires IT whitelisting, and the Backend team workload is approaching capacity.</p><div><span>View overdue work ↗</span><span>Open team workload ↗</span></div></div></div>
          <small><ShieldCheck size={13}/> Permission-aware · Grounded in available records · Human-reviewed decisions</small>
        </div>
        <div className="lp-ai-capabilities">
          <article><span>01</span><h3>Ask the workplace</h3><p>Get useful answers from records and approved company knowledge you are permitted to access.</p></article>
          <article><span>02</span><h3>Draft the summary</h3><p>Turn verified contributions and delivery evidence into a clear first draft for manager review.</p></article>
          <article><span>03</span><h3>Find the next move</h3><p>Surface workload bottlenecks, review queues, and delivery signals so managers act with context.</p></article>
        </div>
      </section>

      {/* Section 04: The Enterprise Engine (DEEP DIVE FOR MISSING FEATURES) */}
      <section className="lp-engine" id="enterprise-engine">
        <div className="lp-engine-header">
          <div className="lp-opening-number">04</div>
          <div><p className="lp-kicker">BUILT FOR REAL ENTERPRISE OPERATORS</p><h2>Under the hood.<br/><em>Where standard tools stop.</em></h2></div>
          <p className="lp-engine-intro">Most platforms show simple Kanban cards and stop there. MobiusEMS powers mission-critical workforce operations: hierarchical blocker triage, live sales revenue maps, AI candidate qualification screening, and burnout defense.</p>
        </div>

        <div className="lp-engine-grid">
          {/* Feature 1: Subordinate Surveillance & Blocker Triage */}
          <CardSpotlight className="lp-engine-card" color="rgba(232, 98, 60, 0.08)">
            <div>
              <div className="lp-engine-top"><span className="lp-engine-badge badge-coral"><AlertOctagon size={13}/> MANAGEMENT SURVEILLANCE</span><span className="font-mono text-xs text-slate-400">01</span></div>
              <h3>Hierarchical Blocker Triage</h3>
              <p>Superiors monitor direct and indirect reporting lines. When work stalls, blockers are flagged immediately with the root cause and the worker&apos;s direct comment—eliminating status meetings.</p>
              <div className="lp-engine-features">
                <span><Check size={12}/> Subtree reporting lines</span>
                <span><Check size={12}/> Blocker root-cause tags</span>
                <span><Check size={12}/> One-click reassignment</span>
              </div>
            </div>
            <div className="lp-engine-mockup">
              <div className="mb-3.5 rounded-lg overflow-hidden h-28 relative border border-slate-200/90 shadow-xs group">
                <img src={engineeringImg} alt="Engineering delivery team" loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-2.5">
                  <span className="text-[10px] text-white font-semibold tracking-wide">
                    ● Real-Time Subtree Triage · Sprint unblocked
                  </span>
                </div>
              </div>
              <div className="lp-blocker-card">
                <div className="lp-blocker-head"><AlertOctagon size={14}/> LIVE TASK BLOCKER · CRITICAL</div>
                <p className="lp-blocker-title">OAuth2 Integration with Enterprise SSO</p>
                <p className="lp-blocker-quote">&ldquo;Blocked: Waiting for client IT security team to whitelist our staging IP addresses.&rdquo;</p>
                <div className="lp-blocker-footer">
                  <span>Assigned: Sarah Kowalski (Senior Lead)</span>
                  <button type="button">Resolve Blocker ↗</button>
                </div>
              </div>
            </div>
          </CardSpotlight>

          {/* Feature 2: Sales CRM & Geographic Revenue Map */}
          <CardSpotlight className="lp-engine-card" color="rgba(101, 87, 217, 0.08)">
            <div>
              <div className="lp-engine-top"><span className="lp-engine-badge badge-violet"><TrendingUp size={13}/> SALES & CRM SUITE</span><span className="font-mono text-xs text-slate-400">02</span></div>
              <h3>Deals, Quotas & Territory Maps</h3>
              <p>Bridge client acquisition directly with engineering delivery. Track leads, sales rep quotas, country revenue heatmaps, and channel partners with real-time conversion rates.</p>
              <div className="lp-engine-features">
                <span><Check size={12}/> Deal pipeline Kanban</span>
                <span><Check size={12}/> Quota vs actual pacing</span>
                <span><Check size={12}/> Geographic territories</span>
              </div>
            </div>
            <div className="lp-engine-mockup">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Q3 Global Quota Pacing</span>
                  <span className="font-bold text-emerald-600">$1.14M / $1.25M (91.2%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600" style={{ width: "91%" }}/>
                </div>
                <div className="flex justify-between pt-2 text-[10px] text-slate-500">
                  <span>NA: 100% Quota</span>
                  <span>EMEA: 94% Quota</span>
                  <span>APAC: 88% Quota</span>
                </div>
              </div>
            </div>
          </CardSpotlight>

          {/* Feature 3: AI Resume Screener & Talent Engine */}
          <CardSpotlight className="lp-engine-card" color="rgba(19, 137, 107, 0.08)">
            <div>
              <div className="lp-engine-top"><span className="lp-engine-badge badge-forest"><FileSearch size={13}/> AI RECRUITMENT ATS</span><span className="font-mono text-xs text-slate-400">03</span></div>
              <h3>AI Resume Screener & ATS</h3>
              <p>Screen candidate resumes against specific job descriptions in seconds. Match verifiable skills, identify missing requirements, and generate explainable fit scores without removing human recruiters.</p>
              <div className="lp-engine-features">
                <span><Check size={12}/> PDF & DOCX extraction</span>
                <span><Check size={12}/> Fit % score explanation</span>
                <span><Check size={12}/> Missing criteria alerts</span>
              </div>
            </div>
            <div className="lp-engine-mockup">
              <div className="mb-3.5 rounded-lg overflow-hidden h-28 relative border border-slate-200/90 shadow-xs group">
                <img src={talentImg} alt="HR candidate interview panel" loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-2.5">
                  <span className="text-[10px] text-white font-semibold tracking-wide">
                    ● Human Interview Panel · Explainable Fit Verification
                  </span>
                </div>
              </div>
              <div className="lp-screener-card">
                <div className="lp-screener-header">
                  <div>
                    <p className="text-xs font-bold">Sarah Lin · Lead Systems Architect</p>
                    <p className="text-[10px] text-slate-400">Match against JD-104: Senior Full-Stack</p>
                  </div>
                  <span className="lp-score-badge"><Check size={12}/> 94% Fit</span>
                </div>
                <div className="lp-skill-chips">
                  <span className="lp-chip-match"><Check size={10}/> Distributed Systems</span>
                  <span className="lp-chip-match"><Check size={10}/> TypeScript / React</span>
                  <span className="lp-chip-match"><Check size={10}/> Microservices</span>
                  <span className="lp-chip-miss">! Cloud Cert Required</span>
                </div>
              </div>
            </div>
          </CardSpotlight>

          {/* Feature 4: Executive Workload Radar & Burnout Defense */}
          <CardSpotlight className="lp-engine-card" color="rgba(245, 158, 11, 0.08)">
            <div>
              <div className="lp-engine-top"><span className="lp-engine-badge badge-amber"><BarChart3 size={13}/> EXECUTIVE TELEMETRY</span><span className="font-mono text-xs text-slate-400">04</span></div>
              <h3>Workload Radar & Burnout Defense</h3>
              <p>Protect team capacity before delivery suffers. Super Admin analytics track remaining estimated hours per person, surface overcommitted engineers, and integrate employee focus rhythms.</p>
              <div className="lp-engine-features">
                <span><Check size={12}/> 30s telemetry polling</span>
                <span><Check size={12}/> Estimated hours capacity</span>
                <span><Check size={12}/> Micro-breaks & mood rhythms</span>
              </div>
            </div>
            <div className="lp-engine-mockup">
              <div className="mb-3.5 rounded-lg overflow-hidden h-28 relative border border-slate-200/90 shadow-xs group">
                <img src={teamImg} alt="Leadership telemetry and burnout defense review" loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-2.5">
                  <span className="text-[10px] text-white font-semibold tracking-wide">
                    ● Leadership Telemetry · Capacity & Burnout Defense
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Alex M. · 6 open tasks</span>
                  <span className="lp-status-pill lp-status-red">46h · Overloaded</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-red-500" style={{ width: "92%" }}/>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium">Sarah K. · 3 open tasks</span>
                  <span className="lp-status-pill lp-status-amber">28h · High Load</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "62%" }}/>
                </div>
              </div>
            </div>
          </CardSpotlight>
        </div>
      </section>

      <section className="lp-feature-atlas" id="features">
        <div className="lp-feature-atlas-head"><span className="lp-section-number">05</span><div><p className="lp-kicker">EVERY FEATURE HAS A JOB</p><h2>One platform.<br/><em>Zero mystery.</em></h2></div><p>Here is exactly what each part of MobiusEMS does, who it is for, and what it helps your company decide next.</p></div>
        <div className="lp-feature-atlas-grid">
          {[
            ["People 360", "A single source of truth for every employee, team, role, location, and reporting line.", "HR & leadership", "Know who is here, who owns what, and where support is needed."],
            ["Work & Task Tracker", "Turn goals into assigned work with owners, due dates, status, priorities, and review queues.", "Every team", "See what is moving, what is late, and what needs a decision."],
            ["Performance & Contributions", "Connect completed work and verified evidence to fair, review-ready growth conversations.", "Managers", "Replace memory-based reviews with a clear record of impact."],
            ["Onboarding & Development", "Guide new hires through structured steps, then turn skill gaps into focused learning paths.", "People ops", "Move from first day to next capability without dropped handoffs."],
            ["Governance & Security", "Control access by tenant, role, and section while keeping a durable audit trail of sensitive actions.", "Admins & compliance", "Scale confidently without losing accountability."],
            ["Email Automation", "Create repeatable, permission-aware messages for onboarding, reminders, updates, and workflows.", "Operations", "Keep routine communication moving while people focus on judgment."],
          ].map(([title, description, audience, outcome], index) => <article key={title}><div className="lp-feature-atlas-index">0{index + 1}</div><div><span>{audience}</span><h3>{title}</h3><p>{description}</p><strong>→ {outcome}</strong></div></article>)}
        </div>
      </section>

      <section className="lp-voice relative overflow-hidden" id="voice">
        <div className="lp-voice-wave" aria-hidden="true">{[24,42,72,38,88,58,98,48,77,32,64,92,54,34,70,44,82,26].map((height,index)=><i key={index} style={{height:`${height}%`}}/>)}</div><div className="lp-voice-copy"><span><Mic size={20}/> MULTILINGUAL VOICE CONTROL</span><h2>Work said out loud.<br/><em>Work ready to move.</em></h2><p>Speak naturally. MobiusEMS turns the note into editable assignments, owners, and deadlines across English and Indian languages. You review everything before it becomes real.</p><blockquote>“Create the launch assets for the Design team, and assign the client follow-up to Client Success by tomorrow.”</blockquote><div><span><Check size={15}/> 2 task previews</span><span><Clock3 size={15}/> Deadline detected</span><span><Users size={15}/> Teams matched</span></div></div></section>

      <section className="lp-chapters" id="why"><div className="lp-chapters-intro"><span className="lp-section-number">06</span><p className="lp-kicker">THE POWER OF COMPLETE CONNECTION</p><h2>Less software to manage.<br/>More company to understand.</h2></div><div className="lp-chapter-list">{[[Users, "People & Global Footprint", "Profiles, departments, onboarding, geofenced attendance, and interactive employee maps stay organized."], [AlertOctagon, "Delivery & Blocker Surveillance", "Subordinate reporting trees, blocker root-cause alerts, and real-time review queues without status chasing."], [TrendingUp, "Revenue & Territory Pacing", "Full sales CRM, lead pipelines, country revenue maps, and sales rep quota tracking in the same workspace."], [FileSearch, "Talent & Capability Matrix", "AI resume screener against JDs, departmental skill matrix heatmaps, and evidence-grounded performance reviews."]].map(([Icon, title, text], index) => { const ChapterIcon = Icon as typeof Users; return <CardSpotlight key={title as string} color="rgba(19, 137, 107, 0.06)"><article className="border-0"><span>0{index + 1}</span><ChapterIcon size={24}/><h3>{title as string}</h3><p>{text as string}</p><i>↗</i></article></CardSpotlight>; })}</div></section>

      <section className="lp-outcomes"><p className="lp-kicker">WHAT CHANGES WHEN WORK CONNECTS</p><div>{[["From", "Status chasing", "to", "Live Blocker Triage"], ["From", "Scattered tools", "to", "Unified Revenue & Delivery"], ["From", "Reactive burnout", "to", "Workload Capacity Radar"]].map(([beforeLabel,before,afterLabel,after]) => <p key={before}><small>{beforeLabel}</small><span>{before}</span><i>→</i><small>{afterLabel}</small><strong>{after}</strong></p>)}</div></section>

      <section className="lp-principles"><ShieldCheck size={34}/><p className="lp-kicker">PEOPLE STAY IN CHARGE</p><h2>AI can organize the evidence.<br/>It cannot replace judgment.</h2><p>Section-level RBAC permissions, immutable audit history, editable previews, and recommendation-only AI keep employment decisions explainable and in human hands.</p></section>

      <section className="lp-faq"><div><span className="lp-section-number">07</span><p className="lp-kicker">STRAIGHT ANSWERS</p><h2>Before you bring<br/>everyone together.</h2></div><div>{[["What makes MobiusEMS different from simple project tools?", "Traditional tools only track tasks. MobiusEMS unites hierarchical subordinate surveillance, live blocker triage, full sales CRM with territory maps, AI resume screening, skill matrix heatmaps, and employee burnout telemetry into one seamless workspace."], ["Does MobiusEMS include Sales CRM and Territory Management?", "Yes. MobiusEMS includes a full Sales module: lead capture, deals Kanban pipeline, customer CRM accounts, sales rep quota tracking, country sales heatmaps, and territory ownership."], ["How does the AI Resume Screener work?", "The screener automatically parses PDF and DOCX resumes, matches candidate experience against saved Job Descriptions (JDs), highlights matching vs missing skills, and calculates a documented fit percentage. The AI is advisory; human interviewers make the final hiring decisions."], ["How does MobiusEMS identify and defend against employee burnout?", "The dashboard calculates remaining estimated hours for open work per person and flags overloaded team members on a live Workload Radar, helping managers reassign tasks and promote focus rhythms before burnout occurs."], ["What is the Subordinate Surveillance Hub?", "It allows team leads, department heads, and executives to filter by reporting subtrees, see live task blockers with employee quotes, review pending work, and unblock execution in real time without scheduling meetings."], ["Does AI make decisions about employees?", "Never. AI only answers questions, parses documents, and drafts summaries from permitted records. Managers review the evidence and remain fully responsible for every promotion, compensation, and staffing decision."]].map(([question,answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div></section>

      <section className="lp-final relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-white/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <span className="lp-final-orbit"/>
        <b className="lp-final-mark">8</b>
        <p className="lp-kicker">YOUR COMPANY IS ALREADY MOVING</p>
        <h2>Give it one place<br/><em>to move together.</em></h2>
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-5">
          <Link to={destination}>
            <ShimmerButton background="#ffffff" shimmerColor="#e8623c" className="text-stone-900 font-bold text-sm py-4 px-7 gap-2.5 shadow-xl">
              Build your workspace <ArrowRight size={18}/>
            </ShimmerButton>
          </Link>
          <Link to={user ? "/" : "/login"} className="text-white font-semibold text-xs hover:underline">{user ? "Return to workspace" : "Sign in to your team"} ↗</Link>
        </div>
      </section>
    </main>

    <footer className="lp-footer"><Link to="/welcome" className="lp-brand"><img src={logo} alt=""/><span>MobiusEMS</span></Link><p>A flagship product of Mobius Bloom Venture Pvt Ltd</p><div><Link to="/solutions">Capabilities</Link><a href="#enterprise-engine">Enterprise Engine</a><Link to="/solutions/mobius-ems-ai">AI</Link><Link to={user ? "/" : "/login"}>Workspace ↗</Link></div></footer>
  </div>;
};


