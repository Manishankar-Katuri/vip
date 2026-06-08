import type { AiRecommendationReadService } from "./service";
import { handleAiRequest } from "./errors";
import { parseRecommendationQuery, parseSummaryQuery } from "./query";
import type { AiApiTelemetry } from "./telemetry";

export interface AiApiHandlers {
  recommendations(request: Request): Promise<Response>;
  insights(request: Request): Promise<Response>;
  explanations(request: Request): Promise<Response>;
  opportunities(request: Request): Promise<Response>;
}

export function createAiApiHandlers(service: AiRecommendationReadService, telemetry: AiApiTelemetry): AiApiHandlers {
  return {
    recommendations: (request) => handleAiRequest("recommendations", request, telemetry, () =>
      service.recommendations(parseRecommendationQuery(request.url))
    ),
    insights: (request) => handleAiRequest("insights", request, telemetry, () =>
      service.insights(parseSummaryQuery(request.url))
    ),
    explanations: (request) => handleAiRequest("explanations", request, telemetry, () =>
      service.explanations(parseSummaryQuery(request.url))
    ),
    opportunities: (request) => handleAiRequest("opportunities", request, telemetry, () =>
      service.opportunities(parseSummaryQuery(request.url))
    ),
  };
}
