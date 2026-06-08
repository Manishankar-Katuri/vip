import { Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export type AIUsageTrackerInput<T> = {
  hospitalId?:string | null;
  userId?:string | null;
  roleId?:string | null;
  feature:string;
  provider:string;
  model:string;
  operation:()=>Promise<T>;
};

export type AiUsageRecordInput = {
  hospitalId?:string | null;
  userId?:string | null;
  roleId?:string | null;
  feature:string;
  provider:string;
  model:string;
  promptTokens?:number;
  completionTokens?:number;
  totalTokens?:number;
  responseTimeMs:number;
  success:boolean;
  errorMessage?:string | null;
};

export type TokenUsage = {
  promptTokens:number;
  completionTokens:number;
  totalTokens:number;
};

const DEFAULT_MODEL_PRICING:Record<string, {
  input:number;
  output:number;
}> = {
  "openai:gpt-4.1-mini":{
    input:0.4,
    output:1.6
  },
  "openai:text-embedding-3-small":{
    input:0.02,
    output:0
  }
};

@Injectable()
export class AIUsageTracker {
  private readonly logger = new Logger(AIUsageTracker.name);

  constructor(
    private readonly prisma:PrismaService
  ) {}

  async execute<T>(
    input:AIUsageTrackerInput<T>
  ):Promise<T> {
    const startedAt = Date.now();

    try {
      const result = await input.operation();
      const usage = extractTokenUsage(result);

      await this.safeRecord({
        ...input,
        ...usage,
        responseTimeMs:Date.now() - startedAt,
        success:true
      });

      return result;
    } catch(error) {
      await this.safeRecord({
        ...input,
        responseTimeMs:Date.now() - startedAt,
        success:false,
        errorMessage:errorMessage(error)
      });

      throw error;
    }
  }

  async record(
    input:AiUsageRecordInput
  ) {
    const promptTokens = normalizeToken(input.promptTokens);
    const completionTokens = normalizeToken(input.completionTokens);
    const totalTokens =
      normalizeToken(input.totalTokens) ||
      promptTokens + completionTokens;
    const estimatedCost = await this.estimateCost({
      provider:input.provider,
      model:input.model,
      promptTokens,
      completionTokens
    });

    return this.prisma.aiAuditLog.create({
      data:{
        hospitalId:input.hospitalId ?? null,
        userId:input.userId ?? null,
        roleId:input.roleId ?? null,
        feature:input.feature,
        provider:input.provider,
        model:input.model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost,
        responseTimeMs:Math.max(0, Math.round(input.responseTimeMs)),
        success:input.success,
        errorMessage:input.errorMessage ?? null
      }
    });
  }

  async estimateCost(
    input:{
      provider:string;
      model:string;
      promptTokens:number;
      completionTokens:number;
    }
  ) {
    const pricing = await this.prisma.aiModelPricing.findFirst({
      where:{
        provider:input.provider,
        model:input.model,
        isActive:true,
        effectiveFrom:{
          lte:new Date()
        },
        OR:[
          { effectiveTo:null },
          { effectiveTo:{ gt:new Date() } }
        ]
      },
      orderBy:{
        effectiveFrom:"desc"
      }
    });
    const fallback =
      DEFAULT_MODEL_PRICING[
        `${input.provider}:${input.model}`
      ];
    const inputPrice =
      pricing?.inputTokenPricePerMillion ??
      fallback?.input ??
      0;
    const outputPrice =
      pricing?.outputTokenPricePerMillion ??
      fallback?.output ??
      0;

    return roundMoney(
      (input.promptTokens / 1_000_000) * inputPrice +
      (input.completionTokens / 1_000_000) * outputPrice
    );
  }

  private async safeRecord(
    input:AiUsageRecordInput
  ) {
    try {
      await this.record(input);
    } catch(error) {
      this.logger.warn(
        `AI audit logging failed: ${errorMessage(error)}`
      );
    }
  }
}

export function extractTokenUsage(
  value:unknown
):TokenUsage {
  const record = value as {
    usage?:Record<string, unknown>;
  } | null;
  const usage = record?.usage ?? {};
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

function normalizeToken(
  value:unknown
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function roundMoney(
  value:number
) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function errorMessage(
  error:unknown
) {
  return error instanceof Error
    ? error.message
    : String(error);
}
