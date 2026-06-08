import prisma from "@vip/database";

import { CollectedSignals, MarketSignalProvider, ProviderRequest } from "./types";
import { toJson } from "../utils";

const lastRequestAt = new Map<string, number>();

export class ProviderRunner {
  async collect(
    provider: MarketSignalProvider,
    request: ProviderRequest,
    forceRefresh = false
  ): Promise<CollectedSignals> {
    const cacheKey = this.cacheKey(provider, request);
    const now = new Date();

    if (!forceRefresh) {
      const cached = await prisma.marketProviderCache.findUnique({ where: { cacheKey } });
      if (cached && cached.expiresAt > now) {
        return {
          signals: cached.payload as unknown as CollectedSignals["signals"],
          cached: true,
          providerId: provider.id,
          collectedAt: cached.collectedAt.toISOString(),
        };
      }
    }

    await this.waitForRateLimit(provider);
    const signals = await provider.collect(request);
    const expiresAt = new Date(now.getTime() + (provider.cacheTtlMs ?? 6 * 60 * 60 * 1000));

    await prisma.marketProviderCache.upsert({
      where: { cacheKey },
      update: { payload: toJson(signals), collectedAt: now, expiresAt },
      create: {
        cacheKey,
        provider: provider.id,
        category: provider.category,
        regionKey: request.regionKey,
        payload: toJson(signals),
        collectedAt: now,
        expiresAt,
      },
    });

    return {
      signals,
      cached: false,
      providerId: provider.id,
      collectedAt: now.toISOString(),
    };
  }

  private cacheKey(provider: MarketSignalProvider, request: ProviderRequest) {
    const focus = [...request.specialtyFocus].sort().join(",").toLowerCase();
    return `${provider.id}:${provider.category}:${request.regionKey}:${focus}`;
  }

  private async waitForRateLimit(provider: MarketSignalProvider) {
    const interval = provider.minimumIntervalMs ?? 1000;
    const previous = lastRequestAt.get(provider.id) ?? 0;
    const waitMs = interval - (Date.now() - previous);

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    lastRequestAt.set(provider.id, Date.now());
  }
}
