import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { SecretCipher } from "../interfaces";

export class AesGcmSecretCipher implements SecretCipher {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error("AES-256-GCM requires a 32-byte key.");
  }

  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
  }

  decrypt(value: string) {
    const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}

export class WebhookSignatureVerifier {
  constructor(private readonly secret: string) {}

  sign(payload: string, timestamp: string) {
    return createHmac("sha256", this.secret).update(`${timestamp}.${payload}`).digest("hex");
  }

  verify(payload: string, timestamp: string, signature: string, toleranceSeconds = 300) {
    if (Math.abs(Date.now() - new Date(timestamp).getTime()) > toleranceSeconds * 1000) return false;
    const expected = Buffer.from(this.sign(payload, timestamp), "hex");
    const received = Buffer.from(signature, "hex");
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
