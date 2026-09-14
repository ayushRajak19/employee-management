import assert from "node:assert/strict";
import test from "node:test";
import { decryptSecret, encryptSecret } from "./secretCipher.js";

test("integration credentials are encrypted and authenticated", () => {
  const encrypted = encryptSecret("tenant-api-key");
  assert.notEqual(encrypted, "tenant-api-key");
  assert.equal(decryptSecret(encrypted), "tenant-api-key");
  const parts = encrypted.split(".");
  const ciphertext = Buffer.from(parts[3]!, "base64url");
  ciphertext[0] = ciphertext[0]! ^ 1;
  parts[3] = ciphertext.toString("base64url");
  assert.throws(() => decryptSecret(parts.join(".")));
});
