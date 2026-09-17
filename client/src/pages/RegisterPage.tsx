import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Particles } from "@/components/inspira";

export const RegisterPage = () => {
  // Check if loaded with legacy token in hash
  const [legacyToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const [step, setStep] = useState<"org-basics" | "org-profile" | "account" | "otp" | "legacy" | "complete">(() => (legacyToken ? "legacy" : "org-basics"));
  const [form, setForm] = useState({ name: "", industry: "", companySize: "", country: "", website: "", referralSource: "", primaryUseCase: "", adminName: "", adminEmail: "", password: "", confirmPassword: "", otp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationToken, setRegistrationToken] = useState("");
  const [directOtp, setDirectOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    setPending(true);
    setError("");
    try {
      const result = await api.post<{
        registrationToken: string;
        emailSent?: boolean;
        directOtp?: string;
      }>("/api/v1/registration/request", {
        name: form.name,
        industry: form.industry,
        companySize: form.companySize,
        country: form.country,
        website: form.website,
        referralSource: form.referralSource,
        primaryUseCase: form.primaryUseCase,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
      });

      if (result?.registrationToken) {
        setRegistrationToken(result.registrationToken);
        if (result.directOtp) {
          setDirectOtp(result.directOtp);
          setForm((prev) => ({ ...prev, otp: prev.otp || result.directOtp! }));
        }
        setStep("otp");
        setResendCooldown(30);
        setMessage(
          result.emailSent
            ? `We sent a 6-digit verification code to ${form.adminEmail}.`
            : "Email service is unconfigured or unavailable. Use the direct verification code below."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please make sure both password fields are identical.");
      return;
    }

    setPending(true);
    try {
      const result = await api.post<{ slug: string }>("/api/v1/registration/verify-otp", {
        registrationToken,
        otp: form.otp.trim(),
        password: form.password,
      });

      setCreatedSlug(result.slug);
      setStep("complete");
      setMessage(
        `Your organization is ready! Organization ID: ${result.slug}. Sign in with your email (${form.adminEmail}) and chosen password.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check your code and password.");
    } finally {
      setPending(false);
    }
  };

  const handleLegacyComplete = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please make sure both password fields are identical.");
      return;
    }

    setPending(true);
    try {
      const result = await api.post<{ slug: string }>("/api/v1/registration/complete", {
        token: legacyToken,
        password: form.password,
      });
      setCreatedSlug(result.slug);
      setStep("complete");
      window.history.replaceState(null, "", "/register");
      setMessage(`Your organization is ready! Organization ID: ${result.slug}. Sign in with your registered email and chosen password.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-950 px-4 py-10 overflow-hidden">
      <Particles className="absolute inset-0 pointer-events-none opacity-40" quantity={45} color="#6366f1" />
      <section className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-soft overflow-hidden z-10">
        <p className="text-sm font-medium text-brand-700">MobiusEMS</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {step === "complete"
            ? "Registration complete!"
            : step === "otp"
            ? "Verify email with OTP"
            : step === "legacy"
            ? "Finish organization registration"
            : step === "account"
            ? "Create your administrator account"
            : step === "org-profile"
            ? "Organization profile & focus"
            : "Register your organization"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === "complete"
            ? "Your organization has been successfully created."
            : step === "otp"
            ? `Enter the 6-digit verification code sent to ${form.adminEmail} and set your password.`
            : step === "legacy"
            ? "Choose a secure administrator password to create your workspace."
            : step === "account"
            ? "Your email will identify the correct workspace automatically when you sign in."
            : step === "org-profile"
            ? "Help us tailor MobiusEMS to your team's workflow and primary goals."
            : "Tell us about your company. Your organization ID will be generated automatically."}
        </p>

        {["org-basics", "org-profile", "account"].includes(step) && (
          <div className="mt-5 mb-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-brand-700">
                {step === "org-basics" && "Stage 1: Organization Details"}
                {step === "org-profile" && "Stage 2: Profile & Goals"}
                {step === "account" && "Administrator Account"}
              </span>
              <span className="text-slate-400 font-medium">
                {step === "org-basics" ? "Page 1 of 2" : step === "org-profile" ? "Page 2 of 2" : "Final Step"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  ["org-basics", "org-profile", "account"].includes(step) ? "bg-brand-600" : "bg-slate-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  ["org-profile", "account"].includes(step) ? "bg-brand-600" : "bg-slate-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === "account" ? "bg-brand-600" : "bg-slate-200"
                }`}
              />
            </div>
          </div>
        )}

        {/* Step 3: Registration Complete */}
        {step === "complete" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold text-emerald-900">Workspace successfully created!</p>
              <p className="mt-1 text-xs text-emerald-700">Organization ID: <span className="font-mono font-bold">{createdSlug}</span></p>
              <p className="mt-2 text-xs text-emerald-700">Sign in with your email and chosen password.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {/* Step 2: OTP Verification & Password */}
        {step === "otp" && (
          <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp}>
            {message && (
              <p role="status" className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                {message}
              </p>
            )}

            {directOtp && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <span className="font-semibold">Direct Code:</span> Email service not active on server. Use code:{" "}
                <strong className="font-mono text-sm tracking-wider text-amber-950">{directOtp}</strong>
              </div>
            )}

            <label className="block text-sm font-medium">
              6-Digit Verification Code (OTP)
              <Input
                className="mt-2 text-center font-mono text-xl font-bold tracking-widest"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                placeholder="123456"
                autoFocus
                value={form.otp}
                onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              />
            </label>

            <label className="block text-sm font-medium">
              Set your login password
              <div className="relative mt-2">
                <Input
                  className="pr-10"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="mt-1 block text-xs text-slate-500">
                At least 12 characters (uppercase, lowercase, number & symbol).
              </span>
            </label>

            <label className="block text-sm font-medium">
              Confirm password
              <div className="relative mt-2">
                <Input
                  className="pr-10"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirmPassword && (
                <span
                  className={`mt-1 block text-xs font-medium ${
                    form.password === form.confirmPassword ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button className="w-full" disabled={pending}>
              {pending ? "Verifying…" : "Verify & Create Organization"}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                className="text-brand-700 underline disabled:opacity-50"
                disabled={resendCooldown > 0 || pending}
                onClick={() => handleSendOtp()}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP Code"}
              </button>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setStep("account");
                  setError("");
                }}
              >
                Change details
              </button>
            </div>
          </form>
        )}

        {/* Legacy Hash Token Form */}
        {step === "legacy" && (
          <form className="mt-6 space-y-4" onSubmit={handleLegacyComplete}>
            <label className="block text-sm font-medium">
              Set your login password
              <div className="relative mt-2">
                <Input
                  className="pr-10"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="mt-1 block text-xs text-slate-500">
                At least 12 characters (uppercase, lowercase, number & symbol).
              </span>
            </label>

            <label className="block text-sm font-medium">
              Confirm password
              <div className="relative mt-2">
                <Input
                  className="pr-10"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirmPassword && (
                <span
                  className={`mt-1 block text-xs font-medium ${
                    form.password === form.confirmPassword ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </span>
              )}
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button className="w-full" disabled={pending}>
              {pending ? "Please wait…" : "Create organization"}
            </Button>
          </form>
        )}

        {/* Stage 1: Organization Basics */}
        {step === "org-basics" && (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              setStep("org-profile");
            }}
          >
            <label className="block text-sm font-medium">
              Organization name
              <Input
                className="mt-2"
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Acme Corporation"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Industry
              <select
                required
                className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm focus:border-brand-500 focus:outline-hidden"
                value={form.industry}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
              >
                <option value="">Select industry</option>
                {[
                  "Technology",
                  "Financial services",
                  "Healthcare",
                  "Education",
                  "Retail & e-commerce",
                  "Manufacturing",
                  "Professional services",
                  "Real estate",
                  "Media & entertainment",
                  "Nonprofit",
                  "Other",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Company size
              <select
                required
                className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm focus:border-brand-500 focus:outline-hidden"
                value={form.companySize}
                onChange={(event) => setForm({ ...form, companySize: event.target.value })}
              >
                <option value="">Select employee count</option>
                {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Country
              <Input
                className="mt-2"
                required
                maxLength={80}
                placeholder="e.g. United States, India"
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button className="w-full mt-2 flex items-center justify-center gap-2">
              <span>Next</span>
              <ArrowRight size={16} />
            </Button>
          </form>
        )}

        {/* Stage 2: Organization Profile & Goals */}
        {step === "org-profile" && (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              setStep("account");
            }}
          >
            <label className="block text-sm font-medium">
              Company website <span className="font-normal text-slate-400">(optional)</span>
              <Input
                className="mt-2"
                type="url"
                placeholder="https://company.com"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              What do you want to improve?
              <select
                required
                className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm focus:border-brand-500 focus:outline-hidden"
                value={form.primaryUseCase}
                onChange={(event) => setForm({ ...form, primaryUseCase: event.target.value })}
              >
                <option value="">Select primary goal</option>
                {[
                  "Employee records",
                  "Skills & development",
                  "Performance management",
                  "Attendance",
                  "Sales workforce",
                  "Complete HR operations",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              How did you hear about us?
              <select
                required
                className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm focus:border-brand-500 focus:outline-hidden"
                value={form.referralSource}
                onChange={(event) => setForm({ ...form, referralSource: event.target.value })}
              >
                <option value="">Select source</option>
                {[
                  "Search engine",
                  "Social media",
                  "Friend or colleague",
                  "Partner",
                  "Event",
                  "Advertisement",
                  "Other",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-1.5"
                onClick={() => {
                  setError("");
                  setStep("org-basics");
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </Button>
              <Button className="flex-1 flex items-center justify-center gap-2">
                <span>Next</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Account owner */}
        {step === "account" && (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendOtp();
            }}
          >
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
              Your organization ID is assigned automatically and shown after verification. You will sign in using only your email and password.
            </div>
            <label className="block text-sm font-medium">
              Your name
              <Input
                className="mt-2"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                placeholder="e.g. John Doe"
                value={form.adminName}
                onChange={(event) => setForm({ ...form, adminName: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Work email
              <Input
                className="mt-2"
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="admin@company.com"
                value={form.adminEmail}
                onChange={(event) => setForm({ ...form, adminEmail: event.target.value })}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-1.5"
                onClick={() => {
                  setError("");
                  setStep("org-profile");
                }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </Button>
              <Button className="flex-1" disabled={pending}>
                {pending ? "Sending OTP…" : "Send verification code"}
              </Button>
            </div>
          </form>
        )}

        <Link className="mt-6 block text-sm font-medium text-brand-700" to="/login">
          Already registered? Sign in
        </Link>
      </section>
    </main>
  );
};
