import axios, { AxiosInstance } from "axios";

import { formatInstagramApiError } from "./instagram.collector";

const INSTAGRAM_GRAPH_API_BASE_URL = "https://graph.facebook.com/v20.0";

export interface InstagramMetricValue {
  value: number;
  end_time?: string;
}

export interface InstagramInsightMetric {
  name: "reach" | "impressions" | "saved" | string;
  period: string;
  values: InstagramMetricValue[];
  title?: string;
  description?: string;
  id: string;
}

interface InstagramInsightsResponse {
  data?: InstagramInsightMetric[];
}

export interface InstagramPostInsights {
  reach: number;
  impressions: number;
  saved: number;
  raw: InstagramInsightMetric[];
}

export interface InstagramMetricsCollectorConfig {
  accessToken: string;
  httpClient?: AxiosInstance;
}

export class InstagramMetricsCollector {
  private readonly httpClient: AxiosInstance;
  private readonly accessToken: string;

  constructor(config: InstagramMetricsCollectorConfig) {
    if (!config.accessToken) {
      throw new Error("INSTAGRAM_ACCESS_TOKEN is required.");
    }

    this.accessToken = config.accessToken;
    this.httpClient =
      config.httpClient ??
      axios.create({
        baseURL: INSTAGRAM_GRAPH_API_BASE_URL,
        timeout: 15000,
      });
  }

  async fetchPostInsights(mediaId: string): Promise<InstagramPostInsights> {
    const metrics = (
      await Promise.all(
        ["reach", "saved"].map((metric) =>
          this.fetchMetric(mediaId, metric)
        )
      )
    ).flat();

    return {
      reach: readMetricValue(metrics, "reach"),
      impressions: readMetricValue(metrics, "impressions"),
      saved: readMetricValue(metrics, "saved"),
      raw: metrics,
    };
  }

  private async fetchMetric(mediaId: string, metric: string) {
    try {
      const response = await this.httpClient.get<InstagramInsightsResponse>(
        `/${mediaId}/insights`,
        {
          params: {
            access_token: this.accessToken,
            metric,
          },
        }
      );

      return response.data.data ?? [];
    } catch (error) {
      const detail = formatInstagramApiError(error);

      if (
        detail.includes("metric") &&
        (detail.includes("does not support") || detail.includes("not supported"))
      ) {
        return [];
      }

      throw new Error(
        `Failed to fetch Instagram ${metric} insight for media ${mediaId}: ${detail}`
      );
    }
  }
}

export function createInstagramMetricsCollector(
  config?: Partial<InstagramMetricsCollectorConfig>
) {
  return new InstagramMetricsCollector({
    accessToken: config?.accessToken ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? "",
    httpClient: config?.httpClient,
  });
}

function readMetricValue(metrics: InstagramInsightMetric[], metricName: string) {
  const metric = metrics.find((item) => item.name === metricName);
  return metric?.values.at(-1)?.value ?? 0;
}
