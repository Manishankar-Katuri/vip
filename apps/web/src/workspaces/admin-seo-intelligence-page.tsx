"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Compass,
  FileSearch,
  Gauge,
  Globe,
  Link2,
  MapPinned,
  MessageCircle,
  MousePointerClick,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

import {
  IntelligenceActionQueue,
  IntelligenceHero,
  IntelligenceMetricGrid,
  type IntelligenceAction,
  type IntelligenceMetric,
  type SurfaceState,
  surfaceTone,
} from "@/design-system/dashboard-surfaces";
import { AlertBanner, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { Tone } from "@/design-system/theme";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import { isHarikaHospital } from "@/lib/harika-workspace";
import { hospitalProfile, resultMeasures, websiteChecks } from "@/lib/playbook/harika-playbook";

type CoverageStatus = "Connected" | "Partial" | "Foundation only" | "Setup needed";

type CoverageItem = {
  title: string;
  status: CoverageStatus;
  detail: string;
  owner: string;
  icon: React.ComponentType<{ className?: string }>;
};

type IntentCluster = {
  title: string;
  intent: string;
  examples: string[];
  landingPage: string;
  priority: "High" | "Medium";
  dependency: string;
};

type AuditItem = {
  area: string;
  check: string;
  status: string;
  state: SurfaceState;
};

type ContentGap = {
  title: string;
  source: string;
  action: string;
  priority: "High" | "Medium";
};

const seoCoverage: CoverageItem[] = [
  {
    title: "Search Console",
    status: "Setup needed",
    detail: "Required before organic clicks, impressions, CTR, positions, queries, and page trends can be treated as measured SEO.",
    owner: "Growth",
    icon: Search,
  },
  {
    title: "GBP performance",
    status: "Partial",
    detail: "Public listing evidence exists elsewhere; owned calls, website clicks, directions, and search terms still need authenticated GBP performance access.",
    owner: "Admin",
    icon: MapPinned,
  },
  {
    title: "Google Places",
    status: "Connected",
    detail: "Public centre/listing evidence can support local discoverability checks without making owned-performance claims.",
    owner: "Ops",
    icon: Compass,
  },
  {
    title: "Website crawl",
    status: "Foundation only",
    detail: "Audit categories are defined. A crawler can later populate metadata, broken links, indexability, and structured data checks.",
    owner: "SEO",
    icon: FileSearch,
  },
  {
    title: "Conversion tracking",
    status: "Setup needed",
    detail: "Phone taps, WhatsApp clicks, appointment submits, and GBP actions need instrumentation before attribution is shown.",
    owner: "Analytics",
    icon: MousePointerClick,
  },
  {
    title: "Competitor tracking",
    status: "Setup needed",
    detail: "Nearby competitor listing and service-page comparisons should stay setup-labeled until tracked search data is available.",
    owner: "Market",
    icon: Target,
  },
];

const visibilityMetrics: IntelligenceMetric[] = [
  {
    label: "Organic clicks",
    value: "Setup",
    detail: "Connect Search Console before click totals are displayed.",
    state: "empty",
    icon: MousePointerClick,
  },
  {
    label: "Search impressions",
    value: "Setup",
    detail: "Impressions will split by branded, local, service, and education queries.",
    state: "empty",
    icon: BarChart3,
  },
  {
    label: "Average CTR",
    value: "Setup",
    detail: "CTR will be calculated from measured Search Console clicks and impressions.",
    state: "empty",
    icon: Gauge,
  },
  {
    label: "Average position",
    value: "Setup",
    detail: "Shown only as Search Console's averaged position signal, not a fixed rank.",
    state: "empty",
    icon: SlidersHorizontal,
  },
];

const intentClusters: IntentCluster[] = [
  {
    title: "Local ENT searches",
    intent: "Find a nearby specialist or centre",
    examples: ["ENT doctor Hyderabad", "ENT clinic Kondapur", "ENT specialist near me"],
    landingPage: "Centre-specific location pages",
    priority: "High",
    dependency: "Search Console and location pages",
  },
  {
    title: "Sinus care",
    intent: "Understand symptoms and choose consultation",
    examples: ["sinus specialist Hyderabad", "sinus infection doctor", "blocked nose ENT"],
    landingPage: "Sinus care service page and FAQ",
    priority: "High",
    dependency: "Reviewed service content",
  },
  {
    title: "Hearing care",
    intent: "Evaluate hearing symptoms and testing options",
    examples: ["hearing test Hyderabad", "hearing loss symptoms", "ear specialist near me"],
    landingPage: "Hearing screening page",
    priority: "High",
    dependency: "Doctor-reviewed education copy",
  },
  {
    title: "Pediatric ENT",
    intent: "Find family-safe ENT guidance",
    examples: ["child ENT doctor", "tonsils doctor for child", "adenoid specialist"],
    landingPage: "Pediatric ENT service page",
    priority: "Medium",
    dependency: "Clinical scope confirmation",
  },
  {
    title: "Throat and voice concerns",
    intent: "Understand persistent throat or voice symptoms",
    examples: ["voice change doctor", "throat pain ENT", "vocal cord specialist"],
    landingPage: "Throat and voice care page",
    priority: "Medium",
    dependency: "Safe YMYL wording review",
  },
  {
    title: "Branded trust searches",
    intent: "Validate hospital, doctor, reviews, and contact details",
    examples: ["Harika ENT reviews", "Dr Harika ENT hospital", "Harika ENT phone number"],
    landingPage: "Homepage, doctor profile, and locations",
    priority: "High",
    dependency: "GBP, NAP, and review ingestion",
  },
];

const serviceAudit: AuditItem[] = [
  {
    area: "ENT service pages",
    check: "Clear service explanation, safe symptoms guidance, appointment CTA, and internal links.",
    status: "Audit queued",
    state: "degraded",
  },
  {
    area: "Location pages",
    check: "Centre address, phone, hours, directions, nearby context, and GBP listing match.",
    status: "Needs buildout",
    state: "empty",
  },
  {
    area: "FAQs",
    check: "Patient-friendly questions for sinus, hearing, pediatric ENT, throat, and post-visit care.",
    status: "Content gaps",
    state: "degraded",
  },
  {
    area: "Metadata",
    check: "Unique titles and descriptions that reflect page intent without keyword stuffing.",
    status: "Crawler needed",
    state: "empty",
  },
  {
    area: "Safe CTAs",
    check: "Consultation guidance without emergency ambiguity, unsupported outcomes, or superlatives.",
    status: "Approval required",
    state: "degraded",
  },
  {
    area: "Doctor-reviewed wording",
    check: "Visible clinical review path for YMYL healthcare content before publishing.",
    status: "Required",
    state: "degraded",
  },
];

const contentGaps: ContentGap[] = [
  {
    title: "Sinus care FAQ",
    source: "Website audit",
    action: "Create a plain-language page for blocked nose, sinus symptoms, consultation timing, and safe next steps.",
    priority: "High",
  },
  {
    title: "Hearing screening page",
    source: "Social signal",
    action: "Turn hearing-awareness content into a measurable landing page with appointment and call actions.",
    priority: "High",
  },
  {
    title: "Tinnitus education",
    source: "Search Console-needed",
    action: "Prepare reviewed educational copy, then validate query demand after Search Console connection.",
    priority: "Medium",
  },
  {
    title: "Pediatric ENT page",
    source: "GBP/review signal",
    action: "Map parent questions into a clinically reviewed page for tonsils, adenoids, and ear infections.",
    priority: "Medium",
  },
  {
    title: "Throat and voice care",
    source: "Website audit",
    action: "Add safe symptom education and consultation guidance without diagnostic claims.",
    priority: "Medium",
  },
  {
    title: "Centre-specific pages",
    source: "Local SEO",
    action: "Create or refresh pages for each centre so business facts and local intent have a clear destination.",
    priority: "High",
  },
];

const technicalChecks: AuditItem[] = [
  { area: "Sitemap", check: "XML sitemap presence and discoverable service/location URLs.", status: "Crawler needed", state: "empty" },
  { area: "Robots.txt", check: "Confirm important healthcare pages are crawlable.", status: "Crawler needed", state: "empty" },
  { area: "Canonical tags", check: "Detect duplicate or conflicting canonical URLs.", status: "Crawler needed", state: "empty" },
  { area: "Broken links", check: "Find internal links that block patient journeys or search crawling.", status: "Crawler needed", state: "empty" },
  { area: "Mobile usability", check: "Confirm location, phone, WhatsApp, and appointment actions work on mobile.", status: "Manual QA", state: "degraded" },
  { area: "Core Web Vitals", check: "Track loading, interactivity, and visual stability after measurement is connected.", status: "Setup needed", state: "empty" },
  { area: "Structured data", check: "Prepare LocalBusiness/medical organization, breadcrumb, and page-level schema readiness.", status: "Foundation only", state: "degraded" },
  { area: "Alt text", check: "Check service and doctor images for useful text alternatives.", status: "Crawler needed", state: "empty" },
];

const seoActions: IntelligenceAction[] = [
  {
    title: "Connect Google Search Console",
    detail: "Unlock measured queries, pages, clicks, impressions, CTR, average position, index signals, and search appearance reporting.",
    owner: "Growth",
    due: "Before SEO launch",
    state: "empty",
  },
  {
    title: "Verify every centre's NAP details",
    detail: "Confirm names, addresses, phone numbers, hours, and location-page mappings before attributing local search performance.",
    owner: "Ops",
    due: "This week",
    state: "degraded",
  },
  {
    title: "Create or refresh location pages",
    detail: "Give Kondapur, Chandanagar, and Vanasthalipuram searches a clear centre-level destination with verified access details.",
    owner: "SEO",
    due: "This sprint",
    state: "empty",
  },
  {
    title: "Audit service pages for healthcare trust",
    detail: "Review ENT pages for safe medical claims, doctor-reviewed wording, plain-language explanations, and appointment CTAs.",
    owner: "Clinical",
    due: "Before publishing",
    state: "degraded",
  },
  {
    title: "Add structured data readiness",
    detail: "Prepare local business, breadcrumb, location, and service-page schema validation without promising rich-result visibility.",
    owner: "Engineering",
    due: "After page audit",
    state: "degraded",
  },
  {
    title: "Track call, WhatsApp, and appointment actions",
    detail: "Instrument conversion events so SEO can report patient-intent outcomes instead of vanity visibility only.",
    owner: "Analytics",
    due: "After Search Console",
    state: "empty",
  },
  {
    title: "Add competitor search tracking",
    detail: "Track nearby ENT competitors only after source data can separate observed visibility from assumptions.",
    owner: "Market",
    due: "Later",
    state: "empty",
  },
];

export function AdminSEOIntelligencePage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const isHarika = isHarikaHospital(selectedHospital);
  const centres = isHarika
    ? hospitalProfile.locations
    : [
        {
          name: `${selectedHospital.city} primary centre`,
          address: "Centre address requires workspace setup before local SEO attribution.",
          phone: "Phone number requires verification",
        },
      ];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="SEO intelligence"
        title={`${selectedHospital.name} SEO intelligence`}
        description="Search visibility, local discoverability, website trust, technical health, and conversion-readiness for healthcare growth."
        icon={Globe}
        state="degraded"
      >
        <StatusIndicator label="Search Console needed" tone="warning" />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <AlertBanner
          title="Foundation view: measured SEO sources are not connected yet"
          message="This page shows the exact SEO control room structure while keeping clicks, rankings, calls, and attribution setup-labeled until Search Console, GBP performance, and conversion tracking are available."
          tone="warning"
        />

        <Panel className="p-5">
          <SectionHeader
            title="SEO coverage status"
            description="Source readiness for search visibility, local discovery, website crawl health, attribution, and competitor tracking."
            action={<StatusIndicator label="Honest states" tone="info" />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {seoCoverage.map((item) => (
              <CoverageCard key={item.title} item={item} />
            ))}
          </div>
        </Panel>

        <IntelligenceMetricGrid metrics={visibilityMetrics} />

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Local SEO and centre coverage"
              description="Centre-level business facts, listing readiness, and website destination checks."
              action={<MapPinned className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 lg:grid-cols-3">
              {centres.map((centre) => (
                <CentreSeoCard key={centre.name} centre={centre} isHarika={isHarika} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Local ranking frame"
              description="The page separates what can be controlled from what needs measured source data."
              action={<StatusIndicator label="Google local model" tone="info" />}
            />
            <div className="space-y-3">
              <EvidenceRow
                icon={Search}
                title="Relevance"
                detail="Business categories, service pages, location pages, and content clarity help match patient search intent."
                state="degraded"
              />
              <EvidenceRow
                icon={MapPinned}
                title="Distance"
                detail="Centre proximity matters for Maps and local results; each location needs verified business facts."
                state="degraded"
              />
              <EvidenceRow
                icon={Sparkles}
                title="Prominence"
                detail="Reviews, links, brand searches, listing strength, and trustworthy content contribute to discoverability."
                state="empty"
              />
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Keyword and intent intelligence"
            description="Healthcare searches grouped by patient intent so future rankings connect to the right page and action."
            action={<StatusIndicator label="Clusters ready" tone="info" />}
          />
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {intentClusters.map((cluster) => (
              <IntentClusterCard key={cluster.title} cluster={cluster} />
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Service page quality audit"
              description="Healthcare/YMYL trust checks for service, location, FAQ, metadata, and CTA quality."
              action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {serviceAudit.map((item) => (
                <AuditRow key={item.area} item={item} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Content gap intelligence"
              description="Recommended pages and updates labeled by the evidence source that should drive them."
              action={<FileSearch className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {contentGaps.map((gap) => (
                <ContentGapCard key={gap.title} gap={gap} />
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Technical SEO health"
              description="Compact operational checks for crawlability, metadata, mobile quality, Core Web Vitals, and schema readiness."
              action={<Activity className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              {technicalChecks.map((item) => (
                <AuditRow key={item.area} item={item} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Conversion bridge"
              description="Where SEO visibility becomes patient intent once tracking is connected."
              action={<MousePointerClick className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {resultMeasures
                .filter((group) => group.label === "Discovery" || group.label === "Intent")
                .map((group) => (
                  <div key={group.label} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{group.label}</p>
                      <StatusIndicator label="Setup needed" tone="neutral" />
                    </div>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                      {group.measures.map((measure) => (
                        <li key={measure}>{measure}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              <EvidenceRow
                icon={Phone}
                title="Phone and WhatsApp actions"
                detail="Track tap-to-call and WhatsApp click events before attributing enquiries to SEO."
                state="empty"
              />
              <EvidenceRow
                icon={MessageCircle}
                title="Appointment form submits"
                detail="Form submits need analytics tagging and source attribution before reporting conversion lift."
                state="empty"
              />
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Website audit foundation"
            description="Existing playbook checks that feed the SEO page until crawl and Search Console data are connected."
            action={<StatusIndicator label="Playbook linked" tone="info" />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {websiteChecks.map((check) => (
              <div key={check.area} className="rounded-lg border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{check.area}</p>
                  <StatusIndicator label={check.status} tone={check.status === "Approval required" ? "warning" : "neutral"} />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{check.action}</p>
              </div>
            ))}
          </div>
        </Panel>

        <IntelligenceActionQueue
          title="Next SEO actions"
          description="Prioritized so the page can show a complete control room now and light up measured SEO later."
          actions={seoActions}
        />
      </section>
    </main>
  );
}

function CoverageCard({ item }: { item: CoverageItem }) {
  const Icon = item.icon;

  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <StatusIndicator label={item.status} tone={coverageTone(item.status)} />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Owner: {item.owner}</p>
    </article>
  );
}

function CentreSeoCard({
  centre,
  isHarika,
}: {
  centre: { name: string; address: string; phone: string };
  isHarika: boolean;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <MapPinned className="size-5 shrink-0 text-primary" aria-hidden />
        <StatusIndicator label={isHarika ? "Verify NAP" : "Setup needed"} tone={isHarika ? "warning" : "neutral"} />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{centre.name}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{centre.address}</p>
      <div className="mt-3 space-y-2 text-xs">
        <p className="flex items-center gap-2">
          <Phone className="size-4 text-primary" aria-hidden />
          {centre.phone}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Link2 className="size-4 text-primary" aria-hidden />
          Location page: {isHarika ? "Needs page mapping" : "Requires setup"}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden />
          GBP match: {isHarika ? "Validate against listing" : "Not connected"}
        </p>
      </div>
    </article>
  );
}

function EvidenceRow({
  icon: Icon,
  title,
  detail,
  state,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  state: SurfaceState;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <StatusIndicator label={stateLabel(state)} tone={surfaceTone[state]} />
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function IntentClusterCard({ cluster }: { cluster: IntentCluster }) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{cluster.title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{cluster.intent}</p>
        </div>
        <StatusIndicator label={cluster.priority} tone={cluster.priority === "High" ? "warning" : "info"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {cluster.examples.map((example) => (
          <span key={example} className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            {example}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Landing page: <span className="font-medium text-foreground">{cluster.landingPage}</span>
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Dependency: {cluster.dependency}
      </p>
    </article>
  );
}

function AuditRow({ item }: { item: AuditItem }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold">{item.area}</p>
        <StatusIndicator label={item.status} tone={surfaceTone[item.state]} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.check}</p>
    </div>
  );
}

function ContentGapCard({ gap }: { gap: ContentGap }) {
  return (
    <article className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{gap.title}</h3>
        <StatusIndicator label={gap.priority} tone={gap.priority === "High" ? "warning" : "info"} />
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary">{gap.source}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{gap.action}</p>
    </article>
  );
}

function coverageTone(status: CoverageStatus): Tone {
  if (status === "Connected") return "success";
  if (status === "Partial") return "warning";
  if (status === "Foundation only") return "info";
  return "neutral";
}

function stateLabel(state: SurfaceState) {
  if (state === "ready") return "Ready";
  if (state === "degraded") return "Partial";
  if (state === "empty") return "Setup";
  if (state === "error") return "Error";
  return "Mock";
}
