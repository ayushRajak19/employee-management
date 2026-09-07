import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Check, ChevronDown, Clock3, Layers3, Mic, ShieldCheck, Sparkles, Target, Users, Workflow } from "lucide-react";
import logo from "@/assets/mobius-mark.png";
import { useAuth } from "@/features/auth/AuthProvider";
import "./landing.css";

type ShowroomKey = "Command center" | "Work delivery" | "People growth";
const showroom: Record<ShowroomKey, { eyebrow: string; title: string; body: string; proof: string[]; accent: string }> = {
  "Command center": { eyebrow: "For the whole organization", title: "See the company while it is moving.", body: "A calm operating view of delivery, workload, attendance, reviews, and the few things that genuinely need attention.", proof: ["Live delivery signals", "Department comparison", "Review and workload queues"], accent: "#e8623c" },
  "Work delivery": { eyebrow: "For every team", title: "Turn every promise into visible ownership.", body: "Move from assignment to evidence and review without losing the conversation, the deadline, or the person responsible.", proof: ["Clear owners and deadlines", "Reassign when priorities change", "Evidence-based completion"], accent: "#6557d9" },
  "People growth": { eyebrow: "For every person", title: "Make progress feel personal, not procedural.", body: "Keep skills, learning, goals, contributions, and performance evidence connected to the work employees actually do.", proof: ["Role skill maps", "Learning recommendations", "Human-reviewed AI summaries"], accent: "#13896b" }
};
const taskRows = [["Launch campaign", "Design", "In review"], ["Client onboarding", "Success", "On track"], ["Quarterly forecast", "Operations", "Attention"]];

export const LandingPage = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ShowroomKey>("Command center");
  const active = showroom[activeView];
  const destination = user ? "/" : "/register";
  useEffect(() => { document.title = "MobiusBloom — Run the company, not the chaos."; }, []);

  return <div className="lp">
    <a className="sr-only focus:not-sr-only" href="#main-content">Skip to content</a>
    <header className="lp-nav">
      <Link to="/welcome" className="lp-brand" aria-label="MobiusBloom home"><img src={logo} alt=""/><span>MobiusBloom</span><small>WORKFORCE OS</small></Link>
      <nav aria-label="Main navigation"><Link to="/solutions">All capabilities</Link><Link to="/solutions/employee-360">Employee 360</Link><Link to="/solutions/ask-mobius">Mobius AI</Link><Link to="/solutions/voice-task-assistant">Voice control</Link></nav>
      <div className="lp-nav-actions"><Link to={user ? "/" : "/login"}>{user ? "Workspace" : "Sign in"}</Link><Link className="lp-button lp-button-dark" to={destination}>Start building <ArrowRight size={16}/></Link></div>
    </header>

    <main id="main-content">
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <p className="lp-kicker"><span>01</span> THE OPERATING SYSTEM FOR WORK THAT MOVES</p>
          <h1>Run the company.<br/><em>Not the chaos.</em></h1>
          <p>People, work, growth, and AI—connected in one place so everyone knows what matters now and what should happen next.</p>
          <div className="lp-hero-actions"><Link className="lp-button lp-button-coral" to={destination}>Create your workspace <ArrowRight size={18}/></Link><a href="#product" className="lp-play-link"><span>↘</span> See MobiusBloom in action</a></div>
          <div className="lp-hero-note"><ShieldCheck size={15}/> Built for human decisions. AI assists; your people decide.</div>
        </div>

        <div className="lp-product-world" aria-label="Illustrative MobiusBloom product preview">
          <span className="lp-world-label">YOUR COMPANY, IN MOTION</span><span className="lp-world-orbit orbit-one"/><span className="lp-world-orbit orbit-two"/>
          <div className="lp-app-shell">
            <aside className="lp-app-rail"><b className="lp-rail-mark">8</b>{["⌂", "◎", "✓", "◌", "↗"].map((item, index) => <span className={index === 0 ? "active" : ""} key={index}>{item}</span>)}</aside>
            <div className="lp-app-main">
              <div className="lp-app-top"><div><small>MONDAY · COMMAND CENTER</small><strong>Good morning, team.</strong></div><span>Illustrative workspace</span></div>
              <div className="lp-app-grid">
                <div className="lp-app-focus"><p>THIS WEEK</p><h2>Work is moving.<br/><em>Three things need you.</em></h2><div className="lp-app-stats"><span><small>OPEN WORK</small><strong>24</strong></span><span><small>ON-TIME</small><strong>86%</strong></span><span><small>IN REVIEW</small><strong>5</strong></span></div><div className="lp-mini-chart"><div><strong>Delivery rhythm</strong><small>Last 7 days</small></div><div>{[36, 52, 44, 70, 58, 82, 66].map((height, index) => <i key={index} style={{ height: `${height}%` }}/>)}</div></div></div>
                <div className="lp-app-side"><div className="lp-ai-pulse"><span><Sparkles size={15}/> MOBIUS AI</span><strong>What deserves attention?</strong><p>Two reviews are waiting and Operations has the highest estimated workload.</p><button type="button">Open insight <ArrowRight size={13}/></button></div><div className="lp-team-pulse"><span>TEAM PULSE</span><strong>18 of 21</strong><small>people checked in today</small><div><i/><i/><i/><i/></div></div></div>
              </div>
              <div className="lp-task-strip">{taskRows.map(([task, team, state]) => <div key={task}><span>{task[0]}</span><p><strong>{task}</strong><small>{team}</small></p><em className={state === "Attention" ? "warn" : ""}>{state}</em></div>)}</div>
            </div>
          </div>
          <div className="lp-float-card lp-float-left"><Mic size={16}/><span><small>VOICE → TASK</small><strong>2 assignments ready</strong></span></div>
          <div className="lp-float-card lp-float-right"><Check size={16}/><span><small>REVIEW COMPLETE</small><strong>Evidence recorded</strong></span></div>
        </div>
      </section>

      <section className="lp-ribbon" aria-label="Platform capabilities"><p>ONE SYSTEM FOR</p>{["People", "Projects", "Attendance", "Performance", "Skills", "AI guidance", "Voice tasks"].map(item => <span key={item}>{item}<i>✦</i></span>)}</section>

      <section className="lp-opening" id="product"><div className="lp-opening-number">02</div><div><p className="lp-kicker">YOUR COMPANY SHOULD NOT FEEL LIKE 12 DIFFERENT TOOLS</p><h2>From the first check-in<br/>to the final review—<br/><em>one shared story.</em></h2></div><p className="lp-opening-copy">MobiusBloom connects the records that usually live apart. A task informs workload. Completed work becomes evidence. Evidence shapes a better growth conversation. Nothing important disappears between tools.</p></section>

      <section className="lp-showroom">
        <div className="lp-showroom-tabs" role="tablist" aria-label="Explore MobiusBloom">{(Object.keys(showroom) as ShowroomKey[]).map((key, index) => <button type="button" role="tab" aria-selected={activeView === key} className={activeView === key ? "active" : ""} onClick={() => setActiveView(key)} key={key}><span>0{index + 1}</span>{key}</button>)}</div>
        <div className="lp-showroom-scene" style={{ "--scene-accent": active.accent } as CSSProperties}>
          <div className="lp-showroom-copy"><p>{active.eyebrow}</p><h3>{active.title}</h3><div>{active.body}</div><ul>{active.proof.map(item => <li key={item}><Check size={15}/>{item}</li>)}</ul></div>
          <div className="lp-showroom-ui" aria-live="polite"><div className="lp-ui-head"><span/><span/><span/><p>mobiusbloom / {activeView.toLowerCase().replace(" ", "-")}</p></div>
            {activeView === "Command center" && <div className="lp-scene-dashboard"><div className="lp-scene-title"><span>Organization pulse</span><strong>What needs attention today?</strong></div><div className="lp-scene-metrics"><span><small>ON-TIME RATE</small><strong>86%</strong><i/></span><span><small>AWAITING REVIEW</small><strong>5</strong><i/></span><span><small>OPEN BLOCKERS</small><strong>2</strong><i/></span></div><div className="lp-scene-bars">{[44, 65, 51, 82, 70, 91, 76, 88].map((height, i) => <i key={i} style={{height:`${height}%`}}/>)}</div></div>}
            {activeView === "Work delivery" && <div className="lp-scene-board">{["NOT STARTED", "IN PROGRESS", "IN REVIEW"].map((column, i) => <div key={column}><strong>{column}<small>{3 - i}</small></strong>{[0, 1].map(item => <article key={item}><span>{["Campaign brief", "Client setup", "Quality review"][i]}</span><small>{item ? "Due Friday" : "Due tomorrow"}</small><i style={{background:active.accent}}/></article>)}</div>)}</div>}
            {activeView === "People growth" && <div className="lp-scene-growth"><div><p>ROLE READINESS</p><strong>Skills that move<br/>the team forward.</strong><span>Verified skills connect learning to real work.</span></div><div>{[["Communication",82],["Planning",68],["Analysis",91],["Leadership",74]].map(([skill,score]) => <p key={skill as string}><span>{skill}</span><i><b style={{width:`${score}%`,background:active.accent}}/></i><strong>{score}%</strong></p>)}</div></div>}
          </div>
        </div>
      </section>

      <section className="lp-ai-story" id="intelligence"><div className="lp-ai-heading"><span className="lp-section-number">03</span><p className="lp-kicker">INTELLIGENCE, WITH BOUNDARIES</p><h2>AI that knows the work.<br/><em>And knows its place.</em></h2></div><div className="lp-ai-conversation"><div className="lp-ai-avatar"><Bot size={31}/><i/></div><p className="lp-ai-question">“What should I pay attention to before the team meeting?”</p><div className="lp-ai-answer"><Sparkles size={18}/><div><strong>Here is the short version.</strong><p>Two tasks are overdue, one launch item is waiting for review, and the Operations workload is above its recent range.</p><div><span>View overdue work ↗</span><span>Open team workload ↗</span></div></div></div><small><ShieldCheck size={13}/> Permission-aware · Grounded in available records · Human-reviewed decisions</small></div><div className="lp-ai-capabilities"><article><span>01</span><h3>Ask the workplace</h3><p>Get useful answers from records and approved company knowledge you are allowed to access.</p></article><article><span>02</span><h3>Draft the summary</h3><p>Turn verified contributions and performance evidence into a clear first draft for review.</p></article><article><span>03</span><h3>Find the next move</h3><p>Surface workload, review queues, and delivery signals so a manager can act with context.</p></article></div></section>

      <section className="lp-voice" id="voice"><div className="lp-voice-wave" aria-hidden="true">{[24,42,72,38,88,58,98,48,77,32,64,92,54,34,70,44,82,26].map((height,index)=><i key={index} style={{height:`${height}%`}}/>)}</div><div className="lp-voice-copy"><span><Mic size={20}/> MULTILINGUAL VOICE CONTROL</span><h2>Work said out loud.<br/><em>Work ready to move.</em></h2><p>Speak naturally. MobiusBloom turns the note into editable assignments, owners, and deadlines. You review everything before it becomes real.</p><blockquote>“Design team ko launch assets banana hai, aur client success team ko follow-up karna hai.”</blockquote><div><span><Check size={15}/> 2 task previews</span><span><Clock3 size={15}/> Deadline detected</span><span><Users size={15}/> Teams matched</span></div></div></section>

      <section className="lp-chapters" id="why"><div className="lp-chapters-intro"><span className="lp-section-number">04</span><p className="lp-kicker">THE DIFFERENCE IS CONNECTION</p><h2>Less software to manage.<br/>More company to understand.</h2></div><div className="lp-chapter-list">{[[Users, "People without paperwork", "Profiles, departments, onboarding, attendance, and leave stay organized and close to the work."], [Layers3, "Delivery without chasing", "Every project has visible ownership, deadlines, progress, evidence, and a review trail."], [Target, "Performance without guesswork", "Goals, KPIs, outcomes, support, and development appear together—with context."], [Workflow, "Growth without disconnect", "Skills and learning connect to roles, project needs, and the work employees complete."]].map(([Icon, title, text], index) => { const ChapterIcon = Icon as typeof Users; return <article key={title as string}><span>0{index + 1}</span><ChapterIcon size={24}/><h3>{title as string}</h3><p>{text as string}</p><i>↗</i></article>; })}</div></section>

      <section className="lp-outcomes"><p className="lp-kicker">WHAT CHANGES WHEN WORK CONNECTS</p><div>{[["From", "Status chasing", "to", "A shared view"], ["From", "Scattered evidence", "to", "Clear context"], ["From", "Reactive management", "to", "Timely support"]].map(([beforeLabel,before,afterLabel,after]) => <p key={before}><small>{beforeLabel}</small><span>{before}</span><i>→</i><small>{afterLabel}</small><strong>{after}</strong></p>)}</div></section>

      <section className="lp-principles"><ShieldCheck size={34}/><p className="lp-kicker">PEOPLE STAY IN CHARGE</p><h2>AI can organize the evidence.<br/>It cannot replace judgment.</h2><p>Role-based access, audit history, editable previews, and recommendation-only AI keep decisions explainable and in human hands.</p></section>

      <section className="lp-faq"><div><span className="lp-section-number">05</span><p className="lp-kicker">STRAIGHT ANSWERS</p><h2>Before you bring<br/>everyone together.</h2></div><div>{[["Who is MobiusBloom for?", "Organizations that want employees, daily work, attendance, performance, and development in one connected workspace."], ["Does AI make decisions about employees?", "No. AI answers questions and drafts summaries from permitted records. Managers review the evidence and remain responsible for every employment decision."], ["Can employees use it directly?", "Yes. Employees can access their own work, profile, attendance, leave, skills, learning, goals, and contribution records."], ["Can voice commands create several tasks?", "Yes. A multilingual voice note can create editable task previews for several people or teams. Nothing is applied until it is reviewed and confirmed."], ["Is the product preview real company data?", "No. Every number and item on this public page is illustrative. Signed-in workspaces show only their permitted organization records."]].map(([question,answer]) => <details key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>)}</div></section>

      <section className="lp-final"><span className="lp-final-orbit"/><b className="lp-final-mark">8</b><p className="lp-kicker">YOUR COMPANY IS ALREADY MOVING</p><h2>Give it one place<br/><em>to move together.</em></h2><div><Link className="lp-button lp-button-light" to={destination}>Build your workspace <ArrowRight size={18}/></Link><Link to={user ? "/" : "/login"}>{user ? "Return to workspace" : "Sign in to your team"} ↗</Link></div></section>
    </main>

    <footer className="lp-footer"><Link to="/welcome" className="lp-brand"><img src={logo} alt=""/><span>MobiusBloom</span></Link><p>People, work, and intelligence—moving as one.</p><div><Link to="/solutions">Capabilities</Link><Link to="/solutions/ask-mobius">AI</Link><Link to={user ? "/" : "/login"}>Workspace ↗</Link></div></footer>
  </div>;
};
