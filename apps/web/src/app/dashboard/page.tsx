"use client";

import {
  AIRecommendationCard,
  FieldChip,
  InsightCard,
  IntelligenceShell,
  MetricCard,
  PrivacyStatusBadge,
  SectionHeader,
  StatusPill,
  TimelineStamp,
} from "@/components/intelligence-os/system";
import { Activity, Bell, CheckCircle2, DatabaseZap, LineChart, Megaphone, ShieldCheck } from "lucide-react";

const metrics = [
  {
    label: "Business health",
    value: "82%",
    conclusion: "Growth is stable; approval velocity is the only visible bottleneck.",
    trend: "up" as const,
    points: [62, 64, 66, 65, 74, 82],
  },
  {
    label: "Active demand",
    value: "+18%",
    conclusion: "Reputation and social signals are moving in the right direction.",
    trend: "up" as const,
    points: [28, 31, 35, 38, 43, 46],
  },
  {
    label: "Compliance queue",
    value: "3",
    conclusion: "Three items need review before any external action is taken.",
    trend: "stable" as const,
    points: [3, 4, 3, 3, 2, 3],
  },
];

const alerts = [
  "Script approval required before publishing this week’s ENT awareness content.",
  "One integration has stale sync metadata and should be validated.",
  "Two AI recommendations have high confidence but no assigned owner.",
];

export default function DashboardPage() {
  return (
    <IntelligenceShell
      activePath="/dashboard"
      title="Home"
      subtitle="A conclusions-first operating view for healthcare growth, approvals, and privacy-safe execution."
    >
      <div className="grid gap-5">
        <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeader
              icon={Activity}
              title="Today's Business Health"
              summary="VIP is prioritizing the few signals that need a leadership decision today."
            />
            <PrivacyStatusBadge />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
            <SectionHeader icon={Bell} title="Critical Alerts" summary="Only urgent or decision-blocking items are shown here." />
            <div className="mt-5 grid gap-3">
              {alerts.map((alert, index) => (
                <div key={alert} className="flex gap-3 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-semibold text-amber-700">
                    {index + 1}
                  </span>
                  <p className="text-base leading-7 text-slate-700">{alert}</p>
                </div>
              ))}
            </div>
          </section>

          <AIRecommendationCard
            title="Clear approvals before scaling new outreach"
            recommendation="The fastest safe move is to approve or reject the three pending content and campaign items, then assign one owner to the next lead-conversion test."
            confidence="88% confidence"
            nextAction="Review approval queue"
            evidence="Pending approvals are blocking scheduled content, while demand indicators remain positive across reputation and social movement."
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <InsightCard
            eyebrow="Active Campaigns"
            title="ENT awareness campaign is ready for controlled execution"
            summary="Campaign assets are prepared; publish readiness depends on clinical and compliance approval."
            tone="success"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldChip label="Status" value="Ready" />
              <FieldChip label="Owner" value="Marketing" />
              <FieldChip label="Privacy" value="Safe preview" />
            </div>
          </InsightCard>

          <InsightCard
            eyebrow="Pending Approvals"
            title="Three decisions need human confirmation"
            summary="VIP will not publish, send, or execute these items until an authorized reviewer acts."
            tone="warning"
          >
            <ul className="space-y-2">
              <li>Content script: masked patient education post</li>
              <li>Daily analytics report: client-ready version</li>
              <li>WhatsApp follow-up sequence: privacy-safe template</li>
            </ul>
          </InsightCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
            <SectionHeader icon={LineChart} title="Recent Performance Movement" summary="Trend context sits next to the conclusion so teams do not have to interpret charts first." />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MetricCard label="Review sentiment" value="+6%" conclusion="Positive movement after recent patient education posts." trend="up" points={[32, 35, 34, 39, 41, 44]} />
              <MetricCard label="Social reach" value="14.2k" conclusion="Reach is concentrated around doctor-led education topics." trend="up" points={[20, 24, 29, 31, 36, 42]} />
              <MetricCard label="Lead response" value="41%" conclusion="Response is steady; next lift likely comes from faster follow-up." points={[39, 42, 40, 41, 41, 41]} />
            </div>
          </section>

          <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
            <SectionHeader icon={DatabaseZap} title="Privacy/Data Sync Status" summary="Data freshness and processing boundaries stay visible without exposing sensitive records." />
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                <span className="text-base font-semibold text-slate-800">Server-side processing</span>
                <StatusPill tone="success">Active</StatusPill>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                <span className="text-base font-semibold text-slate-800">Masked identifiers</span>
                <StatusPill tone="success">Enabled</StatusPill>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                <span className="text-base font-semibold text-slate-800">Last safe sync</span>
                <TimelineStamp>Today</TimelineStamp>
              </div>
              <details className="rounded-lg border border-[#d7e5e4] bg-white p-3">
                <summary className="cursor-pointer text-base font-semibold text-[#000080]">Advanced audit logs</summary>
                <p className="mt-2 text-base leading-7 text-slate-600">Audit events remain hidden by default and available through governed admin routes.</p>
              </details>
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-[#008080]" aria-hidden />
              <p className="text-base leading-7 text-slate-700">HIPAA/privacy-safe previews avoid unnecessary patient or client identifiers.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 size-5 text-[#008080]" aria-hidden />
              <p className="text-base leading-7 text-slate-700">Primary actions are large, reachable, and reserved for meaningful decisions.</p>
            </div>
            <div className="flex items-start gap-3">
              <Megaphone className="mt-1 size-5 text-[#008080]" aria-hidden />
              <p className="text-base leading-7 text-slate-700">Detail-heavy data stays behind expandable evidence areas.</p>
            </div>
          </div>
        </section>
      </div>
    </IntelligenceShell>
  );
}
