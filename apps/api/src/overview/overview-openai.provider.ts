import OpenAI from "openai";

export const OVERVIEW_OPENAI_CLIENT = Symbol("OVERVIEW_OPENAI_CLIENT");

export type OverviewOpenAIClient = {
  responses:{
    create(input:unknown):Promise<unknown>;
  };
};

export const overviewOpenAIProvider = {
  provide:OVERVIEW_OPENAI_CLIENT,
  useFactory:():OverviewOpenAIClient | null => {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    return new OpenAI({
      apiKey:process.env.OPENAI_API_KEY,
      timeout:30_000,
      maxRetries:0
    }) as unknown as OverviewOpenAIClient;
  }
};
