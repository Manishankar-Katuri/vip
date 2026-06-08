import { createHash, randomUUID } from "node:crypto";

import type { EntityRef, EvidenceRef, TemporalWindow, WorkspaceId } from "@vip/cognitive-core";

export type OutcomeKind = "RECOMMENDATION" | "ACTION" | "WORKFLOW" | "CAMPAIGN" | "STRATEGY" | "APPROVAL" | "KPI_CHANGE";
export type OutcomeStatus = "PROPOSED" | "ACCEPTED" | "REJECTED" | "EXECUTED" | "SUCCESSFUL" | "FAILED" | "SUPERSEDED";
export type EpisodeEventKind = "SIGNAL" | "RECOMMENDATION" | "ACTION" | "WORKFLOW" | "KPI_CHANGE" | "CAUSAL_FINDING" | "APPROVAL";

export interface OutcomeLineage {
  traceId: string;
  sourceEventIds: string[];
  signalIds: string[];
  priorityIds: string[];
  recommendationIds: string[];
  causalChainIds: string[];
  parentOutcomeIds: string[];
}

export interface OutcomeRecord {
  id: string;
  workspaceId: WorkspaceId;
  kind: OutcomeKind;
  status: OutcomeStatus;
  subject: EntityRef;
  summary: string;
  occurredAt: string;
  effectiveAt?: string;
  measurementWindow?: TemporalWindow;
  graphLinks: EntityRef[];
  recommendationId?: string;
  kpiDeltas: Array<{ kpi: EntityRef; baseline: number; current: number; unit?: string; observedAt: string }>;
  evidence: EvidenceRef[];
  lineage: OutcomeLineage;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeEvent {
  id: string;
  kind: EpisodeEventKind;
  ref: EntityRef;
  occurredAt: string;
  summary: string;
  evidence: EvidenceRef[];
  metadata: Record<string, unknown>;
}

export interface IntelligenceEpisode {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  sequenceKey: string;
  temporalWindow: TemporalWindow;
  events: EpisodeEvent[];
  outcomeIds: string[];
  replayCursor: number;
  graphLinks: EntityRef[];
  lineage: OutcomeLineage;
  createdAt: string;
  updatedAt: string;
}

export interface OutcomeQuery {
  workspaceId: WorkspaceId;
  kinds?: OutcomeKind[];
  statuses?: OutcomeStatus[];
  recommendationId?: string;
  entity?: EntityRef;
  from?: string;
  to?: string;
  traceId?: string;
}

export interface OutcomeRepository {
  upsert(outcome: OutcomeRecord): Promise<OutcomeRecord>;
  get(workspaceId: WorkspaceId, id: string): Promise<OutcomeRecord | null>;
  query(query: OutcomeQuery): Promise<OutcomeRecord[]>;
  upsertEpisode(episode: IntelligenceEpisode): Promise<IntelligenceEpisode>;
  getEpisode(workspaceId: WorkspaceId, id: string): Promise<IntelligenceEpisode | null>;
  queryEpisodes(query: { workspaceId: WorkspaceId; entity?: EntityRef; from?: string; to?: string; sequenceKey?: string }): Promise<IntelligenceEpisode[]>;
}

export class InMemoryOutcomeRepository implements OutcomeRepository {
  private readonly outcomes = new Map<string, OutcomeRecord>();
  private readonly episodes = new Map<string, IntelligenceEpisode>();

  async upsert(outcome: OutcomeRecord) {
    const prior = this.outcomes.get(key(outcome.workspaceId, outcome.id));
    const merged = prior ? { ...prior, ...outcome, createdAt: prior.createdAt } : outcome;
    this.outcomes.set(key(outcome.workspaceId, outcome.id), merged);
    return merged;
  }

  async get(workspaceId: WorkspaceId, id: string) {
    return this.outcomes.get(key(workspaceId, id)) ?? null;
  }

  async query(query: OutcomeQuery) {
    return [...this.outcomes.values()]
      .filter((outcome) => outcome.workspaceId === query.workspaceId)
      .filter((outcome) => !query.kinds || query.kinds.includes(outcome.kind))
      .filter((outcome) => !query.statuses || query.statuses.includes(outcome.status))
      .filter((outcome) => !query.recommendationId || outcome.recommendationId === query.recommendationId || outcome.lineage.recommendationIds.includes(query.recommendationId))
      .filter((outcome) => !query.traceId || outcome.lineage.traceId === query.traceId)
      .filter((outcome) => !query.entity || sameEntity(outcome.subject, query.entity) || outcome.graphLinks.some((entity) => sameEntity(entity, query.entity!)))
      .filter((outcome) => !query.from || outcome.occurredAt >= query.from)
      .filter((outcome) => !query.to || outcome.occurredAt <= query.to)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  }

  async upsertEpisode(episode: IntelligenceEpisode) {
    const prior = this.episodes.get(key(episode.workspaceId, episode.id));
    const merged = prior ? { ...prior, ...episode, createdAt: prior.createdAt } : episode;
    this.episodes.set(key(episode.workspaceId, episode.id), merged);
    return merged;
  }

  async getEpisode(workspaceId: WorkspaceId, id: string) {
    return this.episodes.get(key(workspaceId, id)) ?? null;
  }

  async queryEpisodes(query: { workspaceId: WorkspaceId; entity?: EntityRef; from?: string; to?: string; sequenceKey?: string }) {
    return [...this.episodes.values()]
      .filter((episode) => episode.workspaceId === query.workspaceId)
      .filter((episode) => !query.sequenceKey || episode.sequenceKey === query.sequenceKey)
      .filter((episode) => !query.entity || episode.graphLinks.some((entity) => sameEntity(entity, query.entity!)) || episode.events.some((event) => sameEntity(event.ref, query.entity!)))
      .filter((episode) => !query.from || episode.temporalWindow.endsAt >= query.from)
      .filter((episode) => !query.to || episode.temporalWindow.startsAt <= query.to)
      .sort((left, right) => left.temporalWindow.startsAt.localeCompare(right.temporalWindow.startsAt));
  }
}

export class OutcomeStore {
  constructor(
    private readonly repository: OutcomeRepository = new InMemoryOutcomeRepository(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async record(input: Omit<OutcomeRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
    const timestamp = this.now();
    return this.repository.upsert({
      ...input,
      id: input.id ?? this.id(),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  get(workspaceId: WorkspaceId, id: string) {
    return this.repository.get(workspaceId, id);
  }

  query(query: OutcomeQuery) {
    return this.repository.query(query);
  }
}

export class OutcomeTimeline {
  constructor(private readonly repository: OutcomeRepository) {}

  async forRecommendation(workspaceId: WorkspaceId, recommendationId: string) {
    const outcomes = await this.repository.query({ workspaceId, recommendationId });
    return outcomes.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  }

  async forEntity(workspaceId: WorkspaceId, entity: EntityRef, window?: Pick<OutcomeQuery, "from" | "to">) {
    return this.repository.query({ workspaceId, entity, ...window });
  }
}

export class OutcomeLinking {
  constructor(private readonly store: OutcomeStore) {}

  async linkRecommendation(input: {
    workspaceId: WorkspaceId;
    recommendationId: string;
    status: OutcomeStatus;
    subject: EntityRef;
    summary: string;
    occurredAt: string;
    traceId: string;
    graphLinks?: EntityRef[];
    evidence?: EvidenceRef[];
    metadata?: Record<string, unknown>;
  }) {
    return this.store.record({
      workspaceId: input.workspaceId,
      kind: "RECOMMENDATION",
      status: input.status,
      subject: input.subject,
      summary: input.summary,
      occurredAt: input.occurredAt,
      graphLinks: input.graphLinks ?? [],
      recommendationId: input.recommendationId,
      kpiDeltas: [],
      evidence: input.evidence ?? [],
      lineage: emptyLineage(input.traceId, { recommendationIds: [input.recommendationId] }),
      metadata: input.metadata ?? {},
    });
  }

  async linkKpiChange(input: {
    workspaceId: WorkspaceId;
    subject: EntityRef;
    recommendationId?: string;
    summary: string;
    occurredAt: string;
    kpiDeltas: OutcomeRecord["kpiDeltas"];
    traceId: string;
    evidence?: EvidenceRef[];
    graphLinks?: EntityRef[];
  }) {
    return this.store.record({
      workspaceId: input.workspaceId,
      kind: "KPI_CHANGE",
      status: input.kpiDeltas.some((delta) => delta.current > delta.baseline) ? "SUCCESSFUL" : "FAILED",
      subject: input.subject,
      summary: input.summary,
      occurredAt: input.occurredAt,
      graphLinks: input.graphLinks ?? [],
      recommendationId: input.recommendationId,
      kpiDeltas: input.kpiDeltas,
      evidence: input.evidence ?? [],
      lineage: emptyLineage(input.traceId, { recommendationIds: input.recommendationId ? [input.recommendationId] : [] }),
      metadata: {},
    });
  }
}

export class OutcomeCorrelation {
  constructor(private readonly repository: OutcomeRepository) {}

  async recommendationLineage(workspaceId: WorkspaceId, recommendationId: string) {
    const timeline = await this.repository.query({ workspaceId, recommendationId });
    const successful = timeline.filter((outcome) => outcome.status === "SUCCESSFUL").length;
    const failed = timeline.filter((outcome) => outcome.status === "FAILED" || outcome.status === "REJECTED").length;
    const executed = timeline.some((outcome) => outcome.status === "EXECUTED" || outcome.kind === "WORKFLOW" || outcome.kind === "ACTION");
    return {
      recommendationId,
      timeline,
      accepted: timeline.some((outcome) => outcome.status === "ACCEPTED"),
      executed,
      effectiveness: clamp((successful - failed + timeline.length) / Math.max(1, timeline.length * 2), 0, 1),
    };
  }

  async correlateByGraph(workspaceId: WorkspaceId, entity: EntityRef, window?: Pick<OutcomeQuery, "from" | "to">) {
    const outcomes = await this.repository.query({ workspaceId, entity, ...window });
    const grouped = new Map<OutcomeKind, OutcomeRecord[]>();
    for (const outcome of outcomes) grouped.set(outcome.kind, [...(grouped.get(outcome.kind) ?? []), outcome]);
    return [...grouped.entries()].map(([kind, records]) => ({ kind, records, count: records.length }));
  }
}

export class EpisodicMemory {
  constructor(
    private readonly repository: OutcomeRepository,
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async storeEpisode(input: Omit<IntelligenceEpisode, "id" | "sequenceKey" | "replayCursor" | "createdAt" | "updatedAt"> & { id?: string; sequenceKey?: string }) {
    const timestamp = this.now();
    const events = [...input.events].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    return this.repository.upsertEpisode({
      ...input,
      id: input.id ?? this.id(),
      sequenceKey: input.sequenceKey ?? sequenceKey(events),
      events,
      replayCursor: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async appendEvent(workspaceId: WorkspaceId, episodeId: string, event: EpisodeEvent) {
    const episode = await this.repository.getEpisode(workspaceId, episodeId);
    if (!episode) throw new Error(`Unknown intelligence episode: ${episodeId}.`);
    const events = [...episode.events.filter((item) => item.id !== event.id), event].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    return this.repository.upsertEpisode({ ...episode, events, sequenceKey: sequenceKey(events), replayCursor: Math.min(episode.replayCursor, events.length), updatedAt: this.now() });
  }

  async replay(workspaceId: WorkspaceId, episodeId: string, handler: (event: EpisodeEvent) => Promise<void>) {
    const episode = await this.repository.getEpisode(workspaceId, episodeId);
    if (!episode) throw new Error(`Unknown intelligence episode: ${episodeId}.`);
    for (let index = episode.replayCursor; index < episode.events.length; index += 1) await handler(episode.events[index]);
    await this.repository.upsertEpisode({ ...episode, replayCursor: episode.events.length, updatedAt: this.now() });
    return { episodeId, replayed: Math.max(0, episode.events.length - episode.replayCursor) };
  }
}

export function emptyLineage(traceId: string, patch: Partial<OutcomeLineage> = {}): OutcomeLineage {
  return {
    traceId,
    sourceEventIds: [],
    signalIds: [],
    priorityIds: [],
    recommendationIds: [],
    causalChainIds: [],
    parentOutcomeIds: [],
    ...patch,
  };
}

function sameEntity(left: EntityRef, right: EntityRef) {
  return left.id === right.id && left.type === right.type;
}

function key(workspaceId: WorkspaceId, id: string) {
  return `${workspaceId}:${id}`;
}

function sequenceKey(events: EpisodeEvent[]) {
  return createHash("sha1").update(events.map((event) => `${event.kind}:${event.ref.type}:${event.ref.id}`).join(">")).digest("hex");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
