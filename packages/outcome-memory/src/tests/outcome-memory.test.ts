import test from "node:test";
import assert from "node:assert/strict";

import { EpisodicMemory, InMemoryOutcomeRepository, OutcomeCorrelation, OutcomeLinking, OutcomeStore } from "../index";

test("stores recommendation outcome lineage and replayable episodes", async () => {
  const repository = new InMemoryOutcomeRepository();
  const store = new OutcomeStore(repository, () => "outcome-1", () => "2026-05-29T00:00:00.000Z");
  const linking = new OutcomeLinking(store);
  await linking.linkRecommendation({
    workspaceId: "workspace-1",
    recommendationId: "rec-1",
    status: "ACCEPTED",
    subject: { id: "rec-1", type: "RECOMMENDATION" },
    summary: "Accepted competitor response.",
    occurredAt: "2026-05-29T00:00:00.000Z",
    traceId: "trace-1",
  });

  const correlation = new OutcomeCorrelation(repository);
  const lineage = await correlation.recommendationLineage("workspace-1", "rec-1");
  assert.equal(lineage.accepted, true);
  assert.equal(lineage.timeline.length, 1);

  const episodic = new EpisodicMemory(repository, () => "episode-1", () => "2026-05-29T00:00:00.000Z");
  const episode = await episodic.storeEpisode({
    workspaceId: "workspace-1",
    title: "Competitor surge response",
    temporalWindow: { startsAt: "2026-05-29T00:00:00.000Z", endsAt: "2026-05-30T00:00:00.000Z", granularity: "DAY" },
    events: [
      { id: "signal-1", kind: "SIGNAL", ref: { id: "signal-1", type: "SIGNAL" }, occurredAt: "2026-05-29T01:00:00.000Z", summary: "Competitor surged.", evidence: [], metadata: {} },
      { id: "rec-1", kind: "RECOMMENDATION", ref: { id: "rec-1", type: "RECOMMENDATION" }, occurredAt: "2026-05-29T02:00:00.000Z", summary: "Response recommended.", evidence: [], metadata: {} },
    ],
    outcomeIds: ["outcome-1"],
    graphLinks: [{ id: "competitor-1", type: "COMPETITOR" }],
    lineage: {
      traceId: "trace-1",
      sourceEventIds: [],
      signalIds: ["signal-1"],
      priorityIds: [],
      recommendationIds: ["rec-1"],
      causalChainIds: [],
      parentOutcomeIds: [],
    },
  });

  const replayed: string[] = [];
  await episodic.replay("workspace-1", episode.id, async (event) => { replayed.push(event.id); });
  assert.deepEqual(replayed, ["signal-1", "rec-1"]);
});
