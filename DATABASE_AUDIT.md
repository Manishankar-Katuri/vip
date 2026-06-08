# VIP Database Audit

Generated: 2026-06-05. Migration-plan audit only. No production data removal is recommended in this pass.

## Table Classification

| Model | Location | Classification | Release Rationale |
| --- | --- | --- | --- |
| BrandMemory | packages/database/prisma/schema.prisma:11 | Production optional | Platform/supporting data |
| ContentDraft | packages/database/prisma/schema.prisma:27 | Production optional | Core release data or telemetry |
| ContentCalendarItem | packages/database/prisma/schema.prisma:38 | Production optional | Core release data or telemetry |
| ContentCalendarScript | packages/database/prisma/schema.prisma:73 | Production optional | Core release data or telemetry |
| ContentGeneratorRun | packages/database/prisma/schema.prisma:103 | Production optional | Core release data or telemetry |
| HospitalRequest | packages/database/prisma/schema.prisma:139 | Review before release | Platform/supporting data |
| HospitalWorkspace | packages/database/prisma/schema.prisma:150 | Production platform | Platform/supporting data |
| HospitalIntegrationConfig | packages/database/prisma/schema.prisma:183 | Production platform | Platform/supporting data |
| User | packages/database/prisma/schema.prisma:210 | Production platform | Platform/supporting data |
| Invitation | packages/database/prisma/schema.prisma:234 | Production platform | Platform/supporting data |
| AuditLog | packages/database/prisma/schema.prisma:252 | Production platform | Platform/supporting data |
| BrandVoice | packages/database/prisma/schema.prisma:268 | Review before release | Platform/supporting data |
| Template | packages/database/prisma/schema.prisma:280 | Review before release | Platform/supporting data |
| KnowledgeSource | packages/database/prisma/schema.prisma:295 | Production optional | Platform/supporting data |
| Review | packages/database/prisma/schema.prisma:305 | Production | Core release data or telemetry |
| ReviewAlert | packages/database/prisma/schema.prisma:320 | Production | Core release data or telemetry |
| VectorMemory | packages/database/prisma/schema.prisma:330 | Production optional | Platform/supporting data |
| WebsiteContent | packages/database/prisma/schema.prisma:341 | Production optional | Core release data or telemetry |
| Workspace | packages/database/prisma/schema.prisma:353 | Production platform | Platform/supporting data |
| OperationalCampaign | packages/database/prisma/schema.prisma:423 | Production optional | Core release data or telemetry |
| OperationalMediaAsset | packages/database/prisma/schema.prisma:455 | Production optional | Core release data or telemetry |
| OperationalContentVersion | packages/database/prisma/schema.prisma:478 | Production optional | Core release data or telemetry |
| OperationalActivityEvent | packages/database/prisma/schema.prisma:497 | Review before release | Core release data or telemetry |
| OperationalNotification | packages/database/prisma/schema.prisma:517 | Production | Core release data or telemetry |
| OperationalTask | packages/database/prisma/schema.prisma:536 | Production | Core release data or telemetry |
| OperationalRecommendationAction | packages/database/prisma/schema.prisma:551 | Review before release | Core release data or telemetry |
| SocialAccount | packages/database/prisma/schema.prisma:564 | Production | Core release data or telemetry |
| SocialPost | packages/database/prisma/schema.prisma:578 | Production | Core release data or telemetry |
| PostMetrics | packages/database/prisma/schema.prisma:607 | Production | Platform/supporting data |
| EngagementSnapshot | packages/database/prisma/schema.prisma:626 | Review before release | Platform/supporting data |
| Hashtag | packages/database/prisma/schema.prisma:646 | Review before release | Platform/supporting data |
| PostHashtag | packages/database/prisma/schema.prisma:652 | Review before release | Platform/supporting data |
| ContentCategory | packages/database/prisma/schema.prisma:662 | Review before release | Core release data or telemetry |
| AudienceInsight | packages/database/prisma/schema.prisma:676 | Review before release | Platform/supporting data |
| CompetitorAccount | packages/database/prisma/schema.prisma:691 | Production | Core release data or telemetry |
| AIRecommendation | packages/database/prisma/schema.prisma:709 | Review before release | Core release data or telemetry |
| SystemEndpointHealth | packages/database/prisma/schema.prisma:756 | Review before release | Platform/supporting data |
| SystemVerificationRun | packages/database/prisma/schema.prisma:782 | Review before release | Platform/supporting data |
| SystemVerificationCheck | packages/database/prisma/schema.prisma:798 | Review before release | Platform/supporting data |
| DataProvenanceSnapshot | packages/database/prisma/schema.prisma:816 | Review before release | Platform/supporting data |
| AiProviderHealth | packages/database/prisma/schema.prisma:838 | Review before release | Platform/supporting data |
| PdfExportRun | packages/database/prisma/schema.prisma:861 | Production | Core release data or telemetry |
| MissionExecution | packages/database/prisma/schema.prisma:882 | Production | Core release data or telemetry |
| DailyBusinessSnapshot | packages/database/prisma/schema.prisma:920 | Production | Core release data or telemetry |
| DailyPerformanceReport | packages/database/prisma/schema.prisma:941 | Production | Core release data or telemetry |
| StrategyOutcome | packages/database/prisma/schema.prisma:961 | Production | Core release data or telemetry |
| TrendOpportunity | packages/database/prisma/schema.prisma:983 | Production | Platform/supporting data |
| ContentBrief | packages/database/prisma/schema.prisma:1008 | Production | Core release data or telemetry |
| ContentProductionPackage | packages/database/prisma/schema.prisma:1036 | Production | Core release data or telemetry |
| DailyGrowthReport | packages/database/prisma/schema.prisma:1078 | Production | Core release data or telemetry |
| ContentOutcome | packages/database/prisma/schema.prisma:1104 | Production | Core release data or telemetry |
| AgentLearningMemory | packages/database/prisma/schema.prisma:1126 | Production | Core release data or telemetry |
| PilotQualityReview | packages/database/prisma/schema.prisma:1143 | Production | Core release data or telemetry |
| RecommendationSimilarityFingerprint | packages/database/prisma/schema.prisma:1170 | Review before release | Platform/supporting data |
| MarketSignalObservation | packages/database/prisma/schema.prisma:1189 | Production | Core release data or telemetry |
| MarketProviderCache | packages/database/prisma/schema.prisma:1212 | Review before release | Core release data or telemetry |
| MarketContextSnapshot | packages/database/prisma/schema.prisma:1225 | Production | Core release data or telemetry |
| StrategySnapshot | packages/database/prisma/schema.prisma:1239 | Review before release | Platform/supporting data |
| RecommendationStatusTransition | packages/database/prisma/schema.prisma:1260 | Review before release | Platform/supporting data |
| RecommendationOutcome | packages/database/prisma/schema.prisma:1279 | Review before release | Core release data or telemetry |
| StrategyAuditEvent | packages/database/prisma/schema.prisma:1302 | Review before release | Core release data or telemetry |
| StrategyOutboxEvent | packages/database/prisma/schema.prisma:1322 | Review before release | Core release data or telemetry |
| ActionPlan | packages/database/prisma/schema.prisma:1343 | Production | Core release data or telemetry |
| ActionExecution | packages/database/prisma/schema.prisma:1373 | Production | Core release data or telemetry |
| ExecutionStep | packages/database/prisma/schema.prisma:1402 | Production | Platform/supporting data |
| ExecutionLog | packages/database/prisma/schema.prisma:1429 | Production | Platform/supporting data |
| ExecutionFailure | packages/database/prisma/schema.prisma:1447 | Production | Platform/supporting data |
| ApprovalRequest | packages/database/prisma/schema.prisma:1466 | Production | Platform/supporting data |
| ActionOutboxEvent | packages/database/prisma/schema.prisma:1486 | Review before release | Core release data or telemetry |
| AutomationRule | packages/database/prisma/schema.prisma:1507 | Production | Core release data or telemetry |
| AutomationWorkflowMapping | packages/database/prisma/schema.prisma:1521 | Production | Core release data or telemetry |
| AutomationExecution | packages/database/prisma/schema.prisma:1529 | Production | Core release data or telemetry |
| AutomationExecutionLog | packages/database/prisma/schema.prisma:1563 | Production | Core release data or telemetry |
| AutomationOutboxEvent | packages/database/prisma/schema.prisma:1578 | Production | Core release data or telemetry |
| EventEnvelope | packages/database/prisma/schema.prisma:1599 | Production | Core release data or telemetry |
| EventDelivery | packages/database/prisma/schema.prisma:1627 | Production | Core release data or telemetry |
| EventDeadLetter | packages/database/prisma/schema.prisma:1644 | Production | Core release data or telemetry |
| OperationalError | packages/database/prisma/schema.prisma:1660 | Review before release | Core release data or telemetry |
| AIExecutionTrace | packages/database/prisma/schema.prisma:1679 | Production | Core release data or telemetry |
| AgentMemoryEntry | packages/database/prisma/schema.prisma:1709 | Production optional | Platform/supporting data |
| PromptTemplate | packages/database/prisma/schema.prisma:1725 | Production optional | Platform/supporting data |
| WorkspaceMember | packages/database/prisma/schema.prisma:1742 | Production platform | Platform/supporting data |
| Role | packages/database/prisma/schema.prisma:1761 | Production platform | Platform/supporting data |
| Permission | packages/database/prisma/schema.prisma:1776 | Production platform | Platform/supporting data |
| RolePermission | packages/database/prisma/schema.prisma:1783 | Production platform | Platform/supporting data |
| WorkspaceMemberRole | packages/database/prisma/schema.prisma:1792 | Production platform | Platform/supporting data |
| APIKey | packages/database/prisma/schema.prisma:1801 | Production platform | Platform/supporting data |
| UsageEvent | packages/database/prisma/schema.prisma:1821 | Production platform | Core release data or telemetry |
| SubscriptionPlan | packages/database/prisma/schema.prisma:1836 | Production platform | Platform/supporting data |
| WorkspaceSubscription | packages/database/prisma/schema.prisma:1849 | Production platform | Platform/supporting data |
| ControlPlaneAuditEvent | packages/database/prisma/schema.prisma:1864 | Production platform | Core release data or telemetry |

## Enum Inventory

| Enum | Location | Use |
| --- | --- | --- |
| ContentPlatform | packages/database/prisma/schema.prisma:1879 | Supporting enum |
| ContentStatus | packages/database/prisma/schema.prisma:1886 | Production state/role enum |
| ContentCalendarType | packages/database/prisma/schema.prisma:1892 | Supporting enum |
| ContentCalendarStatus | packages/database/prisma/schema.prisma:1901 | Production state/role enum |
| ContentCalendarPriority | packages/database/prisma/schema.prisma:1911 | Supporting enum |
| ContentCalendarCategory | packages/database/prisma/schema.prisma:1917 | Supporting enum |
| ContentScriptType | packages/database/prisma/schema.prisma:1928 | Supporting enum |
| ContentScriptStatus | packages/database/prisma/schema.prisma:1936 | Production state/role enum |
| RequestStatus | packages/database/prisma/schema.prisma:1942 | Production state/role enum |
| WorkspaceStatus | packages/database/prisma/schema.prisma:1950 | Production state/role enum |
| IntegrationConfigStatus | packages/database/prisma/schema.prisma:1956 | Production state/role enum |
| SocialPlatform | packages/database/prisma/schema.prisma:1963 | Supporting enum |
| SocialContentType | packages/database/prisma/schema.prisma:1973 | Supporting enum |
| ContentCategoryType | packages/database/prisma/schema.prisma:1984 | Supporting enum |
| RecommendationLifecycleStatus | packages/database/prisma/schema.prisma:2000 | Production state/role enum |
| RecommendationOutcomeStatus | packages/database/prisma/schema.prisma:2009 | Production state/role enum |
| StrategyActorType | packages/database/prisma/schema.prisma:2016 | Supporting enum |
| StrategyEventStatus | packages/database/prisma/schema.prisma:2024 | Production state/role enum |
| HealthStatus | packages/database/prisma/schema.prisma:2030 | Production state/role enum |
| VerificationResultStatus | packages/database/prisma/schema.prisma:2038 | Production state/role enum |
| VerificationCheckStatus | packages/database/prisma/schema.prisma:2045 | Production state/role enum |
| DataProvenanceStatus | packages/database/prisma/schema.prisma:2051 | Production state/role enum |
| PdfExportStatus | packages/database/prisma/schema.prisma:2058 | Production state/role enum |
| DuplicateStatus | packages/database/prisma/schema.prisma:2065 | Production state/role enum |
| ActionPlanType | packages/database/prisma/schema.prisma:2071 | Production state/role enum |
| ActionPlanStatus | packages/database/prisma/schema.prisma:2079 | Production state/role enum |
| ActionExecutionStatus | packages/database/prisma/schema.prisma:2091 | Production state/role enum |
| ExecutionStepStatus | packages/database/prisma/schema.prisma:2101 | Production state/role enum |
| ExecutionLogLevel | packages/database/prisma/schema.prisma:2110 | Production state/role enum |
| ApprovalRequestStatus | packages/database/prisma/schema.prisma:2117 | Production state/role enum |
| AIAgentType | packages/database/prisma/schema.prisma:2124 | Production state/role enum |
| AIRunStatus | packages/database/prisma/schema.prisma:2132 | Production state/role enum |
| WorkspaceMemberStatus | packages/database/prisma/schema.prisma:2140 | Production state/role enum |
| APIKeyStatus | packages/database/prisma/schema.prisma:2147 | Production state/role enum |
| SubscriptionStatus | packages/database/prisma/schema.prisma:2153 | Production state/role enum |
| UserRole | packages/database/prisma/schema.prisma:2160 | Production state/role enum |
| InvitationStatus | packages/database/prisma/schema.prisma:2167 | Production state/role enum |

## Migration Plan Only

| Area | Recommendation | Reason |
| --- | --- | --- |
| Mission data | Keep MissionExecution, DailyBusinessSnapshot, DailyPerformanceReport, StrategyOutcome, TrendOpportunity, ContentBrief, ContentProductionPackage, DailyGrowthReport, ContentOutcome, AgentLearningMemory, PilotQualityReview. | Required for Daily Growth Mission, Pilot Operations, reporting, quality review and learning validation. |
| Event/action/automation | Keep EventEnvelope/EventDelivery/EventDeadLetter, Action*, ApprovalRequest, Automation*. | Required for durable orchestration, approvals and execution audit. |
| Operational tables | Keep OperationalTask, OperationalNotification, OperationalError and operational content/media/campaign tables. | Required for production workspace and mission task visibility. |
| Demo-adjacent content tables | Review ContentDraft/ContentCalendar*/ContentGeneratorRun retention policy. | Useful but some UI paths still use demo fallbacks. Do not delete without data usage check. |
| Legacy duplicate workspace tables | Review HospitalWorkspace vs Workspace mapping. | Both are actively referenced; consolidation requires data migration design, not deletion. |
