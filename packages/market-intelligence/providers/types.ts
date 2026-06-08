import { IndiaRegion, MarketSignalCategory, TrendSignal } from "../types";

export interface ProviderRequest {
  workspaceId: string;
  region: IndiaRegion;
  regionKey: string;
  asOf: Date;
  specialtyFocus: string[];
}

export interface MarketSignalProvider {
  id: string;
  category: MarketSignalCategory | "MULTI_SIGNAL";
  cacheTtlMs?: number;
  minimumIntervalMs?: number;
  collect(request: ProviderRequest): Promise<TrendSignal[]>;
}

export interface CollectedSignals {
  signals: TrendSignal[];
  cached: boolean;
  providerId: string;
  collectedAt: string;
}
