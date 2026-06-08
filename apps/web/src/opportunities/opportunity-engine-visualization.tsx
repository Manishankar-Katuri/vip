import { ArrowUpRight, HeartPulse, Sparkles, Target } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

export function OpportunityEngineVisualization({ data }: { data: LiveData }) {
  const market = data.intelligence?.marketContext?.opportunitySignals ?? [];
  const recommendations = data.recommendations.slice().sort((left, right) => right.score - left.score);
  const opportunities = market.length
    ? market.slice(0, 4).map((item) => ({
        title: item.title,
        reason: item.reason,
        score: Math.round(item.score),
        confidence: Math.round(item.confidence * 100),
        format: item.recommendedFormat,
      }))
    : recommendations.slice(0, 4).map((item) => ({
        title: item.title,
        reason: item.evidence,
        score: item.score,
        confidence: item.confidence,
        format: item.type,
      }));
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Healthcare opportunity engine"
        description="Highest-value growth opportunities ranked by observable evidence"
        action={<StatusIndicator label={market.length ? "Market + performance signals" : "Performance signals"} tone="info" />}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {opportunities.map((item) => (
          <article key={item.title} className="rounded-xl border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-start gap-2 text-sm font-semibold"><Target className="mt-0.5 size-4 shrink-0 text-primary" />{item.title}</p>
              <span className="rounded-lg bg-primary/8 px-2 py-1 text-sm font-semibold text-primary">{item.score}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusIndicator label={`${item.confidence}% confidence`} tone="info" />
              <StatusIndicator label={item.format} tone="success" />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <OpportunityLabel icon={<Sparkles />} title="Adoption impact" value={recommendations[0]?.expectedOutcome ?? "No recommendation outcome available."} />
        <OpportunityLabel icon={<HeartPulse />} title="Recovery focus" value={recommendations.find((item) => item.riskLevel === "HIGH")?.title ?? "No high-severity recovery action detected."} />
        <OpportunityLabel icon={<ArrowUpRight />} title="Optimization" value={data.analytics.hashtagPerformance[0] ? `Evaluate #${data.analytics.hashtagPerformance[0].tag} with clinical relevance review.` : "Hashtag response evidence pending."} />
      </div>
    </Panel>
  );
}

function OpportunityLabel({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/35 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{icon}{title}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}
