import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  MapPin,
  Mic,
  ArrowUpRight,
} from "lucide-react";
import logo from "@/assets/mobius-mark.png";
import { useAuth } from "@/features/auth/AuthProvider";

export const MarketingFooter = () => {
  const { user } = useAuth();

  return (
    <footer className="w-full bg-[#102d2c] text-slate-300 border-t border-[#102d2c]/20">
      {/* Upper Main Footer Grid */}
      <div className="mx-auto max-w-[1360px] px-6 py-16 sm:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand, Tagline & Trust Badges (Span 4) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <Link
                to="/welcome"
                className="inline-flex items-center gap-3 text-white transition-opacity hover:opacity-90"
              >
                <img
                  src={logo}
                  alt="MobiusEMS Mark"
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white leading-none">
                    MobiusEMS
                  </span>
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-emerald-400">
                    Workforce Operating System
                  </span>
                </div>
              </Link>

              <p className="max-w-sm text-xs leading-relaxed text-slate-300">
                A unified platform connecting dynamic organization hierarchy, task delivery,
                verified skills, explainable performance intelligence, and privacy-first local AI.
              </p>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <p className="text-[11px] font-medium text-slate-200">
                  A flagship product of{" "}
                  <strong className="text-white font-semibold">
                    Mobius Bloom Venture Pvt Ltd
                  </strong>
                </p>
                <p className="mt-1 text-[10px] text-emerald-400/90">
                  Registered in India · Enterprise Workforce Solutions
                </p>
              </div>
            </div>

            {/* Privacy & Ethical Guarantee Badges */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
                <span>Zero Employee Surveillance (No keyloggers or screen capture)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <MapPin size={14} className="shrink-0 text-emerald-400" />
                <span>300m Geofencing (Biometric-free workplace presence)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <Mic size={14} className="shrink-0 text-emerald-400" />
                <span>100% Local Speech-to-Task (Zero third-party audio retention)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <Lock size={14} className="shrink-0 text-emerald-400" />
                <span>Fail-Closed Multi-Tenancy & Section-Scoped RBAC</span>
              </div>
            </div>
          </div>

          {/* Column 2: Capabilities (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Workforce Capabilities
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/solutions/employee-360"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Employee 360 Profiles
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/work-attendance"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Smart Geofenced Attendance
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/skills-development"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Verified Skill Matrix & Heatmaps
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/performance-contribution"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Evidence-Based Performance Reviews
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/voice-task-assistant"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Local Multilingual Voice-to-Task
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/ai-recruitment"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Advisory Resume Screener (ATS)
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/email-automation"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Responsible Email Automation
                </Link>
              </li>
              <li>
                <Link
                  to="/solutions/secure-operations"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Security & Tenant Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Architecture & Modules (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Platform Architecture
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="/welcome#enterprise-engine"
                  className="hover:text-white hover:underline transition-colors"
                >
                  The Enterprise Engine
                </a>
              </li>
              <li>
                <a
                  href="/welcome#enterprise-engine"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Hierarchical Blocker Triage
                </a>
              </li>
              <li>
                <a
                  href="/welcome#enterprise-engine"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Workload Radar & Burnout Defense
                </a>
              </li>
              <li>
                <a
                  href="/welcome#intelligence"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Permission-Scoped AI Workspace
                </a>
              </li>
              <li>
                <a
                  href="/welcome#product"
                  className="hover:text-white hover:underline transition-colors"
                >
                  30s Polling Leadership Telemetry
                </a>
              </li>
              <li>
                <Link
                  to="/solutions"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-colors"
                >
                  <span>Explore All 9 Capabilities</span>
                  <ArrowUpRight size={13} />
                </Link>
              </li>
              <li>
                <a
                  href="/welcome#faq"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Product Principles & FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Workspace Access (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Workspace Access
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to={user ? "/" : "/login"}
                  className="hover:text-white hover:underline transition-colors font-medium text-white"
                >
                  {user ? "Open Dashboard →" : "Sign In to Team →"}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Register New Organization
                </Link>
              </li>
              <li>
                <Link
                  to="/forgot-password"
                  className="hover:text-white hover:underline transition-colors"
                >
                  Reset Password
                </Link>
              </li>
              <li>
                <Link
                  to="/platform/login"
                  className="hover:text-white hover:underline transition-colors text-slate-400"
                >
                  Platform Tenant Portal
                </Link>
              </li>
            </ul>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                System Health
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>Operational (v2.4.0)</span>
              </div>
              <p className="text-[10px] text-slate-400">
                100% Server-side isolation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-white/10 bg-[#0c2423]">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] text-slate-400 sm:flex-row sm:px-10">
          <p>© 2026 Mobius Bloom Venture Pvt Ltd. All rights reserved.</p>

          <p className="text-center sm:text-right text-slate-400 font-medium">
            Respectful accountability over invasive surveillance · Zero automated personnel decisions.
          </p>
        </div>
      </div>
    </footer>
  );
};
