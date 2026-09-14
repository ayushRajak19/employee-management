import assert from "node:assert/strict";
import test from "node:test";
import { deliveryState, type DeliveryEvent } from "./emailDeliveryState.js";

const event = (type: string, seconds: number, reason?: string): DeliveryEvent => ({ type, occurredAt: new Date(seconds * 1000), ...(reason && { reason }) });

test("the September 6 history stays OPENED in either API order and after duplicate requests", () => {
  const history = [event("request", 1), event("unique_opened", 2), event("delivered", 3), event("opened", 20), event("requests", 1)];
  for (const events of [history, [...history].reverse(), [...history, event("request", 30)], [...history, ...history]]) {
    assert.deepEqual(deliveryState(events), { status: "OPENED", lastEventAt: new Date(20000), lastError: null });
  }
});

test("failure and opt-out evidence cannot be erased by requests or opens", () => {
  const failure = event("error", 10, "Your sending platform is currently disabled");
  for (const history of [[failure, event("requests", 10)], [event("requests", 10), failure]]) {
    assert.deepEqual(deliveryState(history), { status: "ERROR", lastEventAt: new Date(10000), lastError: failure.reason });
  }
  assert.equal(deliveryState([event("unsubscribed", 12), event("opened", 30)])?.status, "UNSUBSCRIBED");
  assert.equal(deliveryState([event("hardBounce", 12), event("sent", 30)])?.status, "BOUNCED");
});

test("delivery supersedes deferrals while an acceptance alone remains unconfirmed", () => {
  assert.equal(deliveryState([event("delivered", 12), event("softBounce", 10)])?.status, "DELIVERED");
  assert.equal(deliveryState([event("requests", 1)])?.status, "REQUESTED");
  assert.equal(deliveryState([event("unknown", 1)]), undefined);
});
