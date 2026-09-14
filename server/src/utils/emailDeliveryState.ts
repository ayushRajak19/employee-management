export type DeliveryEvent = { type: string; occurredAt: Date; reason?: string };

export const normalizeDeliveryEvent = (value: string) => value.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`).toLowerCase();

const statuses: Record<string, string> = {
  request: "REQUESTED", requests: "REQUESTED", sent: "SENT", deferred: "DEFERRED", soft_bounce: "DEFERRED",
  delivered: "DELIVERED", opened: "OPENED", unique_opened: "OPENED", click: "CLICKED",
  error: "ERROR", hard_bounce: "BOUNCED", invalid: "INVALID", invalid_email: "INVALID",
  blocked: "BLOCKED", spam: "SPAM", unsubscribed: "UNSUBSCRIBED",
};
// Arrival order is unreliable: late request/deferred events cannot erase delivery
// evidence, and delivery/open events cannot erase a failure or an opt-out.
const priority: Record<string, number> = {
  REQUESTED: 1, SENT: 2, DEFERRED: 3, DELIVERED: 4, OPENED: 5, CLICKED: 6,
  ERROR: 7, BOUNCED: 8, INVALID: 8, BLOCKED: 8, SPAM: 9, UNSUBSCRIBED: 10,
};

export const deliveryState = (events: readonly DeliveryEvent[]) => {
  let selected: { status: string; lastEventAt: Date; lastError: string | null } | undefined;
  for (const event of events) {
    const status = statuses[normalizeDeliveryEvent(event.type)];
    if (!status || !Number.isFinite(event.occurredAt.getTime())) continue;
    const rank = priority[status]!;
    const previousRank = selected ? priority[selected.status]! : 0;
    if (rank > previousRank || (rank === previousRank && event.occurredAt > selected!.lastEventAt)) {
      selected = { status, lastEventAt: event.occurredAt, lastError: (rank >= 7 || status === "DEFERRED") ? event.reason || null : null };
    }
  }
  return selected;
};
