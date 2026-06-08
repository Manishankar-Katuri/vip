import { AlertTriangle, Building2, LineChart, MessageSquareText, Sparkles } from "lucide-react";

import {
  ComparisonBars,
  EvidenceList,
  InsightPanel,
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
} from "@/design-system/dashboard-surfaces";

const metrics = [
  {
    label: "VIP health score",
    value: "58",
    detail: "Growth health is at risk because reputation and competitor gaps are visible.",
    state: "degraded" as const,
    icon: LineChart,
  },
  {
    label: "Reviews analyzed",
    value: "345",
    detail: "Patient sentiment, response gaps, and recurring themes are available.",
    state: "ready" as const,
    icon: MessageSquareText,
  },
  {
    label: "Competitors tracked",
    value: "10",
    detail: "Local market content velocity and authority signals are monitored.",
    state: "ready" as const,
    icon: Building2,
  },
  {
    label: "Open alerts",
    value: "3",
    detail: "Priority risks need owner assignment before the next production cycle.",
    state: "degraded" as const,
    icon: AlertTriangle,
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Hospital growth overview"
        title="VIP Command Center"
        description="A clean operating view for hospital growth health, reputation risk, market pressure, and AI-recommended next moves."
        icon={Sparkles}
        state="mock"
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <IntelligenceMetricGrid metrics={metrics} />

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <InsightPanel title="AI insight summary" description="What needs attention before growth work scales." state="mock">
            Doctor trust concerns are appearing in review language while competitors are outpacing content authority. Prioritize a trust-building
            campaign backed by doctor-led education, review response proof, and service-specific appointment CTAs.
          </InsightPanel>

          <ComparisonBars
            title="Growth pressure"
            description="Relative signals from the current local market."
            items={[
              { label: "Trust gap", value: 64, detail: "Competitor review volume is materially higher.", state: "degraded" },
              { label: "Content readiness", value: 72, detail: "Enough topics exist for the next campaign cycle." },
              { label: "Authority signal", value: 48, detail: "Doctor-led proof needs more visibility.", state: "degraded" },
            ]}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <IntelligenceActionQueue
            title="Recommended actions"
            description="Ranked actions the team can move into production."
            actions={[
              {
                title: "Launch doctor authority campaign",
                detail: "Convert expertise and patient education into short-form content for high-intent ENT searches.",
                owner: "Production",
                due: "This week",
                state: "mock",
              },
              {
                title: "Close review response gaps",
                detail: "Resolve trust concerns with guided responses and escalation notes for clinical themes.",
                owner: "Admin",
                due: "Today",
                state: "degraded",
                href: "../alerts",
              },
              {
                title: "Compare top competitor velocity",
                detail: "Use competitor cadence to set a practical weekly content target.",
                owner: "Growth",
                due: "Weekly",
                state: "ready",
                href: "../competitor-intelligence",
              },
            ]}
          />

          <EvidenceList
            title="Evidence trail"
            description="Signals supporting this dashboard state."
            items={[
              { title: "Review intelligence", detail: "345 reviews are available for sentiment and theme analysis.", state: "ready" },
              { title: "Market intelligence", detail: "Competitor review volume and publishing patterns are modeled.", state: "ready" },
              { title: "Revenue attribution", detail: "Appointment impact is still a labeled demo state in this view.", state: "mock" },
            ]}
          />
        </div>

        <ComparisonBars
          title="Hospital performance ranking"
          description="Portfolio-style comparison prepared for admin and agency reporting."
          items={[
            { label: "CityCare Hospital", value: 96, detail: "High trust and strong campaign consistency." },
            { label: "Apollo Demo", value: 92, detail: "Strong content velocity with good review depth." },
            { label: "Dr Harika ENT", value: 58, detail: "Growth risk is visible and actionable.", state: "degraded" },
          ]}
        />
      </section>
    </main>
  );
}
