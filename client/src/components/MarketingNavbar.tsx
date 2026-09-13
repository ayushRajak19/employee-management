import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  FileSearch,
  Fingerprint,
  MailCheck,
  Menu,
  Mic,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import logo from "@/assets/mobius-mark.svg";
import { useAuth } from "@/features/auth/AuthProvider";
import { ShimmerButton } from "@/components/inspira";

const capabilitiesGroups = [
  {
    heading: "Workforce & Delivery",
    items: [
      {
        slug: "employee-360",
        name: "Employee 360",
        desc: "Complete employee record, profile, & timeline",
        Icon: Users,
        accent: "#e8623c",
      },
      {
        slug: "work-attendance",
        name: "Work & Attendance",
        desc: "Task boards, deadlines, & geofenced check-in",
        Icon: BriefcaseBusiness,
        accent: "#136f63",
      },
      {
        slug: "voice-task-assistant",
        name: "Voice Task Control",
        desc: "Multilingual spoken task triage & automation",
        Icon: Mic,
        accent: "#d84b69",
      },
    ],
  },
  {
    heading: "Capability & Performance",
    items: [
      {
        slug: "skills-development",
        name: "Skills & Development",
        desc: "Verified competency matrix & department heatmaps",
        Icon: Sparkles,
        accent: "#6557d9",
      },
      {
        slug: "performance-contribution",
        name: "Performance & Reviews",
        desc: "Goals, KPIs, check-ins, & evidence reviews",
        Icon: Target,
        accent: "#bd7a16",
      },
      {
        slug: "mobius-ems-ai",
        name: "MobiusEMS AI",
        desc: "Permission-aware conversational workforce intelligence",
        Icon: Bot,
        accent: "#5142cb",
      },
    ],
  },
  {
    heading: "Enterprise & Scale",
    items: [
      {
        slug: "ai-recruitment",
        name: "AI Recruitment",
        desc: "Resume ATS parser, JD matching, & candidate fit",
        Icon: FileSearch,
        accent: "#1478a3",
      },
      {
        slug: "email-automation",
        name: "Email Automation",
        desc: "Workflow sequences & outreach delivery tracking",
        Icon: MailCheck,
        accent: "#a84f19",
      },
      {
        slug: "secure-operations",
        name: "Secure Operations",
        desc: "Multi-tenant isolation, RBAC, & immutable audit logs",
        Icon: Fingerprint,
        accent: "#233e3a",
      },
    ],
  },
];

export const MarketingNavbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileCapabilitiesOpen, setMobileCapabilitiesOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    setMobileOpen(false);
    setDropdownOpen(false);

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

  const destination = user ? "/" : "/register";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#f7f6ef]/90 backdrop-blur-md shadow-[0_4px_24px_rgba(16,45,44,0.06)] border-b border-[#102d2c]/10 py-3"
          : "bg-[#f7f6ef]/60 backdrop-blur-sm border-b border-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/welcome"
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="MobiusEMS home"
        >
          <img
            src={logo}
            alt=""
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-xl tracking-tight text-[#102d2c]">
              MobiusEMS
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold tracking-[0.2em] text-[#63766e] pl-2 border-l border-[#cbd1c7]">
              BY MOBIUS BLOOM
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#102d2c]/[0.03] border border-[#102d2c]/[0.06]"
          aria-label="Main navigation"
        >
          {/* Capabilities Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              onMouseEnter={() => setDropdownOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                dropdownOpen
                  ? "bg-white text-[#102d2c] shadow-sm"
                  : "text-[#3f5350] hover:text-[#102d2c] hover:bg-white/80"
              }`}
              aria-expanded={dropdownOpen}
            >
              Capabilities
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mega Menu Dropdown */}
            {dropdownOpen && (
              <div
                onMouseLeave={() => setDropdownOpen(false)}
                className="absolute left-1/2 -translate-x-1/3 top-full mt-3 w-[720px] rounded-2xl border border-[#102d2c]/10 bg-[#f7f6ef]/95 backdrop-blur-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="grid grid-cols-3 gap-6">
                  {capabilitiesGroups.map((group) => (
                    <div key={group.heading} className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#72827d]">
                        {group.heading}
                      </p>
                      <div className="space-y-1">
                        {group.items.map(({ slug, name, desc, Icon, accent }) => (
                          <Link
                            key={slug}
                            to={`/solutions/${slug}`}
                            onClick={() => setDropdownOpen(false)}
                            className="group/item flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#102d2c]/5 transition-colors"
                          >
                            <div
                              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg transition-transform group-hover/item:scale-110"
                              style={{ backgroundColor: `${accent}18`, color: accent }}
                            >
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#102d2c] group-hover/item:text-[#e8623c] transition-colors">
                                {name}
                              </p>
                              <p className="text-[10px] text-[#63766e] leading-snug line-clamp-2">
                                {desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-[#102d2c]/10 flex items-center justify-between">
                  <span className="text-xs text-[#63766e]">
                    9 connected workforce & intelligence modules
                  </span>
                  <Link
                    to="/solutions"
                    onClick={() => setDropdownOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8623c] hover:underline"
                  >
                    View complete platform catalog <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Direct section anchor links */}
          <a
            href="#features"
            onClick={(e) => handleAnchorClick(e, "#features")}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#3f5350] hover:text-[#102d2c] hover:bg-white/80 rounded-full transition-all duration-150"
          >
            Features
          </a>
          <a
            href="#enterprise-engine"
            onClick={(e) => handleAnchorClick(e, "#enterprise-engine")}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#3f5350] hover:text-[#102d2c] hover:bg-white/80 rounded-full transition-all duration-150"
          >
            Enterprise Engine
          </a>
          <a
            href="#product"
            onClick={(e) => handleAnchorClick(e, "#product")}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#3f5350] hover:text-[#102d2c] hover:bg-white/80 rounded-full transition-all duration-150"
          >
            Live Showroom
          </a>
          <Link
            to="/solutions/mobius-ems-ai"
            className="px-3.5 py-1.5 text-xs font-semibold text-[#3f5350] hover:text-[#102d2c] hover:bg-white/80 rounded-full transition-all duration-150 flex items-center gap-1"
          >
            <Sparkles size={12} className="text-violet-600" />
            AI Workspace
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            to={user ? "/" : "/login"}
            className="text-xs font-semibold text-[#102d2c] hover:text-[#e8623c] transition-colors px-2 py-1"
          >
            {user ? "Workspace" : "Sign in"}
          </Link>
          <Link to={destination}>
            <ShimmerButton
              background="#102d2c"
              shimmerColor="#34d399"
              className="text-xs font-semibold py-2 px-4 gap-1.5 rounded-full shadow-sm hover:shadow-md"
            >
              Start building <ArrowRight size={14} />
            </ShimmerButton>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to={user ? "/" : "/login"}
            className="text-xs font-semibold text-[#102d2c] px-2 py-1"
          >
            {user ? "Workspace" : "Sign in"}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-9 place-items-center rounded-lg text-[#102d2c] hover:bg-[#102d2c]/5 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#102d2c]/10 bg-[#f7f6ef]/98 backdrop-blur-xl px-4 py-5 shadow-xl max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-1">
            {/* Mobile Capabilities Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileCapabilitiesOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-bold text-[#102d2c] hover:bg-[#102d2c]/5 rounded-xl transition-colors"
              >
                <span>Capabilities & Modules</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    mobileCapabilitiesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileCapabilitiesOpen && (
                <div className="my-2 space-y-3 pl-3 pr-1 py-2 border-l-2 border-[#102d2c]/15 ml-2">
                  {capabilitiesGroups.map((group) => (
                    <div key={group.heading} className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#72827d]">
                        {group.heading}
                      </p>
                      {group.items.map(({ slug, name, Icon, accent }) => (
                        <Link
                          key={slug}
                          to={`/solutions/${slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#102d2c] hover:bg-[#102d2c]/5 rounded-lg"
                        >
                          <Icon size={14} style={{ color: accent }} />
                          <span>{name}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link
                    to="/solutions"
                    onClick={() => setMobileOpen(false)}
                    className="block pt-1 text-xs font-bold text-[#e8623c]"
                  >
                    View all 9 modules →
                  </Link>
                </div>
              )}
            </div>

            <a
              href="#features"
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="px-3 py-2.5 text-sm font-medium text-[#102d2c] hover:bg-[#102d2c]/5 rounded-xl transition-colors"
            >
              Features
            </a>
            <a
              href="#enterprise-engine"
              onClick={(e) => handleAnchorClick(e, "#enterprise-engine")}
              className="px-3 py-2.5 text-sm font-medium text-[#102d2c] hover:bg-[#102d2c]/5 rounded-xl transition-colors"
            >
              Enterprise Engine
            </a>
            <a
              href="#product"
              onClick={(e) => handleAnchorClick(e, "#product")}
              className="px-3 py-2.5 text-sm font-medium text-[#102d2c] hover:bg-[#102d2c]/5 rounded-xl transition-colors"
            >
              Live Showroom
            </a>
            <Link
              to="/solutions/mobius-ems-ai"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#102d2c] hover:bg-[#102d2c]/5 rounded-xl transition-colors"
            >
              <Sparkles size={16} className="text-violet-600" />
              AI Workspace
            </Link>
          </nav>

          <div className="mt-5 pt-4 border-t border-[#102d2c]/10 flex flex-col gap-2.5">
            <Link
              to={destination}
              onClick={() => setMobileOpen(false)}
              className="w-full"
            >
              <ShimmerButton
                background="#102d2c"
                shimmerColor="#34d399"
                className="w-full text-xs font-semibold py-2.5 justify-center gap-2 rounded-xl"
              >
                Start building <ArrowRight size={14} />
              </ShimmerButton>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
