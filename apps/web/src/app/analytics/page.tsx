"use client";

import {
  FieldChip,
  InsightCard,
  IntelligenceShell,
  MetricCard,
  RefineResultsTray,
  SectionHeader,
  StatusPill,
} from "@/components/intelligence-os/system";
import { BarChart3 } from "lucide-react";

const sections = [
  {
    name: "Overview",
    conclusion: "Overall growth is healthy, with approvals and follow-up speed limiting the next lift.",
    metrics: [["Health", "82%"], ["Actions", "5"], ["Risk", "Low"]],
    points: [62, 66, 65, 71, 77, 82],
  },
  {
    name: "Social Growth",
    conclusion: "Doctor-led education posts are driving the strongest audience movement.",
    metrics: [["Reach", "14.2k"], ["Engagement", "+18%"], ["Best channel", "Instagram"]],
    points: [22, 28, 31, 36, 44, 49],
  },
  {
    name: "Leads & Acquisition",
    conclusion: "High-intent clicks are rising, but response time needs tighter ownership.",
    metrics: [["New leads", "43"], ["Response", "41%"], ["SLA risk", "2"]],
    points: [18, 21, 25, 24, 31, 35],
  },
  {
    name: "Content Performance",
    conclusion: "Treatment explainers outperform generic awareness posts.",
    metrics: [["Top format", "Video"], ["Saves", "+11%"], ["Ready posts", "6"]],
    points: [31, 30, 33, 39, 42, 45],
  },
  {
    name: "Campaign ROI",
    conclusion: "ROI remains positive when campaigns include trust-building clinical proof.",
    metrics: [["ROI", "2.4x"], ["CAC", "Stable"], ["Next test", "ENT care"]],
    points: [12, 16, 18, 21, 23, 26],
  },
  {
    name: "Reputation",
    conclusion: "Positive review share is improving; waiting-time concerns still need proactive messaging.",
    metrics: [["Rating", "4.6"], ["Positive", "89%"], ["Watch", "Wait time"]],
    points: [40, 41, 43, 42, 45, 46],
  },
  {
    name: "Patient Engagement",
    conclusion: "Follow-up education is the clearest path to conversion and retention.",
    metrics: [["Replies", "31"], ["Education CTR", "+9%"], ["Safe templates", "4"]],
    points: [24, 25, 29, 33, 32, 37],
  },
  {
    name: "Competitive Benchmarks",
    conclusion: "VIP client is ahead in educational content, behind in review response speed.",
    metrics: [["Content rank", "#1"], ["Response rank", "#3"], ["Gap", "Speed"]],
    points: [28, 32, 35, 34, 38, 40],
  },
];

export default function AnalyticsPage() {
  return (
    <IntelligenceShell
      activePath="/analytics"
      title="Analytics"
      subtitle="Micro-dashboards that state the conclusion first, then show only the metrics and evidence needed for a decision."
    >
      <div className="grid gap-5">
        <RefineResultsTray>
          <FieldChip label="Client" value="Dr. Harika ENT Care" />
          <FieldChip label="Date range" value="Last 30 days" />
          <FieldChip label="View" value="Decision summary" />
        </RefineResultsTray>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section key={section.name} className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <SectionHeader icon={BarChart3} title={section.name} summary={section.conclusion} />
                <StatusPill tone="success">privacy-safe aggregate</StatusPill>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.1fr]">
                {section.metrics.map(([label, value]) => (
                  <MetricCard
                    key={label}
                    label={label}
                    value={value}
                    conclusion="Decision-ready signal, aggregated without exposing personal data."
                    trend="up"
                    points={section.points}
                  />
                ))}
                <InsightCard eyebrow="Plain-language conclusion" title="What this means" summary={section.conclusion}>
                  <p>
                    Details are intentionally summarized here. Use the preserved admin and production analytics routes for raw tables, exports, and audit-level diagnostics.
                  </p>
                </InsightCard>
              </div>
            </section>
          ))}
        </div>
      </div>
    </IntelligenceShell>
  );
}
