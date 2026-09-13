import assert from "node:assert/strict";
import test from "node:test";
import { emailConfigurationSchema } from "./emailAutomationValidators.js";

test("organization email settings normalize valid addresses and reject invalid ones", () => {
  const parsed = emailConfigurationSchema.parse({ body: { senderName: " Acme Sales ", senderEmail: "SALES@ACME.TEST", replyToEmail: "SUPPORT@ACME.TEST" } });
  assert.deepEqual(parsed.body, { senderName: "Acme Sales", senderEmail: "sales@acme.test", replyToEmail: "support@acme.test" });
  assert.equal(emailConfigurationSchema.safeParse({ body: { senderName: "Acme", senderEmail: "invalid", replyToEmail: "support@acme.test" } }).success, false);
});

test("an empty Brevo key preserves an existing organization connection", () => {
  const parsed = emailConfigurationSchema.parse({ body: { apiKey: "", senderName: "Acme", senderEmail: "sales@acme.test", replyToEmail: "support@acme.test" } });
  assert.equal(parsed.body.apiKey, undefined);
});
