import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { persistMarketContextSnapshot } from "./persist-market-context-snapshot";
import type { MarketContext } from "../types";

describe("persistMarketContextSnapshot", () => {
  it("writes the resolved social workspace ID as the snapshot foreign key", async () => {
    const calls: unknown[] = [];
    const generatedAt = new Date("2026-05-23T10:49:39.252Z");
    const workspaceId = "4d70a15e-9600-4020-a7aa-3dd84218b363";
    const context = {
      workspaceId,
      regionKey: "in:karnataka:bengaluru",
    } as MarketContext;

    await persistMarketContextSnapshot(
      async (data) => { calls.push(data); return data; },
      context,
      generatedAt
    );

    assert.equal((calls[0] as { workspaceId: string }).workspaceId, workspaceId);
  });
});
