import { createHmac, timingSafeEqual } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { UserRole } from "./types/user-role.enum";

export type JwtUserPayload = {
  userId:string;
  role:UserRole;
  hospitalId:string | null;
  isGlobal:boolean;
};

type JwtClaims = JwtUserPayload & {
  iat:number;
  exp:number;
};

const SUPPORTED_ROLES = new Set<string>(
  Object.values(UserRole)
);

export function signJwt(
  payload:JwtUserPayload,
  secret:string,
  expiresInSeconds = 60 * 60 * 24 * 7
) {
  const now = Math.floor(Date.now() / 1000);
  const claims:JwtClaims = {
    ...payload,
    iat:now,
    exp:now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(
    JSON.stringify({
      alg:"HS256",
      typ:"JWT"
    })
  );

  const encodedPayload = base64UrlEncode(
    JSON.stringify(claims)
  );

  const signature = createSignature(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(
  token:string,
  secret:string
): JwtUserPayload {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new UnauthorizedException("Invalid JWT");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = createSignature(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );

  if (!safeEqual(signature, expectedSignature)) {
    throw new UnauthorizedException("Invalid JWT signature");
  }

  const header = parseBase64Json(encodedHeader);

  if (header.alg !== "HS256") {
    throw new UnauthorizedException("Unsupported JWT algorithm");
  }

  const claims = parseBase64Json(encodedPayload) as Partial<JwtClaims>;
  const now = Math.floor(Date.now() / 1000);

  if (!claims.exp || claims.exp < now) {
    throw new UnauthorizedException("JWT expired");
  }

  if (
    typeof claims.userId !== "string" ||
    typeof claims.role !== "string" ||
    !SUPPORTED_ROLES.has(claims.role) ||
    typeof claims.isGlobal !== "boolean"
  ) {
    throw new UnauthorizedException("Invalid JWT role context");
  }

  return {
    userId:claims.userId,
    role:claims.role as UserRole,
    hospitalId:
      typeof claims.hospitalId === "string"
        ? claims.hospitalId
        : null,
    isGlobal:claims.isGlobal
  };
}

function createSignature(
  value:string,
  secret:string
) {
  return createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
}

function base64UrlEncode(
  value:string
) {
  return Buffer.from(value).toString("base64url");
}

function parseBase64Json(
  value:string
) {
  return JSON.parse(
    Buffer.from(value, "base64url").toString("utf8")
  );
}

function safeEqual(
  value:string,
  expected:string
) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}
