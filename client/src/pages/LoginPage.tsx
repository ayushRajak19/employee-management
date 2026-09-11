import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import logo from "@/assets/mobius-mark.png";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/client"; import { Button } from "@/components/ui/Button"; import { Input } from "@/components/ui/Input"; import { authApi } from "@/features/auth/authApi"; import { useAuth } from "@/features/auth/AuthProvider";

const schema = z.object({ email: z.string().email("Enter a valid official email"), password: z.string().min(8, "Password must be at least 8 characters") });
type FormValues = z.infer<typeof schema>;
export const LoginPage = () => {
  const navigate = useNavigate(); const location = useLocation(); const { user, setUser } = useAuth(); const [showPassword, setShowPassword] = useState(false);
  const passwordChanged = Boolean((location.state as { passwordChanged?: boolean } | null)?.passwordChanged);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const mutation = useMutation({ mutationFn: authApi.login, onSuccess: ({ user: nextUser }) => { setUser(nextUser); navigate(nextUser.forcePasswordChange ? "/change-password" : "/", { replace: true }); } });
  if (user) return <Navigate to={user.forcePasswordChange ? "/change-password" : "/"} replace/>;
  return <main className="grid min-h-screen bg-white lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 18% 22%, #9b7be8 0, transparent 28%), radial-gradient(circle at 80% 82%, #654aa8 0, transparent 35%)" }}/>
      <div className="relative flex items-center gap-3">
        <img src={logo} alt="" className="h-14 w-11 object-contain" />
        <div><p className="text-lg font-semibold">MobiusEMS</p><p className="text-xs text-white/60">A flagship product of Mobius Bloom Venture Pvt Ltd</p></div>
      </div>
      <div className="relative max-w-xl"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100">Capability · Quality · Growth</span><h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.08]">See the strengths behind every great team.</h1><p className="mt-5 max-w-lg text-base leading-7 text-white/65">A clearer view of skills, delivery, goals and growth—built to help people thrive, not measure time online.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{["Explainable performance", "Verified capability profiles", "Balanced workload signals", "Human-led decisions"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-white/80"><CheckCircle2 size={16} className="text-violet-200"/>{item}</div>)}</div></div>
      <p className="relative text-xs text-white/40">Secure workforce workspace · employee.whalexy.com</p>
    </section>
    <section className="flex items-center justify-center px-6 py-12 sm:px-12"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3 lg:hidden">
        <img src={logo} alt="" className="h-12 w-10 object-contain" />
        <div><span className="block font-semibold">MobiusEMS</span><span className="text-[10px] text-slate-400">by Mobius Bloom Venture Pvt Ltd</span></div>
      </div><div className="mb-8"><div className="mb-4 grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShieldCheck size={22}/></div><h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the credentials provided by your administrator.</p></div>
      {passwordChanged && <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/><span>Password updated successfully. Sign in with your new password.</span></div>}
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate><div><label className="mb-2 block text-sm font-medium" htmlFor="email">Official email</label><Input id="email" type="email" autoComplete="username" placeholder="you@company.com" {...form.register("email")}/>{form.formState.errors.email && <p className="mt-1.5 text-xs text-red-600">{form.formState.errors.email.message}</p>}</div><div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium" htmlFor="password">Password</label></div><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-11" {...form.register("password")}/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{form.formState.errors.password && <p className="mt-1.5 text-xs text-red-600">{form.formState.errors.password.message}</p>}</div>{mutation.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{mutation.error instanceof ApiError ? mutation.error.message : "Unable to sign in"}</div>}<Button className="w-full" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Signing in…" : <>Sign in securely <ArrowRight size={16}/></>}</Button></form>
      <p className="mt-5 text-center text-sm"><Link className="font-medium text-brand-700 underline" to="/forgot-password">Forgot Super Admin password?</Link></p><p className="mt-3 text-center text-sm text-slate-500">New to MobiusEMS? <Link className="font-medium text-brand-700 underline" to="/register">Register your organization</Link></p></div></section>
  </main>;
};
