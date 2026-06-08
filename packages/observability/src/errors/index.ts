import { randomUUID } from "node:crypto";

import type { OperationalError, TelemetryContext } from "../dto";
import { OperationalErrorSchema } from "../dto";

export interface ErrorStore {
  persist(error: OperationalError): Promise<void>;
  list(): Promise<OperationalError[]>;
}

export class CentralErrorService {
  constructor(private readonly store: ErrorStore, private readonly id: () => string = () => randomUUID()) {}

  async capture(error: unknown, context: TelemetryContext, attributes: Record<string, unknown> = {}) {
    const exception = error instanceof Error ? error : new Error(String(error));
    const classification = classify(exception);
    const operational = OperationalErrorSchema.parse({
      id: this.id(), ...classification, message: exception.message, stack: exception.stack,
      occurredAt: new Date().toISOString(), context, attributes,
    }) as OperationalError;
    await this.store.persist(operational);
    return operational;
  }
}

export class MemoryErrorStore implements ErrorStore {
  readonly errors: OperationalError[] = [];
  async persist(error: OperationalError) { this.errors.push(error); }
  async list() { return [...this.errors]; }
}

export function classify(error: Error): Pick<OperationalError, "category" | "severity" | "retryable" | "code"> {
  const message = error.message.toLowerCase();
  if (message.includes("timeout") || message.includes("timed out")) {
    return { category: "TIMEOUT", severity: "ERROR", retryable: true, code: "TIMEOUT" };
  }
  if (message.includes("queue") || message.includes("redis")) {
    return { category: "QUEUE", severity: "ERROR", retryable: true, code: "QUEUE_FAILURE" };
  }
  if (message.includes("database") || message.includes("prisma")) {
    return { category: "DATABASE", severity: "CRITICAL", retryable: true, code: "DATABASE_FAILURE" };
  }
  if (message.includes("valid") || message.includes("schema")) {
    return { category: "VALIDATION", severity: "WARNING", retryable: false, code: "VALIDATION_FAILURE" };
  }
  return { category: "UNKNOWN", severity: "ERROR", retryable: false, code: "UNCLASSIFIED_FAILURE" };
}

interface ErrorDelegate { create(args: unknown): Promise<unknown>; findMany(args?: unknown): Promise<Record<string, unknown>[]>; }
export interface ErrorPrismaClient { operationalError: ErrorDelegate; }

export class PrismaErrorStore implements ErrorStore {
  constructor(private readonly database: ErrorPrismaClient) {}
  async persist(error: OperationalError) {
    await this.database.operationalError.create({ data: {
      ...error, workspaceId: typeof error.attributes.workspaceId === "string" ? error.attributes.workspaceId : undefined,
      occurredAt: new Date(error.occurredAt), context: error.context, attributes: error.attributes,
    } });
  }
  async list() {
    const rows = await this.database.operationalError.findMany({ orderBy: { occurredAt: "desc" } });
    return rows.map((row) => OperationalErrorSchema.parse({
      id: String(row.id), category: row.category, severity: row.severity, retryable: Boolean(row.retryable),
      code: String(row.code), message: String(row.message), stack: row.stack == null ? undefined : String(row.stack),
      occurredAt: row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt),
      context: row.context, attributes: row.attributes,
    }) as OperationalError);
  }
}
