import { ZodError } from "zod";

import type { AiApiTelemetry } from "./telemetry";

export class AiApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AiApiError";
  }
}

export async function handleAiRequest<T>(
  endpoint: string,
  request: Request,
  telemetry: AiApiTelemetry,
  execute: () => Promise<T>
) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    const body = await execute();
    telemetry.record({ endpoint, requestId, outcome: "success", durationMs: Date.now() - startedAt });
    return Response.json(body, { headers: { "x-request-id": requestId } });
  } catch (error) {
    const failure = toFailure(error);
    telemetry.record({
      endpoint,
      requestId,
      outcome: "failure",
      durationMs: Date.now() - startedAt,
      code: failure.code,
    });
    return Response.json(
      { success: false, error: { code: failure.code, message: failure.message, requestId } },
      { status: failure.status, headers: { "x-request-id": requestId } }
    );
  }
}

function toFailure(error: unknown) {
  if (error instanceof ZodError) {
    return new AiApiError("INVALID_QUERY", error.issues.map((issue) => issue.message).join(" "), 400);
  }
  if (error instanceof AiApiError) return error;
  return new AiApiError("INTERNAL_ERROR", "The request could not be completed.", 500);
}
