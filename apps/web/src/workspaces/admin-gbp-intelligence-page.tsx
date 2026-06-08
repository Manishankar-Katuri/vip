import {
  AlertTriangle,
  Compass,
  ExternalLink,
  KeyRound,
  MapPinned,
  MessageSquareText,
  Phone,
  Radar,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";

import {
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceAction,
  type IntelligenceMetric,
  type SurfaceState,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import {
  loadIntegrationHealth,
  loadPlaceLocations,
  type IntegrationHealth,
  type LivePlaceLocation,
} from "@/lib/acquisition/live-client-data";
import {
  findCompetitorsForLocations,
  type PlaceCompetitor,
  type PlaceCompetitorLocationGroup,
} from "@/lib/acquisition/places";
import { hospitalProfile, resultMeasures, todayAgenda, websiteChecks } from "@/lib/playbook/harika-playbook";

export async function AdminGBPIntelligencePage() {
  const [places, integrations] = await Promise.all([
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);
  const competitorGroups = await findCompetitorsForLocations(places, "Hyderabad", "ENT");
  const competitors = uniqueCompetitors(competitorGroups);

  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const totalReviews = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const averageRating = calculateWeightedRating(matchedPlaces);
  const reviewSnippetCount =
    matchedPlaces.reduce((total, place) => total + place.reviewSnippets.length, 0) +
    competitors.reduce((total, competitor) => total + competitor.reviewSnippets.length, 0);
  const topCompetitor = competitors[0];
  const gbpHealth = integrations.find((integration) => integration.id === "gbp");
  const pageState: SurfaceState = matchedPlaces.length
    ? gbpHealth?.status === "Connected"
      ? "ready"
      : "degraded"
    : "empty";

  const metrics: IntelligenceMetric[] = [
    {
      label: "Matched listings",
      value: `${matchedPlaces.length}/${places.length}`,
      detail: "Official centre addresses matched against public Google Places listing evidence.",
      state: matchedPlaces.length ? "ready" : "empty",
      icon: MapPinned,
    },
    {
      label: "Visible review count",
      value: integer(totalReviews),
      detail: "Public review totals returned on matched Google listings. This is not the authenticated review feed.",
      state: totalReviews ? "ready" : "empty",
      icon: MessageSquareText,
    },
    {
      label: "Average listing rating",
      value: averageRating ? averageRating.toFixed(1) : "N/A",
      detail: "Weighted by public review count across matched centre listings.",
      state: averageRating ? "ready" : "empty",
      icon: Star,
    },
    {
      label: "Location competitor pulls",
      value: `${competitorGroups.filter((group) => group.competitors.length > 0).length}/${places.length}`,
      detail: "Separate nearby competitor searches around Kondapur, Chandanagar, and Vanasthalipuram.",
      state: competitorGroups.some((group) => group.competitors.length) ? "ready" : "empty",
      icon: Radar,
    },
  ];

  const actions: IntelligenceAction[] = [
    {
      title: "Refresh Google Business Profile OAuth",
      detail: "Authenticated GBP access is required for owned review replies, profile performance, calls, directions, and post analytics.",
      owner: "Admin",
      due: "Before launch",
      state: gbpHealth?.status === "Connected" ? "ready" : "degraded",
    },
    {
      title: "Confirm centre-to-listing mapping",
      detail: "The three Harika centres should each map to the correct live Google listing before performance is attributed.",
      owner: "Operations",
      due: "This week",
      state: matchedPlaces.length === places.length ? "ready" : "degraded",
    },
    {
      title: "Ingest owned review records",
      detail: "Once authorized, pull review text, rating, reply state, created time, and update time into the workspace for theme intelligence.",
      owner: "Data",
      due: "After OAuth",
      state: "empty",
    },
    {
      title: "Baseline GBP actions",
      detail: "Track discovery views, search terms, calls, website clicks, direction requests, and GBP post performance by centre.",
      owner: "Growth",
      due: "After OAuth",
      state: "empty",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="GBP intelligence"
        title={`${hospitalProfile.name} GBP intelligence`}
        description="Google Business Profile intelligence assembled from the data available now: public listing evidence, centre coverage, visible review totals, connector health, and nearby competitor listings."
        icon={Star}
        state={pageState}
      >
        <StatusIndicator
          label={gbpHealth?.status === "Connected" ? "GBP connected" : "GBP auth needed"}
          tone={gbpHealth?.status === "Connected" ? "success" : "warning"}
        />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {gbpHealth?.status !== "Connected" && (
          <AlertBanner
            title="Authenticated GBP access still needs attention"
            message="We can show public Places evidence now. Owned GBP data such as review replies, calls, direction requests, profile views, and post analytics will populate after OAuth access is refreshed and quota is available."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Google listing coverage"
              description="Available centre evidence from public Google Places lookup."
              action={
                <StatusIndicator
                  label={matchedPlaces.length ? `${matchedPlaces.length} matched` : "No matches"}
                  tone={matchedPlaces.length ? "success" : "warning"}
                />
              }
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {places.map((place) => (
                <ListingCard key={place.centre} place={place} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Connector status"
              description="Configured credentials are only marked live after the upstream API responds."
              action={<Compass className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {integrations
                .filter((integration) => integration.id === "maps" || integration.id === "gbp")
                .map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Places review snippets"
            description="Public Google Places Details returns a small set of recent/highlighted review snippets. Full governed review intelligence still needs authenticated GBP ingestion."
            action={
              <StatusIndicator
                label={reviewSnippetCount ? `${reviewSnippetCount} snippets` : "No snippets"}
                tone={reviewSnippetCount ? "success" : "neutral"}
              />
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            {matchedPlaces.map((place) => (
              <ReviewSnippetCard
                key={`${place.centre}-reviews`}
                title={place.mapsName ?? place.centre}
                rating={place.rating}
                reviews={place.reviews}
                snippets={place.reviewSnippets}
              />
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Review intelligence status"
              description="What can be trusted from available data versus what needs GBP authorization."
              action={<MessageSquareText className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              <EvidenceRow
                title="Visible rating and review totals"
                detail={`${integer(totalReviews)} public review counts are visible across matched listings${averageRating ? ` with a ${averageRating.toFixed(1)} weighted rating` : ""}.`}
                state={totalReviews ? "ready" : "empty"}
              />
              <EvidenceRow
                title="Owned review text and reply status"
                detail={reviewSnippetCount ? "Places snippets are visible now, but owned reply status and complete review history still require Google Business Profile authorization." : "Requires Google Business Profile authorization before review themes, response coverage, and unresolved-review queues can be trusted."}
                state={reviewSnippetCount ? "degraded" : gbpHealth?.status === "Connected" ? "ready" : "degraded"}
              />
              <EvidenceRow
                title="GBP profile action metrics"
                detail="Calls, website clicks, direction requests, discovery views, and search keywords are not available from public Places data."
                state="empty"
              />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Competitor visibility by location"
              description="Separate public Google Places competitor pulls around each Harika centre, deduped inside each location."
              action={
                <StatusIndicator
                  label={topCompetitor ? `${integer(competitors.length)} unique competitors` : "No competitor data"}
                  tone={competitors.length ? "success" : "warning"}
                />
              }
            />
            {competitorGroups.some((group) => group.competitors.length) ? (
              <div className="space-y-4">
                {competitorGroups.map((group) => (
                  <LocationCompetitorGroup key={group.centre} group={group} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border bg-background p-4 text-sm leading-6 text-muted-foreground">
                Competitor Places lookup did not return listing evidence for any of the three locations. Verify Google Maps API access before using competitor comparisons.
              </p>
            )}
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <SectionHeader
              title="GBP measurement map"
              description="The GBP signals that should feed growth reporting once authenticated access is restored."
              action={<TrendingUp className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {resultMeasures
                .filter((group) => group.label === "Discovery" || group.label === "Intent" || group.label === "Trust")
                .map((group) => (
                  <div key={group.label} className="rounded-lg border bg-background p-3">
                    <p className="text-sm font-semibold">{group.label}</p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                      {group.measures.map((measure) => (
                        <li key={measure}>{measure}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Operational checks"
              description="Items already known from the playbook that should be verified against GBP."
              action={<Search className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {websiteChecks
                .filter((check) => check.area === "Business facts" || check.area === "Google Business Profile")
                .map((check) => (
                  <EvidenceRow
                    key={check.area}
                    title={check.area}
                    detail={check.action}
                    state={check.status === "Connect source" ? "degraded" : "empty"}
                  />
                ))}
              {todayAgenda
                .filter((item) => item.channel === "Google Business Profile")
                .map((item) => (
                  <EvidenceRow
                    key={item.title}
                    title={item.title}
                    detail={item.detail}
                    state="degraded"
                  />
                ))}
            </div>
          </Panel>
        </div>

        <IntelligenceActionQueue
          title="Next GBP actions"
          description="Sequenced so the page can keep showing public evidence now, then light up owned GBP intelligence after access is fixed."
          actions={actions}
        />

        <p className="text-xs leading-5 text-muted-foreground">
          Public Google Places ratings and review totals are listing indicators only. Clinical quality, patient outcomes, and review sentiment require governed review ingestion before they are used for recommendations.
        </p>
      </section>
    </main>
  );
}

function ListingCard({ place }: { place: LivePlaceLocation }) {
  const tone: Tone = place.status === "Matched" ? "success" : place.status === "Unavailable" ? "warning" : "neutral";

  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <MapPinned className="size-5 shrink-0 text-primary" aria-hidden />
        <StatusIndicator label={place.status} tone={tone} />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{place.centre}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{place.officialAddress}</p>
      {place.mapsName && (
        <p className="mt-3 rounded-lg bg-info/35 p-3 text-xs leading-5">
          Maps result: {place.mapsName}
          {place.mapsAddress ? ` / ${place.mapsAddress}` : ""}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusIndicator
          label={place.rating ? `${place.rating.toFixed(1)} rating` : "No rating"}
          tone={place.rating && place.rating >= 4 ? "success" : "neutral"}
        />
        <StatusIndicator label={`${integer(place.reviews ?? 0)} reviews`} tone="neutral" />
        {place.openNow !== undefined && <StatusIndicator label={place.openNow ? "Open now" : "Closed now"} tone={place.openNow ? "success" : "neutral"} />}
        {place.photoCount !== undefined && <StatusIndicator label={`${place.photoCount} photos`} tone="info" />}
      </div>
      <ContactLinks phone={place.phone} website={place.website} mapsUrl={place.mapsUrl} />
      {place.weekdayText?.length ? (
        <details className="mt-3 rounded-lg border bg-card p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-foreground">Opening hours</summary>
          <ul className="mt-2 space-y-1 leading-5 text-muted-foreground">
            {place.weekdayText.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {place.detail && <p className="mt-3 text-xs leading-5 text-muted-foreground">{place.detail}</p>}
    </article>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationHealth }) {
  const tone: Tone = integration.status === "Connected" || integration.status === "Configured"
    ? "success"
    : integration.status === "Needs attention"
      ? "warning"
      : "neutral";
  const Icon = integration.id === "gbp" ? KeyRound : MapPinned;

  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 shrink-0 text-primary" aria-hidden />
        <StatusIndicator label={integration.status} tone={tone} />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{integration.label}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{integration.detail}</p>
    </article>
  );
}

function CompetitorCard({ competitor }: { competitor: PlaceCompetitor }) {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Radar className="size-5 shrink-0 text-primary" aria-hidden />
        <StatusIndicator
          label={competitor.rating ? `${competitor.rating.toFixed(1)} rating` : "No rating"}
          tone={competitor.rating >= 4 ? "success" : "neutral"}
        />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{competitor.name}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{competitor.address}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusIndicator label={`${integer(competitor.reviews)} reviews`} tone="neutral" />
        {competitor.distanceKm !== undefined && <StatusIndicator label={`${competitor.distanceKm.toFixed(1)} km`} tone="info" />}
        {competitor.businessStatus && <StatusIndicator label={friendly(competitor.businessStatus)} tone="info" />}
        {competitor.openNow !== undefined && <StatusIndicator label={competitor.openNow ? "Open now" : "Closed now"} tone={competitor.openNow ? "success" : "neutral"} />}
        {competitor.photoCount !== undefined && <StatusIndicator label={`${competitor.photoCount} photos`} tone="info" />}
      </div>
      <ContactLinks phone={competitor.phone} website={competitor.website} mapsUrl={competitor.mapsUrl} />
      {competitor.reviewSnippets.length > 0 && (
        <div className="mt-3 rounded-lg border bg-card p-3">
          <p className="text-xs font-semibold">Public review snippets</p>
          <ReviewSnippetList snippets={competitor.reviewSnippets.slice(0, 2)} />
        </div>
      )}
    </article>
  );
}

function LocationCompetitorGroup({ group }: { group: PlaceCompetitorLocationGroup }) {
  return (
    <section className="rounded-lg border bg-card p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{group.centre}</h3>
          {group.anchorName && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Anchor listing: {group.anchorName}
            </p>
          )}
        </div>
        <StatusIndicator
          label={`${group.competitors.length} nearby`}
          tone={group.competitors.length ? "success" : "warning"}
        />
      </div>
      {group.competitors.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {group.competitors.map((competitor) => (
            <CompetitorCard key={`${group.centre}-${competitor.placeId}`} competitor={competitor} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
          No competitor listings were returned around this centre in the current Places response.
        </p>
      )}
    </section>
  );
}

function ReviewSnippetCard({
  title,
  rating,
  reviews,
  snippets,
}: {
  title: string;
  rating?: number;
  reviews?: number;
  snippets: Array<{ authorName: string; rating: number; relativeTimeDescription: string; text: string }>;
}) {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <MessageSquareText className="size-5 shrink-0 text-primary" aria-hidden />
        <StatusIndicator label={rating ? `${rating.toFixed(1)} rating` : "No rating"} tone={rating && rating >= 4 ? "success" : "neutral"} />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{integer(reviews ?? 0)} visible public reviews</p>
      {snippets.length ? (
        <ReviewSnippetList snippets={snippets.slice(0, 3)} />
      ) : (
        <p className="mt-3 rounded-lg border bg-card p-3 text-xs leading-5 text-muted-foreground">
          Places Details did not return review snippets for this listing in the current response.
        </p>
      )}
    </article>
  );
}

function ReviewSnippetList({
  snippets,
}: {
  snippets: Array<{ authorName: string; rating: number; relativeTimeDescription: string; text: string }>;
}) {
  return (
    <div className="mt-3 space-y-2">
      {snippets.map((snippet, index) => (
        <div key={`${snippet.authorName}-${index}`} className="rounded-lg bg-muted/45 p-3 text-xs leading-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={`${snippet.rating}/5`} tone={snippet.rating >= 4 ? "success" : snippet.rating <= 2 ? "warning" : "neutral"} />
            <span className="font-medium">{snippet.authorName}</span>
            <span className="text-muted-foreground">{snippet.relativeTimeDescription}</span>
          </div>
          {snippet.text && (
            <p className="mt-2 text-muted-foreground">
              {truncateWords(snippet.text, 18)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ContactLinks({
  phone,
  website,
  mapsUrl,
}: {
  phone?: string;
  website?: string;
  mapsUrl?: string;
}) {
  if (!phone && !website && !mapsUrl) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {phone && (
        <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-medium">
          <Phone className="size-3" aria-hidden />
          {phone}
        </span>
      )}
      {website && (
        <a className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-medium text-primary" href={website} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3" aria-hidden />
          Website
        </a>
      )}
      {mapsUrl && (
        <a className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-medium text-primary" href={mapsUrl} target="_blank" rel="noreferrer">
          <MapPinned className="size-3" aria-hidden />
          Maps
        </a>
      )}
    </div>
  );
}

function EvidenceRow({
  title,
  detail,
  state,
}: {
  title: string;
  detail: string;
  state: SurfaceState;
}) {
  const tone: Tone = state === "ready" ? "success" : state === "degraded" ? "warning" : "neutral";
  const Icon = state === "degraded" ? AlertTriangle : state === "ready" ? Star : Compass;

  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <StatusIndicator
            label={state === "ready" ? "Available" : state === "degraded" ? "Needs access" : "Pending"}
            tone={tone}
          />
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
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

function uniqueCompetitors(groups: PlaceCompetitorLocationGroup[]) {
  const competitors = new Map<string, PlaceCompetitor>();

  for (const group of groups) {
    for (const competitor of group.competitors) {
      const existing = competitors.get(competitor.placeId);
      if (!existing || competitor.reviews > existing.reviews) {
        competitors.set(competitor.placeId, competitor);
      }
    }
  }

  return Array.from(competitors.values())
    .sort((a, b) => b.reviews - a.reviews);
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function friendly(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function truncateWords(value: string, limit: number) {
  const words = value.trim().split(/\s+/);
  if (words.length <= limit) return value;

  return `${words.slice(0, limit).join(" ")}...`;
}
