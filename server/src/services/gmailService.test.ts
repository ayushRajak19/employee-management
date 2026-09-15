import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { GmailConnection } from "../models/GmailConnection.js";
import { GoogleOAuthAttempt } from "../models/GoogleOAuthAttempt.js";
import { EmailWorkflow } from "../models/EmailWorkflow.js";
import { EmailEnrollment } from "../models/EmailEnrollment.js";
import { EmailDelivery } from "../models/EmailDelivery.js";
import { VendorContact } from "../models/VendorContact.js";
import { sendTest, runEmailAutomationCycle } from "./emailAutomationService.js";
import { AuditLog } from "../models/AuditLog.js";
import { Tenant } from "../models/Tenant.js";
import { runWithTenant } from "../tenancy/tenantContext.js";
import { encryptSecret, decryptSecret } from "../utils/secretCipher.js";
import { disconnectGoogle, finishGoogleConnection, gmailAccessToken, gmailRawMessage, gmailScope, googleReady, sendGmailEmail, startGoogleConnection } from "./gmailService.js";

const tenantId = new Types.ObjectId();
const actor = new Types.ObjectId().toString();
const setup = (t: TestContext) => {
  const old = { GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI };
  Object.assign(env, { GOOGLE_CLIENT_ID: "test-client", GOOGLE_CLIENT_SECRET: "test-secret", GOOGLE_REDIRECT_URI: `${env.CLIENT_URL}/api/v1/email-automation/google/callback` });
  t.after(() => Object.assign(env, old));
};
const scoped = (filter: Record<string, unknown>) => assert.equal(String(filter.tenantId), String(tenantId));
const connection = () => ({ _id: new Types.ObjectId(), key: "gmail", email: "vendor@example.com", refreshTokenEncrypted: encryptSecret("refresh-secret"), needsReconnect: false });
const mockConnected = (t: TestContext) => {
  t.mock.method(Tenant.collection, "findOne", async (filter: Record<string, unknown>) => { assert.equal(String(filter._id), String(tenantId)); return { emailSendingProvider: "GMAIL" }; });
  t.mock.method(GmailConnection.collection, "findOne", async (filter: Record<string, unknown>) => { scoped(filter); return connection(); });
  t.mock.method(GmailConnection.collection, "findOneAndUpdate", async (filter: Record<string, unknown>, update: unknown) => { scoped(filter); assert.equal(filter.email, "vendor@example.com"); assert.ok(Array.isArray(update)); assert.ok(filter.$or); return connection(); });
};

test("Google setup fails closed for missing credentials or a cross-origin callback", async (t) => {
  setup(t);
  env.GOOGLE_CLIENT_SECRET = undefined;
  assert.equal(googleReady(), false);
  await assert.rejects(startGoogleConnection(actor), { code: "GOOGLE_SETUP_REQUIRED" });
  env.GOOGLE_CLIENT_SECRET = "test"; env.GOOGLE_REDIRECT_URI = "https://other.example/api/v1/email-automation/google/callback";
  assert.equal(googleReady(), false);
});

test("connect requests send-only scope with offline consent, PKCE and encrypted expiring tenant state", async (t) => {
  setup(t);
  let stored: Record<string, unknown> = {};
  t.mock.method(GoogleOAuthAttempt.collection, "insertOne", async (doc: Record<string, unknown>) => { stored = doc; return { acknowledged: true, insertedId: doc._id }; });
  const result = await runWithTenant(tenantId, () => startGoogleConnection(actor));
  const url = new URL(result.url);
  scoped(stored);
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("scope"), `${gmailScope} https://www.googleapis.com/auth/userinfo.email`);
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  const verifier = decryptSecret(String(stored.verifierEncrypted));
  assert.equal(url.searchParams.get("code_challenge"), createHash("sha256").update(verifier).digest("base64url"));
  assert.notEqual(stored.stateHash, url.searchParams.get("state"));
  assert.ok(+(stored.expiresAt as Date) > Date.now());
  assert.ok(+(stored.expiresAt as Date) <= Date.now() + 600_000);
});

test("callback consumes actor-bound state once, stores only encrypted refresh token and pauses tenant workflows", async (t) => {
  setup(t);
  let used = false; let connected = false; let paused = false;
  t.mock.method(GoogleOAuthAttempt.collection, "findOneAndDelete", async (filter: Record<string, unknown>) => {
    scoped(filter); assert.equal(String(filter.actor), actor); assert.ok(filter.expiresAt);
    if (used) return null; used = true;
    return { verifierEncrypted: encryptSecret("test-verifier") };
  });
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url === "https://oauth2.googleapis.com/token") { assert.equal(new URLSearchParams(String(init?.body)).get("code_verifier"), "test-verifier"); return new Response(JSON.stringify({ access_token: "access", refresh_token: "new-refresh", scope: gmailScope })); }
    assert.equal(url, "https://www.googleapis.com/oauth2/v2/userinfo"); return new Response(JSON.stringify({ email: "vendor@example.com", verified_email: true }));
  });
  t.mock.method(EmailWorkflow.collection, "updateMany", async (filter: Record<string, unknown>) => { scoped(filter); paused = true; return { acknowledged: true }; });
  t.mock.method(GmailConnection.collection, "findOneAndUpdate", async (filter: Record<string, unknown>, update: { $set: Record<string, unknown> }) => { scoped(filter); assert.ok(paused); assert.equal(decryptSecret(String(update.$set.refreshTokenEncrypted)), "new-refresh"); assert.equal(update.$set.email, "vendor@example.com"); connected = true; return connection(); });
  t.mock.method(Tenant.collection, "updateOne", async (filter: Record<string, unknown>, update: { $set: Record<string, unknown> }) => { assert.equal(String(filter._id), String(tenantId)); assert.equal(update.$set.emailSendingProvider, "GMAIL"); return { acknowledged: true }; });
  t.mock.method(AuditLog.collection, "insertOne", async (doc: Record<string, unknown>) => { scoped(doc); assert.ok(!JSON.stringify(doc).includes("new-refresh")); return { acknowledged: true, insertedId: doc._id }; });
  await runWithTenant(tenantId, async () => {
    await finishGoogleConnection(actor, "state", "code");
    await assert.rejects(finishGoogleConnection(actor, "state", "code"), { code: "GOOGLE_STATE_INVALID" });
  });
  assert.ok(connected);
});

test("wrong tenant, actor or expired state cannot exchange Google credentials", async (t) => {
  setup(t);
  t.mock.method(GoogleOAuthAttempt.collection, "findOneAndDelete", async (filter: Record<string, unknown>) => { scoped(filter); assert.ok(filter.expiresAt); return null; });
  t.mock.method(globalThis, "fetch", async () => { assert.fail("State validation must precede provider requests"); });
  await runWithTenant(tenantId, () => assert.rejects(finishGoogleConnection(actor, "bad-state", "code"), { code: "GOOGLE_STATE_INVALID" }));
});

test("denied consent and missing send scope never replace the organization's connection", async (t) => {
  setup(t);
  t.mock.method(GoogleOAuthAttempt.collection, "findOneAndDelete", async () => ({ verifierEncrypted: encryptSecret("verifier") }));
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh", scope: "email" })));
  t.mock.method(GmailConnection.collection, "findOneAndUpdate", async () => assert.fail("No credentials may be saved without scope"));
  await runWithTenant(tenantId, async () => {
    await assert.rejects(finishGoogleConnection(actor, "state"), { code: "GOOGLE_CANCELLED" });
    await assert.rejects(finishGoogleConnection(actor, "state", "code"), { code: "GOOGLE_SCOPE_REQUIRED" });
  });
});

test("Gmail MIME validates addresses, handles Unicode, and cannot inject recipients via subject", async () => {
  const raw = await gmailRawMessage({ from: "vendor@example.com", to: "consented@example.com", subject: "Hello\r\nBcc: stolen@example.com नमस्ते", text: "Hello world", unsubscribeUrl: "https://example.com/unsubscribe/token" });
  const mime = Buffer.from(raw, "base64url").toString();
  assert.match(mime, /From: vendor@example.com/);
  assert.match(mime, /To: consented@example.com/);
  assert.doesNotMatch(mime, /\r\nBcc:/);
  assert.match(mime, /List-Unsubscribe:/);
  await assert.rejects(gmailRawMessage({ from: "evil\r\nBcc: x@example.com", to: "ok@example.com", subject: "hi", text: "hi" }));
});

test("Gmail sends only from the tenant's authorized mailbox and reserves quota before sending", async (t) => {
  setup(t); mockConnected(t);
  let sends = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "access" }));
    assert.equal(url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"); sends++;
    const mime = Buffer.from(JSON.parse(String(init?.body)).raw, "base64url").toString();
    assert.match(mime, /From: vendor@example.com/);
    return new Response(JSON.stringify({ id: "gmail-id" }));
  });
  await runWithTenant(tenantId, async () => {
    const id = await sendGmailEmail({ to: "consented@example.com", subject: "Hi", text: "Test" }, "vendor@example.com");
    assert.equal(id, "gmail:vendor@example.com:gmail-id");
    await assert.rejects(sendGmailEmail({ to: "consented@example.com", subject: "Hi", text: "Test" }, "other@example.com"), { code: "GMAIL_SENDER_CHANGED" });
  });
  assert.equal(sends, 1);
});

test("uncertain Gmail send is surfaced without automatically retrying the provider", async (t) => {
  setup(t); mockConnected(t);
  let sends = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "access" }));
    sends++; throw new Error("timeout");
  });
  await runWithTenant(tenantId, () => assert.rejects(sendGmailEmail({ to: "consented@example.com", subject: "Hi", text: "Test" }, "vendor@example.com"), { code: "GMAIL_SEND_UNCERTAIN" }));
  assert.equal(sends, 1);
});

test("exhausted Gmail quota prevents the send request", async (t) => {
  setup(t); mockConnected(t);
  t.mock.method(GmailConnection.collection, "findOneAndUpdate", async () => null);
  t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.equal(url, "https://oauth2.googleapis.com/token", "No Gmail send is allowed when the atomic reservation fails");
    return new Response(JSON.stringify({ access_token: "access" }));
  });
  await runWithTenant(tenantId, () => assert.rejects(sendGmailEmail({ to: "consented@example.com", subject: "Hi", text: "Test" }, "vendor@example.com"), { code: "GMAIL_DAILY_LIMIT" }));
});

test("Google connection credentials are hidden by default and singleton indexes include tenant", () => {
  assert.equal(GmailConnection.schema.path("refreshTokenEncrypted").options.select, false);
  assert.equal(GoogleOAuthAttempt.schema.path("verifierEncrypted").options.select, false);
  assert.ok(GmailConnection.schema.indexes().some(([fields, options]) => options.unique && fields.tenantId === 1 && fields.key === 1));
  assert.ok(GoogleOAuthAttempt.schema.indexes().some(([fields, options]) => options.expireAfterSeconds === 0 && fields.expiresAt === 1 && Object.keys(fields).length === 1));
});

test("automation test sends dispatch to Gmail, never Brevo, and record SENT rather than DELIVERED", async (t) => {
  setup(t); mockConnected(t);
  let saved: Record<string, unknown> = {};
  t.mock.method(EmailDelivery.collection, "insertOne", async (doc: Record<string, unknown>) => { scoped(doc); saved = doc; return { acknowledged: true, insertedId: doc._id }; });
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "access" }));
    assert.equal(url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    return new Response(JSON.stringify({ id: "test-message" }));
  });
  await runWithTenant(tenantId, () => sendTest("consented@example.com"));
  assert.equal(saved.provider, "GMAIL"); assert.equal(saved.status, "SENT");
});

test("Gmail worker marks uncertain sends FAILED and does not requeue abandoned in-flight sends", async (t) => {
  setup(t); mockConnected(t);
  const enrollment = { _id: new Types.ObjectId(), tenantId, workflow: new Types.ObjectId(), contact: new Types.ObjectId(), step: 0, status: "PROCESSING", attempts: 0 };
  let claimed = false; let finalStatus = ""; let sends = 0;
  t.mock.method(EmailEnrollment.collection, "findOne", async () => ({ _id: enrollment._id }));
  t.mock.method(EmailEnrollment.collection, "updateMany", async (filter: Record<string, unknown>, update: { $set: { status: string } }) => { scoped(filter); assert.equal(update.$set.status, "FAILED"); return { acknowledged: true }; });
  t.mock.method(EmailEnrollment.collection, "findOneAndUpdate", async (filter: Record<string, unknown>) => { scoped(filter); if (claimed) return null; claimed = true; return enrollment; });
  t.mock.method(EmailEnrollment.collection, "updateOne", async (filter: Record<string, unknown>, update: { $set: { status: string } }) => { assert.equal(String(filter._id), String(enrollment._id)); finalStatus = update.$set.status; return { acknowledged: true, matchedCount: 1 }; });
  t.mock.method(EmailWorkflow.collection, "findOne", async () => ({ _id: enrollment.workflow, status: "ACTIVE", subject: "Hi", message: "Consented communication", followUp: false }));
  t.mock.method(VendorContact.collection, "findOne", async () => ({ _id: enrollment.contact, status: "ACTIVE", email: "consented@example.com", name: "Vendor", companyName: "Test", unsubscribeToken: "test-token" }));
  t.mock.method(EmailDelivery.collection, "countDocuments", async () => 0);
  t.mock.method(EmailDelivery.collection, "insertOne", async (doc: Record<string, unknown>) => { scoped(doc); assert.equal(doc.status, "ERROR"); return { acknowledged: true, insertedId: doc._id }; });
  t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "access" }));
    sends++; throw new Error("network timeout after submission");
  });
  await runWithTenant(tenantId, () => runEmailAutomationCycle());
  assert.equal(finalStatus, "FAILED"); assert.equal(sends, 1);
});

test("revoked refresh token marks only the scoped connection as needing reconnection", async (t) => {
  setup(t); mockConnected(t);
  let marked = false;
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }));
  t.mock.method(GmailConnection.collection, "updateOne", async (filter: Record<string, unknown>) => { scoped(filter); assert.ok(filter.refreshTokenEncrypted); marked = true; return { acknowledged: true }; });
  await runWithTenant(tenantId, () => assert.rejects(gmailAccessToken(), { code: "GMAIL_RECONNECT_REQUIRED" }));
  assert.ok(marked);
});

test("disconnect pauses workflows, deletes only tenant credentials and does not fall back to Brevo", async (t) => {
  setup(t);
  t.mock.method(Tenant.collection, "updateOne", async (filter: Record<string, unknown>, update: { $set: Record<string, unknown> }) => { assert.equal(String(filter._id), String(tenantId)); assert.equal(update.$set.emailSendingProvider, "NONE"); return { acknowledged: true }; });
  t.mock.method(EmailWorkflow.collection, "updateMany", async (filter: Record<string, unknown>) => { scoped(filter); return { acknowledged: true }; });
  t.mock.method(GmailConnection.collection, "updateMany", async (filter: Record<string, unknown>, update: { $unset: Record<string, unknown> }) => { scoped(filter); assert.ok(update.$unset.refreshTokenEncrypted); return { acknowledged: true }; });
  t.mock.method(GoogleOAuthAttempt.collection, "deleteMany", async (filter: Record<string, unknown>) => { scoped(filter); return { acknowledged: true }; });
  t.mock.method(AuditLog.collection, "insertOne", async (doc: Record<string, unknown>) => ({ acknowledged: true, insertedId: doc._id }));
  await runWithTenant(tenantId, () => disconnectGoogle(actor));
});
