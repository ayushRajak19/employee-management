import { forwardRef, type HTMLInputTypeAttribute, type InputHTMLAttributes } from "react"; import { cn } from "@/lib/cn";

const defaultPlaceholder = (type: HTMLInputTypeAttribute) => {
  if (type === "email") return "name@company.com";
  if (type === "password") return "Enter your password";
  if (type === "url") return "https://example.com";
  if (type === "tel") return "+91 98765 43210";
  if (type === "number") return "Enter a number";
  if (type === "search") return "Search...";
  if (["date", "datetime-local", "file", "month", "time", "week", "checkbox", "radio", "hidden"].includes(type)) return undefined;
  return "Enter details";
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = "text", placeholder, ...props }, ref) => <input ref={ref} type={type} placeholder={placeholder ?? defaultPlaceholder(type)} className={cn("h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100", className)} {...props}/>); Input.displayName = "Input";
