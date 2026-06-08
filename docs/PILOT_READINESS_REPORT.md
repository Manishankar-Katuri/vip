# VIP Daily Growth Mission Pilot Readiness Report

Date: 2026-06-05

## Executive Recommendation

**Recommendation: Pilot Ready with controlled internal/customer-design-partner guardrails.**

The Daily Growth Mission is ready for a 7-day validation pilot against one real workspace if the pilot is framed as a supervised validation, not a fully autonomous customer deployment. The mission can execute, persist status, generate reports, generate downloadable PDFs, create AI-assisted content packages, pause for approvals, create production tasks after approval, and write learning memory. The pilot should prove usefulness, reliability, and learning progression before broad deployment.

**Readiness score for real customer deployment: 78/100.**

This is below the previous implementation-readiness estimate because pilot readiness asks for operational proof over 7 consecutive days, quality scoring, KPI validation, and reliability reporting. Those can be measured during the pilot, but several are not yet first-class persisted product features.

## Architecture Status

The mission has a real persisted execution spine:

- `MissionExecution` stores status, phase, timestamps, replay cursor, emitted event IDs, and phase state in `packages/database/prisma/schema.prisma`.
- `DailyBusinessSnapshot`, `DailyPerformanceReport`, `StrategyOutcome`, `TrendOpportunity`, `ContentBrief`, `ContentProductionPackage`, `DailyGrowthReport`, `ContentOutcome`, and `AgentLearningMemory` store the mission outputs.
- Mission API execution is routed through `apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/run/route.ts`.
- The live mission implementation is in `apps/web/src/lib/daily-growth-mission.ts`.
- Mission Control displays mission status, replay, PDFs, trends, competitor gaps, calendar opportunities, tasks, packages, and learning memory in `apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx`.

Key implementation anchors:

| Capability | Evidence |
|---|---|
| Manual run and resume path | `runDailyGrowthMission` in `apps/web/src/lib/daily-growth-mission.ts` |
| Approval pause/resume | `resumeAfterApproval` in `apps/web/src/lib/daily-growth-mission.ts` |
| Learning retrieval | `retrieveLearningMemory` in `apps/web/src/lib/daily-growth-mission.ts` |
| Calendar intelligence | `buildCalendarIntelligence` in `apps/web/src/lib/daily-growth-mission.ts` |
| Trend intelligence | `buildTrendIntelligence` in `apps/web/src/lib/daily-growth-mission.ts` |
| Competitor intelligence | `buildCompetitorIntelligence` in `apps/web/src/lib/daily-growth-mission.ts` |
| AI content production and trace | `generateAIContentPackage` in `apps/web/src/lib/daily-growth-mission.ts` |
| PDF generation | `generateDailyGrowthPdf` in `apps/web/src/lib/daily-growth-mission.ts` |
| Approval API | `apps/web/src/app/api/admin/workspaces/[id]/daily-growth-mission/[executionId]/approval/route.ts` |
| Mission dashboard | `apps/web/src/app/admin/workspaces/[id]/mission-control/page.tsx` |

## Phase 1: Validation Dashboard

Current status: **Partially implemented.**

The Mission Control page already shows:

- Daily mission status
- Generated reports
- Generated PDFs with download link
- Approval state through Action Plan steps
- Content packages
- Production tasks
- Learning memory
- Trend signals
- Competitor signals
- Event replay
- Mission history

Pilot validation dashboard metrics that can be derived today:

| Dashboard item | Current source |
|---|---|
| Daily Mission Status | `MissionExecution.status`, `MissionExecution.currentPhase` |
| Mission Duration | `MissionExecution.startedAt`, `completedAt`, `failedAt` |
| Generated Reports | `DailyGrowthReport` |
| Generated PDFs | `DailyGrowthReport.pdfFileName`, `PdfExportRun` |
| Approval Decisions | `ApprovalRequest.status`, `decisionNote`, `decidedAt` |
| Content Packages | `ContentProductionPackage` |
| Learning Memory Updates | `AgentLearningMemory.updatedAt`, `scope`, `key` |
| Recommendation Changes Over Time | `TrendOpportunity`, `ContentBrief.inputs`, `AgentLearningMemory` |

Gap: there is no dedicated 7-day pilot dashboard route or persisted pilot summary table. The existing Mission Control page is usable for a pilot, but pilot rollups must be manually derived or queried.

## Phase 2: Quality Scoring

Current status: **Calculable, not persisted as first-class product scores.**

Recommended scoring model for the pilot:

### Report Quality Score

Inputs:

- `DailyGrowthReport.sections`
- `DailyBusinessSnapshot.sourceStatuses`
- `DailyPerformanceReport.metrics`
- `TrendOpportunity`
- `ContentProductionPackage`

Formula:

| Dimension | Score basis |
|---|---|
| Completeness | Required sections present: executive summary, performance, growth, review, competitor, trend, opportunities, strategy, content, scripts, captions, hashtags, thumbnails, schedule, expected outcomes |
| Relevance | Uses non-empty persisted source statuses, trend signals, competitor gaps, calendar opportunities, and performance metrics |
| Actionability | Includes content package, CTA, target KPI, approval plan, tasks, and publishing payload |

Recommended pilot threshold: **>= 75/100**.

### Content Quality Score

Inputs:

- `ContentProductionPackage.hook`
- `fullScript`
- `cta`
- `caption`
- `hashtags`
- `targetKpi`
- `publishingPayload.generationMetadata`
- `TrendOpportunity.signals`

Formula:

| Dimension | Score basis |
|---|---|
| Hook Quality | Specific, patient-centered, under 18 words, non-generic |
| Script Quality | Complete structure, doctor talking points, scene breakdown, visual directions, B-roll |
| CTA Quality | Clear next step, clinically safe, aligned to objective |
| Trend Alignment | Uses trend, calendar, competitor, or learning evidence |

Recommended pilot threshold: **>= 80/100**.

### Strategy Quality Score

Inputs:

- `TrendOpportunity.priorityScore`
- `growthScore`
- `revenueScore`
- `trendScore`
- `confidenceScore`
- `ContentBrief.inputs.learningContext`

Formula:

| Dimension | Score basis |
|---|---|
| Opportunity Relevance | Derived from real persisted sources and calendar/trend/competitor context |
| Growth Potential | `growthScore` and target KPI quality |
| Confidence | `confidenceScore` plus source coverage |

Recommended pilot threshold: **>= 70/100**.

Gap: these scores are not currently stored in a table. For the pilot, calculate them in the report workbook/query output. For customer deployment, add persisted quality evaluation records.

## Phase 3: Learning Validation

Current status: **Partially implemented.**

The mission now retrieves prior learning before opportunity discovery, strategy planning, and content generation through `retrieveLearningMemory`. It writes learning after approved completion through `upsertLearningMemory`.

Pilot validation method:

| Day | What to capture |
|---|---|
| Day 1 | Baseline `TrendOpportunity.title`, `ContentBrief.inputs`, content package topic/hook/script, memory scopes |
| Day 2 | Compare opportunity title, content topic, hook, and target KPI against Day 1 |
| Day 3 | Verify `learningContext` in `ContentBrief.inputs` includes Day 1/2 memory |
| Day 7 | Compare evolved recommendations, repeated patterns, avoided failure patterns, and confidence movement |

Evidence to inspect:

- `AgentLearningMemory.scope`
- `AgentLearningMemory.key`
- `AgentLearningMemory.content`
- `ContentBrief.inputs.learningContext`
- `TrendOpportunity.signals.learning`
- `ContentProductionPackage.publishingPayload.generationMetadata`

Learning validation pass condition:

- Day 3 and Day 7 recommendations must include non-empty prior learning context.
- At least one topic, hook, format, posting time, or failure pattern must influence later mission outputs.
- If no real outcome data exists, learning must explicitly record that attribution is pending, not claim success.

Gap: the learning loop is present but shallow. It does not yet perform semantic retrieval, causal attribution, or automatic learned-weight adjustment.

## Phase 4: KPI Prediction Validation

Current status: **Partially implemented.**

The mission stores predicted KPI in `ContentProductionPackage.targetKpi` and creates `ContentOutcome` after approval resume. Current actual KPI status is set to awaiting published-content metrics when no published content metric is available.

Pilot KPI dimensions:

| KPI | Predicted source | Actual source needed |
|---|---|---|
| Reach | `ContentProductionPackage.targetKpi.reach` | `PostMetrics.reach` mapped to the produced content |
| Engagement | `targetKpi.engagementRate` | likes/comments/shares/saves/reach from `PostMetrics` |
| Watch Time | not currently first-class | video metrics connector/table |
| Leads | not currently first-class | CRM/lead capture integration |
| Appointments | not currently first-class | appointment/booking system integration |

Accuracy metric:

```text
accuracy = 100 - min(100, abs(actual - predicted) / max(predicted, 1) * 100)
```

Pilot pass condition:

- Reach and engagement accuracy can be evaluated if the generated content is manually posted and then mapped back to a `SocialPost`.
- Watch time, leads, and appointments should be marked `NOT_CONFIGURED` unless real connectors exist.

Gap: there is no durable link between a generated `ContentProductionPackage` and a later `SocialPost`. That mapping is required for reliable KPI validation.

## Phase 5: Mission Reliability

Current status: **Measurable from existing records.**

Reliability metrics:

| Metric | Source |
|---|---|
| Success Rate | `MissionExecution.status = COMPLETED` over 7 days |
| Failure Rate | `MissionExecution.status = FAILED` |
| Approval Delays | `ApprovalRequest.decidedAt - requestedAt` |
| Generation Errors | `AIExecutionTrace.status = FAILED`, `error` |
| Recovery Events | `EventEnvelope.eventType`, repeated run/resume attempts |
| PDF Reliability | `PdfExportRun.status`, `fileName`, `fileSizeBytes` |

Pilot pass thresholds:

- Mission start success: **7/7 days**
- Report generation: **7/7 days**
- PDF generation: **7/7 days**
- AI content package generated: **7/7 days**, fallback allowed but must be flagged
- Approval flow: at least **3 approved runs** to verify resume behavior
- No unhandled fatal failures

## 7-Day Pilot Operating Procedure

1. Select one real workspace with populated `Workspace`, `SocialAccount`, `SocialPost`, `PostMetrics`, `CompetitorAccount`, `MarketSignalObservation`, `MarketContextSnapshot`, and if available `HospitalWorkspace` calendar data.
2. Confirm `OPENAI_API_KEY` is configured.
3. Run `POST /api/admin/workspaces/[id]/daily-growth-mission/run` once per day.
4. Validate `MissionExecution.status = WAITING_APPROVAL` after content/report generation.
5. Use the approval API for Doctor Approval and Production Approval.
6. Run the mission endpoint again to resume after approvals.
7. Record report, PDF, content package, approvals, tasks, learning memory, and content outcome for each day.
8. If content is posted, map the resulting social post metrics back to the generated package manually for pilot analysis.
9. Compare Day 1, Day 2, Day 3, and Day 7 recommendations.
10. Produce the final pilot scorecard.

## Pilot Dashboard Specification

No new functionality was built for this report. The following dashboard should be assembled from existing records for the pilot review:

| Panel | Data |
|---|---|
| Daily Mission Status | `MissionExecution` by business date |
| Duration | `startedAt`, `completedAt`, `failedAt` |
| Reports/PDFs | `DailyGrowthReport`, `PdfExportRun` |
| Approval Decisions | `ApprovalRequest` by `actionPlanId` |
| Content Packages | `ContentProductionPackage` |
| Learning Updates | `AgentLearningMemory` |
| Recommendation Timeline | `TrendOpportunity`, `ContentBrief` |
| KPI Accuracy | `ContentProductionPackage.targetKpi` vs `ContentOutcome.actualKpi` |
| Reliability | status counts, event replay, AI trace failures |

## Remaining Gaps

Critical gaps before unsupervised real customer deployment:

1. No dedicated 7-day pilot dashboard route or persisted score table.
2. Quality scores are not yet stored.
3. KPI validation lacks automatic mapping from generated package to published social post.
4. Watch time, leads, and appointments need real data connectors.
5. Approval UI buttons are not present in Mission Control; approval API exists.
6. Mission scheduling for 7 consecutive days needs an operational cron/worker, not manual-only execution.
7. AI fallback is intentionally allowed, but pilot reports must distinguish OpenAI-generated content from deterministic fallback.
8. Learning retrieval is DB-based and not semantic/vector-ranked.
9. PDF is real and downloadable, but layout is minimal.
10. Event replay exists, but web mission still writes event envelopes directly rather than publishing through the orchestrator bus.

## Pilot Readiness Score

| Category | Score |
|---|---:|
| Architecture Status | 82 |
| Reliability Status | 76 |
| Intelligence Quality Status | 78 |
| Learning Validation Status | 72 |
| KPI Validation Status | 58 |
| Mission Control Visibility | 74 |

**Overall pilot readiness: 75/100.**

## Final Recommendation

**Pilot Ready: Yes, for a supervised 7-day validation pilot.**

**Not ready for broad autonomous customer deployment yet.**

The correct next step is a single-workspace, human-supervised pilot where each daily run is inspected, approved, and scored. The most important proof points are not whether the mission can run once, but whether Day 3 and Day 7 outputs visibly improve from learning memory, whether generated content is accepted by doctors/production, and whether KPI prediction can be tied to real posted content.
