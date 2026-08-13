import test from "node:test";
import assert from "node:assert/strict";

test("Groq uses the OpenAI-compatible chat completion adapter", async () => {
  process.env.AI_PROVIDER = "groq"; process.env.AI_API_KEY = "test-key"; process.env.AI_MODEL = "test-model";
  const originalFetch = globalThis.fetch; let requestedUrl = ""; let authorization = "";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(input); authorization = String((init?.headers as Record<string, string> | undefined)?.Authorization ?? "");
    return new Response(JSON.stringify({ choices: [{ message: { content: "Grounded response" } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    const { complete } = await import("./llmService.js");
    const result = await complete({ system: "Use evidence", user: "Summarize" });
    assert.equal(result.text, "Grounded response"); assert.equal(result.provider, "groq"); assert.equal(result.model, "test-model");
    assert.equal(requestedUrl, "https://api.groq.com/openai/v1/chat/completions"); assert.equal(authorization, "Bearer test-key");
  } finally { globalThis.fetch = originalFetch; }
});
