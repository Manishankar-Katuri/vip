import { AlertTriangle, Compass, Languages, MapPinned, Stethoscope, UsersRound } from "lucide-react";
import { buildDemographicProfile } from "@vip/market-intelligence";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { EvidenceLinks, SourcesPanel } from "@/components/playbook/playbook-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { loadIntegrationHealth, loadPlaceLocations, type IntegrationHealth, type LivePlaceLocation } from "@/lib/acquisition/live-client-data";
import { findCompetitors, type PlaceCompetitor } from "@/lib/acquisition/places";
import { evidenceSources, hospitalProfile, marketQuestions, officialDemographicBaseline } from "@/lib/playbook/harika-playbook";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function LocalMarketPage() {
  const [places, integrations, intelligence, competitors] = await Promise.all([
    loadPlaceLocations(),
    loadIntegrationHealth(),
    getProductExperience(),
    findCompetitors(hospitalProfile.name, "Hyderabad", "ENT"),
  ]);
  const storedDemographics = intelligence.intelligence?.marketContext?.demographics;
  const persistedDemographics = storedDemographics?.region.city.trim().toLowerCase() === "hyderabad"
    && storedDemographics.region.state.trim().toLowerCase() === "telangana"
    ? storedDemographics
    : undefined;
  const demographics = persistedDemographics ?? buildDemographicProfile({
    region: { country: "IN", state: "Telangana", city: "Hyderabad", district: "Hyderabad" },
    specialtyFocus: [hospitalProfile.specialty],
  });

  return (
    <PlaybookShell
      eyebrow="Market / Current tenant"
      title="Demographics and competitor intelligence grounded in local evidence."
      description={`${hospitalProfile.name} is the active tenant. Official demographic baselines stay separate from planning estimates, while Google Places supplies visible centre and nearby competitor evidence.`}
    >
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="Verified centre locations" description="Official addresses checked against live Google Places results when the configured API permits access" action={<EvidenceLinks sourceIds={["harika-official-site"]} />} />
          <div className="grid gap-4 lg:grid-cols-3">
            {places.map((place) => <CentreTile key={place.centre} place={place} />)}
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionHeader title="Integration health" description="A configured credential is not presented as live data until the corresponding API responds" />
          <div className="grid gap-4 md:grid-cols-3">
            {integrations.map((integration) => <IntegrationTile key={integration.id} integration={integration} />)}
          </div>
        </Panel>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader title="Official demographic baseline" description="Hyderabad district baseline; suitable for context, not real-time neighbourhood targeting" action={<StatusIndicator label="Census 2011 vintage" tone="warning" />} />
            <div className="grid gap-3 sm:grid-cols-2">
              {officialDemographicBaseline.map((metric) => (
                <div key={metric.label} className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{metric.context}</p>
                </div>
              ))}
            </div>
            <EvidenceLinks sourceIds={["telangana-des-hyd", "census-population-finder"]} />
          </Panel>
          <Panel className="p-5">
            <SectionHeader title="Demographic planning profile" description="Audience and language recommendations derived from the regional baseline" />
            <div className="space-y-4">
              <StatusIndicator label={`${persistedDemographics ? "Persisted" : "Modelled"} / planning only`} tone="warning" />
              <p className="text-sm leading-6 text-muted-foreground">
                These audience proportions guide content testing; they are not patient-level facts or real-time targeting data.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demographics.primaryLanguages.slice(0, 4).map((language) => (
                  <div key={language.language} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><Languages className="size-4 text-primary" />{language.language}</span>
                    <span className="font-medium">{Math.round(language.share * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {demographics.audienceSegments.map((segment) => (
                  <div key={segment.label} className="rounded-lg bg-muted/45 p-3">
                    <p className="text-sm font-medium">{segment.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{segment.healthcareNeed}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
        <Panel className="p-5">
          <SectionHeader
            title="Nearby competitor landscape"
            description="Public Google Places listings around the tenant market, used only for visibility and reputation comparison"
            action={<StatusIndicator label={competitors.length ? `${competitors.length} listings found` : "No listing evidence"} tone={competitors.length ? "success" : "warning"} />}
          />
          {competitors.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {competitors.map((competitor) => <CompetitorTile key={competitor.placeId} competitor={competitor} />)}
            </div>
          ) : (
            <p className="rounded-xl border bg-background p-4 text-sm leading-6 text-muted-foreground">
              No nearby competitor records were returned by the configured Places search. Refresh the search criteria or verify API access before using competitor comparisons.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Places ratings and visible review counts are public listing indicators only. Content, clinical quality and patient outcomes are not inferred from them.
          </p>
        </Panel>
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="p-5">
            <SectionHeader title="Questions the intelligence layer must answer" description="These become measured signals, not decorative statistics." />
            <div className="space-y-3">
              {marketQuestions.map((question, index) => (
                <div key={question} className="flex gap-3 rounded-xl border bg-background p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info text-sm font-semibold text-primary">{index + 1}</span>
                  <p className="text-sm leading-6">{question}</p>
                </div>
              ))}
            </div>
          </Panel>
          <SourcesPanel sources={evidenceSources.filter((source) => ["harika-official-site", "telangana-des-hyd", "census-population-finder", "dghs-nppcd"].includes(source.id))} />
        </div>
      </div>
    </PlaybookShell>
  );
}

function CentreTile({ place }: { place: LivePlaceLocation }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <MapPinned className="size-5 text-primary" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{place.centre}</h3>
        <StatusIndicator label={place.status} tone={place.status === "Matched" ? "success" : place.status === "Unavailable" ? "warning" : "neutral"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{place.officialAddress}</p>
      {place.mapsAddress && <p className="mt-3 rounded-lg bg-info/35 p-3 text-xs leading-5">Maps result: {place.mapsName} / {place.mapsAddress}</p>}
      {place.rating !== undefined && <p className="mt-3 text-xs font-medium text-primary">Live Maps listing: {place.rating.toFixed(1)} rating / {place.reviews ?? 0} reviews</p>}
      {place.detail && <p className="mt-3 text-xs text-muted-foreground">{place.detail}</p>}
    </article>
  );
}

function IntegrationTile({ integration }: { integration: IntegrationHealth }) {
  const icon = integration.id === "maps" ? <MapPinned /> : integration.id === "gbp" ? <Compass /> : integration.id === "meta" ? <Stethoscope /> : <AlertTriangle />;
  return (
    <article className="rounded-xl border bg-background p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <h3 className="mt-3 text-sm font-semibold">{integration.label}</h3>
      <div className="mt-2">
        <StatusIndicator label={integration.status} tone={integration.status === "Connected" ? "success" : integration.status === "Needs attention" ? "warning" : "neutral"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{integration.detail}</p>
    </article>
  );
}

function CompetitorTile({ competitor }: { competitor: PlaceCompetitor }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <UsersRound className="size-5 text-primary" />
      <h3 className="mt-3 text-sm font-semibold">{competitor.name}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{competitor.address}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusIndicator label={competitor.rating ? `${competitor.rating.toFixed(1)} rating` : "No rating"} tone={competitor.rating >= 4 ? "success" : "neutral"} />
        <StatusIndicator label={`${competitor.reviews.toLocaleString("en-IN")} reviews`} tone="neutral" />
      </div>
    </article>
  );
}
