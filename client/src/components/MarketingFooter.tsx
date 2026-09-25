import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  ChevronRight,
  Lock,
  MapPin,
  Mic,
  ShieldCheck,
} from "lucide-react";
import logo from "@/assets/mobius-ems-official-logo.png";
import { useAuth } from "@/features/auth/AuthProvider";

export const MarketingFooter = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (location.pathname === "/welcome" || location.pathname === "/") {
      e.preventDefault();
      const targetId = hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", hash);
      }
    } else {
      navigate(`/welcome${hash}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t border-[#1a3e3c] bg-gradient-to-b from-[#0e2726] to-[#071615] text-slate-300 antialiased">
      {/* Top Ambient Glow Line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Main Footer Container */}
      <div className="mx-auto max-w-[1360px] px-6 py-16 sm:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand Identity, Legal Entity & Privacy Guarantees (Span 4) */}
          <div className="flex flex-col justify-between space-y-6 sm:col-span-2 lg:col-span-4">
            <div className="space-y-4">
              <Link
                to="/welcome"
                onClick={(e) => {
                  if (location.pathname === "/welcome" || location.pathname === "/") {
                    e.preventDefault();
                    scrollToTop();
                  }
                }}
                className="group inline-flex items-center gap-3 transition-opacity hover:opacity-95"
                aria-label="MobiusEMS Homepage"
              >
                <img
                  src={logo}
                  alt="MobiusEMS Logo"
                  className="h-12 w-auto max-w-[220px] rounded-md object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </Link>

              <p className="max-w-sm text-xs leading-relaxed text-slate-300">
                A unified enterprise platform connecting organization hierarchy, live blocker
                triage, verified skills, explainable performance intelligence, and privacy-first
                local AI.
              </p>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
                <p className="text-[11px] font-medium text-slate-200">
                  A flagship product of{" "}
                  <strong className="font-semibold text-white">
                    Mobius Bloom Venture Pvt Ltd
                  </strong>
                </p>
                <p className="mt-1 text-[10px] text-emerald-400">
                  Registered in India · Enterprise Workforce Solutions
                </p>
              </div>
            </div>

            {/* Privacy & Ethical Guarantee Badges */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
                <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
                <span>Zero Employee Surveillance (No keyloggers or screen capture)</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
                <MapPin size={15} className="shrink-0 text-emerald-400" />
                <span>300m Haversine Geofencing (Biometric-hardware free)</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
                <Mic size={15} className="shrink-0 text-emerald-400" />
                <span>Local Speech-to-Task (Zero 3rd-party audio retention)</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
                <Lock size={15} className="shrink-0 text-emerald-400" />
                <span>Fail-Closed Multi-Tenancy & Section-Scoped RBAC</span>
              </div>
            </div>
          </div>

          {/* Column 2: Workforce Capabilities (Span 3) */}
          <div className="space-y-4 lg:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Workforce Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/solutions/employee-360"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Employee 360 Profiles</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/work-attendance"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Smart Geofenced Attendance</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/skills-development"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Verified Skill Matrix & Heatmaps</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/performance-contribution"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Evidence-Based Reviews</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/mobius-ems-ai"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>MobiusEMS AI Workspace</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/voice-task-assistant"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Multilingual Voice-to-Task</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/ai-recruitment"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Advisory Resume Screener ATS</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/email-automation"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Responsible Email Automation</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/secure-operations"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Enterprise Security & RBAC</span>
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  to="/solutions"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 transition-colors hover:text-white hover:underline"
                >
                  <span>Explore All 9 Capabilities</span>
                  <ArrowUpRight size={13} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Architecture & Live Tour (Span 3) */}
          <div className="space-y-4 lg:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Platform Architecture
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="#product"
                  onClick={(e) => handleAnchorClick(e, "#product")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Interactive Showroom & Telemetry</span>
                </a>
              </li>
              <li>
                <a
                  href="#intelligence"
                  onClick={(e) => handleAnchorClick(e, "#intelligence")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Permission-Scoped AI Boundaries</span>
                </a>
              </li>
              <li>
                <a
                  href="#enterprise-engine"
                  onClick={(e) => handleAnchorClick(e, "#enterprise-engine")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>The Enterprise Engine</span>
                </a>
              </li>
              <li>
                <a
                  href="#enterprise-engine"
                  onClick={(e) => handleAnchorClick(e, "#enterprise-engine")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Hierarchical Delivery & Resolution</span>
                </a>
              </li>
              <li>
                <a
                  href="#enterprise-engine"
                  onClick={(e) => handleAnchorClick(e, "#enterprise-engine")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Workload Radar & Burnout Defense</span>
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleAnchorClick(e, "#features")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Every Feature Has a Job</span>
                </a>
              </li>
              <li>
                <a
                  href="#human-advantage"
                  onClick={(e) => handleAnchorClick(e, "#human-advantage")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>The Human Advantage Stories</span>
                </a>
              </li>
              <li>
                <a
                  href="#voice"
                  onClick={(e) => handleAnchorClick(e, "#voice")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Multilingual Voice Control</span>
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleAnchorClick(e, "#faq")}
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1 cursor-pointer"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Product Principles & FAQ</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Workspace Access & System Health (Span 2) */}
          <div className="space-y-4 lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Workspace Access
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to={user ? "/" : "/login"}
                  className="inline-flex items-center gap-1.5 font-bold text-white transition-colors hover:text-emerald-400 hover:underline"
                >
                  <span>{user ? "Open Dashboard →" : "Sign In to Team →"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Register Organization</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/forgot-password"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Reset Password</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/platform/login"
                  className="group inline-flex items-center gap-1.5 text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <ChevronRight size={12} className="text-emerald-500/70 transition-transform group-hover:text-emerald-400" />
                  <span>Platform Tenant Portal</span>
                </Link>
              </li>
            </ul>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Platform Status
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>Operational (v2.4.0)</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                100% Server-side multi-tenant isolation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-white/10 bg-[#071615]">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:px-10">
          <p className="text-center sm:text-left">
            © 2026 Mobius Bloom Venture Pvt Ltd. All rights reserved.
          </p>

          <p className="max-w-md text-center text-[11px] text-slate-400 sm:text-center">
            Respectful accountability over invasive surveillance · Zero automated personnel decisions.
          </p>

          <Link
            to="/terms"
            className="inline-flex min-h-9 items-center text-xs font-medium text-slate-300 transition-colors hover:text-white hover:underline"
          >
            Terms &amp; Conditions
          </Link>

          <Link
            to="/privacy"
            className="inline-flex min-h-9 items-center text-xs font-medium text-slate-300 transition-colors hover:text-white hover:underline"
          >
            Privacy Policy
          </Link>

          {/* Back to top interactive action */}
          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-emerald-400/40 hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Scroll back to top of page"
          >
            <span>Back to top</span>
            <ArrowUp
              size={13}
              className="text-emerald-400 transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </footer>
  );
};
