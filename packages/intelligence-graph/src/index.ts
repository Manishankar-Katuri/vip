import { randomUUID } from "node:crypto";

import type { CognitiveRelationshipType, EntityRef, GraphEntity, GraphRelationship, IntelligenceSignal } from "@vip/cognitive-core";

export interface GraphQuery {
  workspaceId: string;
  entity?: EntityRef;
  relationshipTypes?: CognitiveRelationshipType[];
  maxDepth?: number;
  minStrength?: number;
}

export interface GraphPath {
  entities: EntityRef[];
  relationships: GraphRelationship[];
  influenceScore: number;
}

export interface IntelligenceGraphRepository {
  upsertEntity(entity: GraphEntity): Promise<GraphEntity>;
  upsertRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
  findEntity(workspaceId: string, type: EntityRef["type"], id: string): Promise<GraphEntity | null>;
  relationshipsFor(workspaceId: string, entity: EntityRef, types?: CognitiveRelationshipType[]): Promise<GraphRelationship[]>;
}

export class InMemoryIntelligenceGraphRepository implements IntelligenceGraphRepository {
  private readonly entities = new Map<string, GraphEntity>();
  private readonly relationships = new Map<string, GraphRelationship>();

  async upsertEntity(entity: GraphEntity) {
    const key = entityKey(entity.workspaceId, entity);
    const prior = this.entities.get(key);
    const merged = prior ? { ...prior, ...entity, createdAt: prior.createdAt, updatedAt: entity.updatedAt } : entity;
    this.entities.set(key, merged);
    return merged;
  }

  async upsertRelationship(relationship: GraphRelationship) {
    this.relationships.set(relationship.id, relationship);
    return relationship;
  }

  async findEntity(workspaceId: string, type: EntityRef["type"], id: string) {
    return this.entities.get(`${workspaceId}:${type}:${id}`) ?? null;
  }

  async relationshipsFor(workspaceId: string, entity: EntityRef, types?: CognitiveRelationshipType[]) {
    return [...this.relationships.values()].filter((relationship) =>
      relationship.workspaceId === workspaceId &&
      (!types || types.includes(relationship.type)) &&
      (sameEntity(relationship.from, entity) || sameEntity(relationship.to, entity))
    );
  }
}

interface PrismaGraphDelegate {
  upsert(args: unknown): Promise<Record<string, unknown>>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  findMany(args: unknown): Promise<Record<string, unknown>[]>;
}

export interface IntelligenceGraphPrismaClient {
  intelligenceGraphEntity: PrismaGraphDelegate;
  intelligenceGraphRelationship: PrismaGraphDelegate;
}

export class PrismaIntelligenceGraphRepository implements IntelligenceGraphRepository {
  constructor(private readonly database: IntelligenceGraphPrismaClient) {}

  async upsertEntity(entity: GraphEntity) {
    const row = await this.database.intelligenceGraphEntity.upsert({
      where: { workspaceId_entityType_entityId: { workspaceId: entity.workspaceId, entityType: entity.type, entityId: entity.id } },
      create: {
        workspaceId: entity.workspaceId,
        entityType: entity.type,
        entityId: entity.id,
        label: entity.label,
        attributes: entity.attributes,
      },
      update: { label: entity.label, attributes: entity.attributes },
    });
    return entityFromRow(row);
  }

  async upsertRelationship(relationship: GraphRelationship) {
    const from = await this.upsertEntity(refToEntity(relationship.workspaceId, relationship.from));
    const to = await this.upsertEntity(refToEntity(relationship.workspaceId, relationship.to));
    const row = await this.database.intelligenceGraphRelationship.upsert({
      where: { id: relationship.id },
      create: {
        id: relationship.id,
        workspaceId: relationship.workspaceId,
        fromEntityId: rowId(from),
        toEntityId: rowId(to),
        relationshipType: relationship.type,
        strength: relationship.strength,
        confidence: relationship.confidence,
        evidence: relationship.evidence,
        metadata: relationship.metadata,
        startsAt: relationship.startsAt ? new Date(relationship.startsAt) : undefined,
        endsAt: relationship.endsAt ? new Date(relationship.endsAt) : undefined,
      },
      update: {
        strength: relationship.strength,
        confidence: relationship.confidence,
        evidence: relationship.evidence,
        metadata: relationship.metadata,
        startsAt: relationship.startsAt ? new Date(relationship.startsAt) : undefined,
        endsAt: relationship.endsAt ? new Date(relationship.endsAt) : undefined,
      },
    });
    return relationshipFromRow(row);
  }

  async findEntity(workspaceId: string, type: EntityRef["type"], id: string) {
    const row = await this.database.intelligenceGraphEntity.findUnique({ where: { workspaceId_entityType_entityId: { workspaceId, entityType: type, entityId: id } } });
    return row ? entityFromRow(row) : null;
  }

  async relationshipsFor(workspaceId: string, entity: EntityRef, types?: CognitiveRelationshipType[]) {
    const stored = await this.findEntity(workspaceId, entity.type, entity.id);
    if (!stored) return [];
    const rows = await this.database.intelligenceGraphRelationship.findMany({
      where: {
        workspaceId,
        relationshipType: types ? { in: types } : undefined,
        OR: [{ fromEntityId: rowId(stored) }, { toEntityId: rowId(stored) }],
      },
      include: { fromEntity: true, toEntity: true },
    });
    return rows.map(relationshipFromRow);
  }
}

export class IntelligenceGraphService {
  constructor(
    private readonly repository: IntelligenceGraphRepository = new InMemoryIntelligenceGraphRepository(),
    private readonly id: () => string = () => randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async attachSignal(signal: IntelligenceSignal) {
    const signalEntity = await this.ensureEntity({ id: signal.id, type: "SIGNAL", workspaceId: signal.workspaceId, label: signal.type }, {
      severity: signal.severity,
      confidence: signal.scores.confidence,
      summary: signal.summary,
    });
    const relationships: GraphRelationship[] = [];
    for (const ref of signal.relatedEntities) {
      await this.ensureEntity({ ...ref, workspaceId: signal.workspaceId });
      relationships.push(await this.link(signalEntity, { ...ref, workspaceId: signal.workspaceId }, "IMPACTS", signal.scores.impact, signal.scores.confidence, signal.evidence, {
        source: "signal-attachment",
        signalType: signal.type,
      }));
    }
    return { signalEntity, relationships };
  }

  async ensureEntity(ref: EntityRef, attributes: Record<string, unknown> = {}) {
    const existing = await this.repository.findEntity(ref.workspaceId ?? "", ref.type, ref.id);
    const timestamp = this.now();
    return this.repository.upsertEntity({
      id: ref.id,
      type: ref.type,
      label: ref.label,
      workspaceId: ref.workspaceId ?? "",
      attributes: { ...(existing?.attributes ?? {}), ...attributes },
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  }

  async link(from: EntityRef, to: EntityRef, type: CognitiveRelationshipType, strength: number, confidence: number, evidence: GraphRelationship["evidence"], metadata: Record<string, unknown> = {}) {
    const timestamp = this.now();
    return this.repository.upsertRelationship({
      id: this.id(),
      workspaceId: from.workspaceId ?? to.workspaceId ?? "",
      from,
      to,
      type,
      strength: clamp(strength, 0, 100),
      confidence: clamp(confidence, 0, 1),
      evidence,
      metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async traverse(query: GraphQuery): Promise<GraphPath[]> {
    if (!query.entity) return [];
    const maxDepth = query.maxDepth ?? 3;
    const minStrength = query.minStrength ?? 0;
    const paths: GraphPath[] = [];
    const queue: GraphPath[] = [{ entities: [query.entity], relationships: [], influenceScore: 100 }];
    const visited = new Set<string>();
    while (queue.length) {
      const path = queue.shift()!;
      const current = path.entities[path.entities.length - 1];
      const visitKey = `${entityKey(query.workspaceId, current)}:${path.relationships.length}`;
      if (visited.has(visitKey)) continue;
      visited.add(visitKey);
      if (path.relationships.length >= maxDepth) {
        paths.push(path);
        continue;
      }
      const edges = (await this.repository.relationshipsFor(query.workspaceId, current, query.relationshipTypes))
        .filter((edge) => edge.strength >= minStrength);
      for (const edge of edges) {
        const next = sameEntity(edge.from, current) ? edge.to : edge.from;
        if (path.entities.some((entity) => sameEntity(entity, next))) continue;
        const influenceScore = path.influenceScore * (edge.strength / 100) * edge.confidence;
        queue.push({ entities: [...path.entities, next], relationships: [...path.relationships, edge], influenceScore });
      }
      if (!edges.length) paths.push(path);
    }
    return paths.sort((left, right) => right.influenceScore - left.influenceScore);
  }

  async dependencyMap(workspaceId: string, entity: EntityRef) {
    const paths = await this.traverse({ workspaceId, entity, relationshipTypes: ["DEPENDS_ON", "IMPACTS", "INFLUENCES"], maxDepth: 4, minStrength: 20 });
    return { entity, upstream: paths.filter((path) => path.relationships.some((edge) => sameEntity(edge.to, entity))), paths };
  }

  async influenceScore(workspaceId: string, entity: EntityRef) {
    const paths = await this.traverse({ workspaceId, entity, maxDepth: 3, minStrength: 10 });
    return Math.min(100, Math.round(paths.reduce((sum, path) => sum + path.influenceScore, 0) / Math.max(1, paths.length)));
  }
}

function sameEntity(left: EntityRef, right: EntityRef) {
  return left.id === right.id && left.type === right.type;
}

function entityKey(workspaceId: string, entity: EntityRef) {
  return `${workspaceId}:${entity.type}:${entity.id}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function refToEntity(workspaceId: string, ref: EntityRef): GraphEntity {
  const now = new Date().toISOString();
  return { id: ref.id, type: ref.type, label: ref.label, workspaceId, attributes: {}, createdAt: now, updatedAt: now };
}

function entityFromRow(row: Record<string, unknown>): GraphEntity {
  return {
    id: String(row.entityId ?? row.id),
    type: String(row.entityType ?? row.type) as EntityRef["type"],
    label: row.label ? String(row.label) : undefined,
    workspaceId: String(row.workspaceId),
    attributes: (row.attributes ?? {}) as Record<string, unknown>,
    createdAt: dateIso(row.createdAt),
    updatedAt: dateIso(row.updatedAt),
    __rowId: String(row.id),
  } as GraphEntity & { __rowId: string };
}

function relationshipFromRow(row: Record<string, unknown>): GraphRelationship {
  const from = row.fromEntity && typeof row.fromEntity === "object" ? entityFromRow(row.fromEntity as Record<string, unknown>) : { id: String(row.fromEntityId), type: "SIGNAL" as const, workspaceId: String(row.workspaceId) };
  const to = row.toEntity && typeof row.toEntity === "object" ? entityFromRow(row.toEntity as Record<string, unknown>) : { id: String(row.toEntityId), type: "SIGNAL" as const, workspaceId: String(row.workspaceId) };
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    from,
    to,
    type: String(row.relationshipType) as CognitiveRelationshipType,
    strength: Number(row.strength),
    confidence: Number(row.confidence),
    evidence: (row.evidence ?? []) as GraphRelationship["evidence"],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    startsAt: row.startsAt ? dateIso(row.startsAt) : undefined,
    endsAt: row.endsAt ? dateIso(row.endsAt) : undefined,
    createdAt: dateIso(row.createdAt),
    updatedAt: dateIso(row.updatedAt),
  };
}

function rowId(entity: GraphEntity) {
  return (entity as GraphEntity & { __rowId?: string }).__rowId ?? entity.id;
}

function dateIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}
