import { Globe, MapPinned, MessageSquareText, SearchCheck } from "lucide-react";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { IntegrationHealth, LivePlaceLocation } from "@/lib/acquisition/live-client-data";
import { websiteChecks } from "@/lib/playbook/harika-playbook";

export function ReputationDiscoverabilityIntelligence({
  places,
  integrations,
}: {
  places: LivePlaceLocation[];
  integrations: IntegrationHealth[];
}) {
  const maps = integrations.find((integration) => integration.id === "maps");
  const gbp = integrations.find((integration) => integration.id === "gbp");
  const matched = places.filter((place) => place.status === "Matched");
  const listedReviewCount = matched.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const rated = matched.filter((place) => place.rating !== undefined);
  const averageRating = rated.length
    ? rated.reduce((total, place) => total + (place.rating ?? 0), 0) / rated.length
    : undefined;

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Google reputation and discoverability intelligence"
        description="Listing visibility, review readiness and SEO coverage shown separately from social performance"
        action={<StatusIndicator label={matched.length ? "Places evidence available" : "Connector validation required"} tone={matched.length ? "success" : "warning"} />}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <EvidenceCard
          icon={<MapPinned />}
          title="Google Places footprint"
          value={matched.length ? `${matched.length} / ${places.length} centres matched` : "No live centre match recorded"}
          detail={averageRating !== undefined
            ? `${averageRating.toFixed(1)} average visible rating across matched listings; ${listedReviewCount.toLocaleString("en-IN")} public rating records shown by Places.`
            : maps?.detail ?? "Listing verification has not returned rating evidence."}
          status={maps?.status ?? "Unavailable"}
          tone={matched.length ? "success" : "warning"}
        />
        <EvidenceCard
          icon={<MessageSquareText />}
          title="Google reviews intelligence"
          value={gbp?.status === "Connected" ? "GBP account access verified" : "Review analysis not connected"}
          detail={gbp?.status === "Connected"
            ? "The GBP review client is implemented; review-level ingestion must be persisted and summarized before sentiment or complaint claims appear here."
            : "The GBP review client exists, but usable authorized review retrieval is not currently feeding the demo intelligence layer."}
          status={gbp?.status ?? "Unavailable"}
          tone={gbp?.status === "Connected" ? "info" : "warning"}
        />
        <EvidenceCard
          icon={<SearchCheck />}
          title="Website and SEO intelligence"
          value="Audit foundation, not measured SEO"
          detail="Website content storage and an audit checklist exist. Search impressions, rankings, calls and conversion attribution are not yet ingested as measured signals."
          status="Foundation only"
          tone="neutral"
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {websiteChecks.map((check) => (
          <div key={check.area} className="rounded-xl border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Globe className="size-4" />
              {check.area}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{check.action}</p>
            <div className="mt-3">
              <StatusIndicator label={check.status} tone={check.status === "Approval required" ? "warning" : "neutral"} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EvidenceCard({
  icon,
  title,
  value,
  detail,
  status,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  status: string;
  tone: "neutral" | "info" | "success" | "warning";
}) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">
        {icon}
        {title}
      </p>
      <p className="mt-3 text-base font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      <div className="mt-3">
        <StatusIndicator label={status} tone={tone} />
      </div>
    </article>
  );
}

export function IntelligenceCoverage({
  hasMeasuredSocial,
  hasForecasts,
  hasMarketContext,
  hasCompetitors,
  hasAudienceSignals,
  hasOperationalRecords,
  places,
  integrations,
}: {
  hasMeasuredSocial: boolean;
  hasForecasts: boolean;
  hasMarketContext: boolean;
  hasCompetitors: boolean;
  hasAudienceSignals: boolean;
  hasOperationalRecords: boolean;
  places: LivePlaceLocation[];
  integrations: IntegrationHealth[];
}) {
  const gbpConnected = integrations.some((integration) => integration.id === "gbp" && integration.status === "Connected");
  const placesMatched = places.some((place) => place.status === "Matched");
  const areas = [
    { name: "Social analytics", ready: hasMeasuredSocial, detail: "Posts, reach, engagement, formats, hashtags and timing" },
    { name: "Predictive intelligence", ready: hasForecasts, detail: "Trajectory, opportunity windows and risk signals" },
    { name: "Recommendation engine", ready: hasMeasuredSocial, detail: "Ranked actions with evidence and confidence" },
    { name: "Market intelligence", ready: hasMarketContext, detail: "Regional topics, opportunities and demographics" },
    { name: "Competitor patterns", ready: hasCompetitors, detail: "Structured observed competitor benchmarks" },
    { name: "Audience insights", ready: hasAudienceSignals, detail: "Stored platform audience observations" },
    { name: "Google Places", ready: placesMatched, detail: "Centre matching, visible rating and review counts" },
    { name: "Google reviews", ready: gbpConnected, detail: "GBP review ingestion and reputation themes" },
    { name: "Website and SEO", ready: false, detail: "Search visibility and conversion measurements" },
    { name: "Execution records", ready: hasOperationalRecords, detail: "Plans, queues and automated execution persistence" },
  ];

  return (
    <Panel className="p-5">
      <SectionHeader
        title="Intelligence coverage map"
        description="What this demo can prove today versus what has an integration foundation only"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {areas.map((area) => (
          <div key={area.name} className="rounded-xl border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{area.name}</p>
              <StatusIndicator label={area.ready ? "Visible" : "Gap"} tone={area.ready ? "success" : "warning"} />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{area.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
