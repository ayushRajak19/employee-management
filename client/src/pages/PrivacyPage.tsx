import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Database,
  Eye,
  Fingerprint,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import { MarketingFooter } from "@/components/MarketingFooter";

const sections = [
  { id: "scope", number: "01", title: "Scope and our role" },
  { id: "collection", number: "02", title: "Data we collect" },
  { id: "use", number: "03", title: "How we use data" },
  { id: "location", number: "04", title: "Attendance and location" },
  { id: "ai", number: "05", title: "AI-assisted features" },
  { id: "sharing", number: "06", title: "How data is shared" },
  { id: "retention", number: "07", title: "Retention and deletion" },
  { id: "security", number: "08", title: "Security" },
  { id: "rights", number: "09", title: "Your choices and rights" },
  { id: "international", number: "10", title: "International processing" },
  { id: "children", number: "11", title: "Children’s data" },
  { id: "updates", number: "12", title: "Updates and contact" },
];

const dataCards = [
  { Icon: Users, title: "Identity & work profile", text: "Name, work contact details, role, team, reporting line, skills, and organization records." },
  { Icon: MapPin, title: "Attendance & location", text: "Check-in time and location supplied when an authorized attendance feature is used." },
  { Icon: Sparkles, title: "Work & talent records", text: "Tasks, contributions, assessments, applications, resumes, feedback, and development records." },
  { Icon: Fingerprint, title: "Security & device data", text: "Login activity, audit events, browser or device details, IP address, and diagnostic information." },
];

const Bullet = ({ children }: { children: string }) => (
  <li className="flex gap-3"><Check size={16} className="mt-1.5 shrink-0 text-[#13896b]" aria-hidden="true"/><span>{children}</span></li>
);

export const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy — MobiusEMS";
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f6ef] text-[#102d2c] antialiased">
      <a href="#privacy-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:shadow-xl">Skip to privacy policy</a>
      <MarketingNavbar />

      <main id="privacy-content">
        <section className="relative overflow-hidden border-b border-[#102d2c]/10 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="pointer-events-none absolute -right-24 -top-44 size-[34rem] rounded-full border border-[#102d2c]/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-8 -top-28 size-[25rem] rounded-full border border-[#13896b]/20" aria-hidden="true" />
          <div className="mx-auto max-w-7xl">
            <Link to="/welcome" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526762] transition-colors hover:text-[#13896b]"><ArrowLeft size={16} aria-hidden="true"/> Back to MobiusEMS</Link>
            <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_21rem]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#102d2c]/10 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#526762]"><ShieldCheck size={14} className="text-[#13896b]" aria-hidden="true"/> Privacy · Plain-language edition</div>
                <h1 className="mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">Privacy,<br/><span className="text-[#13896b]">made clear.</span></h1>
                <p className="mt-7 max-w-2xl text-base leading-8 text-[#526762] sm:text-lg">What MobiusEMS collects, why it is needed, how it is protected, and the choices available to the people whose data powers their workplace.</p>
              </div>
              <div className="rounded-2xl border border-[#102d2c]/10 bg-white/75 p-6 shadow-[0_20px_60px_rgba(16,45,44,0.08)] backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778781]">Policy details</p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[#102d2c]/10 pb-4"><dt className="text-[#687a74]">Effective</dt><dd className="font-bold">16 September 2026</dd></div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#102d2c]/10 pb-4"><dt className="text-[#687a74]">Version</dt><dd className="font-bold">1.0</dd></div>
                  <div className="flex items-center justify-between gap-4"><dt className="text-[#687a74]">Region</dt><dd className="font-bold">India</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#102d2c]/10 bg-[#102d2c] px-5 py-8 text-white sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
            {[{Icon:Eye,title:"No covert surveillance",text:"No keylogging or continuous screen capture."},{Icon:LockKeyhole,title:"Permission-scoped access",text:"Workspace roles control who can see what."},{Icon:Database,title:"Customer data stays yours",text:"Processed to provide the services you choose."}].map(({Icon,title,text}) => <div key={title} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"><Icon size={19} className="mt-0.5 shrink-0 text-[#b6e0c6]" aria-hidden="true"/><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-white/65">{text}</p></div></div>)}
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-20">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778781]">On this page</p>
              <nav className="mt-4 border-l border-[#102d2c]/15" aria-label="Privacy policy sections">
                {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="group flex min-h-10 items-center gap-3 border-l-2 border-transparent py-2 pl-4 text-xs leading-5 text-[#60736c] transition-colors hover:border-[#13896b] hover:text-[#102d2c]"><span className="font-mono text-[10px] text-[#9aa69f] group-hover:text-[#13896b]">{section.number}</span><span>{section.title}</span></a>)}
              </nav>
              <div className="mt-8 rounded-xl bg-[#102d2c] p-5 text-white"><Mail size={18} className="text-[#b6e0c6]" aria-hidden="true"/><p className="mt-3 text-sm font-bold">Privacy request or concern?</p><a href="mailto:contact@mobiusbloom.com?subject=MobiusEMS%20privacy%20request" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-[#b6e0c6] hover:text-white hover:underline">contact@mobiusbloom.com</a></div>
            </aside>

            <article className="min-w-0 max-w-3xl">
              <div className="mb-14 rounded-2xl border border-[#13896b]/20 bg-[#eef8f3] p-6 sm:p-8"><div className="flex items-start gap-4"><ShieldCheck className="mt-0.5 shrink-0 text-[#13896b]" size={22} aria-hidden="true"/><div><h2 className="text-base font-bold">The important distinction</h2><p className="mt-2 text-sm leading-7 text-[#566b65]">Your employer or the organization that provides your account usually decides why workplace data is processed. In that setting, the organization is the data fiduciary or controller and MobiusEMS processes data on its instructions. We act as a data fiduciary for information we collect for our own account, website, security, billing, and support purposes.</p></div></div></div>

              <div className="space-y-16 [&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.025em] sm:[&_h2]:text-3xl [&_h3]:mt-7 [&_h3]:text-base [&_h3]:font-bold [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-[#526762] [&_ul]:mt-5 [&_ul]:space-y-3 [&_ul]:text-[15px] [&_ul]:leading-7 [&_ul]:text-[#526762]">
                <section aria-labelledby="scope"><p className="font-mono text-xs font-bold text-[#13896b]">01 / SCOPE</p><h2 id="scope" className="mt-3">Scope and our role</h2><p>This Policy explains how Mobius Bloom Venture Pvt Ltd handles personal data through MobiusEMS, our related websites, applications, support, and services. It applies to customer administrators, employees, applicants, visitors, and other authorized users.</p><p>Customer organizations configure the platform, select features, create accounts, and determine much of the workplace data entered into MobiusEMS. Their own privacy notices and policies may also apply. Questions about an employer’s decisions should normally be directed to that organization first.</p></section>

                <section aria-labelledby="collection"><p className="font-mono text-xs font-bold text-[#13896b]">02 / COLLECTION</p><h2 id="collection" className="mt-3">Data we collect</h2><p>We collect information you provide, information supplied by your organization, and limited technical information generated when the service is used. The exact data depends on enabled features and your role.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{dataCards.map(({Icon,title,text}) => <div key={title} className="rounded-xl border border-[#102d2c]/10 bg-white/65 p-5"><Icon size={19} className="text-[#13896b]" aria-hidden="true"/><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="!mt-1 !text-xs !leading-5">{text}</p></div>)}</div><p>We may also receive subscription, billing, support correspondence, integrations selected by your organization, and essential cookie or session data. Please do not provide personal data that is not needed for an authorized workplace purpose.</p></section>

                <section aria-labelledby="use"><p className="font-mono text-xs font-bold text-[#13896b]">03 / PURPOSE</p><h2 id="use" className="mt-3">How we use data</h2><p>We process personal data only for identified, lawful purposes connected to the service. Depending on the context, these include:</p><ul><Bullet>Creating accounts and providing configured workforce features.</Bullet><Bullet>Managing work, attendance, skills, development, hiring, performance, and permitted sales operations.</Bullet><Bullet>Authenticating users, enforcing permissions, detecting misuse, and preserving audit history.</Bullet><Bullet>Delivering support, service notices, billing, and customer-requested communications.</Bullet><Bullet>Maintaining reliability, troubleshooting errors, and improving service usability.</Bullet><Bullet>Complying with legal obligations and protecting people, organizations, and the platform.</Bullet></ul><p>Where consent is the applicable basis, it may be withdrawn as described below. Some processing may continue when another lawful ground or legal obligation applies.</p></section>

                <section aria-labelledby="location"><p className="font-mono text-xs font-bold text-[#13896b]">04 / LOCATION</p><h2 id="location" className="mt-3">Attendance and location</h2><p>If an organization enables geofenced attendance, the browser may request location only when a user initiates a check-in or check-out. The supplied coordinates are compared with an authorized workplace location to determine whether the user is within the configured radius and may be recorded with the attendance event.</p><p>MobiusEMS is not designed for continuous background location tracking. Location permission is controlled by the user’s browser or device, while the organization remains responsible for appropriate notices, lawful use, and alternative attendance procedures where required.</p></section>

                <section aria-labelledby="ai"><p className="font-mono text-xs font-bold text-[#13896b]">05 / AI</p><h2 id="ai" className="mt-3">AI-assisted features</h2><p>When authorized users invoke AI features, relevant permitted records or prompts may be processed to answer questions, summarize information, parse documents, suggest actions, or create editable drafts. Access remains constrained by the user’s workspace permissions.</p><p>AI output is advisory and may be inaccurate. MobiusEMS is not intended to make solely automated employment decisions. Hiring, promotion, compensation, discipline, scheduling, and termination decisions require meaningful human review.</p></section>

                <section aria-labelledby="sharing"><p className="font-mono text-xs font-bold text-[#13896b]">06 / SHARING</p><h2 id="sharing" className="mt-3">How data is shared</h2><p>We do not sell personal data. We may disclose it only as needed to:</p><ul><Bullet>Your organization and its authorized administrators or users, according to configured permissions.</Bullet><Bullet>Service providers that host, secure, communicate, support, or help operate MobiusEMS under contractual safeguards.</Bullet><Bullet>Integration providers when an authorized administrator connects a service.</Bullet><Bullet>Authorities or other parties when required by law or necessary to protect rights, safety, and service integrity.</Bullet><Bullet>A successor in a merger, financing, reorganization, or sale, subject to appropriate confidentiality protections.</Bullet></ul><p>Providers are permitted to handle personal data only for the services they perform for us or the customer, as applicable.</p></section>

                <section aria-labelledby="retention"><p className="font-mono text-xs font-bold text-[#13896b]">07 / LIFECYCLE</p><h2 id="retention" className="mt-3">Retention and deletion</h2><p>We retain personal data only as long as reasonably necessary for the relevant service, customer instructions, security, dispute resolution, and legal or accounting obligations. Retention varies by record type, workspace settings, contract, and applicable law.</p><p>When an account or customer relationship ends, data is deleted, de-identified, or returned according to the applicable agreement and retention process. Limited copies may remain temporarily in protected backups or where retention is legally required.</p></section>

                <section aria-labelledby="security"><p className="font-mono text-xs font-bold text-[#13896b]">08 / PROTECTION</p><h2 id="security" className="mt-3">Security</h2><p>We use reasonable technical and organizational safeguards designed for the nature of the data and service, including tenant isolation, role- and section-based permissions, authentication controls, encryption for sensitive secrets, audit records, backups, and monitored access.</p><p>No online service is completely secure. Customers should assign minimum necessary permissions, promptly remove former users, protect credentials, and report suspected incidents without delay.</p></section>

                <section aria-labelledby="rights"><p className="font-mono text-xs font-bold text-[#13896b]">09 / YOUR RIGHTS</p><h2 id="rights" className="mt-3">Your choices and rights</h2><p>Subject to applicable law and the role in which data is processed, you may request access to information about your personal data, correction or completion, erasure, withdrawal of consent, grievance redressal, or nomination of another person to exercise rights in permitted circumstances.</p><p>For data controlled by your employer or another customer organization, submit the request to that organization first. You may also contact us and we will route or assist with the request where appropriate. We may verify identity and authority before acting. Some requests may be limited where retention or processing is required by law or needed to protect others.</p><p>Browser settings can control cookies and location permission. Disabling required session storage may prevent sign-in, and denying location may prevent geofenced check-in.</p></section>

                <section aria-labelledby="international"><p className="font-mono text-xs font-bold text-[#13896b]">10 / TRANSFERS</p><h2 id="international" className="mt-3">International processing</h2><p>MobiusEMS and its service providers may process data in locations other than where a user lives. When personal data is transferred, we use contractual, technical, and organizational measures intended to protect it and follow applicable transfer restrictions.</p></section>

                <section aria-labelledby="children"><p className="font-mono text-xs font-bold text-[#13896b]">11 / CHILDREN</p><h2 id="children" className="mt-3">Children’s data</h2><p>MobiusEMS is an enterprise workplace service and is not directed to children. Customer organizations must not create accounts for, or submit personal data about, a child unless the processing is lawful, necessary, appropriately configured, and supported by any required verifiable parental consent.</p></section>

                <section aria-labelledby="updates"><p className="font-mono text-xs font-bold text-[#13896b]">12 / CONTACT</p><h2 id="updates" className="mt-3">Updates and contact</h2><h3>Policy changes</h3><p>We may update this Policy as the service, our practices, or applicable law changes. The effective date above shows the latest revision. We will take reasonable steps to notify customers before material changes take effect.</p><h3>Questions and grievances</h3><p>Contact Mobius Bloom Venture Pvt Ltd at <a className="font-semibold text-[#102d2c] underline decoration-[#13896b]/40 underline-offset-4 hover:text-[#13896b]" href="mailto:contact@mobiusbloom.com">contact@mobiusbloom.com</a>. Include the relevant organization and account email, but do not send passwords or unnecessary sensitive data. If a concern relates to a customer-controlled workspace, we may refer it to that organization.</p></section>
              </div>

              <div className="mt-20 overflow-hidden rounded-2xl bg-[#102d2c] p-7 text-white sm:p-10"><div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end"><div><ShieldCheck size={24} className="text-[#b6e0c6]" aria-hidden="true"/><h2 className="mt-5 text-2xl font-extrabold tracking-tight">Your data deserves a clear answer.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/70">Ask a privacy question, report a concern, or request help exercising an applicable data right.</p></div><a href="mailto:contact@mobiusbloom.com?subject=MobiusEMS%20privacy%20request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#13896b] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0f765c]">Contact privacy team <ArrowRight size={16} aria-hidden="true"/></a></div></div>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#102d2c]/10 pt-8 text-xs text-[#687a74]"><span className="inline-flex items-center gap-2"><Building2 size={14} aria-hidden="true"/> Mobius Bloom Venture Pvt Ltd</span><span>India</span><Link className="font-semibold text-[#102d2c] hover:text-[#13896b] hover:underline" to="/terms">Terms &amp; Conditions</Link></div>
            </article>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
};
