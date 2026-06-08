"use client";

import Link from "next/link";

import { PermissionGate } from "@/components/PermissionGate";
import { EditorialCalendar } from "@/content-strategy/editorial-calendar";
import { AlertBanner, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import type { ContentGrowthPlan, EditorialPlan, PriorityImpact } from "@/lib/content-strategy/editorial-plan";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { hasPermission, PERMISSIONS } from "@/permissions-core";

type StrategyMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "info" | "success" | "warning";
};

type StrategySignal = {
  label: string;
  value: string;
  detail: string;
};

type ContentStrategyProps = {
  plan: EditorialPlan;
  plansByHospital?: Record<string, EditorialPlan>;
  metrics: StrategyMetric[];
  signals: StrategySignal[];
  sourceStatus: string;
  sourceTone: "neutral" | "info" | "success" | "warning";
  sourceStatusByHospital?: Record<string, string>;
  sourceToneByHospital?: Record<string, "neutral" | "info" | "success" | "warning">;
};

export function ContentStrategyPage({
  plan,
  plansByHospital,
  sourceStatus,
  sourceTone,
  sourceStatusByHospital,
  sourceToneByHospital,
}: ContentStrategyProps) {
  const { activeHospital, currentUser } = useHospital();
  const displayHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const selectedPlan = plansByHospital?.[displayHospital.id] ?? plan;
  const selectedSourceStatus =
    sourceStatusByHospital?.[displayHospital.id] ?? sourceStatus;
  const selectedSourceTone =
    sourceToneByHospital?.[displayHospital.id] ?? sourceTone;
  const growthPlan = selectedPlan.growthPlan;
  const canViewStrategy =
    !currentUser ||
    hasPermission(currentUser, PERMISSIONS.VIEW_STRATEGY);

  return (
    <PermissionGate fallback={<AccessDenied />}>
      {!canViewStrategy ? (
        <AccessDenied />
      ) : (
      <div className="space-y-6">
        <section className="rounded-lg bg-stone-950 p-6 text-white shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
                Content Strategy
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
                What to post, where to post, and when to post
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-200">
                A hospital-specific growth plan for {displayHospital.name}. Start with the priority actions, then use the calendar to execute each post with platform, time, doctor points, caption, hashtags, and approval notes.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <HeroMetric label="Content health" value={`${growthPlan.contentHealthScore.score}/100`} detail={growthPlan.contentHealthScore.label} />
                {growthPlan.expectedOutcomes.map((outcome) => (
                  <HeroMetric key={outcome.metric} label={outcome.metric} value={outcome.estimate} detail={outcome.basis} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusIndicator label={selectedSourceStatus} tone={selectedSourceTone} />
              <StatusIndicator label="Clinical review required" tone="warning" />
              <StatusIndicator label={selectedPlan.period} tone="info" />
            </div>
          </div>
        </section>

        <GrowthPlanSnapshot growthPlan={growthPlan} />
        <EditorialCalendar plan={selectedPlan} />
      </div>
      )}
    </PermissionGate>
  );
}

function GrowthPlanSnapshot({ growthPlan }: { growthPlan: ContentGrowthPlan }) {
  const topActions = growthPlan.priorityActions.slice(0, 5);
  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">What to do next</p>
            <h2 className="mt-2 text-2xl font-semibold">Priority execution plan</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Ranked actions from the content audit, topic gaps, timing evidence, content mix, and hospital specialty. This is the working plan, not a metrics report.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/25 p-3 text-sm">
            <p className="font-semibold">{growthPlan.contentHealthScore.benchmarkComparison}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {topActions.map((action) => (
            <ActionCard key={`${action.impact}-${action.title}`} action={action} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Content opportunities</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {growthPlan.opportunities.map((opportunity) => (
              <StrategyMiniCard key={`${opportunity.category}-${opportunity.title}`} title={opportunity.title} eyebrow={opportunity.category} impact={opportunity.impact} body={opportunity.action} footer={opportunity.evidence} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Weekly mix and campaign themes</p>
          <div className="mt-4 space-y-3">
            {growthPlan.calendarRecommendations.weeklyContentMix.map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <span className="text-xs text-muted-foreground">{item.count} / week</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {growthPlan.calendarRecommendations.monthlyCampaignThemes.map((theme) => (
              <span key={theme} className="rounded-full bg-info px-3 py-1 text-xs font-medium text-primary">{theme}</span>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Content type strategy</p>
          <div className="mt-4 grid gap-3">
            {growthPlan.contentTypeStrategy.map((item) => (
              <StrategyMiniCard key={item.type} title={item.type} eyebrow={item.cadence} impact={item.impact} body={item.recommendation} footer={item.execution} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Posting, captions and hashtags</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg bg-muted/25 p-3">
              <p className="text-sm font-semibold">Best posting times</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {growthPlan.bestPostingTimes.slice(0, 5).map((time) => (
                  <p key={time.platform} className="text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{time.platform}:</span> {time.window} ({time.source === "measured" ? "measured" : "test"})
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/25 p-3">
              <p className="text-sm font-semibold">Caption direction</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{growthPlan.captionRecommendations[0]?.example}</p>
              <p className="mt-2 text-xs font-medium text-primary">{growthPlan.captionRecommendations[0]?.cta}</p>
            </div>
            <div className="rounded-lg bg-muted/25 p-3">
              <p className="text-sm font-semibold">Hashtag set</p>
              <p className="mt-2 text-xs leading-6 text-primary">
                {growthPlan.hashtagRecommendations.map((item) => `#${item.tag}`).join(" ")}
              </p>
            </div>
          </div>
        </section>
      </div>

      <details className="rounded-lg border bg-background p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-primary">Show health score reasons and competitor gaps</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <EvidenceList title="What is working" items={growthPlan.contentHealthScore.strongReasons} />
          <EvidenceList title="What needs improvement" items={growthPlan.contentHealthScore.weakReasons} />
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Competitor gaps</p>
            {growthPlan.competitorContentGaps.map((gap) => (
              <div key={gap.gap} className="rounded-lg bg-muted/25 p-3">
                <p className="text-sm font-semibold">{gap.gap}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{gap.vipAction}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-200">{detail}</p>
    </div>
  );
}

function ActionCard({ action }: { action: ContentGrowthPlan["priorityActions"][number] }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <ImpactPill impact={action.impact} />
        <span className="text-xs text-muted-foreground">{action.owner} / {action.due}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{action.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.action}</p>
    </div>
  );
}

function StrategyMiniCard({ eyebrow, title, impact, body, footer }: { eyebrow: string; title: string; impact: PriorityImpact; body: string; footer: string }) {
  return (
    <div className="rounded-lg border bg-muted/15 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        <ImpactPill impact={impact} />
      </div>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{footer}</p>
    </div>
  );
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ImpactPill({ impact }: { impact: PriorityImpact }) {
  const tone = impact === "High Impact" ? "bg-success/15 text-success" : impact === "Medium Impact" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{impact}</span>;
}

function AccessDenied() {
  return (
    <div className="space-y-4">
      <AlertBanner
        title="Content strategy access denied"
        message="You do not have access to the shared content strategy workspace."
        tone="danger"
      />
      <Link href="/production/command-centre" className="text-sm font-medium text-primary">
        Return to command centre
      </Link>
    </div>
  );
}
