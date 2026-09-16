import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileText,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import { MarketingFooter } from "@/components/MarketingFooter";

const sections = [
  { id: "acceptance", number: "01", title: "Acceptance of these terms" },
  { id: "service", number: "02", title: "The MobiusEMS service" },
  { id: "accounts", number: "03", title: "Accounts and responsibilities" },
  { id: "data", number: "04", title: "Customer data and privacy" },
  { id: "acceptable-use", number: "05", title: "Acceptable use" },
  { id: "ai", number: "06", title: "AI-assisted features" },
  { id: "billing", number: "07", title: "Subscriptions and payment" },
  { id: "ownership", number: "08", title: "Intellectual property" },
  { id: "availability", number: "09", title: "Availability and changes" },
  { id: "liability", number: "10", title: "Warranties and liability" },
  { id: "termination", number: "11", title: "Suspension and termination" },
  { id: "general", number: "12", title: "General terms" },
];

export const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms & Conditions — MobiusEMS";
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f6ef] text-[#102d2c] antialiased">
      <a
        href="#terms-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:shadow-xl"
      >
        Skip to terms
      </a>
      <MarketingNavbar />

      <main id="terms-content">
        <section className="relative overflow-hidden border-b border-[#102d2c]/10 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="pointer-events-none absolute -right-24 -top-44 size-[34rem] rounded-full border border-[#102d2c]/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-8 -top-28 size-[25rem] rounded-full border border-[#e8623c]/20" aria-hidden="true" />
          <div className="mx-auto max-w-7xl">
            <Link to="/welcome" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526762] transition-colors hover:text-[#e8623c]">
              <ArrowLeft size={16} aria-hidden="true" /> Back to MobiusEMS
            </Link>

            <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1fr_21rem]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#102d2c]/10 bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#526762]">
                  <Scale size={14} className="text-[#e8623c]" aria-hidden="true" /> Legal · Plain-language edition
                </div>
                <h1 className="mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
                  Terms &amp;<br/><span className="text-[#e8623c]">Conditions.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-8 text-[#526762] sm:text-lg">
                  The agreement that governs access to MobiusEMS. We have written it to be direct, readable, and respectful of the organizations and people who use our platform.
                </p>
              </div>

              <div className="rounded-2xl border border-[#102d2c]/10 bg-white/75 p-6 shadow-[0_20px_60px_rgba(16,45,44,0.08)] backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778781]">Document details</p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[#102d2c]/10 pb-4"><dt className="text-[#687a74]">Effective</dt><dd className="font-bold">16 September 2026</dd></div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#102d2c]/10 pb-4"><dt className="text-[#687a74]">Version</dt><dd className="font-bold">1.0</dd></div>
                  <div className="flex items-center justify-between gap-4"><dt className="text-[#687a74]">Applies to</dt><dd className="font-bold">MobiusEMS</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-20">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#778781]">On this page</p>
              <nav className="mt-4 border-l border-[#102d2c]/15" aria-label="Terms sections">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="group flex min-h-10 items-center gap-3 border-l-2 border-transparent py-2 pl-4 text-xs leading-5 text-[#60736c] transition-colors hover:border-[#e8623c] hover:text-[#102d2c]">
                    <span className="font-mono text-[10px] text-[#9aa69f] group-hover:text-[#e8623c]">{section.number}</span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </nav>

              <div className="mt-8 rounded-xl bg-[#102d2c] p-5 text-white">
                <Mail size={18} className="text-[#b6e0c6]" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">Questions about these terms?</p>
                <a href="mailto:contact@mobiusbloom.com" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-[#b6e0c6] hover:text-white hover:underline">
                  contact@mobiusbloom.com
                </a>
              </div>
            </aside>

            <article className="min-w-0 max-w-3xl">
              <div className="mb-14 rounded-2xl border border-[#e8623c]/20 bg-[#fff8f3] p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#e8623c]" size={22} aria-hidden="true" />
                  <div>
                    <h2 className="text-base font-bold">A quick note before you begin</h2>
                    <p className="mt-2 text-sm leading-7 text-[#566b65]">By creating an account, accepting an order form, or using MobiusEMS, you agree to these Terms. If you use the service for an organization, you confirm that you are authorized to accept these Terms for that organization.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-16 [&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-[-0.025em] sm:[&_h2]:text-3xl [&_h3]:mt-7 [&_h3]:text-base [&_h3]:font-bold [&_li]:pl-1 [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-[#526762] [&_ul]:mt-5 [&_ul]:space-y-3 [&_ul]:text-[15px] [&_ul]:leading-7 [&_ul]:text-[#526762]">
                <section aria-labelledby="acceptance"><p className="font-mono text-xs font-bold text-[#e8623c]">01 / AGREEMENT</p><h2 id="acceptance" className="mt-3">Acceptance of these terms</h2><p>These Terms &amp; Conditions form a binding agreement between you or the organization you represent (“Customer”, “you”) and Mobius Bloom Venture Pvt Ltd (“Mobius Bloom”, “we”, “us”) for use of MobiusEMS and its related websites, applications, support, and services.</p><p>You must be legally capable of entering into this agreement. If a separate order form, subscription plan, or written enterprise agreement conflicts with these Terms, the more specific written agreement controls for that conflict.</p></section>

                <section aria-labelledby="service"><p className="font-mono text-xs font-bold text-[#e8623c]">02 / SERVICE</p><h2 id="service" className="mt-3">The MobiusEMS service</h2><p>MobiusEMS is a workforce operating platform that may include employee records, work management, attendance, skills, performance, recruitment, communication, analytics, and AI-assisted tools. Available features depend on your plan, configuration, and permissions.</p><p>The Customer remains responsible for its employment practices, workplace policies, notices, consents, and decisions. MobiusEMS provides tools and information; it is not the employer, recruitment agency, legal adviser, or final decision-maker.</p></section>

                <section aria-labelledby="accounts"><p className="font-mono text-xs font-bold text-[#e8623c]">03 / ACCOUNTS</p><h2 id="accounts" className="mt-3">Accounts and responsibilities</h2><p>Keep account information accurate and credentials confidential. Administrators control user access, roles, permissions, and workspace settings for their organization.</p><ul>{["Use the service only for lawful, authorized business purposes.","Promptly remove access for people who no longer require it.","Notify us without undue delay if you suspect unauthorized access.","Ensure users follow these Terms and your organization’s policies."].map((item) => <li key={item} className="flex gap-3"><Check size={16} className="mt-1.5 shrink-0 text-[#13896b]" aria-hidden="true"/><span>{item}</span></li>)}</ul><p>You are responsible for activity performed through your accounts unless caused by our breach of these Terms.</p></section>

                <section aria-labelledby="data"><p className="font-mono text-xs font-bold text-[#e8623c]">04 / DATA</p><h2 id="data" className="mt-3">Customer data and privacy</h2><p>You retain ownership of information submitted to the service (“Customer Data”). You grant us the limited rights needed to host, process, transmit, back up, secure, and display Customer Data to provide and improve the service.</p><p>You are responsible for having a valid legal basis to collect and use Customer Data, including employee, applicant, location, attendance, and performance information. You must provide required notices and obtain required permissions or consents.</p><p>We apply reasonable technical and organizational safeguards and isolate customer workspaces. No system is completely secure, so you should use appropriate access controls and avoid uploading information that is unnecessary for your use of the service.</p></section>

                <section aria-labelledby="acceptable-use"><p className="font-mono text-xs font-bold text-[#e8623c]">05 / CONDUCT</p><h2 id="acceptable-use" className="mt-3">Acceptable use</h2><p>You may not misuse the service or help anyone else do so. Prohibited conduct includes:</p><ul>{["Accessing data, accounts, or systems without authorization.","Uploading unlawful, malicious, infringing, deceptive, or harmful content.","Interfering with the service, bypassing security controls, or probing for vulnerabilities without written permission.","Reverse engineering or copying protected parts of the service except where the law expressly permits it.","Using MobiusEMS for unlawful discrimination, covert surveillance, or solely automated high-impact employment decisions.","Reselling or sublicensing the service unless we agree in writing."].map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e8623c]"/><span>{item}</span></li>)}</ul></section>

                <section aria-labelledby="ai"><p className="font-mono text-xs font-bold text-[#e8623c]">06 / AI</p><h2 id="ai" className="mt-3">AI-assisted features</h2><p>AI features may summarize, classify, match, draft, or suggest information. Their output can be incomplete, inaccurate, or unsuitable for a particular situation. Treat all output as assistance—not fact, professional advice, or an employment decision.</p><p>Qualified people must review AI output before acting on it, especially for hiring, performance, promotion, compensation, discipline, scheduling, or termination. You may not use MobiusEMS to make solely automated decisions that produce legal or similarly significant effects on a person.</p></section>

                <section aria-labelledby="billing"><p className="font-mono text-xs font-bold text-[#e8623c]">07 / COMMERCIAL</p><h2 id="billing" className="mt-3">Subscriptions and payment</h2><p>Fees, billing cycles, usage limits, renewal terms, and taxes are stated in your selected plan or order form. Unless stated otherwise, fees are due in advance and are non-refundable except where required by law or expressly agreed in writing.</p><p>We may change plan pricing or features by giving reasonable advance notice. Changes normally apply from your next renewal. Overdue amounts may result in restricted access or suspension after notice.</p></section>

                <section aria-labelledby="ownership"><p className="font-mono text-xs font-bold text-[#e8623c]">08 / OWNERSHIP</p><h2 id="ownership" className="mt-3">Intellectual property</h2><p>Mobius Bloom and its licensors own the service, software, design, documentation, trademarks, and related intellectual property. Subject to these Terms and payment of applicable fees, we grant you a limited, non-exclusive, non-transferable right to use the service during your subscription.</p><p>If you provide feedback, we may use it without restriction or obligation, provided we do not identify you publicly without permission.</p></section>

                <section aria-labelledby="availability"><p className="font-mono text-xs font-bold text-[#e8623c]">09 / OPERATIONS</p><h2 id="availability" className="mt-3">Availability and changes</h2><p>We work to keep MobiusEMS secure and available, but uninterrupted operation cannot be guaranteed. Maintenance, updates, external providers, internet conditions, emergencies, or events outside reasonable control may affect access.</p><p>We may update features to improve security, reliability, or usability. If a change materially reduces core paid functionality, we will provide reasonable notice when practicable.</p></section>

                <section aria-labelledby="liability"><p className="font-mono text-xs font-bold text-[#e8623c]">10 / RISK</p><h2 id="liability" className="mt-3">Warranties and liability</h2><p>To the extent permitted by law, the service is provided “as is” and “as available”. We disclaim implied warranties that cannot reasonably apply to a software service, including merchantability, fitness for a particular purpose, and non-infringement.</p><p>Neither party is liable for indirect, incidental, special, exemplary, or consequential loss, or for lost profits, revenue, goodwill, or data, to the extent the law permits. Our aggregate liability arising from the service will not exceed the fees paid or payable by the Customer for the service during the twelve months before the event giving rise to the claim.</p><p>Nothing in these Terms excludes liability that cannot lawfully be excluded or limited.</p></section>

                <section aria-labelledby="termination"><p className="font-mono text-xs font-bold text-[#e8623c]">11 / ENDING USE</p><h2 id="termination" className="mt-3">Suspension and termination</h2><p>You may stop using the service at any time and may cancel as described in your plan or order form. We may suspend access where reasonably necessary to address a security risk, unlawful use, material breach, or overdue payment.</p><p>Either party may terminate for a material breach that is not remedied within a reasonable period after written notice. After termination, access ends and Customer Data is handled under the applicable agreement, retention settings, and law. Terms that by nature should survive termination will remain in effect.</p></section>

                <section aria-labelledby="general"><p className="font-mono text-xs font-bold text-[#e8623c]">12 / GENERAL</p><h2 id="general" className="mt-3">General terms</h2><h3>Changes to these Terms</h3><p>We may update these Terms to reflect service, legal, or security changes. We will post the revised version and update its effective date. If a change materially affects your rights, we will take reasonable steps to notify you before it takes effect.</p><h3>Governing law</h3><p>These Terms are governed by the laws of India. Subject to applicable mandatory law, courts in Raipur, Chhattisgarh will have exclusive jurisdiction over disputes arising from these Terms.</p><h3>Entire agreement</h3><p>These Terms, together with applicable order forms and referenced policies, are the entire agreement about the service. If one provision is unenforceable, the remaining provisions continue in effect. A delay in enforcing a right is not a waiver of that right.</p></section>
              </div>

              <div className="mt-20 overflow-hidden rounded-2xl bg-[#102d2c] p-7 text-white sm:p-10">
                <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div><FileText size={24} className="text-[#b6e0c6]" aria-hidden="true"/><h2 className="mt-5 text-2xl font-extrabold tracking-tight">Need clarification?</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/70">For questions about a contract, subscription, or how these Terms apply to your organization, contact our team.</p></div>
                  <a href="mailto:contact@mobiusbloom.com?subject=MobiusEMS%20Terms%20question" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#e8623c] px-5 text-sm font-bold text-white transition-colors hover:bg-[#d95531]">Contact us <ArrowRight size={16} aria-hidden="true"/></a>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#102d2c]/10 pt-8 text-xs text-[#687a74]">
                <span className="inline-flex items-center gap-2"><Building2 size={14} aria-hidden="true"/> Mobius Bloom Venture Pvt Ltd</span>
                <span>India</span>
                <a className="font-semibold text-[#102d2c] hover:text-[#e8623c] hover:underline" href="mailto:contact@mobiusbloom.com">contact@mobiusbloom.com</a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
};
