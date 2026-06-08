import { RecommendationQuerySchema, SummaryQuerySchema } from "./contracts";

export function parseRecommendationQuery(url: string) {
  const query = new URL(url).searchParams;
  return RecommendationQuerySchema.parse({
    ...filterValues(query),
    page: query.get("page") ?? undefined,
    pageSize: query.get("pageSize") ?? undefined,
    sortBy: query.get("sortBy") ?? undefined,
    sortDirection: query.get("sortDirection") ?? undefined,
  });
}

export function parseSummaryQuery(url: string) {
  const query = new URL(url).searchParams;
  return SummaryQuerySchema.parse({
    ...filterValues(query),
    limit: query.get("limit") ?? undefined,
  });
}

function filterValues(query: URLSearchParams) {
  return {
    workspaceId: query.get("workspaceId") ?? undefined,
    statuses: query.get("statuses") ?? undefined,
    priorities: query.get("priorities") ?? undefined,
    types: query.get("types") ?? undefined,
    minConfidence: query.get("minConfidence") ?? undefined,
    maxConfidence: query.get("maxConfidence") ?? undefined,
    from: query.get("from") ?? undefined,
    to: query.get("to") ?? undefined,
  };
}
