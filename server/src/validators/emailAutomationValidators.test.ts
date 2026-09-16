import assert from "node:assert/strict";
import test from "node:test";
import { createBroadcastSchema, emailConfigurationSchema } from "./emailAutomationValidators.js";

test("organization email settings normalize valid addresses and reject invalid ones", () => {
  const parsed = emailConfigurationSchema.parse({ body: { senderName: " Acme Sales ", senderEmail: "SALES@ACME.TEST", replyToEmail: "SUPPORT@ACME.TEST" } });
  assert.deepEqual(parsed.body, { senderName: "Acme Sales", senderEmail: "sales@acme.test", replyToEmail: "support@acme.test" });
  assert.equal(emailConfigurationSchema.safeParse({ body: { senderName: "Acme", senderEmail: "invalid", replyToEmail: "support@acme.test" } }).success, false);
});

test("an empty Brevo key preserves an existing organization connection", () => {
  const parsed = emailConfigurationSchema.parse({ body: { apiKey: "", senderName: "Acme", senderEmail: "sales@acme.test", replyToEmail: "support@acme.test" } });
  assert.equal(parsed.body.apiKey, undefined);
});

test("broadcasts require a valid message and idempotency key", () => {
  const body = { clientRequestId: "fb8ac9de-86a0-4c8e-a39f-4f0b99bc31be", name: "Partner update", subject: "Hello", message: "A useful update", source: "Imported vendors" };
  assert.equal(createBroadcastSchema.safeParse({ body }).success, true);
  assert.equal(createBroadcastSchema.safeParse({ body: { ...body, clientRequestId: "bad" } }).success, false);
  assert.equal(createBroadcastSchema.safeParse({ body: { ...body, message: "" } }).success, false);
});
