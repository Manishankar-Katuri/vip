"use client";

import {
  FieldChip,
  IntelligenceShell,
  SectionHeader,
  StatusPill,
} from "@/components/intelligence-os/system";
import { CalendarClock, Target } from "lucide-react";

const strategies = [
  {
    objective: "Increase qualified ENT appointments",
    recommendation: "Prioritize sinus and throat education content with direct callback prompts.",
    roi: "2.4x",
    effort: "Medium",
    timeline: "14 days",
    owner: "Marketing",
    status: "Needs approval",
    why: "Recent content saves and high-intent clicks cluster around condition-specific education, not generic awareness posts.",
  },
  {
    objective: "Improve lead response speed",
    recommendation: "Assign one owner to same-day follow-up for high-priority leads.",
    roi: "1.8x",
    effort: "Low",
    timeline: "7 days",
    owner: "Operations",
    status: "Ready",
    why: "Lead quality is improving, but response rate is stable. Faster ownership is the simplest conversion lever.",
  },
  {
    objective: "Protect reputation momentum",
    recommendation: "Create a waiting-time communication workflow before requesting more reviews.",
    roi: "1.5x",
    effort: "Medium",
    timeline: "21 days",
    owner: "Clinical admin",
    status: "In review",
    why: "Positive sentiment is rising, while waiting-time concerns remain the recurring risk in reputation evidence.",
  },
];

export default function StrategyPage() {
  return (
    <IntelligenceShell
      activePath="/strategy"
      title="Strategy"
      subtitle="An action planner for objectives, ROI, effort, owners, approvals, and the next governed move."
    >
      <div className="grid gap-5">
        <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader icon={Target} title="Action Planner" summary="Strategy cards show what to do next, while deeper reasoning stays expandable." />
        </section>

        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <article key={strategy.objective} className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={strategy.status === "Ready" ? "success" : "warning"}>{strategy.status}</StatusPill>
                    <StatusPill tone="info">AI recommendation</StatusPill>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#000080]">{strategy.objective}</h2>
                  <p className="mt-2 text-base leading-7 text-slate-700">{strategy.recommendation}</p>
                  <details className="mt-4 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                    <summary className="cursor-pointer text-base font-semibold text-[#000080]">Why this strategy?</summary>
                    <p className="mt-2 text-base leading-7 text-slate-600">{strategy.why}</p>
                  </details>
                </div>

                <div className="grid gap-3">
                  <FieldChip label="Expected ROI" value={strategy.roi} />
                  <FieldChip label="Effort level" value={strategy.effort} />
                  <FieldChip label="Timeline" value={strategy.timeline} />
                  <FieldChip label="Owner" value={strategy.owner} />
                  <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#008080] px-5 text-base font-semibold text-white">
                    <CalendarClock className="size-5" aria-hidden />
                    Plan next action
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </IntelligenceShell>
  );
}
