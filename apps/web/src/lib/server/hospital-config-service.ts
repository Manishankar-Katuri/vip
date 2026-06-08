import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import prisma from "@vip/database";

export const INTEGRATION_PROVIDERS = [
  "google-business",
  "google-analytics",
  "meta",
  "linkedin",
  "youtube",
  "crm",
  "website",
  "custom"
] as const;

export type IntegrationProvider = typeof INTEGRATION_PROVIDERS[number];
export type IntegrationStatus = "PENDING" | "CONNECTED" | "NEEDS_ATTENTION" | "DISABLED";

export type IntegrationCredentials = Record<string, string | undefined>;
export type IntegrationSettings = Record<string, unknown>;

export type IntegrationInput = {
  provider:string;
  apiName:string;
  baseUrl?:string | null;
  credentials?:IntegrationCredentials;
  settings?:IntegrationSettings;
  status?:IntegrationStatus;
  actorId?:string | null;
};

export type IntegrationTestResult = {
  ok:boolean;
  status:IntegrationStatus;
  message:string;
  checkedAt:string;
  latencyMs?:number;
  details?:Record<string, unknown>;
};

type AdapterInput = {
  provider:IntegrationProvider;
  apiName:string;
  baseUrl?:string | null;
  credentials:IntegrationCredentials;
  settings:IntegrationSettings;
};

type ProviderAdapter = {
  validateCredentials(input:AdapterInput): Promise<void>;
  testConnection(input:AdapterInput): Promise<IntegrationTestResult>;
};

type CachedRuntimeConfig = {
  expiresAt:number;
  config:ResolvedIntegrationConfig;
};

export type ResolvedIntegrationConfig = {
  id:string;
  hospitalId:string;
  provider:string;
  apiName:string;
  baseUrl:string | null;
  credentials:IntegrationCredentials;
  settings:IntegrationSettings;
  status:IntegrationStatus;
  lastSyncAt:string | null;
};

const runtimeConfigCache = new Map<string, CachedRuntimeConfig>();
const CACHE_TTL_MS = 60_000;

export class HospitalConfigService {
  async createIntegration(hospitalId:string, input:IntegrationInput) {
    const normalized = await normalizeInput(input);
    await adapters[normalized.provider].validateCredentials(normalized);
    const test = await adapters[normalized.provider].testConnection(normalized);
    const encryptedCredentials = encryptJson(normalized.credentials);
    const now = new Date();

    const record = await prisma.hospitalIntegrationConfig.create({
      data:{
        hospitalId,
        provider:normalized.provider,
        apiName:normalized.apiName,
        baseUrl:normalized.baseUrl ?? null,
        encryptedCredentials,
        credentialMeta:maskCredentialSummary(normalized.credentials),
        settings:toPrismaJson(normalized.settings),
        status:test.status,
        lastValidatedAt:now,
        lastTestedAt:now,
        lastError:test.ok ? null : test.message,
        createdBy:input.actorId ?? null,
        updatedBy:input.actorId ?? null
      }
    });

    await recordIntegrationChange(hospitalId, "integration.create", record.id, input.actorId, {
      provider:record.provider,
      apiName:record.apiName,
      status:record.status
    });
    invalidateHospitalIntegrationCache(hospitalId, record.provider);

    return toPublicIntegration(record);
  }

  async updateIntegration(hospitalId:string, integrationId:string, input:IntegrationInput) {
    const current = await prisma.hospitalIntegrationConfig.findFirst({
      where:{ id:integrationId, hospitalId }
    });

    if (!current) {
      throw new Error("Integration config not found.");
    }

    const currentCredentials = decryptJson(current.encryptedCredentials);
    const mergedCredentials = {
      ...currentCredentials,
      ...dropEmptyCredentialValues(input.credentials ?? {})
    };
    const normalized = await normalizeInput({
      provider:input.provider ?? current.provider,
      apiName:input.apiName ?? current.apiName,
      baseUrl:input.baseUrl ?? current.baseUrl,
      credentials:mergedCredentials,
      settings:{
        ...jsonObject(current.settings),
        ...(input.settings ?? {})
      },
      status:input.status ?? current.status,
      actorId:input.actorId
    });
    await adapters[normalized.provider].validateCredentials(normalized);
    const test = await adapters[normalized.provider].testConnection(normalized);
    const now = new Date();

    const record = await prisma.hospitalIntegrationConfig.update({
      where:{ id:integrationId },
      data:{
        provider:normalized.provider,
        apiName:normalized.apiName,
        baseUrl:normalized.baseUrl ?? null,
        encryptedCredentials:encryptJson(normalized.credentials),
        credentialMeta:maskCredentialSummary(normalized.credentials),
        settings:toPrismaJson(normalized.settings),
        status:test.status,
        lastValidatedAt:now,
        lastTestedAt:now,
        lastError:test.ok ? null : test.message,
        updatedBy:input.actorId ?? null
      }
    });

    await recordIntegrationChange(hospitalId, "integration.update", record.id, input.actorId, {
      provider:record.provider,
      apiName:record.apiName,
      status:record.status
    });
    invalidateHospitalIntegrationCache(hospitalId, record.provider);

    return toPublicIntegration(record);
  }

  async deleteIntegration(hospitalId:string, integrationId:string, actorId?:string | null) {
    const record = await prisma.hospitalIntegrationConfig.findFirst({
      where:{ id:integrationId, hospitalId }
    });

    if (!record) {
      throw new Error("Integration config not found.");
    }

    await prisma.hospitalIntegrationConfig.delete({ where:{ id:integrationId } });
    await recordIntegrationChange(hospitalId, "integration.delete", integrationId, actorId, {
      provider:record.provider,
      apiName:record.apiName
    });
    invalidateHospitalIntegrationCache(hospitalId, record.provider);
  }

  async getIntegration(hospitalId:string, provider:string, apiName?:string) {
    return getHospitalIntegrationConfig(hospitalId, provider, apiName);
  }

  async validateCredentials(input:IntegrationInput) {
    const normalized = await normalizeInput(input);
    await adapters[normalized.provider].validateCredentials(normalized);
    return { ok:true };
  }

  async testConnection(hospitalId:string, integrationId:string, replacementCredentials?:IntegrationCredentials) {
    const current = await prisma.hospitalIntegrationConfig.findFirst({
      where:{ id:integrationId, hospitalId }
    });

    if (!current) {
      throw new Error("Integration config not found.");
    }

    const credentials = {
      ...decryptJson(current.encryptedCredentials),
      ...dropEmptyCredentialValues(replacementCredentials ?? {})
    };
    const normalized = await normalizeInput({
      provider:current.provider,
      apiName:current.apiName,
      baseUrl:current.baseUrl,
      credentials,
      settings:jsonObject(current.settings),
      status:current.status
    });
    await adapters[normalized.provider].validateCredentials(normalized);
    const test = await adapters[normalized.provider].testConnection(normalized);

    await prisma.hospitalIntegrationConfig.update({
      where:{ id:integrationId },
      data:{
        status:test.status,
        lastTestedAt:new Date(test.checkedAt),
        lastValidatedAt:test.ok ? new Date(test.checkedAt) : current.lastValidatedAt,
        lastError:test.ok ? null : test.message
      }
    });
    invalidateHospitalIntegrationCache(hospitalId, current.provider);

    return test;
  }
}

export const hospitalConfigService = new HospitalConfigService();

export async function getHospitalIntegrationConfig(
  hospitalId:string,
  provider:string,
  apiName?:string
):Promise<ResolvedIntegrationConfig | null> {
  const key = `${hospitalId}:${provider}:${apiName ?? "*"}`;
  const cached = runtimeConfigCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  const record = await prisma.hospitalIntegrationConfig.findFirst({
    where:{
      hospitalId,
      provider,
      ...(apiName ? { apiName } : {}),
      status:"CONNECTED",
      hospital:{
        status:"ACTIVE",
        disabledAt:null
      }
    },
    orderBy:{ updatedAt:"desc" }
  });

  if (!record) {
    return null;
  }

  const config = {
    id:record.id,
    hospitalId:record.hospitalId,
    provider:record.provider,
    apiName:record.apiName,
    baseUrl:record.baseUrl,
    credentials:decryptJson(record.encryptedCredentials),
    settings:jsonObject(record.settings),
    status:record.status as IntegrationStatus,
    lastSyncAt:record.lastSyncAt?.toISOString() ?? null
  };

  runtimeConfigCache.set(key, {
    config,
    expiresAt:Date.now() + CACHE_TTL_MS
  });

  return config;
}

export function invalidateHospitalIntegrationCache(hospitalId:string, provider?:string) {
  for (const key of runtimeConfigCache.keys()) {
    if (key.startsWith(`${hospitalId}:`) && (!provider || key.startsWith(`${hospitalId}:${provider}:`))) {
      runtimeConfigCache.delete(key);
    }
  }
}

export function toPublicIntegration(record:{
  id:string;
  hospitalId:string;
  provider:string;
  apiName:string;
  baseUrl:string | null;
  credentialMeta:unknown;
  settings:unknown;
  status:string;
  lastValidatedAt:Date | null;
  lastTestedAt:Date | null;
  lastSyncAt:Date | null;
  lastError:string | null;
  createdAt:Date;
  updatedAt:Date;
}) {
  return {
    id:record.id,
    hospitalId:record.hospitalId,
    provider:record.provider,
    apiName:record.apiName,
    baseUrl:record.baseUrl,
    credentials:jsonObject(record.credentialMeta),
    settings:jsonObject(record.settings),
    status:record.status,
    lastValidatedAt:record.lastValidatedAt?.toISOString() ?? null,
    lastTestedAt:record.lastTestedAt?.toISOString() ?? null,
    lastSyncAt:record.lastSyncAt?.toISOString() ?? null,
    lastError:record.lastError,
    createdAt:record.createdAt.toISOString(),
    updatedAt:record.updatedAt.toISOString()
  };
}

async function normalizeInput(input:IntegrationInput):Promise<AdapterInput> {
  const provider = normalizeProvider(input.provider);
  const apiName = input.apiName?.trim() || providerLabel(provider);
  const credentials = dropEmptyCredentialValues(input.credentials ?? {});
  const settings = jsonObject(input.settings ?? {});

  return {
    provider,
    apiName,
    baseUrl:input.baseUrl?.trim() || null,
    credentials,
    settings
  };
}

function normalizeProvider(provider:string):IntegrationProvider {
  const normalized = provider.trim().toLowerCase().replace(/_/g, "-");

  if (INTEGRATION_PROVIDERS.includes(normalized as IntegrationProvider)) {
    return normalized as IntegrationProvider;
  }

  throw new Error("Unsupported integration provider.");
}

function providerLabel(provider:IntegrationProvider) {
  return provider
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function encryptJson(value:IntegrationCredentials) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final()
  ]);

  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decryptJson(value:string):IntegrationCredentials {
  const key = getEncryptionKey();
  const [iv, tag, encrypted] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const raw = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(raw) as IntegrationCredentials;
}

function getEncryptionKey() {
  const raw = process.env.HOSPITAL_CONFIG_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("HOSPITAL_CONFIG_ENCRYPTION_KEY is required for hospital integration credentials.");
  }

  const key = parseKey(raw);

  if (key.length !== 32) {
    throw new Error("HOSPITAL_CONFIG_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return key;
}

function parseKey(raw:string) {
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  try {
    const base64 = Buffer.from(raw, "base64");
    if (base64.length === 32) return base64;
  } catch {
    // Fall through to utf8 parsing.
  }

  return Buffer.from(raw, "utf8");
}

function maskCredentialSummary(credentials:IntegrationCredentials) {
  return Object.fromEntries(
    Object.entries(credentials)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, maskSecret(value ?? "")])
  );
}

function maskSecret(value:string) {
  if (!value) return "";
  const tail = value.slice(-4);
  return `••••••${tail}`;
}

function dropEmptyCredentialValues(credentials:IntegrationCredentials) {
  return Object.fromEntries(
    Object.entries(credentials).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
  ) as IntegrationCredentials;
}

function jsonObject(value:unknown):IntegrationSettings {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntegrationSettings;
  }

  return {};
}

function toPrismaJson(value:IntegrationSettings) {
  return value as never;
}

function requireAnyCredential(credentials:IntegrationCredentials, keys:string[]) {
  if (!keys.some((key) => credentials[key])) {
    throw new Error(`Provide at least one credential: ${keys.join(", ")}.`);
  }
}

function bearer(credentials:IntegrationCredentials) {
  return credentials.accessToken ?? credentials.refreshToken ?? credentials.apiKey;
}

function buildHeaders(credentials:IntegrationCredentials, settings:IntegrationSettings) {
  const headers = new Headers();
  const token = bearer(credentials);
  const headerName = typeof settings.authHeaderName === "string"
    ? settings.authHeaderName
    : "Authorization";

  if (token) {
    headers.set(headerName, headerName.toLowerCase() === "authorization" ? `Bearer ${token}` : token);
  }

  if (credentials.apiKey && typeof settings.apiKeyHeaderName === "string") {
    headers.set(settings.apiKeyHeaderName, credentials.apiKey);
  }

  return headers;
}

async function timedFetch(url:string, init:RequestInit = {}):Promise<IntegrationTestResult> {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(url, {
      ...init,
      signal:AbortSignal.timeout(12_000)
    });
    const latencyMs = Date.now() - startedAt;

    return {
      ok:response.ok,
      status:response.ok ? "CONNECTED" : "NEEDS_ATTENTION",
      message:response.ok
        ? "Connection test succeeded."
        : `Connection test failed with HTTP ${response.status}.`,
      checkedAt,
      latencyMs,
      details:{
        httpStatus:response.status
      }
    };
  } catch (error) {
    return {
      ok:false,
      status:"NEEDS_ATTENTION",
      message:error instanceof Error ? error.message : "Connection test failed.",
      checkedAt,
      latencyMs:Date.now() - startedAt
    };
  }
}

const googleBusinessAdapter:ProviderAdapter = {
  async validateCredentials({ credentials }) {
    requireAnyCredential(credentials, ["accessToken", "apiKey", "refreshToken"]);
  },
  async testConnection({ credentials }) {
    if (credentials.accessToken) {
      return timedFetch("https://mybusinessbusinessinformation.googleapis.com/v1/accounts", {
        headers:buildHeaders(credentials, {})
      });
    }

    if (credentials.apiKey) {
      return timedFetch(`https://mybusinessbusinessinformation.googleapis.com/v1/accounts?key=${encodeURIComponent(credentials.apiKey)}`);
    }

    return {
      ok:false,
      status:"NEEDS_ATTENTION",
      message:"A Google access token or API key is required for a live test.",
      checkedAt:new Date().toISOString()
    };
  }
};

const googleAnalyticsAdapter:ProviderAdapter = {
  async validateCredentials({ credentials }) {
    requireAnyCredential(credentials, ["accessToken", "apiKey", "refreshToken"]);
  },
  async testConnection({ credentials, settings }) {
    const propertyId = typeof settings.propertyId === "string" ? settings.propertyId : null;

    if (propertyId && credentials.accessToken) {
      return timedFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`, {
        method:"POST",
        headers:new Headers([
          ["Authorization", `Bearer ${credentials.accessToken}`],
          ["Content-Type", "application/json"]
        ]),
        body:JSON.stringify({
          dateRanges:[{ startDate:"7daysAgo", endDate:"today" }],
          metrics:[{ name:"activeUsers" }]
        })
      });
    }

    if (credentials.accessToken) {
      return timedFetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(credentials.accessToken)}`);
    }

    return {
      ok:false,
      status:"NEEDS_ATTENTION",
      message:"A Google Analytics access token is required for a live test.",
      checkedAt:new Date().toISOString()
    };
  }
};

const metaAdapter:ProviderAdapter = {
  async validateCredentials({ credentials }) {
    requireAnyCredential(credentials, ["accessToken", "apiKey"]);
  },
  async testConnection({ credentials }) {
    const token = bearer(credentials);
    return timedFetch(`https://graph.facebook.com/me?access_token=${encodeURIComponent(token ?? "")}`);
  }
};

const linkedInAdapter:ProviderAdapter = {
  async validateCredentials({ credentials }) {
    requireAnyCredential(credentials, ["accessToken"]);
  },
  async testConnection({ credentials }) {
    return timedFetch("https://api.linkedin.com/v2/userinfo", {
      headers:buildHeaders(credentials, {})
    });
  }
};

const youtubeAdapter:ProviderAdapter = {
  async validateCredentials({ credentials }) {
    requireAnyCredential(credentials, ["accessToken", "apiKey"]);
  },
  async testConnection({ credentials }) {
    if (credentials.accessToken) {
      return timedFetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
        headers:buildHeaders(credentials, {})
      });
    }

    return timedFetch(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&q=healthcare&key=${encodeURIComponent(credentials.apiKey ?? "")}`);
  }
};

const httpAdapter:ProviderAdapter = {
  async validateCredentials({ baseUrl, credentials }) {
    if (!baseUrl) {
      throw new Error("Base URL is required for this provider.");
    }

    if (!credentials.apiKey && !credentials.accessToken && !credentials.username) {
      throw new Error("Provide API key, access token, or username credentials.");
    }
  },
  async testConnection({ baseUrl, credentials, settings }) {
    if (!baseUrl) {
      throw new Error("Base URL is required for this provider.");
    }

    const url = new URL(baseUrl);
    if (credentials.apiKey && typeof settings.apiKeyQueryParam === "string") {
      url.searchParams.set(settings.apiKeyQueryParam, credentials.apiKey);
    }

    return timedFetch(url.toString(), {
      method:typeof settings.testMethod === "string" ? settings.testMethod : "GET",
      headers:buildHeaders(credentials, settings)
    });
  }
};

const adapters:Record<IntegrationProvider, ProviderAdapter> = {
  "google-business":googleBusinessAdapter,
  "google-analytics":googleAnalyticsAdapter,
  meta:metaAdapter,
  linkedin:linkedInAdapter,
  youtube:youtubeAdapter,
  crm:httpAdapter,
  website:httpAdapter,
  custom:httpAdapter
};

async function recordIntegrationChange(
  hospitalId:string,
  action:string,
  resourceId:string,
  actorId:string | null | undefined,
  payload:Record<string, unknown>
) {
  await prisma.auditLog.create({
    data:{
      userId:actorId ?? null,
      action,
      resource:"HospitalIntegrationConfig",
      resourceId,
      hospitalId
    }
  });

  const workspace = await prisma.workspace.findFirst({
    where:{ slug:hospitalId },
    select:{ id:true }
  });

  if (workspace) {
    await prisma.eventEnvelope.create({
      data:{
        id:crypto.randomUUID(),
        eventId:crypto.randomUUID(),
        workspaceId:workspace.id,
        idempotencyKey:`${action}:${resourceId}:${Date.now()}`,
        topic:"hospital.integrations",
        eventType:action,
        eventVersion:1,
        aggregateType:"HospitalIntegrationConfig",
        aggregateId:resourceId,
        event:toPrismaJson(payload),
        metadata:toPrismaJson({ hospitalId, actorId:actorId ?? null }),
        priority:"HIGH",
        publishedAt:new Date(),
        occurredAt:new Date(),
        state:"PENDING"
      }
    });
  }
}
