import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { Recommendation } from "@/demo-data/workspaces";
import { AlertBanner, Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";

export function RecommendationCards({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader title="AI recommendations" description="Explainable opportunities for your team" />
      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <div key={recommendation.title} className="rounded-xl border border-primary/10 bg-info/45 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-semibold">{recommendation.title}</p>
                  <ConfidenceIndicator value={recommendation.confidence} />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.reason}</p>
                <Button asChild className="mt-3" variant="outline" size="lg">
                  <Link href="/production/recommendations">Open recommendation page</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ConfidenceIndicator({ value }: { value: number }) {
  const tone: Tone = value > 89 ? "success" : "info";
  return <StatusIndicator label={`${value}% confidence`} tone={tone} />;
}

export function AnomalyCard() {
  return (
    <AlertBanner
      title="Waiting-time mentions increased"
      message="Three reviews this week reference check-in communication. A prepared response is ready for review."
      tone="warning"
    />
  );
}

export function InsightSummary({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="border-primary/15 bg-info/35 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Intelligence summary</p>
      <p className="mt-3 text-base leading-7 text-foreground">{children}</p>
    </Panel>
  );
}
