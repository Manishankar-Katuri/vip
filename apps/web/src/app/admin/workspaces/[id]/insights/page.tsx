import { CheckCircle2, HeartPulse, LineChart, MessageSquareText, Sparkles } from "lucide-react";

import {
  ComparisonBars,
  EvidenceList,
  InsightPanel,
  IntelligenceHero,
  IntelligenceMetricGrid,
} from "@/design-system/dashboard-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

const trendData = [
  { day: "Mon", score: 65 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 70 },
  { day: "Thu", score: 81 },
  { day: "Fri", score: 88 },
  { day: "Sat", score: 92 },
  { day: "Sun", score: 100 },
];

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Revenue and intelligence dashboard"
        title="Hospital health insights"
        description="Trend, sentiment, review growth, and resolution signals shaped into an executive-readable intelligence surface."
        icon={LineChart}
        state="mock"
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <IntelligenceMetricGrid
          metrics={[
            { label: "Patient sentiment", value: "Positive", detail: "Current themes are improving after issue resolution.", state: "mock", icon: HeartPulse },
            { label: "Review growth", value: "+31%", detail: "Growth trend is moving in the right direction.", state: "mock", icon: MessageSquareText },
            { label: "Resolved issues", value: "9", detail: "Closed operational issues are visible in reporting.", state: "ready", icon: CheckCircle2 },
            { label: "Insight confidence", value: "High", detail: "Weekly trend direction is clear in the demo data.", state: "mock", icon: Sparkles },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <Panel className="p-5">
            <SectionHeader title="Health trend" description="Weekly hospital health movement." action={<StatusIndicator label="Improving" tone="success" />} />
            <div className="flex h-64 items-end gap-3">
              {trendData.map((item) => (
                <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="w-full rounded-t-lg bg-primary" style={{ height: `${Math.max(18, item.score * 2)}px` }} />
                  <p className="mt-2 text-xs font-medium text-muted-foreground">{item.day}</p>
                </div>
              ))}
            </div>
          </Panel>

          <ComparisonBars
            title="Signal quality"
            description="How reliable each insight source is today."
            items={[
              { label: "Review coverage", value: 82, detail: "Enough review data exists for theme analysis." },
              { label: "Operational closure", value: 90, detail: "Resolved issues are easy to explain." },
              { label: "Revenue attribution", value: 34, detail: "Appointment impact still needs wiring.", state: "empty" },
            ]}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <EvidenceList
            title="Insight evidence"
            description="What the page can explain."
            items={[
              { title: "Sentiment", detail: "Review tone is positive after recent issue resolution.", state: "mock" },
              { title: "Growth", detail: "Review growth is represented as a directional signal.", state: "mock" },
              { title: "Resolution", detail: "Nine issues are marked complete in the current report.", state: "ready" },
            ]}
          />

          <InsightPanel title="Executive readout" description="The useful takeaway, not just the chart." state="mock">
            The week ends with a strong health score because operational issues were resolved and sentiment is moving positively. The next unlock is
            connecting appointment and revenue attribution so growth claims can be tied to actual outcomes.
          </InsightPanel>
        </div>

        <ComparisonBars
          title="Daily health score"
          description="Readable version of the trend for reporting and QA."
          items={trendData.map((item) => ({
            label: item.day,
            value: item.score,
            detail: `Hospital health score reached ${item.score}.`,
          }))}
        />
      </section>
    </main>
  );
}
