import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Compass,
  ExternalLink,
  Gauge,
  MapPinned,
  Radar,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  EvidenceList,
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceAction,
  type IntelligenceMetric,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { scoreCompetitor, uniqueCompetitors, type ScoredCompetitor } from "@/competitors/competitor-analytics-dashboard";
import { loadIntegrationHealth, loadPlaceLocations, type IntegrationHealth, type LivePlaceLocation } from "@/lib/acquisition/live-client-data";
import { findCompetitorsForLocations, type PlaceCompetitorLocationGroup } from "@/lib/acquisition/places";
import { getProductExperience, integer, percent, type ProductExperience } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import { analyzeCompetitors } from "@vip/social-engine";
import type { Tone } from "@/design-system/theme";

export const dynamic = "force-dynamic";

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

type OpportunityCategory =
  | "Content Gaps"
  | "SEO Gaps"
  | "Review Gaps"
  | "Social Presence Gaps"
  | "Service Line Opportunities"
  | "Quick Wins"
  | "Strategic Opportunities";

type SourceLens = "Google Places" | "Similarweb" | "SEMrush" | "Ahrefs" | "Sprout Social" | "VIP Analytics";

type OpportunityItem = {
  category: OpportunityCategory;
  priority: "Critical" | "High" | "Medium";
  title: string;
  competitorSignal: string;
  whyCompetitorWins: string;
  howHospitalClosesGap: string;
  expectedImpact: string;
  owner: string;
  timeframe: string;
  sourceLens: SourceLens;
  state: SurfaceState;
};

type ActionPlanItem = {
  dayRange: string;
  title: string;
  owner: string;
  whyCompetitorWins: string;
  howHospitalClosesGap: string;
  expectedImpact: string;
  state: SurfaceState;
};

type CompetitiveContext = {
  data: ProductExperience;
  places: LivePlaceLocation[];
  integrations: IntegrationHealth[];
  scoredGroups: Array<PlaceCompetitorLocationGroup & { competitors: ScoredCompetitor[] }>;
  competitors: ScoredCompetitor[];
  socialCompetitors: SocialCompetitorComparison;
};

const sourceLinks = [
  {
    publisher: "Similarweb",
    title: "Benchmarking",
    detail: "Traffic share, channel mix, audience quality, and category-level market position are source-labeled until connected.",
    href: "https://www.similarweb.com/corp/web/benchmarking//",
  },
  {
    publisher: "SEMrush",
    title: "Keyword Gap",
    detail: "Competitor keyword gaps guide SEO opportunities when search/domain data is connected.",
    href: "https://www.semrush.com/analytics/keywordgap/",
  },
  {
    publisher: "Ahrefs",
    title: "Content Gap",
    detail: "Content gap analysis identifies competitor ranking topics and missing content opportunities.",
    href: "https://ahrefs.com/content-gap",
  },
  {
    publisher: "Sprout Social",
    title: "Competitive Analysis",
    detail: "Social competitor reports compare content, engagement, hashtags, and profile performance when metrics exist.",
    href: "https://sproutsocial.com/competitive-analysis/",
  },
];

export default async function AdminCompetitorGapStrategyPage() {
  const [data, places, integrations] = await Promise.all([
    getProductExperience(),
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);
  const competitorGroups = await findCompetitorsForLocations(places, "Hyderabad", "ENT");
  const scoredGroups = scoreGroups(competitorGroups);
  const competitors = uniqueCompetitors(scoredGroups);
  const socialCompetitors = data.available && data.workspaceId
    ? await analyzeCompetitors(data.workspaceId)
    : emptySocialCompetitors(data.workspaceId ?? "unavailable");

  const context: CompetitiveContext = {
    data,
    places,
    integrations,
    scoredGroups,
    competitors,
    socialCompetitors,
  };

  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const ownReviewTotal = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const ownRating = weightedRating(matchedPlaces);
  const topThreat = competitors[0];
  const reviewLeader = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const socialProfiles = socialCompetitors.competitors;
  const socialProfilesWithMetrics = socialProfiles.filter((competitor) => hasMetricData(competitor.metrics));
  const marketPositionScore = calculateMarketPositionScore(context);
  const opportunities = buildOpportunities(context);
  const quickWins = opportunities.filter((item) => item.category === "Quick Wins");
  const strategicOpportunities = opportunities.filter((item) => item.category === "Strategic Opportunities");
  const actionPlan = buildActionPlan(context, opportunities);
  const expectedGains = buildExpectedGains(context);
  const metrics = buildMetrics({
    marketPositionScore,
    places,
    matchedPlaces,
    competitors,
    socialProfiles,
    socialProfilesWithMetrics,
    ownReviewTotal,
    topThreat,
    reviewLeader,
  });
  const pageState: SurfaceState = competitors.length || socialProfiles.length ? "ready" : integrations.some((item) => item.status === "Unavailable") ? "degraded" : "empty";
  const mapsHealth = integrations.find((integration) => integration.id === "maps");
  const gbpHealth = integrations.find((integration) => integration.id === "gbp");
  const metaHealth = integrations.find((integration) => integration.id === "meta");

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Competitor gap strategy"
        title={`${hospitalProfile.name} competitive opportunity engine`}
        description="A source-labeled strategy page that turns public competitor pressure, review gaps, SEO/content blind spots, social readiness, and service-line opportunities into hospital growth actions."
        icon={Radar}
        state={pageState}
      >
        <StatusIndicator label={mapsHealth?.status === "Configured" ? "Places live" : "Places setup"} tone={mapsHealth?.status === "Configured" ? "success" : "warning"} />
        <StatusIndicator label={gbpHealth?.status === "Connected" ? "GBP connected" : "GBP gap"} tone={gbpHealth?.status === "Connected" ? "success" : "warning"} />
        <StatusIndicator label={metaHealth?.status === "Connected" ? "Meta connected" : "Social setup"} tone={metaHealth?.status === "Connected" ? "success" : "warning"} />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {pageState !== "ready" && (
          <AlertBanner
            title="Competitive evidence is source-limited"
            message="The page uses live Google Places, GBP, Meta, and stored social evidence where available. Similarweb, SEMrush, Ahrefs, and Sprout Social frameworks are labeled as setup or research lenses until those sources are ingested."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <MarketPositionPanel
          score={marketPositionScore}
          topThreat={topThreat}
          ownRating={ownRating}
          ownReviewTotal={ownReviewTotal}
          socialProfiles={socialProfiles}
          socialProfilesWithMetrics={socialProfilesWithMetrics}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <CompetitorStrengthPanel competitors={competitors} socialProfiles={socialProfiles} />
          <CompetitorWeaknessPanel competitors={competitors} ownRating={ownRating} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <OpportunityPanel title="Content Gaps" description="Ahrefs-style content gap thinking: what competitors or patient demand imply VIP should publish next." icon={BookOpenCheck} items={categoryItems(opportunities, "Content Gaps")} />
          <OpportunityPanel title="SEO Gaps" description="SEMrush-style keyword and local visibility gaps without inventing search traffic estimates." icon={Search} items={categoryItems(opportunities, "SEO Gaps")} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <OpportunityPanel title="Review Gaps" description="Public review and rating gaps that can affect trust before patients call or request directions." icon={Star} items={categoryItems(opportunities, "Review Gaps")} />
          <OpportunityPanel title="Social Presence Gaps" description="Sprout-style competitor social analysis using configured accounts and stored metrics only." icon={Share2} items={categoryItems(opportunities, "Social Presence Gaps")} />
        </div>

        <OpportunityPanel
          title="Service Line Opportunities"
          description="Service areas where public competitor signals leave room for clearer doctor-led positioning."
          icon={MapPinned}
          items={categoryItems(opportunities, "Service Line Opportunities")}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <OpportunityPanel title="Quick Wins" description="Actions that can move visible trust, relevance, or setup quality in the next 30 days." icon={Sparkles} items={quickWins} />
          <OpportunityPanel title="Strategic Opportunities" description="Bigger bets that compound once the evidence layer is stronger." icon={TrendingUp} items={strategicOpportunities} />
        </div>

        <ActionPlanPanel items={actionPlan} />

        <ExpectedGainsPanel items={expectedGains} />

        <IntelligenceActionQueue
          title="Competitive action queue"
          description="Priority actions distilled from the same opportunity engine."
          actions={buildActionQueue(opportunities)}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <EvidenceList
            title="Unavailable source categories"
            description="These gaps stay labeled until a real connector or stored metric exists."
            items={[
              {
                title: "Similarweb traffic share",
                detail: "No live web traffic share, channel mix, visit quality, or category share ingestion exists yet.",
                state: "empty",
              },
              {
                title: "SEMrush keyword gap",
                detail: "No live competitor domain, keyword, map rank, or organic traffic gap ingestion exists yet.",
                state: "empty",
              },
              {
                title: "Ahrefs backlinks and top pages",
                detail: "No live competitor backlink, top-page, or content-gap ingestion exists yet.",
                state: "empty",
              },
              {
                title: "Sprout competitor metrics",
                detail: socialProfiles.length
                  ? `${socialProfilesWithMetrics.length}/${socialProfiles.length} configured social competitors have stored metrics.`
                  : "No competitor social profiles are configured yet.",
                state: socialProfilesWithMetrics.length ? "degraded" : "empty",
              },
            ]}
          />

          <SourceAnchorPanel />
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Healthcare-safe competitive rules"
            description="Use competitor intelligence to find gaps, not to copy unsafe claims or manufacture proof."
            action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Do not copy competitor claims, offers, captions, testimonials, or before-after framing.",
              "Do not imply clinical superiority from reviews, rankings, social engagement, or traffic estimates.",
              "Use review requests broadly and ethically; no incentives, selective asks, or rating pressure.",
              "Use patient proof only at theme level unless documented consent exists.",
              "Route medical questions to consultation or reception; avoid diagnosis or treatment advice in content.",
              "Label every non-ingested source as setup, research, or unavailable until the metric is real.",
            ].map((rule) => (
              <p key={rule} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                {rule}
              </p>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function MarketPositionPanel({
  score,
  topThreat,
  ownRating,
  ownReviewTotal,
  socialProfiles,
  socialProfilesWithMetrics,
}: {
  score: number;
  topThreat?: ScoredCompetitor;
  ownRating: number | null;
  ownReviewTotal: number;
  socialProfiles: SocialCompetitor[];
  socialProfilesWithMetrics: SocialCompetitor[];
}) {
  const state: SurfaceState = score >= 70 ? "ready" : score >= 40 ? "degraded" : "empty";
  const topReviewGap = topThreat ? Math.max(0, topThreat.reviews - ownReviewTotal) : 0;

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Market Position Score"
        description="Composite score from own review/rating baseline, competitor pressure, social readiness, and connector confidence."
        action={<StatusIndicator label={`${score}/100`} tone={stateTone(state)} />}
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Current position</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">{score}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {topThreat
              ? `${hospitalProfile.name} is positioned as a challenger to ${topThreat.name}.`
              : "Competitor evidence is not deep enough for a confident market read yet."}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PositionFact label="Own trust baseline" value={ownRating ? `${ownRating.toFixed(1)} rating` : "Not ready"} detail={`${integer(ownReviewTotal)} visible reviews across matched listings.`} />
          <PositionFact label="Top competitor pressure" value={topThreat ? `${Math.round(topThreat.marketStrength)}/100` : "No pull"} detail={topThreat ? `${topThreat.name}; ${integer(topThreat.reviews)} reviews.` : "Google Places competitors unavailable."} />
          <PositionFact label="Review deficit" value={topReviewGap ? integer(topReviewGap) : "No deficit"} detail={topThreat ? "Gap against the strongest public listing threat." : "Needs competitor data."} />
          <PositionFact label="Social readiness" value={`${socialProfilesWithMetrics.length}/${socialProfiles.length}`} detail="Configured competitor profiles with stored metrics." />
        </div>
      </div>
    </Panel>
  );
}

function PositionFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function CompetitorStrengthPanel({ competitors, socialProfiles }: { competitors: ScoredCompetitor[]; socialProfiles: SocialCompetitor[] }) {
  const top = competitors.slice(0, 5);
  const socialLabels = socialProfiles.slice(0, 3).map((profile) => `${platformLabel(profile.platform)} @${profile.handle}`).join(", ");

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Competitor Strength Analysis"
        description="Why competitors are currently hard to displace in public comparison moments."
        action={<Radar className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {top.length ? top.map((competitor) => (
          <div key={competitor.placeId} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{competitor.name}</p>
              <StatusIndicator label={`${Math.round(competitor.marketStrength)}/100 pressure`} tone={competitor.marketStrength >= 70 ? "warning" : "info"} />
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Strong because it combines {integer(competitor.reviews)} reviews, {competitor.rating.toFixed(1)} rating, {competitor.distanceKm !== undefined ? `${competitor.distanceKm.toFixed(1)} km proximity` : "market proximity"}, and {competitor.relevanceSignals.length ? competitor.relevanceSignals.join(", ") : "general hospital visibility"} signals.
            </p>
          </div>
        )) : (
          <EmptyBlock message="No Google Places competitor pull is available. Strength analysis will populate when Maps evidence is configured." />
        )}
        <div className="rounded-lg border bg-info/30 p-4">
          <p className="text-sm font-semibold">Social strength lens</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {socialProfiles.length
              ? `Tracked competitor accounts: ${socialLabels || `${socialProfiles.length} configured profiles`}. Sprout-style metrics remain limited to profiles with stored metrics.`
              : "No social competitor accounts are configured, so social strength cannot be compared yet."}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function CompetitorWeaknessPanel({ competitors, ownRating }: { competitors: ScoredCompetitor[]; ownRating: number | null }) {
  const noWebsite = competitors.filter((competitor) => !competitor.website);
  const weakHours = competitors.filter((competitor) => !competitor.weekdayText?.length);
  const weakRating = competitors.filter((competitor) => competitor.rating > 0 && competitor.rating < 4.2);
  const weakRelevance = competitors.filter((competitor) => competitor.relevanceSignals.length === 0);

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Competitor Weakness Analysis"
        description="Where the hospital can win without copying competitor positioning."
        action={<Target className="size-5 text-primary" aria-hidden />}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <WeaknessCard title="Website/action gaps" count={noWebsite.length} detail="Competitors without visible website links create a conversion-path opening for service pages, appointment CTAs, and WhatsApp routing." />
        <WeaknessCard title="Hours/profile gaps" count={weakHours.length} detail="Weak visible hours create room for verified centre access, holiday updates, and profile completeness." />
        <WeaknessCard title="Rating vulnerability" count={weakRating.length} detail={ownRating ? `Competitors below 4.2 can be countered with review quality and ${ownRating.toFixed(1)} own-rating proof where safe.` : "Weak competitor ratings become useful once own rating evidence is matched."} />
        <WeaknessCard title="Relevance gaps" count={weakRelevance.length} detail="Competitors visible without ENT/sinus/hearing wording can be beaten with accurate services, FAQs, and doctor-led content." />
      </div>
    </Panel>
  );
}

function WeaknessCard({ title, count, detail }: { title: string; count: number; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <StatusIndicator label={count ? `${count} found` : "None"} tone={count ? "success" : "neutral"} />
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function OpportunityPanel({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: OpportunityItem[];
}) {
  return (
    <Panel className="p-5">
      <SectionHeader title={title} description={description} action={<Icon className="size-5 text-primary" aria-hidden />} />
      <div className="space-y-3">
        {items.length ? items.map((item) => <OpportunityCard key={`${item.category}-${item.title}`} item={item} />) : <EmptyBlock message="No live opportunity in this category yet. The page keeps this as a setup state rather than estimating a gap." />}
      </div>
    </Panel>
  );
}

function OpportunityCard({ item }: { item: OpportunityItem }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={item.priority} tone={priorityTone(item.priority)} />
            <StatusIndicator label={item.sourceLens} tone="info" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.competitorSignal}</p>
        </div>
        <StatusIndicator label={item.state === "ready" ? "Opportunity" : item.state === "degraded" ? "Gap" : "Setup"} tone={stateTone(item.state)} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DecisionField label="Why competitor wins" value={item.whyCompetitorWins} />
        <DecisionField label="How hospital can close the gap" value={item.howHospitalClosesGap} />
        <DecisionField label="Expected impact" value={item.expectedImpact} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Owner: {item.owner}</span>
        <span>Timeframe: {item.timeframe}</span>
      </div>
    </div>
  );
}

function DecisionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-primary/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function ActionPlanPanel({ items }: { items: ActionPlanItem[] }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="p-5">
        <SectionHeader
          title="30-Day Action Plan"
          description="A practical 30-day sequence where every action states why the competitor wins, how the hospital closes the gap, and the expected impact."
          action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-t text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Window</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Why competitor wins</th>
              <th className="px-4 py-3 font-semibold">How hospital can close the gap</th>
              <th className="px-4 py-3 font-semibold">Expected impact</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.dayRange}-${item.title}`} className="border-t align-top">
                <td className="px-4 py-4"><StatusIndicator label={item.dayRange} tone={stateTone(item.state)} /></td>
                <td className="max-w-[220px] px-4 py-4 font-semibold">{item.title}</td>
                <td className="px-4 py-4 text-muted-foreground">{item.owner}</td>
                <td className="max-w-[260px] px-4 py-4 text-muted-foreground">{item.whyCompetitorWins}</td>
                <td className="max-w-[290px] px-4 py-4 text-muted-foreground">{item.howHospitalClosesGap}</td>
                <td className="max-w-[260px] px-4 py-4 text-muted-foreground">{item.expectedImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ExpectedGainsPanel({ items }: { items: OpportunityItem[] }) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Expected Competitive Gains"
        description="The gains are directional and tied to visible evidence, not clinical quality or unsupported third-party estimates."
        action={<TrendingUp className="size-5 text-primary" aria-hidden />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <OpportunityCard key={`${item.category}-${item.title}`} item={item} />
        ))}
      </div>
    </Panel>
  );
}

function SourceAnchorPanel() {
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Research anchors"
        description="Competitive analysis frameworks used by the page."
        action={<Compass className="size-5 text-primary" aria-hidden />}
      />
      <div className="space-y-3">
        {sourceLinks.map((source) => (
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
  );
}

function EmptyBlock({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">{message}</p>;
}

function buildMetrics({
  marketPositionScore,
  places,
  matchedPlaces,
  competitors,
  socialProfiles,
  socialProfilesWithMetrics,
  ownReviewTotal,
  topThreat,
  reviewLeader,
}: {
  marketPositionScore: number;
  places: LivePlaceLocation[];
  matchedPlaces: LivePlaceLocation[];
  competitors: ScoredCompetitor[];
  socialProfiles: SocialCompetitor[];
  socialProfilesWithMetrics: SocialCompetitor[];
  ownReviewTotal: number;
  topThreat?: ScoredCompetitor;
  reviewLeader?: ScoredCompetitor;
}): IntelligenceMetric[] {
  const reviewGap = reviewLeader ? Math.max(0, reviewLeader.reviews - ownReviewTotal) : 0;
  return [
    {
      label: "Market position score",
      value: `${marketPositionScore}/100`,
      detail: "Composite score from own public trust baseline, live competitor pressure, social benchmark readiness, and connector health.",
      state: marketPositionScore >= 70 ? "ready" : marketPositionScore >= 40 ? "degraded" : "empty",
      icon: Gauge,
    },
    {
      label: "Competitor strength leader",
      value: topThreat ? `${Math.round(topThreat.marketStrength)}/100` : "N/A",
      detail: topThreat ? `${topThreat.name} is the strongest live public listing threat.` : "No competitor pressure score is available yet.",
      state: topThreat ? "degraded" : "empty",
      icon: Radar,
    },
    {
      label: "Review gap",
      value: reviewGap ? integer(reviewGap) : "No deficit",
      detail: reviewLeader ? `${reviewLeader.name} shows ${integer(reviewLeader.reviews)} visible reviews versus ${integer(ownReviewTotal)} for matched hospital listings.` : "No review leader can be calculated.",
      state: reviewGap ? "degraded" : competitors.length ? "ready" : "empty",
      icon: Star,
    },
    {
      label: "Evidence coverage",
      value: `${matchedPlaces.length}/${places.length}`,
      detail: `${competitors.length} public competitors and ${socialProfilesWithMetrics.length}/${socialProfiles.length} social competitors with metrics are available.`,
      state: matchedPlaces.length || competitors.length ? "ready" : "empty",
      icon: BarChart3,
    },
  ];
}

function buildOpportunities(context: CompetitiveContext): OpportunityItem[] {
  const { data, places, integrations, competitors, socialCompetitors } = context;
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const ownReviewTotal = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const reviewLeader = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const topThreat = competitors[0];
  const socialProfiles = socialCompetitors.competitors;
  const socialProfilesWithMetrics = socialProfiles.filter((competitor) => hasMetricData(competitor.metrics));
  const mapsHealth = integrations.find((integration) => integration.id === "maps");
  const gbpHealth = integrations.find((integration) => integration.id === "gbp");
  const metaHealth = integrations.find((integration) => integration.id === "meta");
  const weakRelevance = competitors.filter((competitor) => competitor.relevanceSignals.length === 0);
  const noWebsite = competitors.filter((competitor) => !competitor.website);
  const noHours = competitors.filter((competitor) => !competitor.weekdayText?.length);
  const closeCompetitors = competitors.filter((competitor) => competitor.distanceKm !== undefined && competitor.distanceKm <= 2);
  const strongestSignals = topThreat?.relevanceSignals.length ? topThreat.relevanceSignals.join(", ") : "ENT, sinus, hearing, and access";
  const reviewGap = reviewLeader ? Math.max(0, reviewLeader.reviews - ownReviewTotal) : 0;
  const marketTheme =
    data.intelligence?.marketContext?.recommendedThemes[0] ??
    data.intelligence?.marketContext?.healthcareSignals[0]?.title ??
    "high-intent ENT patient questions";
  const bestFormat = data.analytics?.contentTypeBreakdown.formats
    .slice()
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)[0];
  const bestPost = data.analytics?.topPosts[0];

  return [
    {
      category: "Content Gaps",
      priority: "High",
      title: "Own the competitor comparison questions",
      competitorSignal: topThreat ? `${topThreat.name} wins visibility through public prominence and ${strongestSignals} signals.` : "Competitor content gaps are setup-labeled until public competitor evidence is available.",
      whyCompetitorWins: topThreat ? "The competitor already appears in local comparison moments, so patients may evaluate them before seeing a clear hospital point of view." : "Without competitor evidence, the hospital cannot yet see which topics rivals are owning.",
      howHospitalClosesGap: `Create doctor-reviewed explainers around ${marketTheme}, service access, symptoms, when to consult, and centre-level FAQs.`,
      expectedImpact: "More useful search/social content and clearer trust before appointment intent.",
      owner: "Content",
      timeframe: "Days 7-30",
      sourceLens: "Ahrefs",
      state: topThreat || data.intelligence?.marketContext ? "degraded" : "empty",
    },
    {
      category: "Content Gaps",
      priority: bestPost ? "Medium" : "High",
      title: "Extend the proven content format into competitive topics",
      competitorSignal: bestFormat ? `${bestFormat.contentType} has the best measured owned engagement format.` : "Owned content format performance is not available yet.",
      whyCompetitorWins: "Competitors win attention when the hospital has useful expertise but no repeatable format around it.",
      howHospitalClosesGap: bestFormat ? `Turn competitor gap topics into ${bestFormat.contentType.toLowerCase()} assets, then repurpose into GBP posts and service-page FAQs.` : "Start with short doctor-led reels, carousel checklists, and GBP FAQs until measured format history improves.",
      expectedImpact: bestFormat ? `Protect and extend the format currently averaging ${percent(bestFormat.avgEngagementRate)} engagement.` : "Build a measurable content baseline around competitive topics.",
      owner: "Content",
      timeframe: "Days 14-30",
      sourceLens: "VIP Analytics",
      state: bestFormat ? "ready" : "degraded",
    },
    {
      category: "SEO Gaps",
      priority: weakRelevance.length ? "High" : "Medium",
      title: "Strengthen local service relevance",
      competitorSignal: `${weakRelevance.length} public competitors are visible without strong ENT/sinus/hearing wording.`,
      whyCompetitorWins: "Even weakly relevant competitors can win if their listings are prominent and the hospital does not reinforce service intent across pages and profiles.",
      howHospitalClosesGap: "Map sinus, hearing, allergy, pediatric ENT, throat, voice, emergency access, and centre pages to clear FAQs, schema-ready copy, and verified CTAs.",
      expectedImpact: "Better local relevance and more qualified service-page actions.",
      owner: "SEO",
      timeframe: "Days 7-30",
      sourceLens: "SEMrush",
      state: competitors.length ? "degraded" : "empty",
    },
    {
      category: "SEO Gaps",
      priority: "Medium",
      title: "Keep traffic-share metrics setup-labeled",
      competitorSignal: "Similarweb-style traffic share and channel mix are not ingested.",
      whyCompetitorWins: "Competitors may have stronger web traffic or channel mix, but the page cannot safely claim that without a source.",
      howHospitalClosesGap: "Prepare domain, service-line, and channel benchmark requirements; use Search Console and real connector data before showing traffic share.",
      expectedImpact: "Cleaner leadership reporting and no unsupported market-share claims.",
      owner: "Admin",
      timeframe: "Days 1-14",
      sourceLens: "Similarweb",
      state: "empty",
    },
    {
      category: "Review Gaps",
      priority: reviewGap ? "Critical" : "Medium",
      title: "Close visible public review deficit",
      competitorSignal: reviewLeader ? `${reviewLeader.name} leads by ${integer(reviewGap)} visible reviews.` : "No public review leader is available.",
      whyCompetitorWins: reviewGap ? "Higher visible review volume creates prominence and trust before a patient compares services or calls." : "Competitors do not currently show a visible review-volume advantage in this pull.",
      howHospitalClosesGap: "Launch a broad, ethical QR/WhatsApp review request workflow and reply with privacy-safe templates.",
      expectedImpact: "Improved local trust signals, fresher reviews, and stronger comparison confidence.",
      owner: "Reputation",
      timeframe: "Days 1-30",
      sourceLens: "Google Places",
      state: reviewGap ? "degraded" : competitors.length ? "ready" : "empty",
    },
    {
      category: "Review Gaps",
      priority: gbpHealth?.status === "Connected" ? "Medium" : "High",
      title: "Stabilize governed GBP review intelligence",
      competitorSignal: `GBP status is ${gbpHealth?.status ?? "Unavailable"}.`,
      whyCompetitorWins: "Competitors can appear more responsive if the hospital cannot measure new review flow, reply status, and review freshness.",
      howHospitalClosesGap: "Reconnect or verify GBP access, then track review text, reply state, freshness, and escalation themes.",
      expectedImpact: "Faster response coverage and better reputation learning.",
      owner: "Admin",
      timeframe: "Days 1-7",
      sourceLens: "Google Places",
      state: gbpHealth?.status === "Connected" ? "ready" : "degraded",
    },
    {
      category: "Social Presence Gaps",
      priority: socialProfilesWithMetrics.length < socialProfiles.length ? "High" : "Medium",
      title: "Complete competitor social measurement",
      competitorSignal: `${socialProfilesWithMetrics.length}/${socialProfiles.length} tracked social competitors have stored metrics.`,
      whyCompetitorWins: "Competitors can win familiarity on Instagram or Facebook if the hospital tracks only its own performance.",
      howHospitalClosesGap: "Add active competitor profiles, refresh handles, and store engagement, reach, cadence, post type, and hashtag metrics.",
      expectedImpact: "Sprout-style benchmark readiness for cadence, formats, engagement, and share of voice.",
      owner: "Social",
      timeframe: "Days 1-14",
      sourceLens: "Sprout Social",
      state: socialProfilesWithMetrics.length && socialProfilesWithMetrics.length === socialProfiles.length ? "ready" : "degraded",
    },
    {
      category: "Social Presence Gaps",
      priority: metaHealth?.status === "Connected" ? "Medium" : "High",
      title: "Turn social attention into local proof",
      competitorSignal: data.analytics ? `Owned social reach is ${integer(data.analytics.totalReach)} with ${percent(data.analytics.avgEngagementRate)} average engagement.` : "Owned social analytics are unavailable.",
      whyCompetitorWins: "Social competitors win when they are more familiar, more frequent, or more specific about services and access.",
      howHospitalClosesGap: "Repurpose competitive service topics into doctor-led Reels, carousels, Shorts, Facebook posts, and GBP updates.",
      expectedImpact: "More saves, shares, profile visits, and warmer appointment intent.",
      owner: "Social",
      timeframe: "Days 14-30",
      sourceLens: "Sprout Social",
      state: data.analytics ? "ready" : "degraded",
    },
    {
      category: "Service Line Opportunities",
      priority: closeCompetitors.length ? "High" : "Medium",
      title: "Defend high-proximity centre catchments",
      competitorSignal: closeCompetitors.length ? `${closeCompetitors.length} competitors are within 2 km of a centre.` : "No high-proximity competitor pressure found in the current pull.",
      whyCompetitorWins: "Nearby competitors can win convenience-driven searches even when the hospital has stronger expertise.",
      howHospitalClosesGap: "Build centre-specific GBP posts, services, photos, FAQs, directions proof, and appointment CTAs for pressured catchments.",
      expectedImpact: "More directions, calls, and local service intent around priority centres.",
      owner: "Growth",
      timeframe: "Days 7-30",
      sourceLens: "Google Places",
      state: closeCompetitors.length ? "degraded" : competitors.length ? "ready" : "empty",
    },
    {
      category: "Service Line Opportunities",
      priority: "Medium",
      title: "Turn service blind spots into doctor-led pages",
      competitorSignal: topThreat ? topThreat.opportunity : "Competitor service-line opportunities need public evidence.",
      whyCompetitorWins: "Competitors win when patients can find a specific service answer faster than they can find the hospital's answer.",
      howHospitalClosesGap: "Prioritize sinus, hearing, allergy, pediatric ENT, throat, voice, and procedure-readiness pages with simple CTAs.",
      expectedImpact: "Clearer service discovery and higher-quality appointment inquiries.",
      owner: "SEO",
      timeframe: "Days 14-30",
      sourceLens: "Ahrefs",
      state: topThreat ? "degraded" : "empty",
    },
    {
      category: "Quick Wins",
      priority: mapsHealth?.status === "Configured" ? "Medium" : "High",
      title: "Fix profile completeness before chasing scale",
      competitorSignal: `${noWebsite.length} competitors lack websites and ${noHours.length} lack visible hours.`,
      whyCompetitorWins: "Competitors win when profile completeness looks more current, even if their actual service quality is unknown.",
      howHospitalClosesGap: "Verify every centre's hours, phone, website, appointment link, service list, photos, and category alignment.",
      expectedImpact: "Immediate trust and action-path improvement in Maps comparison.",
      owner: "Operations",
      timeframe: "Days 1-10",
      sourceLens: "Google Places",
      state: mapsHealth?.status === "Configured" ? "ready" : "degraded",
    },
    {
      category: "Quick Wins",
      priority: "High",
      title: "Create the first competitor gap brief",
      competitorSignal: topThreat ? `${topThreat.name} is the current benchmark threat.` : "No benchmark threat has been identified yet.",
      whyCompetitorWins: "The team cannot close a gap if each channel chooses topics independently.",
      howHospitalClosesGap: "Write one shared weekly brief covering content topic, SEO page/FAQ, GBP update, review action, social asset, and CTA.",
      expectedImpact: "Faster alignment across content, SEO, reputation, and conversion work.",
      owner: "Strategy",
      timeframe: "Days 1-7",
      sourceLens: "VIP Analytics",
      state: "ready",
    },
    {
      category: "Strategic Opportunities",
      priority: "High",
      title: "Build a competitive evidence operating rhythm",
      competitorSignal: "Competitor, SEO, web traffic, review, and social evidence currently live in separate readiness states.",
      whyCompetitorWins: "Competitors win over time when the hospital reacts slowly to market movement.",
      howHospitalClosesGap: "Create a monthly competitor gap review that separates live evidence, setup gaps, and decisions for the next sprint.",
      expectedImpact: "More disciplined prioritization and fewer generic growth activities.",
      owner: "Leadership",
      timeframe: "Monthly",
      sourceLens: "Similarweb",
      state: "degraded",
    },
    {
      category: "Strategic Opportunities",
      priority: "High",
      title: "Connect real SEO and traffic intelligence",
      competitorSignal: "SEMrush, Ahrefs, and Similarweb-style metrics are not ingested yet.",
      whyCompetitorWins: "Competitors may own demand pockets that are invisible without domain, keyword, content, and traffic benchmarks.",
      howHospitalClosesGap: "Define connector or import requirements for competitor domains, keywords, top pages, backlinks, traffic channels, and local rank tracking.",
      expectedImpact: "Future versions can prioritize by actual demand size instead of only public listing pressure.",
      owner: "Admin",
      timeframe: "Days 21-30",
      sourceLens: "SEMrush",
      state: "empty",
    },
  ];
}

function buildActionPlan(context: CompetitiveContext, opportunities: OpportunityItem[]): ActionPlanItem[] {
  const top = opportunities.filter((item) => item.priority !== "Medium").slice(0, 5);
  const fallback = opportunities.slice(0, 5);
  const selected = top.length >= 5 ? top : [...top, ...fallback.filter((item) => !top.includes(item))].slice(0, 5);
  const windows = ["Days 1-3", "Days 4-7", "Days 8-14", "Days 15-21", "Days 22-30"];

  return selected.map((item, index) => ({
    dayRange: windows[index] ?? "Days 22-30",
    title: item.title,
    owner: item.owner,
    whyCompetitorWins: item.whyCompetitorWins,
    howHospitalClosesGap: item.howHospitalClosesGap,
    expectedImpact: item.expectedImpact,
    state: item.state,
  }));
}

function buildExpectedGains(context: CompetitiveContext): OpportunityItem[] {
  const { competitors, socialCompetitors } = context;
  const hasCompetitors = competitors.length > 0;
  const hasSocialMetrics = socialCompetitors.competitors.some((competitor) => hasMetricData(competitor.metrics));

  return [
    {
      category: "Strategic Opportunities",
      priority: "High",
      title: "Higher local comparison confidence",
      competitorSignal: hasCompetitors ? "Public Places competitors are available for comparison." : "Competitor listing evidence is not available yet.",
      whyCompetitorWins: "Competitors win when they look more complete, more reviewed, or closer in Maps.",
      howHospitalClosesGap: "Close profile, review, photo, FAQ, services, and CTA gaps centre by centre.",
      expectedImpact: "More calls, directions, and appointment-path confidence from local discovery.",
      owner: "Growth",
      timeframe: "30 days",
      sourceLens: "Google Places",
      state: hasCompetitors ? "ready" : "empty",
    },
    {
      category: "Strategic Opportunities",
      priority: "High",
      title: "Sharper organic demand capture",
      competitorSignal: "SEMrush and Ahrefs-style inputs identify missing keywords, pages, and content topics once connected.",
      whyCompetitorWins: "Competitors win when they answer patient intent before the hospital has a relevant page or FAQ.",
      howHospitalClosesGap: "Use the gap brief to publish service-line pages, FAQs, and doctor-led content around high-intent topics.",
      expectedImpact: "More qualified service-page visits and stronger search-to-contact movement.",
      owner: "SEO",
      timeframe: "30-60 days",
      sourceLens: "SEMrush",
      state: "degraded",
    },
    {
      category: "Strategic Opportunities",
      priority: hasSocialMetrics ? "Medium" : "High",
      title: "Better social share of attention",
      competitorSignal: hasSocialMetrics ? "Some stored competitor social metrics exist." : "Competitor social metrics are not fully stored.",
      whyCompetitorWins: "Competitors win familiarity when their cadence, formats, and topics are measured more clearly than the hospital's response plan.",
      howHospitalClosesGap: "Track competitor profiles, then publish repeatable doctor-led formats around service-line gaps.",
      expectedImpact: "More saves, shares, profile visits, and warmer branded search.",
      owner: "Social",
      timeframe: "30 days",
      sourceLens: "Sprout Social",
      state: hasSocialMetrics ? "ready" : "degraded",
    },
  ];
}

function buildActionQueue(opportunities: OpportunityItem[]): IntelligenceAction[] {
  return opportunities
    .filter((item) => item.priority !== "Medium")
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      detail: `${item.competitorSignal} How to close: ${item.howHospitalClosesGap} Expected impact: ${item.expectedImpact}`,
      owner: item.owner,
      due: item.timeframe,
      state: item.state,
    }));
}

function calculateMarketPositionScore({ places, integrations, competitors, socialCompetitors }: CompetitiveContext) {
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const ownReviewTotal = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const ownRating = weightedRating(matchedPlaces);
  const averageCompetitorRating = average(competitors.map((competitor) => competitor.rating).filter(Boolean));
  const reviewLeader = competitors.slice().sort((a, b) => b.reviews - a.reviews)[0];
  const reviewVolumeScore = reviewLeader ? Math.max(0, Math.min(25, 25 * (ownReviewTotal / Math.max(reviewLeader.reviews, 1)))) : matchedPlaces.length ? 12 : 0;
  const ratingScore = ownRating && averageCompetitorRating ? Math.max(0, Math.min(25, 18 + (ownRating - averageCompetitorRating) * 8)) : ownRating ? Math.min(25, (ownRating / 5) * 20) : 0;
  const pressureScore = competitors[0] ? Math.max(0, 20 - competitors[0].marketStrength * 0.12) : 0;
  const profiles = socialCompetitors.competitors;
  const profilesWithMetrics = profiles.filter((competitor) => hasMetricData(competitor.metrics));
  const socialScore = profiles.length ? Math.min(15, (profilesWithMetrics.length / profiles.length) * 15) : 0;
  const connectorScore = integrations.reduce((score, integration) => {
    if (integration.status === "Connected") return score + 5;
    if (integration.status === "Configured") return score + 4;
    if (integration.status === "Needs attention") return score + 2;
    return score;
  }, 0);

  return Math.round(Math.max(0, Math.min(100, reviewVolumeScore + ratingScore + pressureScore + socialScore + connectorScore)));
}

function scoreGroups(groups: PlaceCompetitorLocationGroup[]) {
  return groups.map((group) => ({
    ...group,
    competitors: group.competitors.map((competitor) => scoreCompetitor(competitor, group.centre)),
  }));
}

function categoryItems(items: OpportunityItem[], category: OpportunityCategory) {
  return items.filter((item) => item.category === category);
}

function emptySocialCompetitors(workspaceId: string): SocialCompetitorComparison {
  return {
    workspaceId,
    competitors: [],
    gaps: [{
      label: "Competitor baseline missing",
      confidence: 0.9,
      rationale: "Add local and specialty competitor accounts to unlock comparative recommendations.",
    }],
  };
}

function hasMetricData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).some((metric) => typeof metric === "number" && Number.isFinite(metric));
}

function weightedRating(places: LivePlaceLocation[]) {
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
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((total, value) => total + value, 0) / clean.length : null;
}

function platformLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function stateTone(state: SurfaceState): Tone {
  if (state === "ready") return "success";
  if (state === "degraded") return "warning";
  if (state === "error") return "danger";
  return "neutral";
}

function priorityTone(priority: OpportunityItem["priority"]): Tone {
  if (priority === "Critical") return "danger";
  if (priority === "High") return "warning";
  return "info";
}
