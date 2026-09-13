import { createHash } from "node:crypto";

export const webhookStatus: Record<string, string> = {
  request: "REQUESTED", requests: "REQUESTED", sent: "SENT", delivered: "DELIVERED",
  opened: "OPENED", unique_opened: "OPENED", click: "CLICKED", error: "ERROR",
  hard_bounce: "BOUNCED", soft_bounce: "DEFERRED", deferred: "DEFERRED",
  blocked: "BLOCKED", invalid_email: "INVALID", spam: "SPAM", unsubscribed: "UNSUBSCRIBED",
};

export const suppressingEvents = new Set(["hard_bounce", "blocked", "invalid_email", "spam", "unsubscribed"]);
const terminalStatuses = new Set(["ERROR", "BOUNCED", "BLOCKED", "INVALID", "SPAM", "UNSUBSCRIBED"]);

export const normalizeEmailEvent = (value: string) => value.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`).toLowerCase();

export const shouldUpdateDeliveryStatus = (currentStatus: string, nextStatus: string, currentAt: Date, nextAt: Date) => {
  if (terminalStatuses.has(currentStatus)) return false;
  return terminalStatuses.has(nextStatus) || nextAt >= currentAt;
};

export const emailIdempotencyKey = (tenantId: string, enrollmentId: string, step: number) => {
  const hex = createHash("sha256").update(`${tenantId}:${enrollmentId}:${step}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};
