import assert from "node:assert/strict";
import test from "node:test";
import { emailIdempotencyKey, shouldUpdateDeliveryStatus } from "./emailAutomationPolicy.js";

test("delivery status does not regress on duplicate or late webhook events", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  assert.equal(shouldUpdateDeliveryStatus("DELIVERED", "SENT", now, new Date(now.getTime() - 1)), false);
  assert.equal(shouldUpdateDeliveryStatus("DELIVERED", "BOUNCED", now, new Date(now.getTime() + 1)), true);
  assert.equal(shouldUpdateDeliveryStatus("BOUNCED", "OPENED", now, new Date(now.getTime() + 2)), false);
});

test("email retry idempotency keys are stable UUIDs and differ by step", () => {
  const first = emailIdempotencyKey("tenant", "enrollment", 0);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(first, emailIdempotencyKey("tenant", "enrollment", 0));
  assert.notEqual(first, emailIdempotencyKey("tenant", "enrollment", 1));
});
