import { strict as assert } from "node:assert";

import {
  AIUsageTracker,
  extractTokenUsage
} from "./ai-usage-tracker.service";

describe("AIUsageTracker", () => {
  it("extracts OpenAI chat completion usage", () => {
    assert.deepEqual(
      extractTokenUsage({
        usage:{
          prompt_tokens:10,
          completion_tokens:5,
          total_tokens:15
        }
      }),
      {
        promptTokens:10,
        completionTokens:5,
        totalTokens:15
      }
    );
  });

  it("extracts OpenAI responses usage", () => {
    assert.deepEqual(
      extractTokenUsage({
        usage:{
          input_tokens:20,
          output_tokens:7,
          total_tokens:27
        }
      }),
      {
        promptTokens:20,
        completionTokens:7,
        totalTokens:27
      }
    );
  });

  it("extracts embeddings usage without completion tokens", () => {
    assert.deepEqual(
      extractTokenUsage({
        usage:{
          prompt_tokens:12,
          total_tokens:12
        }
      }),
      {
        promptTokens:12,
        completionTokens:0,
        totalTokens:12
      }
    );
  });

  it("uses configured pricing before default pricing", async () => {
    const tracker = new AIUsageTracker({
      aiModelPricing:{
        findFirst:async () => ({
          inputTokenPricePerMillion:2,
          outputTokenPricePerMillion:4
        })
      }
    } as any);

    assert.equal(
      await tracker.estimateCost({
        provider:"openai",
        model:"gpt-4.1-mini",
        promptTokens:1_000_000,
        completionTokens:500_000
      }),
      4
    );
  });

  it("falls back to known OpenAI pricing", async () => {
    const tracker = new AIUsageTracker({
      aiModelPricing:{
        findFirst:async () => null
      }
    } as any);

    assert.equal(
      await tracker.estimateCost({
        provider:"openai",
        model:"gpt-4.1-mini",
        promptTokens:1_000_000,
        completionTokens:1_000_000
      }),
      2
    );
  });

  it("records failed operations and rethrows the original error", async () => {
    const created:any[] = [];
    const tracker = new AIUsageTracker({
      aiModelPricing:{
        findFirst:async () => null
      },
      aiAuditLog:{
        create:async (input:any) => {
          created.push(input.data);
          return input.data;
        }
      }
    } as any);
    const error = new Error("quota exhausted");

    await assert.rejects(
      () => tracker.execute({
        feature:"test",
        provider:"openai",
        model:"gpt-4.1-mini",
        operation:async () => {
          throw error;
        }
      }),
      (failure:unknown) => failure === error
    );

    assert.equal(created.length, 1);
    assert.equal(created[0].success, false);
    assert.equal(created[0].errorMessage, "quota exhausted");
  });
});
