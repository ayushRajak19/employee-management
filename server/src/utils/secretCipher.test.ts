import assert from "node:assert/strict";
import test from "node:test";
import { decryptSecret, encryptSecret } from "./secretCipher.js";

test("integration credentials are encrypted and authenticated", () => {
  const encrypted = encryptSecret("tenant-api-key");
  assert.notEqual(encrypted, "tenant-api-key");
  assert.equal(decryptSecret(encrypted), "tenant-api-key");
  assert.throws(() => decryptSecret(`${encrypted.slice(0, -1)}x`));
});
