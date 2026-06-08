import { AlertTriangle, Gauge, MessageSquareText, RadioTower, Workflow } from "lucide-react";

import {
  ComparisonBars,
  EvidenceList,
  InsightPanel,
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
} from "@/design-system/dashboard-surfaces";

const notifications = [
  "3 staff complaints detected",
  "1 alert resolved",
  "Health score improved",
];

export default function CommandCenter() {
  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Agency and portfolio command"
        title="VIP Command Center"
        description="A portfolio-grade command surface for hospital health, alerts, review intelligence, notifications, and operational proof."
        icon={Workflow}
        state="mock"
      />

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <IntelligenceMetricGrid
          metrics={[
            { label: "Health score", value: "58/100", detail: "Current hospital health needs strategic attention.", state: "degraded", icon: Gauge },
            { label: "Open alerts", value: "3", detail: "Active risks are waiting for owner response.", state: "degraded", icon: AlertTriangle },
            { label: "Reviews", value: "345", detail: "Review evidence is available for intelligence summaries.", state: "ready", icon: MessageSquareText },
            { label: "System pulse", value: "Live", detail: "Command center modules are reachable from this route.", state: "mock", icon: RadioTower },
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <InsightPanel title="AI daily brief" description="Concise operating summary for the hospital team." state="mock">
            Reputation health is improving, but trust concerns still need visible response proof. Use the next campaign cycle to show doctor
            authority, faster issue resolution, and patient education around high-intent ENT topics.
          </InsightPanel>

          <EvidenceList
            title="Notifications"
            description="Operational events that should remain visible."
            items={notifications.map((item, index) => ({
              title: item,
              detail: index === 0 ? "Requires follow-up from admin or staff." : "Visible in the current command proof trail.",
              state: index === 0 ? "degraded" : "ready",
            }))}
          />
        </div>

        <IntelligenceActionQueue
          title="Command actions"
          description="The next operational moves from this center."
          actions={[
            {
              title: "Assign staff complaint follow-up",
              detail: "Route unresolved complaint themes to a responsible admin owner.",
              owner: "Admin",
              due: "Today",
              state: "degraded",
              href: "../alerts",
            },
            {
              title: "Send health improvement summary",
              detail: "Share concise proof that health score is improving after resolution work.",
              owner: "Agency",
              due: "Today",
              state: "mock",
              href: "../executive",
            },
            {
              title: "Start next campaign from AI brief",
              detail: "Translate the daily brief into a content strategy and production queue.",
              owner: "Production",
              due: "This week",
              state: "mock",
            },
          ]}
        />

        <ComparisonBars
          title="Hospital performance ranking"
          description="Portfolio comparison ready for agency and admin views."
          items={[
            { label: "CityCare Hospital", value: 96, detail: "Highest current growth health.", state: "ready" },
            { label: "Apollo Demo", value: 92, detail: "Strong review and content momentum.", state: "ready" },
            { label: "Workspace Demo", value: 58, detail: "Needs trust campaign and alert closure.", state: "degraded" },
          ]}
        />

        <EvidenceList
          title="Command proof"
          description="Signals the command center is designed to carry."
          items={[
            { title: "Hospital context", detail: "This route is scoped to the workspace id in the URL.", state: "ready" },
            { title: "Review source", detail: "Review totals and themes should come from acquisition/reputation services when wired.", state: "mock" },
            { title: "Notifications", detail: "Operational events are represented without a local hard dependency on port 3001.", state: "ready" },
            { title: "Portfolio rollup", detail: "Cross-hospital ranking remains demo-labeled until live portfolio data is connected.", state: "mock" },
          ]}
        />
      </section>
    </main>
  );
}
