import {
  BarChart3,
  Building2,
  Compass,
  ExternalLink,
  Gauge,
  MessageSquareText,
  Radar,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import {
  ComparisonBars,
  EvidenceList,
  InsightPanel,
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceAction,
  type IntelligenceMetric,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { CompetitorMarketMap, type MarketMapCompetitor } from "@/competitors/competitor-market-map";
import type { LiveData } from "@/components/operations/operational-surfaces";
import type { IntegrationHealth, LivePlaceLocation } from "@/lib/acquisition/live-client-data";
import { integer, percent } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import type { CompetitorAnalysisReport, CompetitorReportInsight } from "@vip/market-intelligence/competitors";

type SocialCompetitor = {
  id: string;
  platform: string;
  handle: string;
  displayName: string | null;
  tier: string;
  lastAnalyzedAt: Date | null;
  metrics: unknown;
};

type SocialCompetitorComparison = {
  workspaceId: string;
  competitors: SocialCompetitor[];
  gaps: Array<{ label: string; confidence: number; rationale: string }>;
};

export type ScoredCompetitor = {
  placeId: string;
  name: string;
  rating: number;
  reviews: number;
  address: string;
  types: string[];
  lat?: number;
  lng?: number;
  businessStatus?: string;
  distanceKm?: number;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  weekdayText?: string[];
  photoCount?: number;
  reviewSnippets: Array<{ authorName: string; rating: number; relativeTimeDescription: string; text: string }>;
  marketStrength: number;
  opportunity: string;
  suggestedAction: string;
  relevanceSignals: string[];
  nearestCentre: string;
};

type ScoredCompetitorGroup = {
  centre: string;
  anchorName?: string;
  anchorPlaceId?: string;
  competitors: ScoredCompetitor[];
};

type BenchmarkRow = {
  metric: string;
  source: string;
  hospital: string;
  bestCompetitor: string;
  marketAverage: string;
  topPerformer: string;
  insight: string;
  state: SurfaceState;
};

type ConnectorGap = {
  label: string;
  source: string;
  detail: string;
};

export function CompetitorAnalyticsDashboard({
  data,
  places,
  scoredGroups,
  competitors,
  socialCompetitors,
  integrations,
  competitorReport,
}: {
  data: LiveData;
  places: LivePlaceLocation[];
  scoredGroups: ScoredCompetitorGroup[];
  competitors: ScoredCompetitor[];
  socialCompetitors: SocialCompetitorComparison;
  integrations: IntegrationHealth[];
  competitorReport?: CompetitorAnalysisReport;
}) {
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const ownReviewTotal = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const ownRating = calculateWeightedRating(matchedPlaces);
  const topThreat = competitors[0];
  const biggestGap = competitors.find((competitor) => competitor.reviews > ownReviewTotal) ?? topThreat;
  const averageCompetitorRating = average(competitors.map((competitor) => competitor.rating).filter(Boolean));
  const averageCompetitorReviews = average(competitors.map((competitor) => competitor.reviews));
  const searchAligned = competitors.filter((competitor) => competitor.relevanceSignals.length > 0).length;
  const socialProfiles = socialCompetitors.competitors;
  const profilesWithMetrics = socialProfiles.filter((competitor) => hasMetricData(competitor.metrics));
  const instagramProfiles = socialProfiles.filter((competitor) => competitor.platform === "INSTAGRAM");
  const facebookProfiles = socialProfiles.filter((competitor) => competitor.platform === "FACEBOOK");
  const gbpHealth = integrations.find((integration) => integration.id === "gbp");
  const metaHealth = integrations.find((integration) => integration.id === "meta");
  const mapsHealth = integrations.find((integration) => integration.id === "maps");
  const pageState: SurfaceState = competitors.length || socialProfiles.length
    ? "ready"
    : places.some((place) => place.status === "Unavailable")
      ? "degraded"
      : "empty";
  const bestSocialEngagement = bestSocialMetric(socialProfiles, ["engagementRate", "avgEngagementRate", "engagement_rate"]);
  const bestSocialReach = bestSocialMetric(socialProfiles, ["reach", "totalReach", "audienceReach"]);
  const bestSocialGrowth = bestSocialMetric(socialProfiles, ["growthRate", "growth_rate", "followerGrowthRate"]);
  const connectorGaps = buildConnectorGaps();
  const centresWithCompetitors = scoredGroups.filter((group) => group.competitors.length).length;
  const benchmarkRows = buildBenchmarkRows({
    data,
    competitors,
    ownRating,
    ownReviewTotal,
    averageCompetitorRating,
    averageCompetitorReviews,
    topThreat,
    bestSocialEngagement,
    bestSocialReach,
    bestSocialGrowth,
    socialProfiles,
  });
  const metrics: IntelligenceMetric[] = [
    {
      label: "Competitor coverage",
      value: `${competitors.length + socialProfiles.length}`,
      detail: `${competitors.length} public Places competitors, ${centresWithCompetitors}/${scoredGroups.length} centre groups with competitors, and ${socialProfiles.length} configured social competitor accounts are available for live-only comparison.`,
      state: competitors.length || socialProfiles.length ? "ready" : "empty",
      icon: Building2,
    },
    {
      label: "Top market position",
      value: topThreat ? `${Math.round(topThreat.marketStrength)}/100` : "N/A",
      detail: topThreat ? `${topThreat.name} leads the public listing pressure score in this live pull.` : "No public competitor benchmark is available yet.",
      state: topThreat ? "ready" : "empty",
      icon: Gauge,
    },
    {
      label: "Largest review gap",
      value: biggestGap && biggestGap.reviews > ownReviewTotal ? integer(biggestGap.reviews - ownReviewTotal) : "0",
      detail: biggestGap ? `${biggestGap.name} has ${integer(biggestGap.reviews)} visible public reviews versus ${integer(ownReviewTotal)} for ${hospitalProfile.name}.` : "No competitor review gap can be calculated yet.",
      state: biggestGap && biggestGap.reviews > ownReviewTotal ? "degraded" : competitors.length ? "ready" : "empty",
      icon: Star,
    },
    {
      label: "Social benchmark readiness",
      value: `${profilesWithMetrics.length}/${socialProfiles.length}`,
      detail: socialProfiles.length ? "Configured social competitors are listed live; comparisons populate only when stored competitor metrics exist." : "Add Instagram and Facebook competitor accounts to unlock social comparison.",
      state: profilesWithMetrics.length ? "ready" : socialProfiles.length ? "degraded" : "empty",
      icon: Users,
    },
  ];
  const executiveCards = [
    {
      title: "Market position",
      value: topThreat ? `Challenger to ${topThreat.name}` : "No competitor baseline",
      detail: topThreat ? `Public listing pressure is led by ${topThreat.name}; VIP should counter with review depth, service relevance, and centre-level proof.` : "Competitor visibility will remain setup-labeled until live evidence is available.",
      state: topThreat ? "degraded" as const : "empty" as const,
      icon: Radar,
    },
    {
      title: "Social presence",
      value: socialProfiles.length ? `${socialProfiles.length} tracked accounts` : "No tracked accounts",
      detail: instagramProfiles.length || facebookProfiles.length ? `${instagramProfiles.length} Instagram and ${facebookProfiles.length} Facebook competitor profiles are configured.` : "Sprout-style competitor reporting needs configured competitor profiles and stored metrics.",
      state: profilesWithMetrics.length ? "ready" as const : socialProfiles.length ? "degraded" as const : "empty" as const,
      icon: Share2,
    },
    {
      title: "Reputation position",
      value: ownRating ? `${ownRating.toFixed(1)} rating` : "Rating unavailable",
      detail: averageCompetitorRating ? `Competitor average is ${averageCompetitorRating.toFixed(1)} from ${competitors.length} public listings.` : "Public competitor rating average is not available.",
      state: ownRating && averageCompetitorRating && ownRating >= averageCompetitorRating ? "ready" as const : competitors.length ? "degraded" as const : "empty" as const,
      icon: MessageSquareText,
    },
    {
      title: "Data confidence",
      value: dataConfidence(places, competitors, socialProfiles),
      detail: "Confidence reflects matched locations, mapped competitors, review snippets, and configured social competitor coverage.",
      state: competitors.length || socialProfiles.length ? "ready" as const : "degraded" as const,
      icon: ShieldCheck,
    },
  ];
  const actions = buildActions({
    competitors,
    socialProfiles,
    instagramProfiles,
    facebookProfiles,
    profilesWithMetrics,
    biggestGap,
    ownReviewTotal,
    searchAligned,
    gbpHealth,
    metaHealth,
  });

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Analytics / competitor intelligence"
        title={`${hospitalProfile.name} competitor analytics`}
        description="Live-only executive competitive intelligence across public listing pressure, social tracking readiness, content signals, reputation gaps, audience visibility, and share of voice. Empty states mean the source is not connected or no live metric exists."
        icon={BarChart3}
        state={pageState}
      >
        <StatusIndicator label={mapsHealth?.status === "Configured" ? "Places configured" : "Places unavailable"} tone={mapsHealth?.status === "Configured" ? "success" : "warning"} />
        <StatusIndicator label={metaHealth?.status === "Connected" ? "Meta connected" : "Meta metrics pending"} tone={metaHealth?.status === "Connected" ? "success" : "warning"} />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {pageState !== "ready" && (
          <AlertBanner
            title="Competitor analytics is source-limited"
            message="The dashboard is live-only, so it shows unavailable connector states instead of estimated Similarweb, SEMrush, or Sprout values."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        {competitorReport && <CompetitorReportPanel report={competitorReport} />}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {executiveCards.map((card) => (
            <ExecutiveCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <CompetitorOverview competitors={competitors} socialProfiles={socialProfiles} />
          <BenchmarkTable rows={benchmarkRows} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <SocialPresencePanel socialProfiles={socialProfiles} instagramProfiles={instagramProfiles} facebookProfiles={facebookProfiles} metaHealth={metaHealth} />
          <ContentComparisonPanel data={data} competitors={competitors} socialProfiles={socialProfiles} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ReputationPanel ownRating={ownRating} ownReviewTotal={ownReviewTotal} averageCompetitorRating={averageCompetitorRating} competitors={competitors} />
          <AudiencePanel data={data} socialProfiles={socialProfiles} bestSocialReach={bestSocialReach} bestSocialGrowth={bestSocialGrowth} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <ShareOfVoicePanel
            competitors={competitors}
            socialProfiles={socialProfiles}
            searchAligned={searchAligned}
            connectorGaps={connectorGaps}
          />
          <GapAdvantagePanel
            competitors={competitors}
            socialProfiles={socialProfiles}
            ownRating={ownRating}
            ownReviewTotal={ownReviewTotal}
            averageCompetitorRating={averageCompetitorRating}
            profilesWithMetrics={profilesWithMetrics}
          />
        </div>

        <IntelligenceActionQueue
          title="Strategic recommendations"
          description="Executive actions derived only from live competitor gaps, source coverage, and reputation/listing evidence."
          actions={actions}
        />

        <Panel className="p-5">
          <SectionHeader
            title="Local competitor pressure map"
            description="Supporting evidence: VIP centres are green, competitors are amber, and catchment rings show 2 km, 5 km, and 7 km pressure bands around each centre."
            action={<StatusIndicator label="Public Places evidence" tone="info" />}
          />
          <CompetitorMarketMap
            centres={places.map((place) => ({
              name: place.centre,
              lat: place.lat,
              lng: place.lng,
              rating: place.rating,
              reviews: place.reviews,
              status: place.status,
            }))}
            competitors={competitors.map(toMarketMapCompetitor)}
          />
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <EvidenceList
            title="Source availability"
            description="Third-party research patterns are represented as source-labeled setup states until VIP ingests those sources."
            items={connectorGaps.map((gap) => ({
              title: gap.label,
              detail: `${gap.source}: ${gap.detail}`,
              state: "empty" as const,
            }))}
          />
          <Panel className="p-5">
            <SectionHeader
              title="Source-backed guardrails"
              description="This screen uses competitor analysis patterns without inventing unavailable metrics."
              action={<Compass className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SourceLink title="Similarweb pattern" detail="Use market visibility, traffic share, and engagement benchmarking only after a live web intelligence source is connected." href="https://www.similarweb.com/corp/web/competitive-analysis/" />
              <SourceLink title="SEMrush pattern" detail="Use competitor traffic gaps, keyword visibility, and audience benchmarking only after search/traffic ingestion exists." href="https://www.semrush.com/kb/954-compare-your-competitors-performance" />
              <SourceLink title="Sprout Social pattern" detail="Use Instagram and Facebook competitor reporting only from stored competitor profiles and metrics." href="https://support.sproutsocial.com/hc/en-us/articles/6476004176653-What-s-included-in-the-Competitor-Performance-Report" />
              <SourceLink title="HubSpot pattern" detail="Use structured strengths, weaknesses, gaps, and recommendations from measured evidence, not unsupported assumptions." href="https://www.hubspot.com/resources/templates/competitive-analysis" />
            </div>
          </Panel>
        </div>

        <InsightPanel title="Executive read" description="How leadership should interpret this page." state={pageState}>
          VIP can act now on live public reputation and listing gaps, while social, web, and search share metrics should stay in setup state until the relevant competitor sources produce stored metrics. This keeps the dashboard useful without mixing real evidence with estimates.
        </InsightPanel>
      </section>
    </main>
  );
}

function ExecutiveCard({
  title,
  value,
  detail,
  state,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  state: SurfaceState;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label={state === "ready" ? "Lead" : state === "degraded" ? "Gap" : "Pending"} tone={state === "ready" ? "success" : state === "degraded" ? "warning" : "neutral"} />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </Panel>
  );
}

function CompetitorReportPanel({ report }: { report: CompetitorAnalysisReport }) {
  const topRows = report.competitorRankingTable.slice(0, 5);
  const sourceItems = Object.entries(report.sourceAvailability);
  const alerts = report.competitorMovementAlerts.slice(0, 3);
  const opportunities = [
    ...report.competitiveOpportunities.quickWins.slice(0, 2),
    ...report.competitiveOpportunities.mediumTerm.slice(0, 1),
    ...report.competitiveOpportunities.strategic.slice(0, 1),
  ];

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Comprehensive competitor intelligence report"
        description="Generated report engine output across market visibility, social, reputation, content, SEO, gaps, opportunities, movement alerts, and strategic recommendations."
        action={<StatusIndicator label={`${report.competitivePositionScore.score}/100 position`} tone={reportStateTone(report.competitivePositionScore.state)} />}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Competitive Position Score</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">{report.competitivePositionScore.score}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{report.competitivePositionScore.insight.whyTheyAreWinning}</p>
          <p className="mt-3 text-sm font-medium">{report.competitivePositionScore.insight.recommendedAction}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {sourceItems.map(([source, state]) => (
            <div key={source} className="rounded-lg border bg-background p-3">
              <p className="text-sm font-semibold">{source}</p>
              <StatusIndicator label={state} tone={reportStateTone(state)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b bg-muted/30">
                <th className="p-3 font-medium">Rank</th>
                <th className="p-3 font-medium">Competitor</th>
                <th className="p-3 font-medium">Visibility</th>
                <th className="p-3 font-medium">Social</th>
                <th className="p-3 font-medium">Reputation</th>
                <th className="p-3 font-medium">Local</th>
                <th className="p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {topRows.length ? topRows.map((row) => (
                <tr key={row.competitorId} className="border-b last:border-b-0">
                  <td className="p-3 font-semibold">#{row.rank}</td>
                  <td className="p-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.insight.winner} winning: {row.insight.whyTheyAreWinning}</p>
                  </td>
                  <td className="p-3">{scoreLabel(row.marketVisibility)}</td>
                  <td className="p-3">{scoreLabel(row.socialPresence)}</td>
                  <td className="p-3">{scoreLabel(row.reputation)}</td>
                  <td className="p-3">{scoreLabel(row.localSearchPresence)}</td>
                  <td className="p-3 font-semibold">{row.totalScore}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-4 text-sm text-muted-foreground">No competitor ranking rows are available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <InsightCard title="Current market position" insight={report.executiveSummary.currentMarketPosition} />
          {report.executiveSummary.competitiveThreats.slice(0, 2).map((insight, index) => (
            <InsightCard key={`threat-${index}`} title="Competitive threat" insight={insight} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ReportList title="Competitive opportunities" items={opportunities.map((item) => item.insight)} />
        <ReportList title="Movement alerts" items={alerts.map((item) => item.insight)} />
        <ReportList title="Strategic recommendations" items={report.strategicRecommendations.slice(0, 4)} />
      </div>
    </Panel>
  );
}

function InsightCard({ title, insight }: { title: string; insight: CompetitorReportInsight }) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <StatusIndicator label={`${Math.round(insight.confidence * 100)}% confidence`} tone={insight.confidence >= 0.65 ? "success" : "warning"} />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">{insight.winner}</span>: {insight.whyTheyAreWinning}
      </p>
      <p className="mt-2 text-sm font-medium">{insight.recommendedAction}</p>
      <p className="mt-2 text-xs text-muted-foreground">Sources: {insight.sourceLabels.join(", ")}</p>
    </article>
  );
}

function ReportList({ title, items }: { title: string; items: CompetitorReportInsight[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-3">
        {items.map((insight, index) => (
          <div key={`${title}-${index}`} className="border-t pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{insight.winner}</span> wins because {insight.whyTheyAreWinning}
            </p>
            <p className="mt-1 text-xs font-medium">{insight.recommendedAction}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreLabel(value: number | null) {
  return value === null ? "N/A" : `${Math.round(value)}`;
}

function reportStateTone(state: "ready" | "degraded" | "empty") {
  if (state === "ready") return "success";
  if (state === "degraded") return "warning";
  return "neutral";
}

function CompetitorOverview({ competitors, socialProfiles }: { competitors: ScoredCompetitor[]; socialProfiles: SocialCompetitor[] }) {
  const rows = [
    ...competitors.slice(0, 6).map((competitor) => ({
      key: competitor.placeId,
      name: competitor.name,
      type: "Public Places",
      position: `${Math.round(competitor.marketStrength)}/100 market pressure`,
      detail: `${competitor.nearestCentre} / ${integer(competitor.reviews)} reviews / ${competitor.rating.toFixed(1)} rating`,
      state: competitor.marketStrength > 70 ? "degraded" as const : "ready" as const,
    })),
    ...socialProfiles.slice(0, 6).map((competitor) => ({
      key: competitor.id,
      name: competitor.displayName ?? `@${competitor.handle}`,
      type: competitor.platform,
      position: competitor.tier,
      detail: hasMetricData(competitor.metrics) ? "Stored social metrics available" : "Metrics not captured yet",
      state: hasMetricData(competitor.metrics) ? "ready" as const : "degraded" as const,
    })),
  ];

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Competitor overview"
        description="Competitor list and market position from live public listing and configured social account evidence."
        action={<StatusIndicator label={`${rows.length} visible`} tone={rows.length ? "success" : "neutral"} />}
      />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.key} className="rounded-lg border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{row.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.type}</p>
                </div>
                <StatusIndicator label={row.position} tone={row.state === "ready" ? "success" : "warning"} />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No live competitor records are available yet. Add social competitor accounts or configure Google Places evidence." />
      )}
    </Panel>
  );
}

function BenchmarkTable({ rows }: { rows: BenchmarkRow[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Benchmarking"
        description="Every metric is compared against best competitor, market average, and top performer when live source data exists."
        action={<StatusIndicator label="Live-only" tone="info" />}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3 font-medium">Metric</th>
              <th className="px-3 py-2 font-medium">Hospital</th>
              <th className="px-3 py-2 font-medium">Best competitor</th>
              <th className="px-3 py-2 font-medium">Market average</th>
              <th className="px-3 py-2 font-medium">Top performer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-b last:border-0">
                <td className="py-3 pr-3 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{row.metric}</span>
                    <StatusIndicator label={row.source} tone={row.state === "ready" ? "success" : "neutral"} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{row.insight}</p>
                </td>
                <td className="px-3 py-3 align-top">{row.hospital}</td>
                <td className="px-3 py-3 align-top">{row.bestCompetitor}</td>
                <td className="px-3 py-3 align-top">{row.marketAverage}</td>
                <td className="px-3 py-3 align-top">{row.topPerformer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SocialPresencePanel({
  socialProfiles,
  instagramProfiles,
  facebookProfiles,
  metaHealth,
}: {
  socialProfiles: SocialCompetitor[];
  instagramProfiles: SocialCompetitor[];
  facebookProfiles: SocialCompetitor[];
  metaHealth?: IntegrationHealth;
}) {
  const rows = [
    { channel: "Instagram", profiles: instagramProfiles, source: "Sprout-style competitor reporting", icon: Share2 },
    { channel: "Facebook", profiles: facebookProfiles, source: "Sprout-style competitor reporting", icon: Users },
    { channel: "Reviews", profiles: [] as SocialCompetitor[], source: "Google Places public evidence", icon: Star },
  ];

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Social presence comparison"
        description="Instagram, Facebook, and review coverage. Social metrics appear only from stored competitor account metrics."
        action={<StatusIndicator label={metaHealth?.status ?? "Unavailable"} tone={metaHealth?.status === "Connected" ? "success" : "warning"} />}
      />
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.channel} className="rounded-lg border bg-background p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
                  <row.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">{row.channel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.source}</p>
                </div>
              </div>
              <StatusIndicator
                label={row.channel === "Reviews" ? "Public Places" : `${row.profiles.length} tracked`}
                tone={row.channel === "Reviews" || row.profiles.length ? "success" : "neutral"}
              />
            </div>
            {row.channel !== "Reviews" && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {row.profiles.length
                  ? `${row.profiles.filter((profile) => hasMetricData(profile.metrics)).length}/${row.profiles.length} profiles have stored metrics; missing profiles remain setup-labeled.`
                  : "Not connected: no competitor profiles are configured for this channel."}
              </p>
            )}
            {row.channel === "Reviews" && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Review ratings, volume, and snippets are populated from live public Places evidence where available.</p>
            )}
          </div>
        ))}
      </div>
      {!socialProfiles.length && <p className="mt-3 text-xs leading-5 text-muted-foreground">Add competitor accounts through the social competitor API to unlock configured Instagram/Facebook comparisons.</p>}
    </Panel>
  );
}

function ContentComparisonPanel({ data, competitors, socialProfiles }: { data: LiveData; competitors: ScoredCompetitor[]; socialProfiles: SocialCompetitor[] }) {
  const ownPostsPerWeek = postsPerWeek(data.analytics.totalPosts, data.period);
  const topThemes = data.intelligence?.marketContext?.recommendedThemes?.slice(0, 3) ?? [];
  const measuredPatterns = data.intelligence?.competitors.patterns.slice(0, 3) ?? [];

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Content comparison"
        description="Posting frequency, engagement rate, and top content themes from measured owned analytics and stored competitor patterns."
        action={<StatusIndicator label={`${data.analytics.totalPosts} owned posts`} tone="success" />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Posting frequency" value={ownPostsPerWeek ?? "Measured"} detail={ownPostsPerWeek ? "Owned posts per week from measured period" : "Period length unavailable"} />
        <MiniMetric label="Engagement rate" value={percent(data.analytics.avgEngagementRate)} detail="Owned average from stored social analytics" />
        <MiniMetric label="Competitor patterns" value={integer(measuredPatterns.length)} detail={competitors.length || socialProfiles.length ? "Observed pattern records" : "No competitor pattern evidence"} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <EvidenceList
          title="Top content themes"
          description="Owned market/context themes available for executive content planning."
          items={(topThemes.length ? topThemes : ["Not connected: no market-context themes stored"]).map((theme, index) => ({
            title: `Theme ${index + 1}`,
            detail: theme,
            state: topThemes.length ? "ready" as const : "empty" as const,
          }))}
        />
        <EvidenceList
          title="Competitor content patterns"
          description="Pattern prevalence from stored competitor intelligence, not inferred social crawling."
          items={(measuredPatterns.length ? measuredPatterns : [{ label: "Not connected", patternType: "Setup", examplesCount: 0, prevalence: 0 }]).map((pattern) => ({
            title: pattern.label,
            detail: measuredPatterns.length ? `${friendly(pattern.patternType)} pattern observed in ${pattern.examplesCount} records with ${Math.round(pattern.prevalence * 100)}% prevalence.` : "No stored competitor content-pattern metrics exist yet.",
            state: measuredPatterns.length ? "ready" as const : "empty" as const,
          }))}
        />
      </div>
    </Panel>
  );
}

function ReputationPanel({
  ownRating,
  ownReviewTotal,
  averageCompetitorRating,
  competitors,
}: {
  ownRating: number | null;
  ownReviewTotal: number;
  averageCompetitorRating: number | null;
  competitors: ScoredCompetitor[];
}) {
  const topReviews = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const snippetCount = competitors.reduce((total, competitor) => total + competitor.reviewSnippets.length, 0);
  const sentiment = sentimentLabel(competitors);

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Reputation comparison"
        description="Ratings, review volume, and sentiment proxy from public Places evidence."
        action={<StatusIndicator label={competitors.length ? "Public reviews" : "No benchmark"} tone={competitors.length ? "success" : "neutral"} />}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniMetric label="Hospital rating" value={ownRating ? ownRating.toFixed(1) : "N/A"} detail={`${integer(ownReviewTotal)} visible public reviews`} />
        <MiniMetric label="Competitor average" value={averageCompetitorRating ? averageCompetitorRating.toFixed(1) : "N/A"} detail={`${competitors.length} competitor listings in this pull`} />
        <MiniMetric label="Review volume leader" value={topReviews ? topReviews.name : "N/A"} detail={topReviews ? `${integer(topReviews.reviews)} reviews` : "No live benchmark"} />
        <MiniMetric label="Sentiment" value={sentiment.value} detail={sentiment.detail} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Sentiment is a conservative proxy from public star ratings and returned snippets only; full review history requires authenticated reputation ingestion.</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{integer(snippetCount)} competitor snippets returned in this live Places pull.</p>
    </Panel>
  );
}

function AudiencePanel({
  data,
  socialProfiles,
  bestSocialReach,
  bestSocialGrowth,
}: {
  data: LiveData;
  socialProfiles: SocialCompetitor[];
  bestSocialReach: number | null;
  bestSocialGrowth: number | null;
}) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Audience comparison"
        description="Reach, engagement, and growth rate from owned analytics and stored competitor metrics where available."
        action={<StatusIndicator label="Live-only" tone="info" />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Owned reach" value={integer(data.analytics.totalReach)} detail="Measured owned social reach" />
        <MiniMetric label="Owned engagement" value={percent(data.analytics.avgEngagementRate)} detail="Measured owned average engagement" />
        <MiniMetric label="Owned growth" value="Not connected" detail="Follower/audience growth source is not stored in current analytics." />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MiniMetric label="Best competitor reach" value={bestSocialReach !== null ? integer(bestSocialReach) : "Not connected"} detail={bestSocialReach !== null ? "From stored competitor metrics" : "No competitor reach metric stored"} />
        <MiniMetric label="Best competitor growth" value={bestSocialGrowth !== null ? percent(bestSocialGrowth) : "Not connected"} detail={bestSocialGrowth !== null ? "From stored competitor metrics" : "No competitor growth metric stored"} />
      </div>
      {!socialProfiles.length && <p className="mt-3 text-xs leading-5 text-muted-foreground">Audience comparisons need configured competitor profiles with stored metrics.</p>}
    </Panel>
  );
}

function ShareOfVoicePanel({
  competitors,
  socialProfiles,
  searchAligned,
  connectorGaps,
}: {
  competitors: ScoredCompetitor[];
  socialProfiles: SocialCompetitor[];
  searchAligned: number;
  connectorGaps: ConnectorGap[];
}) {
  const mappedShare = competitors.length ? Math.round((competitors.filter((competitor) => competitor.lat !== undefined && competitor.lng !== undefined).length / competitors.length) * 100) : 0;
  const relevanceShare = competitors.length ? Math.round((searchAligned / competitors.length) * 100) : 0;
  const socialMetricShare = socialProfiles.length ? Math.round((socialProfiles.filter((profile) => hasMetricData(profile.metrics)).length / socialProfiles.length) * 100) : 0;

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Share of voice"
        description="Market visibility and social visibility from available live evidence only."
        action={<StatusIndicator label="No estimated traffic" tone="info" />}
      />
      <ComparisonBars
        title="Visibility coverage"
        description="Coverage percentages reflect available live source coverage, not market-share estimates."
        items={[
          { label: "Market visibility evidence", value: mappedShare, detail: `${mappedShare}% of Places competitors have coordinates for catchment visibility.`, state: competitors.length ? "ready" : "empty" },
          { label: "Search relevance evidence", value: relevanceShare, detail: `${searchAligned}/${competitors.length} competitors show visible ENT/search relevance signals.`, state: competitors.length ? "ready" : "empty" },
          { label: "Social visibility evidence", value: socialMetricShare, detail: `${socialProfiles.filter((profile) => hasMetricData(profile.metrics)).length}/${socialProfiles.length} social competitor profiles have stored metrics.`, state: socialMetricShare ? "ready" : "empty" },
        ]}
      />
      <div className="mt-3 space-y-2">
        {connectorGaps.map((gap) => (
          <p key={gap.label} className="rounded-lg border border-dashed bg-background p-3 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">{gap.label}:</span> {gap.source} not connected, so no estimated share is shown.
          </p>
        ))}
      </div>
    </Panel>
  );
}

function GapAdvantagePanel({
  competitors,
  socialProfiles,
  ownRating,
  ownReviewTotal,
  averageCompetitorRating,
  profilesWithMetrics,
}: {
  competitors: ScoredCompetitor[];
  socialProfiles: SocialCompetitor[];
  ownRating: number | null;
  ownReviewTotal: number;
  averageCompetitorRating: number | null;
  profilesWithMetrics: SocialCompetitor[];
}) {
  const noWebsite = competitors.filter((competitor) => !competitor.website).length;
  const weakRating = competitors.filter((competitor) => competitor.rating > 0 && competitor.rating < 4.2).length;
  const noHours = competitors.filter((competitor) => !competitor.weekdayText?.length).length;
  const weakRelevance = competitors.filter((competitor) => competitor.relevanceSignals.length === 0).length;
  const reviewLeader = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const gapItems = [
    {
      title: "Review volume",
      detail: reviewLeader && reviewLeader.reviews > ownReviewTotal
        ? `${reviewLeader.name} leads visible reviews by ${integer(reviewLeader.reviews - ownReviewTotal)}.`
        : "No live competitor review-volume deficit is currently visible.",
      state: reviewLeader && reviewLeader.reviews > ownReviewTotal ? "degraded" as const : "ready" as const,
    },
    {
      title: "Social competitor metrics",
      detail: profilesWithMetrics.length < socialProfiles.length
        ? `${socialProfiles.length - profilesWithMetrics.length} configured social competitors do not have stored metrics yet.`
        : "Configured social competitors have stored metrics where available.",
      state: profilesWithMetrics.length < socialProfiles.length ? "degraded" as const : "ready" as const,
    },
    {
      title: "Search relevance",
      detail: `${weakRelevance} public competitors lack visible ENT/sinus/hearing relevance signals.`,
      state: weakRelevance ? "ready" as const : "empty" as const,
    },
  ];
  const advantageItems = [
    {
      title: "Competitor listing weaknesses",
      detail: `${noWebsite} competitors lack visible websites and ${noHours} lack visible hours in this pull.`,
      state: noWebsite || noHours ? "ready" as const : "empty" as const,
    },
    {
      title: "Rating opportunity",
      detail: weakRating ? `${weakRating} competitors rate below 4.2, creating a trust-positioning opportunity.` : "No weak competitor rating pocket was visible in this pull.",
      state: weakRating ? "ready" as const : "empty" as const,
    },
    {
      title: "Rating position",
      detail: ownRating && averageCompetitorRating && ownRating >= averageCompetitorRating
        ? `VIP leads the competitor rating average by ${(ownRating - averageCompetitorRating).toFixed(1)} points.`
        : "VIP does not currently show a rating advantage against the live competitor average.",
      state: ownRating && averageCompetitorRating && ownRating >= averageCompetitorRating ? "ready" as const : "degraded" as const,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <EvidenceList title="Competitive gaps" description="Areas where the hospital is behind or source coverage is incomplete." items={gapItems} />
      <EvidenceList title="Competitive advantages" description="Areas where VIP can lead using live market evidence." items={advantageItems} />
    </div>
  );
}

function MiniMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">{message}</p>;
}

function SourceLink({ title, detail, href }: { title: string; detail: string; href: string }) {
  return (
    <a className="rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30" href={href} target="_blank" rel="noreferrer">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <ExternalLink className="size-4 shrink-0 text-primary" aria-hidden />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </a>
  );
}

export function scoreCompetitor(competitor: Omit<ScoredCompetitor, "marketStrength" | "opportunity" | "suggestedAction" | "relevanceSignals" | "nearestCentre">, nearestCentre: string): ScoredCompetitor {
  const ratingScore = Math.min(30, Math.max(0, (competitor.rating / 5) * 30));
  const reviewScore = Math.min(25, Math.log10(competitor.reviews + 1) * 7.2);
  const distanceScore = competitor.distanceKm === undefined
    ? 5
    : competitor.distanceKm <= 2
      ? 20
      : competitor.distanceKm <= 5
        ? 15
        : competitor.distanceKm <= 7
          ? 10
          : 5;
  const completenessScore =
    (competitor.website ? 5 : 0) +
    (competitor.phone ? 4 : 0) +
    (competitor.weekdayText?.length ? 4 : 0) +
    (competitor.photoCount ? Math.min(5, competitor.photoCount) : 0) +
    (competitor.reviewSnippets.length ? 4 : 0) +
    (competitor.openNow !== undefined ? 3 : 0);
  const relevanceSignals = relevanceSignalsFor(competitor);
  const relevanceScore = Math.min(9, relevanceSignals.length * 3);
  const marketStrength = Math.min(100, ratingScore + reviewScore + distanceScore + completenessScore + relevanceScore);

  return {
    ...competitor,
    marketStrength,
    opportunity: opportunityFor(competitor, relevanceSignals),
    suggestedAction: suggestedActionFor(competitor, nearestCentre),
    relevanceSignals,
    nearestCentre,
  };
}

export function uniqueCompetitors(groups: ScoredCompetitorGroup[]) {
  const competitors = new Map<string, ScoredCompetitor>();

  for (const group of groups) {
    for (const competitor of group.competitors) {
      const existing = competitors.get(competitor.placeId);
      if (!existing || competitor.marketStrength > existing.marketStrength) {
        competitors.set(competitor.placeId, competitor);
      }
    }
  }

  return Array.from(competitors.values()).sort((a, b) => b.marketStrength - a.marketStrength);
}

function toMarketMapCompetitor(competitor: ScoredCompetitor): MarketMapCompetitor {
  return {
    placeId: competitor.placeId,
    name: competitor.name,
    address: competitor.address,
    lat: competitor.lat,
    lng: competitor.lng,
    rating: competitor.rating,
    reviews: competitor.reviews,
    distanceKm: competitor.distanceKm,
    marketStrength: competitor.marketStrength,
    opportunity: competitor.opportunity,
    suggestedAction: competitor.suggestedAction,
    phone: competitor.phone,
    website: competitor.website,
    mapsUrl: competitor.mapsUrl,
    openNow: competitor.openNow,
    weekdayText: competitor.weekdayText,
    reviewSnippets: competitor.reviewSnippets,
  };
}

function buildBenchmarkRows({
  data,
  competitors,
  ownRating,
  ownReviewTotal,
  averageCompetitorRating,
  averageCompetitorReviews,
  topThreat,
  bestSocialEngagement,
  bestSocialReach,
  bestSocialGrowth,
  socialProfiles,
}: {
  data: LiveData;
  competitors: ScoredCompetitor[];
  ownRating: number | null;
  ownReviewTotal: number;
  averageCompetitorRating: number | null;
  averageCompetitorReviews: number | null;
  topThreat?: ScoredCompetitor;
  bestSocialEngagement: number | null;
  bestSocialReach: number | null;
  bestSocialGrowth: number | null;
  socialProfiles: SocialCompetitor[];
}): BenchmarkRow[] {
  const topReviews = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const topRating = competitors.slice().sort((a, b) => b.rating - a.rating)[0];

  return [
    {
      metric: "Market visibility",
      source: "Google Places",
      hospital: "Owned centres",
      bestCompetitor: topThreat ? `${topThreat.name} (${Math.round(topThreat.marketStrength)}/100)` : "Not connected",
      marketAverage: competitors.length ? `${Math.round(average(competitors.map((competitor) => competitor.marketStrength)) ?? 0)}/100` : "Not connected",
      topPerformer: topThreat ? topThreat.name : "Not connected",
      insight: "Market visibility uses public listing pressure, not estimated web traffic share.",
      state: competitors.length ? "ready" : "empty",
    },
    {
      metric: "Rating",
      source: "Google Places",
      hospital: ownRating ? ownRating.toFixed(1) : "Not connected",
      bestCompetitor: topRating ? `${topRating.name} (${topRating.rating.toFixed(1)})` : "Not connected",
      marketAverage: averageCompetitorRating ? averageCompetitorRating.toFixed(1) : "Not connected",
      topPerformer: topRating ? topRating.name : "Not connected",
      insight: "Ratings are public Places values from the live pull.",
      state: ownRating && competitors.length ? "ready" : "empty",
    },
    {
      metric: "Review volume",
      source: "Google Places",
      hospital: integer(ownReviewTotal),
      bestCompetitor: topReviews ? `${topReviews.name} (${integer(topReviews.reviews)})` : "Not connected",
      marketAverage: averageCompetitorReviews !== null ? integer(Math.round(averageCompetitorReviews)) : "Not connected",
      topPerformer: topReviews ? topReviews.name : "Not connected",
      insight: "Review volume is a public prominence signal, not a care-quality ranking.",
      state: competitors.length ? "ready" : "empty",
    },
    {
      metric: "Engagement rate",
      source: "Owned social / competitor metrics",
      hospital: percent(data.analytics.avgEngagementRate),
      bestCompetitor: bestSocialEngagement !== null ? percent(bestSocialEngagement) : "Not connected",
      marketAverage: socialProfiles.some((profile) => metricNumber(profile.metrics, ["engagementRate", "avgEngagementRate", "engagement_rate"]) !== null)
        ? percent(average(socialProfiles.map((profile) => metricNumber(profile.metrics, ["engagementRate", "avgEngagementRate", "engagement_rate"])).filter((value): value is number => value !== null)) ?? 0)
        : "Not connected",
      topPerformer: bestSocialEngagement !== null ? topSocialPerformer(socialProfiles, ["engagementRate", "avgEngagementRate", "engagement_rate"]) : "Not connected",
      insight: "Competitor engagement appears only when stored social competitor metrics exist.",
      state: bestSocialEngagement !== null ? "ready" : "empty",
    },
    {
      metric: "Reach",
      source: "Owned social / competitor metrics",
      hospital: integer(data.analytics.totalReach),
      bestCompetitor: bestSocialReach !== null ? integer(bestSocialReach) : "Not connected",
      marketAverage: socialProfiles.some((profile) => metricNumber(profile.metrics, ["reach", "totalReach", "audienceReach"]) !== null)
        ? integer(Math.round(average(socialProfiles.map((profile) => metricNumber(profile.metrics, ["reach", "totalReach", "audienceReach"])).filter((value): value is number => value !== null)) ?? 0))
        : "Not connected",
      topPerformer: bestSocialReach !== null ? topSocialPerformer(socialProfiles, ["reach", "totalReach", "audienceReach"]) : "Not connected",
      insight: "Competitor reach remains unavailable without stored competitor account metrics.",
      state: bestSocialReach !== null ? "ready" : "empty",
    },
    {
      metric: "Growth rate",
      source: "Competitor metrics",
      hospital: "Not connected",
      bestCompetitor: bestSocialGrowth !== null ? percent(bestSocialGrowth) : "Not connected",
      marketAverage: "Not connected",
      topPerformer: bestSocialGrowth !== null ? topSocialPerformer(socialProfiles, ["growthRate", "growth_rate", "followerGrowthRate"]) : "Not connected",
      insight: "Audience growth rate is not stored for owned or competitor profiles in the current analytics shape.",
      state: bestSocialGrowth !== null ? "ready" : "empty",
    },
  ];
}

function buildActions({
  competitors,
  socialProfiles,
  instagramProfiles,
  facebookProfiles,
  profilesWithMetrics,
  biggestGap,
  ownReviewTotal,
  searchAligned,
  gbpHealth,
  metaHealth,
}: {
  competitors: ScoredCompetitor[];
  socialProfiles: SocialCompetitor[];
  instagramProfiles: SocialCompetitor[];
  facebookProfiles: SocialCompetitor[];
  profilesWithMetrics: SocialCompetitor[];
  biggestGap?: ScoredCompetitor;
  ownReviewTotal: number;
  searchAligned: number;
  gbpHealth?: IntegrationHealth;
  metaHealth?: IntegrationHealth;
}): IntelligenceAction[] {
  return [
    {
      title: "Close the visible review gap",
      detail: biggestGap && biggestGap.reviews > ownReviewTotal
        ? `Create a governed review-request workflow until VIP reduces the ${integer(biggestGap.reviews - ownReviewTotal)} review visibility gap against ${biggestGap.name}.`
        : "Keep review generation active and monitor competitor review movement weekly.",
      owner: "Reputation",
      due: "This week",
      state: biggestGap && biggestGap.reviews > ownReviewTotal ? "degraded" : competitors.length ? "ready" : "empty",
    },
    {
      title: "Complete social competitor tracking",
      detail: socialProfiles.length
        ? `${profilesWithMetrics.length}/${socialProfiles.length} tracked competitor accounts have stored metrics. Add missing metrics before reading social share of voice.`
        : "Add local and specialty Instagram/Facebook competitor accounts before producing social competitor comparisons.",
      owner: "Growth",
      due: "Next 7 days",
      state: profilesWithMetrics.length === socialProfiles.length && socialProfiles.length ? "ready" : "degraded",
    },
    {
      title: "Add missing Instagram and Facebook rivals",
      detail: `${instagramProfiles.length} Instagram and ${facebookProfiles.length} Facebook competitor profiles are configured. Track at least the highest public listing threats on both channels where they have active profiles.`,
      owner: "Social",
      due: "Next 7 days",
      state: instagramProfiles.length && facebookProfiles.length ? "ready" : "degraded",
    },
    {
      title: "Strengthen ENT search relevance",
      detail: `${searchAligned}/${competitors.length} public competitors show visible ENT, sinus, hearing, or related signals. Use accurate GBP services, website FAQs, and doctor-led education to improve relevance.`,
      owner: "SEO",
      due: "This month",
      state: competitors.length && searchAligned < competitors.length ? "degraded" : competitors.length ? "ready" : "empty",
    },
    {
      title: "Stabilize connector coverage",
      detail: `GBP is ${gbpHealth?.status ?? "Unavailable"} and Meta is ${metaHealth?.status ?? "Unavailable"}. Keep unavailable sources labeled until live ingestion is added.`,
      owner: "Admin",
      due: "Before launch",
      state: gbpHealth?.status === "Connected" && metaHealth?.status === "Connected" ? "ready" : "degraded",
    },
  ];
}

function buildConnectorGaps(): ConnectorGap[] {
  return [
    {
      label: "Web traffic share",
      source: "Similarweb-style source",
      detail: "No live web traffic or traffic-share ingestion is implemented, so estimated market share is not displayed.",
    },
    {
      label: "Search traffic gaps",
      source: "SEMrush-style source",
      detail: "No live SEO competitor traffic, keyword gap, or domain visibility ingestion is implemented.",
    },
    {
      label: "Full social competitor report",
      source: "Sprout-style source",
      detail: "Configured social competitors are available, but channel metrics display only when stored on each competitor account.",
    },
  ];
}

function relevanceSignalsFor(competitor: { name: string; address: string; types: string[] }) {
  const text = `${competitor.name} ${competitor.address} ${competitor.types.join(" ")}`.toLowerCase();
  const signals = [
    ["ENT", ["ent", "ear", "nose", "throat"]],
    ["Sinus", ["sinus"]],
    ["Hearing", ["hearing", "audiology", "audiologist"]],
    ["Allergy", ["allergy", "allergic"]],
    ["Pediatric ENT", ["pediatric", "paediatric", "children"]],
  ] as const;

  return signals
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([label]) => label);
}

function opportunityFor(competitor: { website?: string; weekdayText?: string[]; reviewSnippets: unknown[]; rating: number }, relevanceSignals: string[]) {
  if (!competitor.website) return "Competitor has no visible website link; strengthen VIP service pages and GBP website actions.";
  if (!competitor.weekdayText?.length) return "Competitor hours are weak or unavailable; keep VIP hours and holiday updates verified.";
  if (!competitor.reviewSnippets.length) return "Competitor has limited snippet evidence; build richer patient-review themes through governed review collection.";
  if (competitor.rating < 4.2) return "Competitor rating is vulnerable; compete on service clarity, review response quality, and patient access.";
  if (relevanceSignals.length === 0) return "Competitor is visible without strong ENT wording; improve VIP relevance through accurate services, FAQs, and content.";

  return "Competitor has a strong public listing; counter with centre-specific reviews, photos, FAQs, and doctor-led ENT education.";
}

function suggestedActionFor(competitor: { distanceKm?: number; reviews: number }, nearestCentre: string) {
  if (competitor.distanceKm !== undefined && competitor.distanceKm <= 2) {
    return `High proximity pressure near ${nearestCentre}: prioritize GBP photos, review requests, and local service posts for this centre.`;
  }

  if (competitor.reviews > 500) {
    return `Prominence pressure near ${nearestCentre}: close the review-count gap with governed post-visit review workflows and faster response coverage.`;
  }

  return `Monitor ${nearestCentre} catchment weekly and use specialist education to win relevance rather than copying competitor volume.`;
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

function average(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? finite.reduce((total, value) => total + value, 0) / finite.length : null;
}

function dataConfidence(places: LivePlaceLocation[], competitors: ScoredCompetitor[], socialProfiles: SocialCompetitor[]) {
  const matchedCentreShare = places.length ? places.filter((place) => place.status === "Matched").length / places.length : 0;
  const mappedCompetitorShare = competitors.length ? competitors.filter((competitor) => competitor.lat !== undefined && competitor.lng !== undefined).length / competitors.length : 0;
  const snippetShare = competitors.length ? competitors.filter((competitor) => competitor.reviewSnippets.length > 0).length / competitors.length : 0;
  const socialShare = socialProfiles.length ? socialProfiles.filter((profile) => hasMetricData(profile.metrics)).length / socialProfiles.length : 0;
  const score = Math.round((matchedCentreShare * 35) + (mappedCompetitorShare * 30) + (snippetShare * 20) + (socialShare * 15));

  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function sentimentLabel(competitors: ScoredCompetitor[]) {
  const snippetRatings = competitors.flatMap((competitor) => competitor.reviewSnippets.map((snippet) => snippet.rating).filter(Boolean));
  const rating = average(snippetRatings.length ? snippetRatings : competitors.map((competitor) => competitor.rating));
  if (rating === null) return { value: "Not connected", detail: "No public rating or snippet evidence is available." };
  if (rating >= 4.4) return { value: "Positive", detail: `Public competitor sentiment proxy averages ${rating.toFixed(1)} stars.` };
  if (rating >= 3.8) return { value: "Mixed", detail: `Public competitor sentiment proxy averages ${rating.toFixed(1)} stars.` };
  return { value: "Vulnerable", detail: `Public competitor sentiment proxy averages ${rating.toFixed(1)} stars.` };
}

function postsPerWeek(totalPosts: number, period?: string) {
  const match = period?.match(/(\d+)\s*day/i);
  const days = match ? Number(match[1]) : null;
  if (!days || days <= 0) return null;
  return `${(totalPosts / (days / 7)).toFixed(1)}`;
}

function bestSocialMetric(profiles: SocialCompetitor[], keys: string[]) {
  const values = profiles.map((profile) => metricNumber(profile.metrics, keys)).filter((value): value is number => value !== null);
  return values.length ? Math.max(...values) : null;
}

function topSocialPerformer(profiles: SocialCompetitor[], keys: string[]) {
  const ranked = profiles
    .map((profile) => ({ profile, value: metricNumber(profile.metrics, keys) }))
    .filter((item): item is { profile: SocialCompetitor; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value);
  const top = ranked[0]?.profile;
  return top ? top.displayName ?? `@${top.handle}` : "Not connected";
}

function metricNumber(metrics: unknown, keys: string[]) {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  const record = metrics as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace("%", ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function hasMetricData(metrics: unknown) {
  return Boolean(metrics && typeof metrics === "object" && !Array.isArray(metrics) && Object.keys(metrics).length);
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
