import { MarketSignalCategory, TrendSignal } from "../types";
import { MarketSignalProvider, ProviderRequest } from "./types";

export type SignalCollector = (request: ProviderRequest) => Promise<TrendSignal[]>;

export class AdapterSignalProvider implements MarketSignalProvider {
  constructor(
    public readonly id: string,
    public readonly category: MarketSignalCategory | "MULTI_SIGNAL",
    private readonly collector: SignalCollector,
    public readonly cacheTtlMs = 6 * 60 * 60 * 1000,
    public readonly minimumIntervalMs = 1000
  ) {}

  collect(request: ProviderRequest) {
    return this.collector(request);
  }
}

export const marketProviderFactories = {
  googleTrends: (collector: SignalCollector) =>
    new AdapterSignalProvider("google-trends", "MULTI_SIGNAL", collector, 6 * 60 * 60 * 1000, 1500),
  instagramHashtags: (collector: SignalCollector) =>
    new AdapterSignalProvider("instagram-hashtags", "HASHTAG", collector, 6 * 60 * 60 * 1000, 2000),
  youtubeShorts: (collector: SignalCollector) =>
    new AdapterSignalProvider("youtube-shorts", "CONTENT_FORMAT", collector, 6 * 60 * 60 * 1000, 1500),
  redditHealthcare: (collector: SignalCollector) =>
    new AdapterSignalProvider("reddit-healthcare", "HEALTHCARE_TOPIC", collector, 3 * 60 * 60 * 1000, 1200),
  xTrends: (collector: SignalCollector) =>
    new AdapterSignalProvider("x-trends", "MULTI_SIGNAL", collector, 3 * 60 * 60 * 1000, 2000),
  publicHealth: (collector: SignalCollector) =>
    new AdapterSignalProvider("public-health", "MULTI_SIGNAL", collector, 12 * 60 * 60 * 1000, 1500),
  weatherAirQuality: (collector: SignalCollector) =>
    new AdapterSignalProvider("weather-air-quality", "MULTI_SIGNAL", collector, 60 * 60 * 1000, 1000),
};
