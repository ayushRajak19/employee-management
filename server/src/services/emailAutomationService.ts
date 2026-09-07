import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { EmailDelivery } from "../models/EmailDelivery.js";
import { EmailEnrollment } from "../models/EmailEnrollment.js";
import { EmailWorkflow, type EmailWorkflowDocument } from "../models/EmailWorkflow.js";
import { VendorContact, type VendorContactDocument } from "../models/VendorContact.js";
import { AppError } from "../utils/AppError.js";
import { writeAudit } from "./auditService.js";
import { Tenant } from "../models/Tenant.js";
import { currentTenantId, runWithTenant } from "../tenancy/tenantContext.js";

type WorkflowInput = Pick<EmailWorkflowDocument, "name" | "audience" | "subject" | "message" | "followUp" | "delayDays" | "followUpSubject" | "followUpMessage">;
type ContactInput = Pick<VendorContactDocument, "name" | "companyName" | "email" | "source" | "consentAt">;
type BrevoResponse = { messageId?: string; code?: string; message?: string };
type WebhookInput = { event?: string; email?: string; reason?: string; ts_event?: number; ts?: number; "message-id"?: string };
type BrevoEmailEvent = { date?: string; email?: string; event?: string; messageId?: string; reason?: string };

const configured = () => env.EMAIL_AUTOMATION_ENABLED && Boolean(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);
const webhookToken = env.BREVO_WEBHOOK_TOKEN || createHash("sha256").update(`brevo-webhook:${env.JWT_ACCESS_SECRET}`).digest("hex");
const requireConfiguration = () => {
  if (!configured()) throw new AppError("Brevo is not configured on the server", 503, "BREVO_NOT_CONFIGURED");
};
const brevoRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  requireConfiguration();
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    ...init,
    headers: { accept: "application/json", "content-type": "application/json", "api-key": env.BREVO_API_KEY!, ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as BrevoResponse;
  if (!response.ok) throw new AppError(payload.message || "Brevo rejected the request", 502, payload.code || "BREVO_ERROR");
  return payload as T;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
const personalize = (value: string, contact: Pick<VendorContactDocument, "name" | "companyName">) => value
  .replaceAll("{{vendor_name}}", contact.name)
  .replaceAll("{{company_name}}", contact.companyName)
  .replaceAll("{{our_company}}", env.BREVO_SENDER_NAME);
const messageHtml = (text: string, unsubscribeUrl?: string) => `${text.split(/\r?\n/).map((line) => line ? `<p style="margin:0 0 12px">${escapeHtml(line)}</p>` : "<br>").join("")}${unsubscribeUrl ? `<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0 12px"><p style="font-size:12px;color:#64748b">You are receiving this business email because your contact was provided for vendor communication. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p>` : ""}`;

const sendBrevoEmail = async (input: { to: string; toName?: string; subject: string; text: string; unsubscribeUrl?: string; enrollmentId?: string }) => {
  const payload = await brevoRequest<BrevoResponse>("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email: input.to, ...(input.toName && { name: input.toName }) }],
      replyTo: { email: env.BREVO_REPLY_TO_EMAIL || env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
      subject: input.subject,
      textContent: `${input.text}${input.unsubscribeUrl ? `\n\nUnsubscribe: ${input.unsubscribeUrl}` : ""}`,
      htmlContent: messageHtml(input.text, input.unsubscribeUrl),
      tags: ["mobius-automation"],
      ...(input.enrollmentId && { headers: { "X-Mailin-custom": `enrollment:${input.enrollmentId}`, ...(input.unsubscribeUrl && { "List-Unsubscribe": `<${input.unsubscribeUrl}>` }) } }),
    }),
  });
  if (!payload.messageId) throw new AppError("Brevo did not return a message identifier", 502, "BREVO_INVALID_RESPONSE");
  return payload.messageId;
};

export const configuration = () => ({
  configured: configured(),
  senderEmail: env.BREVO_SENDER_EMAIL || null,
  senderName: env.BREVO_SENDER_NAME,
  replyToEmail: env.BREVO_REPLY_TO_EMAIL || env.BREVO_SENDER_EMAIL || null,
  webhookConfigured: configured(),
  webhookUrl: `${env.CLIENT_URL}/api/v1/email-automation/webhooks/brevo`,
  dailyLimit: env.EMAIL_AUTOMATION_DAILY_LIMIT,
});
export const testConnection = async () => {
  const account = await brevoRequest<{ email?: string; companyName?: string }>("/account");
  return { connected: true, accountEmail: account.email || null, companyName: account.companyName || null };
};
export const registerWebhook = async () => {
  requireConfiguration();
  const baseUrl = `${env.CLIENT_URL}/api/v1/email-automation/webhooks/brevo`;
  const url = `${baseUrl}?token=${encodeURIComponent(webhookToken)}`;
  try {
    const existing = await brevoRequest<{ webhooks?: { id: number; url: string; type: string }[] }>("/webhooks?type=transactional&sort=desc");
    const match = existing.webhooks?.find((webhook) => webhook.url === url && webhook.type === "transactional");
    if (match) return { id: match.id, created: false };
  } catch (error) {
    console.warn("Could not read existing Brevo webhooks; attempting a fresh registration", error);
  }
  const created = await brevoRequest<{ id: number }>("/webhooks", { method: "POST", body: JSON.stringify({
    url, type: "transactional", description: "MobiusEMS email automation events", batched: false,
    events: ["request", "delivered", "hardBounce", "softBounce", "blocked", "spam", "invalid", "deferred", "click", "opened", "uniqueOpened", "unsubscribed"],
  }) });
  return { id: created.id, created: true };
};
export const sendTest = async (recipient: string) => {
  const messageId = await sendBrevoEmail({ to: recipient, subject: "MobiusEMS Brevo connection test", text: "Your Brevo email automation connection is working correctly." });
  await EmailDelivery.create({ recipientEmail: recipient, providerMessageId: messageId, step: -1, subject: "MobiusEMS Brevo connection test", status: "REQUESTED", events: [{ type: "request", occurredAt: new Date() }] });
  return { messageId };
};

const normalizeMessageId = (value: string) => value.replace(/^<|>$/g, "");
const normalizeEvent = (value: string) => value.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`).toLowerCase();
export const syncDeliveryEvents = async () => {
  const report = await brevoRequest<{ events?: BrevoEmailEvent[] }>("/smtp/statistics/events?days=30&limit=500&sort=desc");
  let updated = 0;
  for (const item of report.events ?? []) {
    if (!item.messageId || !item.event) continue;
    const rawId = normalizeMessageId(item.messageId);
    const event = normalizeEvent(item.event);
    const occurredAt = item.date && !Number.isNaN(Date.parse(item.date)) ? new Date(item.date) : new Date();
    const delivery = await EmailDelivery.findOne({ providerMessageId: { $in: [rawId, `<${rawId}>`] } }).select("_id status events");
    if (!delivery) continue;
    const recordedFailure = [...delivery.events].reverse().find((record) => ["error", "hard_bounce", "blocked", "invalid_email", "spam"].includes(record.type));
    if (recordedFailure && ["REQUESTED", "REQUESTS", "SENT"].includes(delivery.status)) {
      await EmailDelivery.updateOne({ _id: delivery._id }, { $set: { status: webhookStatus[recordedFailure.type] || "ERROR", lastEventAt: recordedFailure.occurredAt } });
      delivery.status = webhookStatus[recordedFailure.type] || "ERROR";
    }
    if (delivery.events.some((record) => record.type === event && record.occurredAt.getTime() === occurredAt.getTime())) continue;
    const status = webhookStatus[event] || event.toUpperCase();
    const filter = ["request", "requests", "sent"].includes(event)
      ? { _id: delivery._id, status: { $nin: ["ERROR", "BOUNCED", "BLOCKED", "INVALID", "SPAM"] } }
      : { _id: delivery._id };
    await EmailDelivery.updateOne(filter, { $set: { status, lastEventAt: occurredAt }, $push: { events: { type: event, occurredAt, reason: item.reason } } });
    if (item.email && ["hard_bounce", "blocked", "invalid_email", "spam", "unsubscribed"].includes(event)) {
      await suppressContact(item.email, event);
    }
    updated += 1;
  }
  return { updated };
};
export const summary = async () => {
  if (configured()) await syncDeliveryEvents().catch((error: unknown) => console.warn("Brevo delivery activity sync failed", error));
  const [workflows, active, contacts, accepted, delivered, opened, clicked, bounced, replies] = await Promise.all([
    EmailWorkflow.countDocuments(), EmailWorkflow.countDocuments({ status: "ACTIVE" }), VendorContact.countDocuments(),
    EmailDelivery.countDocuments({ step: { $gte: 0 } }), EmailDelivery.countDocuments({ "events.type": "delivered" }),
    EmailDelivery.countDocuments({ "events.type": "opened" }), EmailDelivery.countDocuments({ "events.type": "click" }),
    EmailDelivery.countDocuments({ status: { $in: ["ERROR", "BOUNCED", "BLOCKED", "INVALID", "SPAM"] } }),
    VendorContact.countDocuments({ status: "REPLIED" }),
  ]);
  return { workflows, active, contacts, accepted, sent: accepted, delivered, opened, clicked, bounced, replies };
};
export const listDeliveries = async () => {
  const items = await EmailDelivery.find().select("recipientEmail subject status lastEventAt createdAt step events").sort({ createdAt: -1 }).limit(50).lean();
  return items.map((item) => ({ ...item, lastError: [...item.events].reverse().find((event) => event.reason)?.reason || null, events: undefined }));
};
export const listWorkflows = () => EmailWorkflow.find().sort({ createdAt: -1 }).lean();
export const createWorkflow = async (input: WorkflowInput, actor: string) => {
  const item = await EmailWorkflow.create({ ...input, createdBy: actor });
  await writeAudit({ user: actor as never, action: "EMAIL_WORKFLOW_CREATED", entityType: "EmailWorkflow", entityId: item.id, newValue: input });
  return item;
};
export const updateWorkflow = async (id: string, input: Partial<WorkflowInput>, actor: string) => {
  const item = await EmailWorkflow.findById(id);
  if (!item) throw new AppError("Email workflow not found", 404);
  if (item.status === "ACTIVE") throw new AppError("Pause the workflow before editing it", 409, "WORKFLOW_ACTIVE");
  const oldValue = item.toObject(); Object.assign(item, input); await item.save();
  await writeAudit({ user: actor as never, action: "EMAIL_WORKFLOW_UPDATED", entityType: "EmailWorkflow", entityId: item.id, oldValue, newValue: input });
  return item;
};
export const deleteWorkflow = async (id: string, actor: string) => {
  const item = await EmailWorkflow.findById(id);
  if (!item) throw new AppError("Email workflow not found", 404);
  if (item.status === "ACTIVE") throw new AppError("Pause the workflow before deleting it", 409, "WORKFLOW_ACTIVE");
  await Promise.all([item.deleteOne(), EmailEnrollment.deleteMany({ workflow: item._id })]);
  await writeAudit({ user: actor as never, action: "EMAIL_WORKFLOW_DELETED", entityType: "EmailWorkflow", entityId: id });
};
export const activateWorkflow = async (id: string, actor: string) => {
  requireConfiguration();
  const item = await EmailWorkflow.findById(id);
  if (!item) throw new AppError("Email workflow not found", 404);
  const contacts = await VendorContact.find({ status: "ACTIVE" }).select("_id").lean();
  if (!contacts.length) throw new AppError("Add at least one active, consented vendor contact before activation", 409, "NO_VENDOR_CONTACTS");
  await EmailEnrollment.bulkWrite(contacts.map((contact) => ({ updateOne: { filter: { workflow: item._id, contact: contact._id }, update: { $setOnInsert: { step: 0, status: "PENDING", nextRunAt: new Date(), attempts: 0 } }, upsert: true } })));
  item.status = "ACTIVE"; item.activatedAt = new Date(); await item.save();
  await writeAudit({ user: actor as never, action: "EMAIL_WORKFLOW_ACTIVATED", entityType: "EmailWorkflow", entityId: item.id, newValue: { contacts: contacts.length } });
  void runEmailAutomationCycle();
  return item;
};
export const pauseWorkflow = async (id: string, actor: string) => {
  const item = await EmailWorkflow.findByIdAndUpdate(id, { $set: { status: "PAUSED" } }, { new: true });
  if (!item) throw new AppError("Email workflow not found", 404);
  await writeAudit({ user: actor as never, action: "EMAIL_WORKFLOW_PAUSED", entityType: "EmailWorkflow", entityId: item.id });
  return item;
};

export const listContacts = () => VendorContact.find().select("name companyName email source consentAt status repliedAt createdAt").sort({ createdAt: -1 }).lean();
export const addContacts = async (inputs: ContactInput[], actor: string) => {
  const results = { created: 0, updated: 0 };
  for (const input of inputs) {
    const existing = await VendorContact.findOne({ email: input.email });
    let contact;
    if (existing) { existing.name = input.name; existing.companyName = input.companyName; existing.source = input.source; existing.consentAt = input.consentAt; if (existing.status === "BOUNCED") existing.status = "ACTIVE"; contact = await existing.save(); results.updated += 1; }
    else { contact = await VendorContact.create({ ...input, createdBy: actor }); results.created += 1; }
    if (contact.status === "ACTIVE") {
      const activeWorkflows = await EmailWorkflow.find({ status: "ACTIVE" }).select("_id").lean();
      if (activeWorkflows.length) await EmailEnrollment.bulkWrite(activeWorkflows.map((workflow) => ({ updateOne: { filter: { workflow: workflow._id, contact: contact._id }, update: { $setOnInsert: { step: 0, status: "PENDING", nextRunAt: new Date(), attempts: 0 } }, upsert: true } })));
    }
  }
  await writeAudit({ user: actor as never, action: "VENDOR_CONTACTS_IMPORTED", entityType: "VendorContact", newValue: results });
  return results;
};
export const updateContactStatus = async (id: string, status: VendorContactDocument["status"], actor: string) => {
  const update = status === "REPLIED" ? { $set: { status, repliedAt: new Date() } } : { $set: { status }, $unset: { repliedAt: 1 } };
  const item = await VendorContact.findByIdAndUpdate(id, update, { new: true }).select("name companyName email source consentAt status repliedAt createdAt");
  if (!item) throw new AppError("Vendor contact not found", 404);
  if (status !== "ACTIVE") await EmailEnrollment.updateMany({ contact: item._id, status: { $in: ["PENDING", "PROCESSING"] } }, { $set: { status: "STOPPED" } });
  await writeAudit({ user: actor as never, action: "VENDOR_CONTACT_STATUS_UPDATED", entityType: "VendorContact", entityId: item.id, newValue: { status } });
  return item;
};

const webhookStatus: Record<string, string> = { request: "REQUESTED", requests: "REQUESTED", sent: "SENT", delivered: "DELIVERED", opened: "OPENED", unique_opened: "OPENED", click: "CLICKED", error: "ERROR", hard_bounce: "BOUNCED", soft_bounce: "DEFERRED", deferred: "DEFERRED", blocked: "BLOCKED", invalid_email: "INVALID", spam: "SPAM", unsubscribed: "UNSUBSCRIBED" };
const suppressContact = async (email: string, event: string) => {
  const status = event === "hard_bounce" || event === "invalid_email" ? "BOUNCED" : event === "unsubscribed" ? "UNSUBSCRIBED" : "BLOCKED";
  const contact = await VendorContact.findOneAndUpdate({ email: email.toLowerCase() }, { $set: { status } }, { new: true });
  if (contact) await EmailEnrollment.updateMany({ contact: contact._id, status: { $in: ["PENDING", "PROCESSING"] } }, { $set: { status: "STOPPED" } });
};
export const handleWebhook = async (input: WebhookInput, token?: string) => {
  if (token !== webhookToken) throw new AppError("Invalid webhook token", 401, "INVALID_WEBHOOK_TOKEN");
  const event = normalizeEvent(String(input.event || "unknown"));
  const rawMessageId = String(input["message-id"] || "");
  const messageIds = [rawMessageId, rawMessageId.replace(/^<|>$/g, ""), `<${rawMessageId.replace(/^<|>$/g, "")}>`];
  const occurredAt = new Date((input.ts_event || input.ts || Date.now() / 1000) * 1000);
  const match = await EmailDelivery.collection.findOne({ providerMessageId: { $in: messageIds } }, { projection: { tenantId: 1 } });
  if (!match?.tenantId) return { matched: false };
  return runWithTenant(match.tenantId, async () => {
    const delivery = await EmailDelivery.findOneAndUpdate({ _id: match._id }, { $set: { status: webhookStatus[event] || event.toUpperCase(), lastEventAt: occurredAt }, $push: { events: { type: event, occurredAt, reason: input.reason } } }, { new: true });
    if (delivery && input.email && ["hard_bounce", "blocked", "invalid_email", "spam", "unsubscribed"].includes(event)) await suppressContact(input.email, event);
    return { matched: Boolean(delivery) };
  });
};
export const unsubscribe = async (token: string) => {
  const match = await VendorContact.collection.findOne({ unsubscribeToken: token }, { projection: { tenantId: 1 } });
  if (!match?.tenantId) throw new AppError("This unsubscribe link is invalid", 404);
  await runWithTenant(match.tenantId, async () => {
    const contact = await VendorContact.findOneAndUpdate({ _id: match._id }, { $set: { status: "UNSUBSCRIBED" } }, { new: true }).select("_id");
    if (!contact) throw new AppError("This unsubscribe link is invalid", 404);
    await EmailEnrollment.updateMany({ contact: contact._id, status: { $in: ["PENDING", "PROCESSING"] } }, { $set: { status: "STOPPED" } });
  });
};

const processOne = async () => {
  const stale = new Date(Date.now() - 10 * 60_000);
  await EmailEnrollment.updateMany({ status: "PROCESSING", lockedAt: { $lt: stale } }, { $set: { status: "PENDING" }, $unset: { lockedAt: 1 } });
  const enrollment = await EmailEnrollment.findOneAndUpdate({ status: "PENDING", nextRunAt: { $lte: new Date() } }, { $set: { status: "PROCESSING", lockedAt: new Date() } }, { new: true });
  if (!enrollment) return false;
  try {
    const [workflow, contact] = await Promise.all([EmailWorkflow.findById(enrollment.workflow), VendorContact.findById(enrollment.contact).select("+unsubscribeToken")]);
    if (!workflow || !contact || contact.status !== "ACTIVE") { enrollment.status = "STOPPED"; await enrollment.save(); return true; }
    if (workflow.status === "PAUSED") { enrollment.status = "PENDING"; enrollment.nextRunAt = new Date(Date.now() + 5 * 60_000); enrollment.lockedAt = undefined; await enrollment.save(); return true; }
    if (workflow.status !== "ACTIVE") { enrollment.status = "STOPPED"; await enrollment.save(); return true; }
    const followUp = enrollment.step === 1;
    if (followUp && contact.repliedAt) { enrollment.status = "STOPPED"; await enrollment.save(); return true; }
    const subject = personalize(followUp ? workflow.followUpSubject || `Following up: ${workflow.subject}` : workflow.subject, contact);
    const text = personalize(followUp ? workflow.followUpMessage || `Hi {{vendor_name}},\n\nI wanted to follow up on my previous message about a potential partnership with {{company_name}}. Please let me know if this is relevant for your team.` : workflow.message, contact);
    const unsubscribeUrl = `${env.CLIENT_URL}/api/v1/email-automation/unsubscribe/${contact.unsubscribeToken}`;
    const messageId = await sendBrevoEmail({ to: contact.email, toName: contact.name, subject, text, unsubscribeUrl, enrollmentId: enrollment.id });
    await EmailDelivery.create({ workflow: workflow._id, contact: contact._id, enrollment: enrollment._id, recipientEmail: contact.email, providerMessageId: messageId, step: enrollment.step, subject, status: "REQUESTED", events: [{ type: "request", occurredAt: new Date() }] });
    if (!followUp && workflow.followUp) { enrollment.step = 1; enrollment.status = "PENDING"; enrollment.nextRunAt = new Date(Date.now() + workflow.delayDays * 86_400_000); }
    else enrollment.status = "COMPLETED";
    enrollment.attempts = 0; enrollment.lastError = undefined; enrollment.lockedAt = undefined; await enrollment.save();
  } catch (error) {
    enrollment.attempts += 1; enrollment.lastError = error instanceof Error ? error.message.slice(0, 1000) : "Unknown sending error"; enrollment.lockedAt = undefined;
    enrollment.status = enrollment.attempts >= 3 ? "FAILED" : "PENDING";
    enrollment.nextRunAt = new Date(Date.now() + Math.min(60, 5 * 2 ** enrollment.attempts) * 60_000); await enrollment.save();
  }
  return true;
};
const runTenantEmailAutomationCycle = async () => {
    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const sentToday = await EmailDelivery.countDocuments({ step: { $gte: 0 }, createdAt: { $gte: startOfDay } });
    const available = Math.max(0, env.EMAIL_AUTOMATION_DAILY_LIMIT - sentToday);
    for (let index = 0; index < Math.min(env.EMAIL_AUTOMATION_BATCH_SIZE, available); index += 1) if (!(await processOne())) break;
};
let cycleRunning = false;
export const runEmailAutomationCycle = async () => {
  if (cycleRunning || !configured()) return;
  cycleRunning = true;
  try {
    const tenantId = currentTenantId();
    if (tenantId) await runTenantEmailAutomationCycle();
    else {
      const tenants = await Tenant.find({ status: "ACTIVE" }).select("_id").lean();
      for (const tenant of tenants) await runWithTenant(tenant._id, runTenantEmailAutomationCycle);
    }
  }
  finally { cycleRunning = false; }
};
export const initializeEmailAutomation = async () => {
  if (!configured()) { console.warn("Brevo email automation is not configured"); return; }
  await testConnection();
  try {
    const webhook = await registerWebhook();
    console.log(`Brevo email automation connected; webhook ${webhook.created ? "created" : "ready"}`);
  } catch (error) {
    console.warn("Brevo connected, but automatic webhook registration failed; delivery polling remains active", error);
  }
  await runEmailAutomationCycle();
};

