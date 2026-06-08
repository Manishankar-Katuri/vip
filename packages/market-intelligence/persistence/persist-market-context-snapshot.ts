import { MarketContext } from "../types";
import { toJson } from "../utils";

export interface MarketContextSnapshotInput {
  workspaceId: string;
  regionKey: string;
  context: any;
  generatedAt: Date;
  expiresAt: Date;
}

export type MarketContextSnapshotWriter = (
  data: MarketContextSnapshotInput
) => PromiseLike<unknown>;

export async function persistMarketContextSnapshot(
  writeSnapshot: MarketContextSnapshotWriter,
  context: MarketContext,
  generatedAt: Date
) {
  return writeSnapshot({
    workspaceId: context.workspaceId,
    regionKey: context.regionKey,
    context: toJson(context),
    generatedAt,
    expiresAt: new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000),
  });
}
