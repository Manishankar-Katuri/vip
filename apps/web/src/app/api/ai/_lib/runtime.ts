import { createAiApiHandlers } from "./handlers";
import { PrismaAiRecommendationQueryRepository } from "./repository";
import { AiRecommendationReadService } from "./service";
import { consoleAiApiTelemetry } from "./telemetry";

export const aiApiHandlers = createAiApiHandlers(
  new AiRecommendationReadService(new PrismaAiRecommendationQueryRepository()),
  consoleAiApiTelemetry
);
