import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { ControlPlaneRepository, SecretCipher } from "../interfaces";
import type { APIKeyRecord, IssuedAPIKey } from "../types";
import { validateAPIKeyScopes, validateWorkspaceId } from "../validation";

export class APIKeyService {
  constructor(
    private readonly repository: ControlPlaneRepository,
    private readonly cipher?: SecretCipher
  ) {}

  async issue(workspaceId: string, name: string, scopes: string[], expiresAt?: string): Promise<IssuedAPIKey> {
    validateWorkspaceId(workspaceId);
    validateAPIKeyScopes(scopes);
    const prefix = `vip_${randomBytes(5).toString("hex")}`;
    const secret = randomBytes(24).toString("base64url");
    const token = `${prefix}.${secret}`;
    const record: APIKeyRecord = {
      id: `key_${randomBytes(12).toString("hex")}`,
      workspaceId,
      name,
      prefix,
      secretHash: hashToken(token),
      encryptedSecret: this.cipher?.encrypt(secret),
      scopes,
      status: "ACTIVE",
      expiresAt,
    };
    return { record: await this.repository.saveAPIKey(record), token };
  }

  async authenticate(token: string) {
    const prefix = token.split(".")[0];
    const record = await this.repository.findAPIKeyByPrefix(prefix);
    if (!record || record.status !== "ACTIVE" || isExpired(record.expiresAt)) return null;
    const expected = Buffer.from(record.secretHash, "hex");
    const received = Buffer.from(hashToken(token), "hex");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    return { workspaceId: record.workspaceId, subjectId: record.id, subjectType: "API_KEY" as const, permissions: record.scopes };
  }

  async revoke(workspaceId: string, keyId: string) {
    await this.repository.revokeAPIKey(workspaceId, keyId, new Date().toISOString());
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isExpired(expiresAt?: string) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}
