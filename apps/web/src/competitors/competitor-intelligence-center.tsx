import { Building2, Compass, Radar, TrendingUp } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { percent } from "@/lib/product-experience";

export function CompetitorIntelligenceCenter({ data }: { data: LiveData }) {
  const competitors = data.intelligence?.competitors;
  const context = data.intelligence?.marketContext;
  const patterns = competitors?.patterns ?? [];
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Nearby healthcare competitor intelligence"
        description="Aggregated public pattern benchmarking for local positioning decisions"
        action={<StatusIndicator label={`${competitors?.accountsAnalyzed ?? 0} accounts analyzed`} tone={competitors?.accountsAnalyzed ? "success" : "warning"} />}
      />
      {competitors?.accountsAnalyzed ? (
        <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-xl border bg-info/20 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Building2 className="size-4" />Competitive position</p>
            <p className="mt-3 text-3xl font-semibold">{percent(data.analytics.avgEngagementRate)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Your measured engagement baseline</p>
            <div className="mt-4 space-y-2">
              {competitors.postingFrequencySignals.map((signal) => <p key={signal} className="text-sm leading-6">{signal}</p>)}
              {competitors.opportunityGaps.map((gap) => <p key={gap} className="text-sm leading-6 text-muted-foreground">{gap}</p>)}
            </div>
          </div>
          <div className="space-y-2">
            {patterns.slice(0, 5).map((pattern) => (
              <div key={`${pattern.patternType}-${pattern.label}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3">
                <div>
                  <p className="text-sm font-medium">{pattern.label}</p>
                  <p className="text-xs text-muted-foreground">{friendly(pattern.patternType)} pattern · {pattern.examplesCount} observed records</p>
                </div>
                <StatusIndicator label={`${Math.round(pattern.prevalence * 100)}% prevalence`} tone="info" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-5">
          <p className="text-sm font-medium">Local benchmarking is ready for data collection</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{competitors?.opportunityGaps[0] ?? "No structured competitor patterns are stored for this workspace."}</p>
        </div>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MarketSignal icon={<TrendingUp />} label="Trending healthcare topic" value={context?.healthcareSignals[0]?.title ?? "Awaiting saved regional healthcare signals"} />
        <MarketSignal icon={<Radar />} label="Market opportunity" value={context?.opportunitySignals[0]?.title ?? "Collect market context to identify underserved topics"} />
        <MarketSignal icon={<Compass />} label="Guardrail" value={competitors?.guardrail ?? "Compare only aggregated public pattern intelligence."} />
      </div>
    </Panel>
  );
}

function MarketSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{icon}{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function friendly(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
