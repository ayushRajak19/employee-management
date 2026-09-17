import { Document } from "../models/Document.js";
import { Employee } from "../models/Employee.js";
import { Tenant } from "../models/Tenant.js";
import { currentTenantId, runWithTenant } from "../tenancy/tenantContext.js";
import { notify } from "./notificationService.js";
import { writeAudit } from "./auditService.js";

const DAY = 86_400_000;
const indiaDay = (date: Date) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map((part) => [part.type, Number(part.value)]));
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!);
};
export const expiryMilestone = (expiresAt: Date, now: Date): 30 | 7 | 0 | null => {
  const days = Math.round((indiaDay(expiresAt) - indiaDay(now)) / DAY);
  return days <= 0 ? 0 : days <= 7 ? 7 : days <= 30 ? 30 : null;
};

export const runTenantDocumentExpiryCycle = async (now = new Date()) => {
  const documents = await Document.find({ isActive: true, expiresAt: { $lte: new Date(now.getTime() + 31 * DAY) } });
  for (const document of documents) {
    const milestone = expiryMilestone(document.expiresAt!, now);
    if (milestone === null) continue;
    const claimed = await Document.updateOne({ _id: document._id, expiryReminderDaysSent: { $ne: milestone } }, { $addToSet: { expiryReminderDaysSent: milestone } });
    if (!claimed.modifiedCount) continue;
    const employee = await Employee.findById(document.employee).select("user firstName lastName").lean();
    const title = milestone === 0 ? "Document expired" : `Document expires within ${milestone} days`;
    const body = `${document.originalName} (${document.category.replaceAll("_", " ")}) for ${employee?.firstName ?? "an employee"} ${employee?.lastName ?? ""} ${milestone === 0 ? "has expired" : `expires on ${document.expiresAt!.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}.`;
    const recipients = new Set([employee?.user?.toString(), document.uploadedBy.toString()].filter((id): id is string => Boolean(id)));
    for (const recipient of recipients) await notify({ recipient, type: `DOCUMENT_EXPIRY_${milestone}`, title, body, entityType: "Document", entityId: document.id });
    await writeAudit({ action: "DOCUMENT_EXPIRY_ALERT_SENT", entityType: "Document", entityId: document.id, newValue: { milestone, expiresAt: document.expiresAt, recipients: recipients.size } });
  }
};

let running = false;
export const runDocumentExpiryCycle = async (now = new Date()) => {
  if (running) return;
  running = true;
  try {
    const tenantId = currentTenantId();
    if (tenantId) await runTenantDocumentExpiryCycle(now);
    else for (const tenant of await Tenant.find({ status: "ACTIVE" }).select("_id").lean()) await runWithTenant(tenant._id, () => runTenantDocumentExpiryCycle(now));
  } finally { running = false; }
};
