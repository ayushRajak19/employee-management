import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

type Message = { role: "system" | "user"; content: string };
type CompletionInput = { system: string; user: string; temperature?: number; maxTokens?: number };
export interface CompletionResult { text: string; provider: string; model: string }

const defaults = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" },
  together: { baseUrl: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4-20250514" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com", model: "gemini-2.5-flash" },
  generic: { baseUrl: "", model: "" }
} as const;

const apiKey = () => env.AI_API_KEY || (env.AI_PROVIDER === "groq" ? env.GROQ_API_KEY : undefined) || (env.AI_PROVIDER === "openai" ? env.OPENAI_API_KEY : undefined) || (env.AI_PROVIDER === "anthropic" ? env.ANTHROPIC_API_KEY : undefined) || (env.AI_PROVIDER === "gemini" ? env.GEMINI_API_KEY : undefined);
export const aiConfiguration = () => ({ provider: env.AI_PROVIDER, model: env.AI_MODEL || defaults[env.AI_PROVIDER].model, configured: Boolean(apiKey()) });

const responseText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" && item && "text" in item ? String(item.text) : "").join("");
  return "";
};

const requestJson = async (url: string, init: RequestInit): Promise<Record<string, unknown>> => {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(env.AI_TIMEOUT_MS) });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : `Provider returned ${response.status}`;
    throw new AppError(`AI provider request failed: ${detail}`, 502, "AI_PROVIDER_ERROR");
  }
  return payload;
};

export const complete = async (input: CompletionInput): Promise<CompletionResult> => {
  const key = apiKey(); const provider = env.AI_PROVIDER; const model = env.AI_MODEL || defaults[provider].model; const baseUrl = (env.AI_BASE_URL || defaults[provider].baseUrl).replace(/\/$/, "");
  if (!key) throw new AppError("AI is not configured. Add an AI API key in Hostinger environment variables and redeploy.", 503, "AI_NOT_CONFIGURED");
  if (!model || !baseUrl) throw new AppError("AI model or base URL is missing", 503, "AI_NOT_CONFIGURED");
  let text = "";
  if (provider === "anthropic") {
    const payload = await requestJson(`${baseUrl}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, system: input.system, messages: [{ role: "user", content: input.user }], temperature: input.temperature ?? 0.2, max_tokens: input.maxTokens ?? 900 }) });
    text = responseText(payload.content);
  } else if (provider === "gemini") {
    const payload = await requestJson(`${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: input.system }] }, contents: [{ role: "user", parts: [{ text: input.user }] }], generationConfig: { temperature: input.temperature ?? 0.2, maxOutputTokens: input.maxTokens ?? 900 } }) });
    const candidates = payload.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined;
    text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  } else {
    const messages: Message[] = [{ role: "system", content: input.system }, { role: "user", content: input.user }];
    const payload = await requestJson(`${baseUrl}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages, temperature: input.temperature ?? 0.2, max_tokens: input.maxTokens ?? 900 }) });
    const choices = payload.choices as { message?: { content?: unknown } }[] | undefined;
    text = responseText(choices?.[0]?.message?.content);
  }
  if (!text.trim()) throw new AppError("AI provider returned an empty response", 502, "AI_EMPTY_RESPONSE");
  return { text: text.trim(), provider, model };
};
