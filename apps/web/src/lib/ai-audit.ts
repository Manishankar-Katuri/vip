type TrackedAIInput<T> = {
  hospitalId?:string | null;
  userId?:string | null;
  roleId?:string | null;
  feature:string;
  provider:string;
  model:string;
  operation:()=>Promise<T>;
};

type TokenUsage = {
  promptTokens:number;
  completionTokens:number;
  totalTokens:number;
};

export async function executeTrackedAI<T>(
  input:TrackedAIInput<T>
):Promise<T> {
  const startedAt = Date.now();

  try {
    const result = await input.operation();
    const usage = extractTokenUsage(result);

    await sendAudit({
      ...input,
      ...usage,
      responseTimeMs:Date.now() - startedAt,
      success:true
    });

    return result;
  } catch(error) {
    await sendAudit({
      ...input,
      responseTimeMs:Date.now() - startedAt,
      success:false,
      errorMessage:error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
}

function extractTokenUsage(
  value:unknown
):TokenUsage {
  const usage = (value as { usage?:Record<string, unknown> } | null)?.usage ?? {};
  const promptTokens = firstNumber(
    usage.prompt_tokens,
    usage.input_tokens,
    usage.promptTokens,
    usage.inputTokens
  );
  const completionTokens = firstNumber(
    usage.completion_tokens,
    usage.output_tokens,
    usage.completionTokens,
    usage.outputTokens
  );
  const totalTokens = firstNumber(
    usage.total_tokens,
    usage.totalTokens,
    promptTokens + completionTokens
  );

  return {
    promptTokens,
    completionTokens,
    totalTokens
  };
}

async function sendAudit(
  body:Record<string, unknown>
) {
  const baseUrl =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3001";
  const headers:Record<string, string> = {
    "Content-Type":"application/json"
  };

  if (process.env.AI_AUDIT_INGEST_KEY) {
    headers["x-ai-audit-key"] = process.env.AI_AUDIT_INGEST_KEY;
  }

  try {
    await fetch(`${baseUrl}/ai-audit/ingest`, {
      method:"POST",
      headers,
      body:JSON.stringify(stripOperation(body)),
      cache:"no-store"
    });
  } catch(error) {
    console.warn("AI audit ingest failed", error);
  }
}

function stripOperation(
  body:Record<string, unknown>
) {
  const rest = { ...body };
  delete rest.operation;

  return rest;
}

function firstNumber(
  ...values:unknown[]
) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }
  }

  return 0;
}
