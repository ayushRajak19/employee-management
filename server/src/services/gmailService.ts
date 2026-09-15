import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { env } from "../config/env.js";
import { GmailConnection } from "../models/GmailConnection.js";
import { GoogleOAuthAttempt } from "../models/GoogleOAuthAttempt.js";
import { Tenant } from "../models/Tenant.js";
import { EmailWorkflow } from "../models/EmailWorkflow.js";
import { requireTenantId } from "../tenancy/tenantContext.js";
import { encryptSecret, decryptSecret } from "../utils/secretCipher.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";

export const gmailScope = "https://www.googleapis.com/auth/gmail.send";
const hash = (value: string) => createHash("sha256").update(value).digest("base64url");
export const googleReady = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) return false;
  const callback = new URL(env.GOOGLE_REDIRECT_URI);
  return callback.origin === new URL(env.CLIENT_URL).origin && callback.pathname === "/api/v1/email-automation/google/callback" && !callback.search && !callback.hash && (env.NODE_ENV !== "production" || callback.protocol === "https:");
};
const requireGoogle = () => {
  if (!googleReady()) throw new AppError("The platform administrator must configure Google OAuth before vendors can connect Gmail", 503, "GOOGLE_SETUP_REQUIRED");
};
type Tokens = { access_token?: string; refresh_token?: string; scope?: string; error?: string };
const tokenRequest = async (params: Record<string, string>): Promise<Tokens> => {
  requireGoogle();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, ...params }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as Tokens;
  if (!response.ok || !payload.access_token) throw new AppError("Google authorization could not be renewed. Reconnect Gmail or check the platform OAuth setup.", 409, payload.error === "invalid_grant" ? "GMAIL_RECONNECT_REQUIRED" : "GOOGLE_AUTH_FAILED");
  return payload;
};

export const startGoogleConnection = async (actor: string) => {
  requireGoogle();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  await GoogleOAuthAttempt.create({ stateHash: hash(state), actor, verifierEncrypted: encryptSecret(verifier), expiresAt: new Date(Date.now() + 10 * 60_000) });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, redirect_uri: env.GOOGLE_REDIRECT_URI!, response_type: "code", scope: `${gmailScope} https://www.googleapis.com/auth/userinfo.email`, access_type: "offline", prompt: "consent select_account", state, code_challenge: hash(verifier), code_challenge_method: "S256" }).toString();
  return { url: url.toString() };
};

export const finishGoogleConnection = async (actor: string, state: string, code?: string) => {
  requireGoogle();
  if (!state || state.length > 200) throw new AppError("Invalid Google connection state. Start again.", 400, "GOOGLE_STATE_INVALID");
  // Atomic consumption plus authenticated actor and tenant binding prevents replay
  // and connecting a mailbox to another vendor's organization.
  const attempt = await GoogleOAuthAttempt.findOneAndDelete({ stateHash: hash(state), actor, expiresAt: { $gt: new Date() } }).select("+verifierEncrypted");
  if (!attempt) throw new AppError("Google connection expired or was already used. Start again.", 400, "GOOGLE_STATE_INVALID");
  if (!code) throw new AppError("Google connection was cancelled", 400, "GOOGLE_CANCELLED");
  const tokens = await tokenRequest({ code, code_verifier: decryptSecret(attempt.verifierEncrypted), redirect_uri: env.GOOGLE_REDIRECT_URI!, grant_type: "authorization_code" });
  if (!tokens.scope?.split(" ").includes(gmailScope) || !tokens.refresh_token) throw new AppError("Approve Gmail sending and offline access, then connect again", 409, "GOOGLE_SCOPE_REQUIRED");
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(20_000) });
  const identity = await response.json() as { email?: string; verified_email?: boolean };
  if (!response.ok || identity.verified_email !== true || !z.string().email().safeParse(identity.email).success) throw new AppError("Google did not confirm a verified email address", 409, "GOOGLE_IDENTITY_INVALID");
  await EmailWorkflow.updateMany({ status: "ACTIVE" }, { $set: { status: "PAUSED" } });
  await GmailConnection.findOneAndUpdate({ key: "gmail" }, { $set: { email: identity.email!.toLowerCase(), refreshTokenEncrypted: encryptSecret(tokens.refresh_token), connectedBy: actor, connectedAt: new Date(), needsReconnect: false } }, { upsert: true });
  await Tenant.updateOne({ _id: requireTenantId() }, { $set: { emailSendingProvider: "GMAIL" } });
  await writeAudit({ user: actor as never, action: "GMAIL_CONNECTED", entityType: "Tenant", entityId: requireTenantId().toString(), newValue: { email: identity.email } });
};

export const disconnectGoogle = async (actor: string) => {
  // Local disconnection does not revoke a shared Google grant used by another
  // organization. The owner can revoke it in their Google Account security page.
  await Tenant.updateOne({ _id: requireTenantId() }, { $set: { emailSendingProvider: "NONE" } });
  await EmailWorkflow.updateMany({ status: "ACTIVE" }, { $set: { status: "PAUSED" } });
  await GmailConnection.updateMany({ key: "gmail" }, { $unset: { refreshTokenEncrypted: 1 }, $set: { needsReconnect: true } });
  await GoogleOAuthAttempt.deleteMany({});
  await writeAudit({ user: actor as never, action: "GMAIL_DISCONNECTED", entityType: "Tenant", entityId: requireTenantId().toString() });
};

export const gmailAccessToken = async () => {
  const tenant = await Tenant.findById(requireTenantId()).select("emailSendingProvider").lean();
  const connection = await GmailConnection.findOne({ key: "gmail" }).select("+refreshTokenEncrypted");
  if (tenant?.emailSendingProvider !== "GMAIL" || !connection || connection.needsReconnect) throw new AppError("Reconnect Gmail for this organization", 409, "GMAIL_RECONNECT_REQUIRED");
  try {
    const tokens = await tokenRequest({ grant_type: "refresh_token", refresh_token: decryptSecret(connection.refreshTokenEncrypted) });
    return { token: tokens.access_token!, email: connection.email };
  } catch (error) {
    if (error instanceof AppError && error.code === "GMAIL_RECONNECT_REQUIRED") await GmailConnection.updateOne({ _id: connection._id, refreshTokenEncrypted: connection.refreshTokenEncrypted }, { $set: { needsReconnect: true } });
    throw error;
  }
};

export const gmailRawMessage = async (input: { from: string; to: string; subject: string; text: string; unsubscribeUrl?: string }) => {
  z.string().email().parse(input.from); z.string().email().parse(input.to);
  if (input.unsubscribeUrl) z.string().url().refine(value => !/[\r\n<>]/.test(value)).parse(input.unsubscribeUrl);
  const body = `${input.text}${input.unsubscribeUrl ? `\n\nUnsubscribe: ${input.unsubscribeUrl}` : ""}`;
  const raw = await new MailComposer({ from: input.from, to: input.to, subject: input.subject.replace(/[\r\n]/g, " "), text: body, ...(input.unsubscribeUrl && { headers: { "List-Unsubscribe": `<${input.unsubscribeUrl}>` } }), disableFileAccess: true, disableUrlAccess: true }).compile().build();
  return raw.toString("base64url");
};

export const sendGmailEmail = async (input: { to: string; subject: string; text: string; unsubscribeUrl?: string }, expectedEmail: string) => {
  const { token, email } = await gmailAccessToken();
  if (email !== expectedEmail) throw new AppError("The connected sender changed. Review and reactivate the workflow.", 409, "GMAIL_SENDER_CHANGED");
  const raw = await gmailRawMessage({ ...input, from: email });
  const day = new Date().toISOString().slice(0, 10);
  // Reserve atomically across workers and test sends. Failed/uncertain attempts
  // count against the budget too; reconnecting does not reset it.
  const reserved = await GmailConnection.findOneAndUpdate({ key: "gmail", email, needsReconnect: false, $or: [{ sendDay: { $ne: day } }, { sendCount: { $lt: Math.min(env.GMAIL_DAILY_LIMIT, env.EMAIL_AUTOMATION_DAILY_LIMIT) } }] }, [{ $set: { sendCount: { $cond: [{ $eq: ["$sendDay", day] }, { $add: [{ $ifNull: ["$sendCount", 0] }, 1] }, 1] }, sendDay: day } }], { new: true });
  if (!reserved) throw new AppError("Gmail is disconnected or this organization's daily sending limit was reached", 429, "GMAIL_DAILY_LIMIT");
  let response: globalThis.Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ raw }), signal: AbortSignal.timeout(20_000) });
  } catch { throw new AppError("Gmail send outcome is unknown. Check Sent mail before retrying to avoid a duplicate.", 502, "GMAIL_SEND_UNCERTAIN"); }
  if (!response.ok) throw new AppError(response.status === 401 ? "Google authorization expired. Reconnect Gmail." : "Gmail rejected sending. Check account permissions and sending limits.", 502, response.status >= 500 ? "GMAIL_SEND_UNCERTAIN" : "GMAIL_SEND_REJECTED");
  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!payload.id) throw new AppError("Gmail send outcome is unknown. Check Sent mail before retrying.", 502, "GMAIL_SEND_UNCERTAIN");
  return `gmail:${email}:${payload.id}`;
};
