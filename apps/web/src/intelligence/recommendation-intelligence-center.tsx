import { ArrowRight, Database, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { LiveData } from "@/components/operations/operational-surfaces";
import type { OperationalRecommendation } from "@/lib/product-experience";
import { formatDate } from "@/lib/product-experience";
import { Button } from "@/design-system/primitives";

export function RecommendationIntelligenceCenter({ data, limit }: { data: LiveData; limit?: number }) {
  const ranked = data.recommendations.slice().sort((left, right) => right.score - left.score).slice(0, limit);
  return (
    <Panel className="p-4">
      <SectionHeader
        title="Recommendation intelligence center"
        description="Ranked healthcare growth decisions with evidence and expected outcomes"
        action={
          limit ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/production/recommendations">Open all recommendations</Link>
            </Button>
          ) : (
            <StatusIndicator label={`${data.recommendations.length} signals ranked`} tone="info" />
          )
        }
      />
      <div className="space-y-2">
        {ranked.length ? ranked.map((recommendation, index) => (
          <Recommendation key={recommendation.title} recommendation={recommendation} rank={index + 1} />
        )) : <EmptyEvidence />}
      </div>
    </Panel>
  );
}

export function RecommendationDetailPage({ data }: { data: LiveData }) {
  const ranked = data.recommendations.slice().sort((left, right) => right.score - left.score);
  const hasPersisted = ranked.some((recommendation) => recommendation.status === "Persisted");
  return (
    <div className="space-y-4">
      <Panel className="border-primary/15 bg-info/30 p-4">
        <SectionHeader
          title="AI recommendations detail"
          description="Every recommendation is tied to VIP intelligence, measured analytics, or a clearly labeled fallback."
          action={<StatusIndicator label={hasPersisted ? "Persisted VIP recommendations" : "Analytics fallback mode"} tone={hasPersisted ? "success" : "warning"} />}
        />
        <div className="grid gap-2 md:grid-cols-3">
          <SummaryTile label="Recommendations" value={String(ranked.length)} detail="Ranked by score and confidence" />
          <SummaryTile label="Authoritative records" value={String(ranked.filter((item) => item.status === "Persisted").length)} detail="Stored AIRecommendation rows" />
          <SummaryTile label="Fallback proposals" value={String(ranked.filter((item) => item.status !== "Persisted").length)} detail="Measured analytics only" />
        </div>
      </Panel>
      {ranked.length ? (
        <div className="space-y-3">
          {ranked.map((recommendation, index) => (
            <RecommendationDetail key={recommendation.id} recommendation={recommendation} rank={index + 1} />
          ))}
        </div>
      ) : (
        <Panel className="p-4">
          <EmptyEvidence />
        </Panel>
      )}
      <ReferenceSources />
    </div>
  );
}

export function RecommendationUnavailablePage() {
  return (
    <div className="space-y-4">
      <Panel className="border-primary/15 bg-info/30 p-4">
        <SectionHeader
          title="AI recommendations detail"
          description="VIP will show recommendation evidence here when persisted AIRecommendation records or measured analytics are available."
          action={<StatusIndicator label="Evidence unavailable" tone="warning" />}
        />
        <EmptyEvidence />
      </Panel>
      <ReferenceSources />
    </div>
  );
}

function Recommendation({ recommendation, rank }: { recommendation: OperationalRecommendation; rank: number }) {
  return (
    <article className="rounded-lg border border-primary/12 bg-info/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{rank}</span>
          <div>
            <div className="flex flex-wrap gap-1.5">
              <StatusIndicator label={recommendation.type} tone="info" />
              <StatusIndicator label={`${recommendation.priority} priority`} tone={recommendation.priority === "Critical" || recommendation.priority === "High" ? "warning" : "neutral"} />
              <StatusIndicator label={recommendation.status} tone={recommendation.status === "Persisted" ? "success" : "neutral"} />
              {recommendation.automationReady && <StatusIndicator label="Automation-ready" tone="success" />}
            </div>
            <h3 className="mt-2 text-sm font-semibold">{recommendation.title}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-5">{recommendation.nextAction}</p>
          </div>
        </div>
        <div className="grid min-w-[136px] grid-cols-2 gap-1.5 text-center">
          <Meter label="Confidence" value={recommendation.confidence} />
          <Meter label="Opportunity" value={recommendation.score} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusIndicator label={`${recommendation.riskLevel.toLowerCase()} risk severity`} tone={recommendation.riskLevel === "HIGH" ? "warning" : recommendation.riskLevel === "MEDIUM" ? "info" : "success"} />
        <StatusIndicator label={recommendation.sourceStatus} tone={recommendation.status === "Persisted" ? "success" : "warning"} />
        {recommendation.supportingMetrics.map((metric) => (
          <StatusIndicator key={metric.metric} label={`${metric.metric}: ${signed(metric.changePercent)}%`} tone={metric.changePercent < 0 ? "warning" : "success"} />
        ))}
        {!recommendation.supportingMetrics.length && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ShieldAlert className="size-3.5" /> Supporting rationale shown above</span>
        )}
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <DetailDisclosure label="Narrative">{recommendation.narrative}</DetailDisclosure>
        <DetailDisclosure label="Evidence">{recommendation.evidence}</DetailDisclosure>
        <DetailDisclosure label="Reasoning">{recommendation.reasoning}</DetailDisclosure>
      </div>
    </article>
  );
}

function RecommendationDetail({ recommendation, rank }: { recommendation: OperationalRecommendation; rank: number }) {
  return (
    <article className="rounded-lg border border-primary/12 bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{rank}</span>
            <StatusIndicator label={recommendation.type} tone="info" />
            <StatusIndicator label={`${recommendation.priority} priority`} tone={recommendation.priority === "Critical" || recommendation.priority === "High" ? "warning" : "neutral"} />
            <StatusIndicator label={recommendation.status} tone={recommendation.status === "Persisted" ? "success" : "warning"} />
            <StatusIndicator label={recommendation.sourceStatus} tone="neutral" />
          </div>
          <h2 className="mt-2 text-base font-semibold">{recommendation.title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-5">{recommendation.nextAction}</p>
        </div>
        <div className="grid min-w-[144px] grid-cols-2 gap-1.5 text-center">
          <Meter label="Confidence" value={recommendation.confidence} />
          <Meter label="Score" value={recommendation.score} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <DetailDisclosure label="Decision reasoning">{recommendation.reasoning}</DetailDisclosure>
        <DetailDisclosure label="Expected impact">{recommendation.expectedOutcome}</DetailDisclosure>
        <DetailDisclosure label="Risk">{recommendation.riskLevel} risk. {recommendation.automationReady ? "Automation-ready after approval." : "Manual review is required before execution."}</DetailDisclosure>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border bg-background p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Database className="size-3.5" />Evidence</p>
          <DetailDisclosure label="Show evidence" className="mt-2">{recommendation.evidence}</DetailDisclosure>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recommendation.supportingMetrics.length ? recommendation.supportingMetrics.map((metric) => (
              <StatusIndicator
                key={`${recommendation.id}-${metric.metric}`}
                label={`${metric.metric}: ${signed(metric.changePercent)}%`}
                tone={metric.changePercent < 0 ? "warning" : "success"}
              />
            )) : <StatusIndicator label="Evidence not available as structured metrics" tone="neutral" />}
          </div>
        </section>
        <section className="rounded-lg border bg-background p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><FileText className="size-3.5" />Source Basis</p>
          <DetailDisclosure label="Show source" className="mt-2">{recommendation.sourceBasis}</DetailDisclosure>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusIndicator label={sourceLabel(recommendation.sourceCategory)} tone="info" />
            {recommendation.generatedAt && <StatusIndicator label={`Generated ${formatDate(recommendation.generatedAt)}`} tone="neutral" />}
            {recommendation.updatedAt && <StatusIndicator label={`Updated ${formatDate(recommendation.updatedAt)}`} tone="neutral" />}
          </div>
        </section>
      </div>
    </article>
  );
}

function SummaryTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyEvidence() {
  return (
    <div className="rounded-lg border border-dashed p-4 text-sm leading-5 text-muted-foreground">
      Evidence not available. VIP will show recommendations here only after persisted AIRecommendation records or measured analytics signals are available.
    </div>
  );
}

function ReferenceSources() {
  const sources = [
    "Meta/Instagram insights for reach, engagement, comments, saves, shares, and profile activity.",
    "Google Business Profile Performance API for calls, direction requests, profile performance, and keyword impressions.",
    "Google Search Console Search Analytics for clicks, impressions, CTR, average position, and query/page dimensions.",
    "Google Trends API as external market-demand context only.",
    "NABH standards as healthcare quality and patient-safety framing where relevant.",
  ];
  return (
    <Panel className="p-4">
      <SectionHeader title="Trusted source categories" description="External sources are labels for future integrations and context. They do not override VIP's measured intelligence." />
      <div className="grid gap-2 md:grid-cols-2">
        {sources.map((source) => (
          <div key={source} className="flex gap-2 rounded-lg border bg-background p-2.5 text-xs leading-5 text-muted-foreground">
            <ArrowRight className="mt-1 size-4 shrink-0 text-primary" />
            <span>{source}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-2">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${label} ${value} percent`}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function sourceLabel(source: OperationalRecommendation["sourceCategory"]) {
  return {
    VIP_RECOMMENDATION: "VIP AIRecommendation",
    SOCIAL_ANALYTICS: "Measured social analytics",
    MARKET_CONTEXT: "Market intelligence context",
    SEARCH_CONTEXT: "Search intelligence context",
    REPUTATION_CONTEXT: "Reputation intelligence context",
  }[source];
}

function signed(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}
