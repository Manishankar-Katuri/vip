import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileText,
  Gauge,
  KeyRound,
  MapPinned,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceMetric,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { loadIntegrationHealth, loadPlaceLocations, type LivePlaceLocation } from "@/lib/acquisition/live-client-data";
import { findCompetitorsForLocations, type PlaceCompetitor } from "@/lib/acquisition/places";
import { analyzeReviews } from "@/lib/intelligence/review-analytics";
import { createReputationGrowthStrategy } from "@/lib/intelligence/reputation-growth-strategy";
import type {
  CompetitorReputationGap,
  ReputationGrowthStrategy,
  ReviewAcquisitionTarget,
  ReviewCampaign,
  ReviewRecoveryAction,
  ReviewResponseRecommendation,
  SentimentImprovementAction,
  WeeklyReputationRoadmapItem,
} from "@/lib/intelligence/reputation-growth-strategy";
import { getReviews } from "@/lib/knowledge/review-store";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import type { Tone } from "@/design-system/theme";

export const dynamic = "force-dynamic";

type ExecutiveCard = {
  title: string;
  value: string;
  detail: string;
  state: SurfaceState;
  icon: typeof Star;
};

type StrategyPanel = {
  title: string;
  purpose: string;
  icon: typeof Target;
  tone: Tone;
  actions: string[];
  outcome: string;
};

type ActionPlanRow = {
  priority: "Critical" | "High" | "Medium";
  action: string;
  trigger: string;
  owner: string;
  timeframe: string;
  outcome: string;
  safety: string;
};

const sources = [
  {
    publisher: "Birdeye",
    title: "Review management platform",
    detail: "Centralized review feed, filters, response workflows, templates, sharing, and sentiment reporting patterns.",
    href: "https://support.birdeye.com/en_US/review-management-/all-about-birdeye-reviews",
  },
  {
    publisher: "Birdeye",
    title: "Healthcare reputation management",
    detail: "Healthcare reputation programs should use reviews, listings, sentiment, and operational feedback loops.",
    href: "https://birdeye.com/blog/healthcare-reputation-management/",
  },
  {
    publisher: "Podium",
    title: "Online reputation management",
    detail: "Reputation score monitoring, review collection, customer-preferred channels, and fast response loops.",
    href: "https://www.podium.com/article/online-reputation-management",
  },
  {
    publisher: "Reputation.com",
    title: "Healthcare reputation",
    detail: "Healthcare command centers use scorecards, surveys, reviews, sentiment, and location-level workflows.",
    href: "https://reputation.com/solutions/industries/healthcare",
  },
  {
    publisher: "Reputation.com",
    title: "Healthcare ORM guide",
    detail: "Healthcare reputation programs should connect sentiment, benchmarking, tickets, and weekly reporting.",
    href: "https://go.reputation.com/hubfs/downloadable-assets/Healthcare%20Assets/Healthcare%20Guides/healthcare-orm-guide.pdf",
  },
  {
    publisher: "Google Business Profile",
    title: "Improve local ranking",
    detail: "Relevance, distance, prominence, reviews, and ratings shape local visibility.",
    href: "https://support.google.com/business/answer/7091/improve-your-local-ranking-on-google",
  },
  {
    publisher: "Google Business Profile",
    title: "Get more reviews",
    detail: "Review links, QR codes, public replies, and no incentives.",
    href: "https://support.google.com/business/answer/3474122?hl=en-en",
  },
  {
    publisher: "Google Maps Platform",
    title: "Places API fields",
    detail: "Public listing fields can support ratings, review totals, snippets, photos, and Maps URLs.",
    href: "https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places",
  },
  {
    publisher: "Federal Trade Commission",
    title: "Consumer reviews rule",
    detail: "Fake reviews, misleading testimonials, suppression, and insider reviews create compliance risk.",
    href: "https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers",
  },
  {
    publisher: "American Medical Association",
    title: "Online review responses",
    detail: "Physicians can respond online, but must protect patient privacy and avoid PHI disclosure.",
    href: "https://www.ama-assn.org/system/files/regulatory-myths-online-reviews.pdf",
  },
  {
    publisher: "PubMed",
    title: "Physician reviews and patient choice",
    detail: "Review number and review style can affect how patients evaluate doctors.",
    href: "https://pubmed.ncbi.nlm.nih.gov/25862516/",
  },
  {
    publisher: "Press Ganey",
    title: "Healthcare reviews and choice",
    detail: "Healthcare reputation strategy should proactively collect and use patient feedback responsibly.",
    href: "https://www.pressganey.com/resources/blog/healthcare-provider-reviews-drive-patient-choice/",
  },
];

export default async function AdminReviewStrategyPage() {
  const [places, integrations] = await Promise.all([
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);
  const competitorGroups = await findCompetitorsForLocations(places, "Hyderabad", "ENT");
  const competitors = uniqueCompetitors(competitorGroups.flatMap((group) => group.competitors));
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const totalReviews = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const averageRating = calculateWeightedRating(matchedPlaces);
  const reviewSnippets = [
    ...matchedPlaces.flatMap((place) => place.reviewSnippets.map((snippet) => ({ ...snippet, source: place.centre }))),
    ...competitors.flatMap((competitor) => competitor.reviewSnippets.map((snippet) => ({ ...snippet, source: competitor.name }))),
  ];
  const complaintSnippets = reviewSnippets.filter((snippet) => snippet.rating <= 2);
  const positiveSnippets = reviewSnippets.filter((snippet) => snippet.rating >= 4);
  const topCompetitor = competitors[0];
  const biggestGap = competitors.find((competitor) => competitor.reviews > totalReviews) ?? topCompetitor;
  const reviewGap = biggestGap ? Math.max(0, biggestGap.reviews - totalReviews) : 0;
  const gbpHealth = integrations.find((integration) => integration.id === "gbp");
  const gbpConnected = gbpHealth?.status === "Connected";
  const ownedReviews = getReviews(hospitalProfile.name);
  const analytics = analyzeReviews(ownedReviews.length ? ownedReviews : getReviews("Harika ENT Care Hospitals"));
  const reputationStrategy = createReputationGrowthStrategy({ analytics, gbpConnected });
  const pageState: SurfaceState = matchedPlaces.length ? gbpConnected ? "ready" : "degraded" : "empty";
  const trustScore = reputationStrategy.healthScore.total;
  const responseReadiness = gbpConnected ? "Owned queue ready" : "OAuth needed";
  const dataConfidence = calculateDataConfidence({ matchedPlaces, places, competitors, gbpConnected, reviewSnippets: reviewSnippets.length });

  const metrics: IntelligenceMetric[] = [
    {
      label: "Review trust score",
      value: `${trustScore}/100`,
      detail: averageRating
        ? `${averageRating.toFixed(1)} weighted public rating across ${integer(totalReviews)} visible reviews.`
        : "No public rating baseline is available yet.",
      state: trustScore >= 70 ? "ready" : trustScore >= 45 ? "degraded" : "empty",
      icon: Gauge,
    },
    {
      label: "Public review gap",
      value: reviewGap ? integer(reviewGap) : "No deficit",
      detail: biggestGap && reviewGap
        ? `${biggestGap.name} shows ${integer(biggestGap.reviews)} public reviews versus ${integer(totalReviews)} for matched Harika listings.`
        : "Current public pull does not show a review-volume deficit against the top competitor.",
      state: reviewGap ? "degraded" : competitors.length ? "ready" : "empty",
      icon: Radar,
    },
    {
      label: "Response readiness",
      value: responseReadiness,
      detail: gbpConnected
        ? "Google Business Profile access is verified for owned review response workflows."
        : gbpHealth?.detail ?? "GBP access must be connected before owned reply state and response coverage are trusted.",
      state: gbpConnected ? "ready" : "degraded",
      icon: MessageSquareText,
    },
    {
      label: "Complaint/theme risk",
      value: complaintSnippets.length ? `${complaintSnippets.length} signals` : "Low public signal",
      detail: complaintSnippets.length
        ? "Low-rated public snippets should be converted into patient-experience tasks."
        : "Current public snippets are mostly positive or too limited for complaint-theme analysis.",
      state: complaintSnippets.length ? "degraded" : reviewSnippets.length ? "ready" : "empty",
      icon: AlertTriangle,
    },
  ];

  const executiveCards: ExecutiveCard[] = [
    {
      title: "Centre coverage",
      value: `${matchedPlaces.length}/${places.length}`,
      detail: "Each centre needs a verified public listing before reputation movement can be attributed by location.",
      state: matchedPlaces.length === places.length ? "ready" : matchedPlaces.length ? "degraded" : "empty",
      icon: MapPinned,
    },
    {
      title: "Owned review intelligence",
      value: gbpConnected ? "Ready to ingest" : "Not trusted yet",
      detail: gbpConnected
        ? "Owned review text, reply state, created time, and update time can become the governed intelligence layer."
        : "Public snippets are visible, but complete review history and reply status need GBP authorization.",
      state: gbpConnected ? "ready" : "degraded",
      icon: KeyRound,
    },
    {
      title: "Positive proof pool",
      value: positiveSnippets.length ? `${positiveSnippets.length} snippets` : "Pending",
      detail: "Recurring positive themes can inform website, GBP, and social proof only after privacy-safe wording review.",
      state: positiveSnippets.length ? "ready" : "empty",
      icon: Sparkles,
    },
    {
      title: "Data confidence",
      value: dataConfidence,
      detail: "Confidence combines centre matches, competitor evidence, snippet coverage, and GBP connector health.",
      state: dataConfidence === "High" ? "ready" : dataConfidence === "Medium" ? "degraded" : "empty",
      icon: ShieldCheck,
    },
  ];

  const strategyPanels = buildStrategyPanels({ reviewGap, biggestGap, gbpConnected, complaintCount: complaintSnippets.length });
  const actionPlan = buildActionPlan({ reviewGap, biggestGap, gbpConnected, complaintCount: complaintSnippets.length, matchedCount: matchedPlaces.length, totalPlaces: places.length });
  const diagnosis = buildDiagnosis({ matchedPlaces, places, totalReviews, averageRating, reviewGap, biggestGap, gbpConnected, complaintCount: complaintSnippets.length, positiveCount: positiveSnippets.length });

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Review strategy"
        title={`${hospitalProfile.name} reputation command plan`}
        description="An intelligence-led review strategy that turns public listing evidence, competitor pressure, GBP readiness, and patient feedback themes into safe reputation actions."
        icon={Star}
        state={pageState}
      >
        <StatusIndicator label={gbpConnected ? "GBP connected" : "GBP review access needed"} tone={gbpConnected ? "success" : "warning"} />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {!gbpConnected && (
          <AlertBanner
            title="Owned review intelligence is not fully connected"
            message="This strategy can use public Places ratings, review totals, and snippets now. Complete review history, reply state, response coverage, and freshness need Google Business Profile authorization before they are treated as governed review intelligence."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {executiveCards.map((card) => (
            <ExecutiveStrategyCard key={card.title} card={card} />
          ))}
        </div>

        <ReputationHealthPanel strategy={reputationStrategy} />

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Reputation position"
              description="What the review data says today, and what cannot be claimed yet."
              action={<StatusIndicator label="Evidence separated" tone="info" />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <PositionMetric label="Matched centres" value={`${matchedPlaces.length}/${places.length}`} detail="Official centre listings matched to public Places evidence." />
              <PositionMetric label="Visible review count" value={integer(totalReviews)} detail="Public review totals only; not full owned review history." />
              <PositionMetric label="Weighted rating" value={averageRating ? averageRating.toFixed(1) : "N/A"} detail="Weighted by public review count across matched centres." />
              <PositionMetric label="Competitor benchmark" value={biggestGap?.name ?? "No benchmark"} detail={biggestGap ? `${integer(biggestGap.reviews)} reviews and ${biggestGap.rating.toFixed(1)} rating in the current pull.` : "No competitor pull available."} />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Strategic diagnosis"
              description="Trust builders, conversion risks, and evidence gaps that shape the plan."
              action={<TrendingUp className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {diagnosis.map((item) => (
                <DiagnosisRow key={item.title} title={item.title} detail={item.detail} state={item.state} />
              ))}
            </div>
          </Panel>
        </div>

        <ReviewAcquisitionPanel targets={reputationStrategy.acquisitionTargets} />

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <NegativeRecoveryPanel actions={reputationStrategy.recoveryPlan} />
          <PositiveAmplificationPanel items={reputationStrategy.amplificationPlan} />
        </div>

        <ReviewCampaignPanel campaigns={reputationStrategy.campaigns} />

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <ResponseRecommendationPanel recommendations={reputationStrategy.responseRecommendations} />
          <SentimentImprovementPanel actions={reputationStrategy.sentimentActions} />
        </div>

        <CompetitorGapPanel gaps={reputationStrategy.competitorGaps} />

        <Panel className="p-5">
          <SectionHeader
            title="Deep strategy plans"
            description="Each plan connects review intelligence to action, ownership, and healthcare-safe execution."
            action={<Target className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {strategyPanels.map((panel) => (
              <DeepStrategyPanel key={panel.title} panel={panel} />
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <WeeklyRoadmapPanel items={reputationStrategy.weeklyRoadmap} />
          <ExpectedOutcomesPanel strategy={reputationStrategy} />
        </div>

        <Panel className="overflow-hidden p-0">
          <div className="p-5">
            <SectionHeader
              title="Action plan table"
              description="Prioritized actions with the intelligence trigger, owner, timing, expected result, and safety rule."
              action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-t text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Intelligence trigger</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Timeframe</th>
                  <th className="px-4 py-3 font-semibold">Expected outcome</th>
                  <th className="px-4 py-3 font-semibold">Safety rule</th>
                </tr>
              </thead>
              <tbody>
                {actionPlan.map((row) => (
                  <tr key={`${row.priority}-${row.action}`} className="border-t align-top">
                    <td className="px-4 py-4"><StatusIndicator label={row.priority} tone={priorityTone(row.priority)} /></td>
                    <td className="max-w-[240px] px-4 py-4 font-semibold text-foreground">{row.action}</td>
                    <td className="max-w-[260px] px-4 py-4 text-muted-foreground">{row.trigger}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.owner}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.timeframe}</td>
                    <td className="max-w-[260px] px-4 py-4 text-muted-foreground">{row.outcome}</td>
                    <td className="max-w-[260px] px-4 py-4 text-muted-foreground">{row.safety}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <SectionHeader
              title="30 / 60 / 90 day sequence"
              description="A staged rollout so review strategy becomes an operating system, not a one-time push."
              action={<Clock className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {[
                {
                  period: "Days 1-30",
                  title: "Fix the review foundation",
                  detail: "Refresh GBP access, verify centre mappings, create privacy-safe response templates, and launch a broad post-visit QR or WhatsApp review request flow.",
                },
                {
                  period: "Days 31-60",
                  title: "Build themes and recovery loops",
                  detail: "Summarize praise and complaint themes weekly, convert repeated complaints into patient-experience tasks, and create centre-specific proof points.",
                },
                {
                  period: "Days 61-90",
                  title: "Scale what improves intent",
                  detail: "Prioritize the actions that improve calls, directions, WhatsApp enquiries, appointment requests, response coverage, and review quality.",
                },
              ].map((item) => (
                <div key={item.period} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusIndicator label={item.period} tone="info" />
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Operating rhythm"
              description="The cadence that keeps review intelligence current and actionable."
              action={<CheckCircle2 className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Daily", "Reply to new reviews, flag low ratings, and move sensitive cases offline without confirming patient identity."],
                ["Weekly", "Review praise themes, complaint themes, response coverage, and centre-level review movement."],
                ["Monthly", "Compare competitor review gaps, centre pressure, GBP profile proof, photos, services, and conversion movement."],
                ["Quarterly", "Decide what to stop, continue, or scale based on calls, directions, WhatsApp enquiries, appointment requests, and review quality."],
              ].map(([label, detail]) => (
                <div key={label} className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
          <Panel className="p-5">
            <SectionHeader
              title="Governance and safety"
              description="Rules that keep review growth useful, compliant, and healthcare-safe."
              action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Ask broadly after suitable visits; do not selectively ask only happy patients.",
                "Do not offer discounts, rewards, or benefits for reviews or review changes.",
                "Do not buy, script, invent, suppress, or pressure reviews.",
                "Reply without confirming someone is a patient or revealing protected health information.",
                "Move clinical, billing, safety, or complaint details into a private resolution path.",
                "Use review themes as operational learning, not as claims about clinical outcomes.",
              ].map((rule) => (
                <p key={rule} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                  {rule}
                </p>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Source anchors"
              description="Credible references behind the strategy and guardrails."
              action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border bg-background p-3 transition hover:border-primary/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                    {source.title}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{source.detail}</p>
                </a>
              ))}
            </div>
          </Panel>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Public Google Places ratings and review totals are local visibility and trust indicators only. This page does not rank clinical quality or patient outcomes. Complete sentiment, response coverage, and review freshness should come from governed owned GBP review ingestion.
        </p>
      </section>
    </main>
  );
}

function ExecutiveStrategyCard({ card }: { card: ExecutiveCard }) {
  const tone = card.state === "ready" ? "success" : card.state === "degraded" ? "warning" : "neutral";
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <card.icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label={card.state === "ready" ? "Live" : card.state === "degraded" ? "Needs action" : "Pending"} tone={tone} />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{card.title}</p>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight">{card.value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.detail}</p>
    </Panel>
  );
}

function PositionMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ReputationHealthPanel({ strategy }: { strategy: ReputationGrowthStrategy }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Reputation Health Score"
        description="A practical score inspired by review management platforms: rating, volume, sentiment, freshness, response readiness, department risk, and competitor pressure."
        action={<StatusIndicator label={`${strategy.healthScore.label} / ${strategy.healthScore.total}`} tone={strategy.healthScore.total >= 75 ? "success" : strategy.healthScore.total >= 58 ? "warning" : "danger"} />}
      />
      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <div className="rounded-lg border bg-primary/5 p-5">
          <p className="text-sm font-medium text-muted-foreground">Overall health</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">{strategy.healthScore.total}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{strategy.healthScore.summary}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {strategy.healthScore.subScores.map((score) => (
            <ScoreTile key={score.label} label={score.label} score={score.score} detail={score.detail} />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ScoreTile({ label, score, detail }: { label: string; score: number; detail: string }) {
  const tone: Tone = score >= 75 ? "success" : score >= 58 ? "warning" : "danger";
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        <StatusIndicator label={`${score}/100`} tone={tone} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, score)}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ReviewAcquisitionPanel({ targets }: { targets: ReviewAcquisitionTarget[] }) {
  const departments = targets.filter((target) => target.type === "Department");
  const doctors = targets.filter((target) => target.type === "Doctor");

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <AcquisitionTargetTable
        title="Review Acquisition Plan: Departments"
        description="Departments ranked by low rating, negative trend, low volume, and sentiment weakness."
        icon={Building2}
        targets={departments}
      />
      <AcquisitionTargetTable
        title="Review Acquisition Plan: Doctors"
        description="Doctor targets use known doctor context today; owned review tagging will make this precise later."
        icon={Users}
        targets={doctors}
      />
    </div>
  );
}

function AcquisitionTargetTable({
  title,
  description,
  icon: Icon,
  targets,
}: {
  title: string;
  description: string;
  icon: typeof Target;
  targets: ReviewAcquisitionTarget[];
}) {
  return (
    <Panel className="p-5">
      <SectionHeader title={title} description={description} action={<Icon className="size-5 text-primary" aria-hidden />} />
      <div className="space-y-3">
        {targets.map((target) => (
          <div key={`${target.type}-${target.name}`} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{target.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{target.reason}</p>
              </div>
              <StatusIndicator label={target.priority} tone={priorityTone(target.priority)} />
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground md:grid-cols-3">
              <MiniPlan label="Moment" value={target.requestMoment} />
              <MiniPlan label="Channel" value={target.channel} />
              <MiniPlan label="Target" value={target.target} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function NegativeRecoveryPanel({ actions }: { actions: ReviewRecoveryAction[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Negative Review Recovery Plan"
        description="Turn low sentiment into a response, private resolution, and service improvement loop."
        action={<AlertTriangle className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.trigger} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold">{action.trigger}</p>
              <StatusIndicator label={action.responseSla} tone="warning" />
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground md:grid-cols-2">
              <MiniPlan label="Owner" value={action.owner} />
              <MiniPlan label="Public reply" value={action.publicReply} />
              <MiniPlan label="Offline resolution" value={action.offlineResolution} />
              <MiniPlan label="Service action" value={action.serviceAction} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PositiveAmplificationPanel({ items }: { items: Array<{ channel: string; action: string; safety: string }> }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Positive Review Amplification Plan"
        description="Reuse positive themes as trust proof without exposing patients or overclaiming care outcomes."
        action={<Sparkles className="size-5 text-primary" aria-hidden />}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.channel} className="rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">{item.channel}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.action}</p>
            <p className="mt-3 rounded-md bg-info/50 p-2 text-xs leading-5 text-info-foreground">{item.safety}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReviewCampaignPanel({ campaigns }: { campaigns: ReviewCampaign[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Review Request Campaigns"
        description="Concrete campaigns by department, doctor, channel, owner, cadence, and safe request script."
        action={<MessageSquareText className="size-5 text-primary" aria-hidden />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <div key={campaign.title} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{campaign.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{campaign.audience}</p>
              </div>
              <StatusIndicator label={campaign.channel} tone="info" />
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground md:grid-cols-2">
              <MiniPlan label="Owner" value={campaign.owner} />
              <MiniPlan label="Cadence" value={campaign.cadence} />
            </div>
            <p className="mt-3 rounded-md border bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">{campaign.script}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{campaign.safety}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ResponseRecommendationPanel({ recommendations }: { recommendations: ReviewResponseRecommendation[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Review Response Recommendations"
        description="Response guidance for positive, neutral, negative, privacy-sensitive, and fake or spam reviews."
        action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {recommendations.map((item) => (
          <div key={item.reviewType} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{item.reviewType}</p>
              <StatusIndicator label={item.goal} tone={item.reviewType === "Negative" || item.reviewType === "Privacy-sensitive" ? "warning" : "info"} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.recommendation}</p>
            <p className="mt-2 rounded-md bg-muted p-2 text-xs leading-5 text-muted-foreground">Example: {item.example}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SentimentImprovementPanel({ actions }: { actions: SentimentImprovementAction[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Sentiment Improvement Actions"
        description="Topic-level service actions for waiting time, staff, billing, doctor clarity, facilities, and treatment communication."
        action={<TrendingUp className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.topic} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{action.topic}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.action}</p>
              </div>
              <StatusIndicator label={action.priority} tone={priorityTone(action.priority)} />
            </div>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground md:grid-cols-2">
              <MiniPlan label="Owner" value={action.owner} />
              <MiniPlan label="Metric" value={action.metric} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CompetitorGapPanel({ gaps }: { gaps: CompetitorReputationGap[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Competitor Reputation Gaps"
        description="Compare rating, review volume, sentiment, and growth so the team knows where to close trust gaps first."
        action={<Radar className="size-5 text-primary" aria-hidden />}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {gaps.map((gap) => (
          <div key={gap.competitor} className="rounded-lg border bg-background p-3">
            <p className="text-sm font-semibold">{gap.competitor}</p>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground">
              <MiniPlan label="Rating" value={gap.ratingGap} />
              <MiniPlan label="Reviews" value={gap.reviewGap} />
              <MiniPlan label="Sentiment" value={gap.sentimentGap} />
              <MiniPlan label="Growth" value={gap.growthGap} />
            </div>
            <p className="mt-3 rounded-md bg-info/50 p-2 text-xs leading-5 text-info-foreground">{gap.action}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function WeeklyRoadmapPanel({ items }: { items: WeeklyReputationRoadmapItem[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Weekly Reputation Roadmap"
        description="A four-week execution rhythm for score monitoring, review generation, response coverage, and sentiment improvement."
        action={<Clock className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.week} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusIndicator label={item.week} tone="info" />
              <p className="text-sm font-semibold">{item.focus}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
              {item.actions.map((action) => (
                <li key={action} className="flex gap-2">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-md bg-primary/5 p-2 text-xs leading-5 text-muted-foreground">{item.successMetric}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ExpectedOutcomesPanel({ strategy }: { strategy: ReputationGrowthStrategy }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Expected Outcomes"
        description="Conservative targets for rating, review volume, trust, response coverage, and complaint reduction."
        action={<Target className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {strategy.expectedOutcomes.map((outcome) => (
          <div key={outcome.metric} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold">{outcome.metric}</p>
              <StatusIndicator label={outcome.target} tone="success" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Baseline: {outcome.baseline}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{outcome.note}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MiniPlan({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function DiagnosisRow({ title, detail, state }: { title: string; detail: string; state: SurfaceState }) {
  const tone = state === "ready" ? "success" : state === "degraded" ? "warning" : "neutral";
  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      <FileText className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <StatusIndicator label={state === "ready" ? "Useful" : state === "degraded" ? "Needs action" : "Gap"} tone={tone} />
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function DeepStrategyPanel({ panel }: { panel: StrategyPanel }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <panel.icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label="Plan" tone={panel.tone} />
      </div>
      <h3 className="mt-4 text-base font-semibold">{panel.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{panel.purpose}</p>
      <ul className="mt-4 space-y-2">
        {panel.actions.map((action) => (
          <li key={action} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-lg border bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Expected outcome</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{panel.outcome}</p>
      </div>
    </div>
  );
}

function buildStrategyPanels({
  reviewGap,
  biggestGap,
  gbpConnected,
  complaintCount,
}: {
  reviewGap: number;
  biggestGap?: PlaceCompetitor;
  gbpConnected: boolean;
  complaintCount: number;
}): StrategyPanel[] {
  return [
    {
      title: "Review acquisition plan",
      purpose: "Create a consistent, ethical review request habit after suitable consultations.",
      icon: Users,
      tone: "success",
      actions: [
        "Ask broadly through QR and WhatsApp after visits where a review request is appropriate.",
        "Give patients a simple direct Google review path without suggesting the rating they should leave.",
        "Add a private feedback route for service concerns, separate from the public review request.",
      ],
      outcome: "More genuine review volume and fresher patient voice without incentives or selective review gating.",
    },
    {
      title: "Review response plan",
      purpose: "Turn every review into a visible trust moment while protecting patient privacy.",
      icon: MessageSquareText,
      tone: gbpConnected ? "success" : "warning",
      actions: [
        gbpConnected ? "Use GBP access to track new reviews and reply state." : "Restore GBP OAuth before measuring owned reply coverage.",
        "Use a same-day or next-business-day response SLA for new reviews.",
        "Use calm public replies and move detailed complaint handling offline.",
      ],
      outcome: "Higher response coverage, better public trust, and fewer unsafe public conversations.",
    },
    {
      title: "Patient experience action plan",
      purpose: "Convert complaint patterns into operational fixes instead of only writing replies.",
      icon: ClipboardCheck,
      tone: complaintCount ? "warning" : "info",
      actions: [
        complaintCount ? `Review ${complaintCount} low-rated public snippets for repeated service themes.` : "Start weekly complaint-theme tracking once owned review ingestion is live.",
        "Create tasks for waiting time, reception communication, billing clarity, and follow-up instructions when themes repeat.",
        "Close the loop internally before using any resolved issue as a public proof point.",
      ],
      outcome: "Fewer repeated complaint themes and a clearer path from feedback to patient-experience improvement.",
    },
    {
      title: "Competitor counter-plan",
      purpose: "Use competitor review pressure to decide which centre and proof assets need attention first.",
      icon: Radar,
      tone: reviewGap ? "warning" : "info",
      actions: [
        reviewGap && biggestGap ? `Prioritize the ${integer(reviewGap)} review visibility gap against ${biggestGap.name}.` : "Monitor competitor review movement weekly by centre.",
        "Strengthen GBP photos, services, posts, FAQs, and local service-page clarity around pressured centres.",
        "Compete on real access, doctor-led education, and operational proof rather than copying competitor claims.",
      ],
      outcome: "Better local prominence and trust signals in the catchments where competitors look strongest.",
    },
    {
      title: "Proof reuse plan",
      purpose: "Turn recurring positive themes into safe conversion support across channels.",
      icon: Sparkles,
      tone: "info",
      actions: [
        "Summarize themes such as doctor clarity, staff helpfulness, facility access, and follow-up support.",
        "Use anonymized theme-level proof in GBP posts, website copy, social captions, and conversion paths.",
        "Avoid patient-identifying details, clinical outcome claims, or quoted testimonials without documented permission.",
      ],
      outcome: "Stronger trust copy that reflects real patient voice without creating privacy or testimonial risk.",
    },
  ];
}

function buildActionPlan({
  reviewGap,
  biggestGap,
  gbpConnected,
  complaintCount,
  matchedCount,
  totalPlaces,
}: {
  reviewGap: number;
  biggestGap?: PlaceCompetitor;
  gbpConnected: boolean;
  complaintCount: number;
  matchedCount: number;
  totalPlaces: number;
}): ActionPlanRow[] {
  return [
    {
      priority: gbpConnected ? "High" : "Critical",
      action: "Restore governed GBP review access",
      trigger: gbpConnected ? "GBP connected, move to review-level ingestion." : "GBP OAuth missing or unhealthy.",
      owner: "Admin",
      timeframe: "Days 1-7",
      outcome: "Owned review text, reply status, freshness, and response queues become measurable.",
      safety: "Treat public snippets as partial evidence until owned review ingestion is live.",
    },
    {
      priority: matchedCount === totalPlaces ? "High" : "Critical",
      action: "Verify centre-to-listing mappings",
      trigger: `${matchedCount}/${totalPlaces} centres matched in Places evidence.`,
      owner: "Operations",
      timeframe: "Days 1-14",
      outcome: "Review gaps and actions can be attributed to the correct centre.",
      safety: "Do not compare centres or teams from incomplete listing matches.",
    },
    {
      priority: reviewGap ? "High" : "Medium",
      action: "Launch broad review request workflow",
      trigger: reviewGap && biggestGap ? `${integer(reviewGap)} public review gap against ${biggestGap.name}.` : "Maintain review freshness and prevent future competitor gaps.",
      owner: "Reputation",
      timeframe: "Days 7-30",
      outcome: "More genuine review volume and fresher public trust signals.",
      safety: "No incentives, no rating suggestions, no asking only likely positive reviewers.",
    },
    {
      priority: "High",
      action: "Build privacy-safe response templates",
      trigger: "Response readiness depends on safe public replies and offline escalation.",
      owner: "Doctor and Reputation",
      timeframe: "Days 7-21",
      outcome: "Faster replies with lower privacy and tone risk.",
      safety: "Do not confirm patient identity, treatment, diagnosis, visit details, or protected information.",
    },
    {
      priority: complaintCount ? "High" : "Medium",
      action: "Convert complaint themes into service tasks",
      trigger: complaintCount ? `${complaintCount} low-rated public snippets found.` : "No governed complaint theme queue yet.",
      owner: "Patient Experience",
      timeframe: "Weekly",
      outcome: "Repeated pain points become assigned operational fixes.",
      safety: "Handle details privately and avoid arguing or defending publicly.",
    },
    {
      priority: "Medium",
      action: "Reuse positive themes as proof points",
      trigger: "Positive review themes can support conversion when anonymized and reviewed.",
      owner: "Growth",
      timeframe: "Days 31-60",
      outcome: "Website, GBP, social, and WhatsApp copy becomes more trust-led.",
      safety: "Use theme-level proof unless explicit permission exists for a testimonial quote.",
    },
  ];
}

function buildDiagnosis({
  matchedPlaces,
  places,
  totalReviews,
  averageRating,
  reviewGap,
  biggestGap,
  gbpConnected,
  complaintCount,
  positiveCount,
}: {
  matchedPlaces: LivePlaceLocation[];
  places: LivePlaceLocation[];
  totalReviews: number;
  averageRating: number | null;
  reviewGap: number;
  biggestGap?: PlaceCompetitor;
  gbpConnected: boolean;
  complaintCount: number;
  positiveCount: number;
}) {
  return [
    {
      title: "What helps trust",
      detail: averageRating && totalReviews
        ? `${integer(totalReviews)} public reviews and a ${averageRating.toFixed(1)} weighted rating create a usable trust baseline across matched listings.`
        : "A public trust baseline is not ready until matched listings show rating and review evidence.",
      state: averageRating && totalReviews ? "ready" as const : "empty" as const,
    },
    {
      title: "What hurts conversion",
      detail: reviewGap && biggestGap
        ? `${biggestGap.name} has a visible review-volume advantage. This can affect local comparison before patients call or request directions.`
        : "No public review-volume deficit is visible in the current competitor pull.",
      state: reviewGap ? "degraded" as const : "ready" as const,
    },
    {
      title: "What needs operational action",
      detail: complaintCount
        ? "Low-rated snippets should become service recovery and patient-experience tasks before the team only optimizes public replies."
        : "Complaint-theme intelligence needs owned review ingestion or more low-rated evidence before operational themes are trusted.",
      state: complaintCount ? "degraded" as const : "empty" as const,
    },
    {
      title: "What can become proof",
      detail: positiveCount
        ? "Positive snippets can be summarized into theme-level trust copy after privacy review."
        : "Positive proof reuse should wait for stronger review text coverage.",
      state: positiveCount ? "ready" as const : "empty" as const,
    },
    {
      title: "What evidence is incomplete",
      detail: gbpConnected
        ? "GBP access is verified; next step is persisting review-level ingestion and response state."
        : `Only ${matchedPlaces.length}/${places.length} centre listing matches and public snippets are available. Owned review history and reply coverage are not trusted yet.`,
      state: gbpConnected ? "ready" as const : "degraded" as const,
    },
  ];
}

function calculateDataConfidence({
  matchedPlaces,
  places,
  competitors,
  gbpConnected,
  reviewSnippets,
}: {
  matchedPlaces: LivePlaceLocation[];
  places: LivePlaceLocation[];
  competitors: PlaceCompetitor[];
  gbpConnected: boolean;
  reviewSnippets: number;
}) {
  const score =
    (places.length && matchedPlaces.length === places.length ? 35 : matchedPlaces.length ? 20 : 0) +
    (competitors.length ? 25 : 0) +
    (reviewSnippets ? 20 : 0) +
    (gbpConnected ? 20 : 0);

  if (score >= 75) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function calculateWeightedRating(places: LivePlaceLocation[]) {
  const weighted = places.reduce(
    (total, place) => {
      const reviews = place.reviews ?? 0;
      const rating = place.rating ?? 0;
      return {
        reviews: total.reviews + reviews,
        score: total.score + rating * reviews,
      };
    },
    { reviews: 0, score: 0 },
  );
  return weighted.reviews ? weighted.score / weighted.reviews : null;
}

function uniqueCompetitors(competitors: PlaceCompetitor[]) {
  const byPlaceId = new Map<string, PlaceCompetitor>();
  for (const competitor of competitors) {
    const existing = byPlaceId.get(competitor.placeId);
    if (!existing || competitor.reviews > existing.reviews) {
      byPlaceId.set(competitor.placeId, competitor);
    }
  }
  return Array.from(byPlaceId.values()).sort((a, b) => b.reviews - a.reviews);
}

function priorityTone(priority: ActionPlanRow["priority"]): Tone {
  if (priority === "Critical") return "danger";
  if (priority === "High") return "warning";
  return "info";
}

function integer(value: number) {
  return value.toLocaleString("en-IN");
}
