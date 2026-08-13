import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

const schema = z.object({
  currentPassword: z.string().min(8, "Enter the complete temporary password"),
  newPassword: z.string()
    .min(12, "New password must contain at least 12 characters")
    .max(128, "New password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Add at least one uppercase letter")
    .regex(/[a-z]/, "Add at least one lowercase letter")
    .regex(/[0-9]/, "Add at least one number")
    .regex(/[^A-Za-z0-9]/, "Add at least one symbol"),
  confirmPassword: z.string().min(1, "Confirm your new password")
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "New passwords do not match"
});

type Values = z.infer<typeof schema>;

const passwordRules = [
  { label: "12+ characters", test: (value: string) => value.length >= 12 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
  { label: "Symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) }
];

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });
  const newPassword = form.watch("newPassword");

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword: nextPassword }: Values) => authApi.changePassword({ currentPassword, newPassword: nextPassword }),
    onSuccess: () => {
      setUser(null);
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    }
  });

  const registerField = (name: keyof Values) => form.register(name, { onChange: () => mutation.reset() });

  return <main className="grid min-h-screen place-items-center px-4 py-8 sm:px-6">
    <section className="w-full max-w-lg rounded-3xl border bg-white p-6 shadow-soft sm:p-10">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><KeyRound/></div>
      <h1 className="mt-6 text-2xl font-semibold">Create your secure password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Your temporary password must be replaced before you can enter the workspace.</p>

      <form className="mt-8 space-y-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="current-password">Temporary password</label>
          <div className="relative">
            <Input id="current-password" type={showCurrentPassword ? "text" : "password"} autoComplete="current-password" className="pr-11" aria-invalid={Boolean(form.formState.errors.currentPassword)} {...registerField("currentPassword")}/>
            <button type="button" aria-label={showCurrentPassword ? "Hide temporary password" : "Show temporary password"} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setShowCurrentPassword((value) => !value)}>{showCurrentPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
          </div>
          {form.formState.errors.currentPassword && <p role="alert" className="mt-1.5 text-xs text-red-600">{form.formState.errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="new-password">New password</label>
          <div className="relative">
            <Input id="new-password" type={showNewPassword ? "text" : "password"} autoComplete="new-password" className="pr-11" aria-invalid={Boolean(form.formState.errors.newPassword)} {...registerField("newPassword")}/>
            <button type="button" aria-label={showNewPassword ? "Hide new passwords" : "Show new passwords"} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setShowNewPassword((value) => !value)}>{showNewPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
          </div>
          {form.formState.errors.newPassword && <p role="alert" className="mt-1.5 text-xs text-red-600">{form.formState.errors.newPassword.message}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Password requirements">
            {passwordRules.map((rule) => {
              const met = rule.test(newPassword);
              return <span key={rule.label} className={cn("inline-flex items-center gap-1 text-xs", met ? "text-emerald-600" : "text-slate-400")}><Check size={13}/>{rule.label}</span>;
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="confirm-password">Confirm new password</label>
          <Input id="confirm-password" type={showNewPassword ? "text" : "password"} autoComplete="new-password" aria-invalid={Boolean(form.formState.errors.confirmPassword)} {...registerField("confirmPassword")}/>
          {form.formState.errors.confirmPassword && <p role="alert" className="mt-1.5 text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>}
        </div>

        {mutation.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{mutation.error instanceof ApiError ? mutation.error.message : "Password could not be changed. Please try again."}</div>}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Updating password..." : "Update password"}</Button>
      </form>
    </section>
  </main>;
};
