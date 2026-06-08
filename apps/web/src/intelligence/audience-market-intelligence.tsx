import { Languages, MapPinned, Radar, UsersRound } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

export function AudienceMarketIntelligence({ data }: { data: LiveData }) {
  const audience = data.audienceInsights;
  const context = data.intelligence?.marketContext;
  const demographics = context?.demographics;

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Audience and regional market intelligence"
        description="Measured platform audience observations remain distinct from modelled local-planning context"
        action={<StatusIndicator label={audience.length ? `${audience.length} audience observations` : "Planning model only"} tone={audience.length ? "success" : "warning"} />}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <UsersRound className="size-4" />
            Platform audience signals
          </p>
          {audience.length ? (
            <div className="mt-3 space-y-2">
              {audience.slice(0, 4).map((insight) => (
                <div key={`${insight.type}-${insight.label}`} className="rounded-lg bg-muted/35 p-3">
                  <p className="text-sm font-medium">{insight.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{insight.type} / value {insight.value.toFixed(2)} / {Math.round(insight.confidence * 100)}% confidence</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">No stored platform audience observations are connected to the measured social workspace yet.</p>
          )}
        </article>
        <article className="rounded-xl border bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Languages className="size-4" />
            Language and audience planning
          </p>
          {demographics ? (
            <>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Estimated regional inputs, suitable for testing plans rather than client outcome claims.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demographics.primaryLanguages.slice(0, 4).map((language) => (
                  <StatusIndicator key={language.language} label={language.language} tone="neutral" />
                ))}
              </div>
              <p className="mt-3 text-sm font-medium">{demographics.audienceSegments[0]?.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{demographics.audienceSegments[0]?.healthcareNeed}</p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">No persisted market demographic model is available.</p>
          )}
        </article>
        <article className="rounded-xl border bg-background p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Radar className="size-4" />
            Regional signals
          </p>
          {context ? (
            <div className="mt-3 space-y-3">
              <MarketItem icon={<MapPinned />} label="Healthcare signal" value={context.healthcareSignals[0]?.title ?? "No stored healthcare signal"} />
              <MarketItem icon={<Radar />} label="Opportunity" value={context.opportunitySignals[0]?.title ?? "No ranked market opportunity"} />
              <MarketItem icon={<Languages />} label="Theme" value={context.recommendedThemes[0] ?? "No recommended market theme"} />
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Market context collection has not produced a stored regional snapshot.</p>
          )}
        </article>
      </div>
    </Panel>
  );
}

function MarketItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/35 p-3">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground [&_svg]:size-3.5">{icon}{label}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  );
}
