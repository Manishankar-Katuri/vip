const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("../src/generated/client");

const repoRoot = path.resolve(__dirname, "../../..");
const envFiles = [
  path.join(repoRoot, ".env"),
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, "packages", "database", ".env"),
  path.join(repoRoot, "apps", "web", ".env.local"),
];

for (const filePath of envFiles) {
  loadEnvFile(filePath);
}

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log("VIP database connectivity check");
console.log(`Loaded env files: ${envFiles.filter((filePath) => fs.existsSync(filePath)).map((filePath) => path.relative(repoRoot, filePath)).join(", ") || "none"}`);
console.log(`DATABASE_URL: ${presence(databaseUrl)}`);
console.log(`DIRECT_URL: ${presence(directUrl)}`);

if (!databaseUrl) {
  console.log("Result: FAILED");
  console.log("Reason: DATABASE_URL is not set after loading repo env files.");
  process.exit(1);
}

const prisma = new PrismaClient({
  log: [],
});

async function main() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`select 1 as ok`;
    console.log("Result: SUCCESS");
    console.log(`Reason: Prisma connected and completed a read-only SELECT 1 in ${Date.now() - startedAt}ms.`);
  } catch (error) {
    console.log("Result: FAILED");
    console.log(`Reason: ${friendlyReason(error)}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    process.env[key] = unquote(rawValue.trim());
  }
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function presence(value) {
  if (!value) return "missing";
  return `present (${safeUrlSummary(value)})`;
}

function safeUrlSummary(value) {
  try {
    const url = new URL(value);
    const protocol = url.protocol.replace(":", "") || "unknown";
    const host = url.hostname || "unknown-host";
    const database = url.pathname ? url.pathname.replace(/^\//, "") || "default" : "default";

    return `${protocol}://${host}/${database}`;
  } catch {
    return "set but not parseable as URL";
  }
}

function friendlyReason(error) {
  const message = error instanceof Error ? error.message : String(error);
  const firstLine = message.split(/\r?\n/).find(Boolean) ?? "Unknown Prisma connection error.";

  if (message.includes("Can't reach database server")) {
    return "Prisma could not reach the database server. Check network access, Supabase availability, and the database host/port.";
  }

  if (message.includes("Authentication failed")) {
    return "Prisma reached the database but authentication failed. Check DATABASE_URL credentials.";
  }

  if (message.includes("Environment variable not found")) {
    return firstLine;
  }

  return firstLine;
}

main();
