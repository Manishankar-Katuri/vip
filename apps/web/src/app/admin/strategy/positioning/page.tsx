import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  HeartHandshake,
  Languages,
  MessageSquareText,
  Microscope,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
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
import { getProductExperience, integer, type ProductExperience } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import type { Tone } from "@/design-system/theme";

export const dynamic = "force-dynamic";

type TrustScoreFactor = {
  key: string;
  label: string;
  score: number;
  weight: number;
  status: "Evidence-based" | "Needs proof" | "Action needed";
  detail: string;
};

type TrustOpportunity = {
  title: string;
  analysis: string;
  opportunities: string[];
  evidence: string;
  tone: Tone;
  icon: LucideIcon;
};

type TrustRoadmapStep = {
  period: "Days 1-30" | "Days 31-60" | "Days 61-90";
  title: string;
  owner: string;
  action: string;
  proofAsset: string;
  channel: string;
  expectedTrustMovement: string;
};

type TrustOutcome = {
  title: string;
  value: string;
  detail: string;
  indicator: string;
  icon: LucideIcon;
};

type TrustContext = {
  data: ProductExperience;
  places: LivePlaceLocation[];
  competitors: PlaceCompetitor[];
  gbpConnected: boolean;
  metaConnected: boolean;
  totalReviews: number;
  averageRating?: number;
  matchedPlaces: LivePlaceLocation[];
  positiveSnippetCount: number;
  complaintSnippetCount: number;
};

const sourceLinks = [
  {
    publisher: "Edelman",
    title: "2026 Trust Barometer: Trust and Health",
    detail: "Healthcare providers need clarity, empathy, community engagement, and guide-like communication as health trust fragments.",
    url: "https://www.edelman.com/trust/2026/trust-barometer/special-report-health",
  },
  {
    publisher: "HubSpot",
    title: "2026 State of Marketing",
    detail: "Human-led marketing, sharper brand point of view, trust, and relevance matter more as AI floods channels with content.",
    url: "https://www.hubspot.com/state-of-marketing",
  },
  {
    publisher: "HubSpot",
    title: "Consistent brand voice",
    detail: "Consistent voice builds recognition, trust, confidence, and cross-team alignment across customer touchpoints.",
    url: "https://blog.hubspot.com/marketing/consistent-brand-voice",
  },
  {
    publisher: "American Medical Association",
    title: "Responding to online patient reviews",
    detail: "Review responses can build trust, but must avoid patient-specific information and PHI disclosure.",
    url: "https://www.ama-assn.org/system/files/regulatory-myths-online-reviews.pdf",
  },
  {
    publisher: "Federal Trade Commission",
    title: "Consumer reviews and testimonials rule",
    detail: "Reviews and testimonials must not be fake, false, misleading, suppressed, or presented without required relationship context.",
    url: "https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers",
  },
];

export default async function AdminPositioningTrustStrategyPage() {
  const [data, places, integrations] = await Promise.all([
    getProductExperience(),
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);
  const competitorGroups = await findCompetitorsForLocations(places, "Hyderabad", "ENT");
  const competitors = uniqueCompetitors(competitorGroups.flatMap((group) => group.competitors));
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const totalReviews = matchedPlaces.reduce((total, place) => total + (place.reviews ?? 0), 0);
  const averageRating = calculateWeightedRating(matchedPlaces);
  const reviewSnippets = [
    ...matchedPlaces.flatMap((place) => place.reviewSnippets),
    ...competitors.flatMap((competitor) => competitor.reviewSnippets),
  ];
  const gbpConnected = integrations.find((integration) => integration.id === "gbp")?.status === "Connected";
  const metaConnected = integrations.find((integration) => integration.id === "meta")?.status === "Connected";
  const context: TrustContext = {
    data,
    places,
    competitors,
    gbpConnected,
    metaConnected,
    totalReviews,
    averageRating,
    matchedPlaces,
    positiveSnippetCount: reviewSnippets.filter((snippet) => snippet.rating >= 4).length,
    complaintSnippetCount: reviewSnippets.filter((snippet) => snippet.rating <= 2).length,
  };

  const factors = calculatePositioningTrustScore(context);
  const trustScore = factors.reduce((total, factor) => total + factor.score, 0);
  const brandConsistency = factorPercent(factors, "brand-consistency");
  const messageAlignment = factorPercent(factors, "message-alignment");
  const authorityReadiness = authorityPercent(factors);
  const pageState: SurfaceState = trustScore >= 72 ? "ready" : trustScore >= 48 ? "degraded" : "empty";
  const metrics: IntelligenceMetric[] = [
    {
      label: "Trust Score",
      value: `${trustScore}/100`,
      detail: "Weighted score across brand consistency, message alignment, authority, doctor credibility, patient proof, social proof, review trust and community trust.",
      state: scoreState(trustScore),
      icon: Gauge,
    },
    {
      label: "Brand Consistency",
      value: `${brandConsistency}%`,
      detail: "Measures whether hospital identity, centre data, language, doctor proof and channel signals are consistent enough to create confidence.",
      state: scoreState(brandConsistency),
      icon: ShieldCheck,
    },
    {
      label: "Message Alignment",
      value: `${messageAlignment}%`,
      detail: "Checks whether the positioning message connects specialty, location, patient reassurance, proof and next-step CTAs.",
      state: scoreState(messageAlignment),
      icon: Target,
    },
    {
      label: "Authority Readiness",
      value: `${authorityReadiness}%`,
      detail: "Combines doctor credibility and authority-building evidence into a readiness score for hospital authority growth.",
      state: scoreState(authorityReadiness),
      icon: Stethoscope,
    },
  ];
  const opportunities = buildTrustOpportunities(context);
  const roadmap = buildTrustRoadmap();
  const outcomes = buildTrustOutcomes(context);

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Positioning trust strategy"
        title={`${hospitalProfile.name} trust and authority engine`}
        description="A healthcare-safe strategy page that scores current trust signals, diagnoses credibility gaps, and converts hospital authority into clear actions for reputation and conversion growth."
        icon={HeartHandshake}
        state={pageState}
      >
        <StatusIndicator label="Hospital credibility focus" tone="success" />
        <StatusIndicator label={gbpConnected ? "GBP proof connected" : "GBP proof limited"} tone={gbpConnected ? "success" : "warning"} />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {(!gbpConnected || !metaConnected) && (
          <AlertBanner
            title="Some trust evidence is not fully connected"
            message="The strategy can still recommend credibility actions, but score details separate evidence-based signals from areas that need proof before being treated as live trust intelligence."
            tone="warning"
          />
        )}

        <IntelligenceMetricGrid metrics={metrics} />

        <Panel className="p-5">
          <SectionHeader
            title="Trust score factors"
            description="Transparent weighted scoring. Each factor is labelled as evidence-based, needs proof, or action needed."
            action={<StatusIndicator label="100-point model" tone="info" />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {factors.map((factor) => (
              <TrustFactorCard key={factor.key} factor={factor} />
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
          <Panel className="p-5">
            <SectionHeader
              title="Current trust evidence"
              description="What the system can safely use today, without overstating missing live data."
              action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <EvidenceMetric label="Matched centres" value={`${matchedPlaces.length}/${places.length}`} detail="Centre listings matched to public Places evidence." />
              <EvidenceMetric label="Visible reviews" value={integer(totalReviews)} detail="Public review totals from matched listings only." />
              <EvidenceMetric label="Weighted rating" value={averageRating ? averageRating.toFixed(1) : "N/A"} detail="Weighted by public review volume where ratings are available." />
              <EvidenceMetric label="Competitor benchmarks" value={competitors.length ? `${competitors.length}` : "Limited"} detail="Nearby ENT competitor proof available for context when Places data is configured." />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Trust strategy thesis"
              description="How research translates into hospital credibility and authority work."
              action={<Sparkles className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {[
                "Edelman's health trust research points to clarity, empathy, community engagement and providers acting as guides, not just experts.",
                "HubSpot's marketing research reinforces that trust now depends on human expertise, a clear point of view and consistent brand voice across channels.",
                "Healthcare reputation work must convert patient proof into safe, consent-aware signals while review replies avoid patient-specific disclosures.",
              ].map((item) => (
                <p key={item} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {opportunities.slice(0, 2).map((opportunity) => (
            <TrustOpportunityPanel key={opportunity.title} opportunity={opportunity} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {opportunities.slice(2, 8).map((opportunity) => (
            <TrustOpportunityPanel key={opportunity.title} opportunity={opportunity} />
          ))}
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Trust building roadmap"
            description="A 30/60/90 day execution sequence for hospital credibility and authority."
            action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {roadmap.map((step) => (
              <RoadmapCard key={step.period} step={step} />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Expected outcomes"
            description="The business impact this strategy should improve when proof assets and review workflows are executed consistently."
            action={<TrendingUp className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <OutcomeCard key={outcome.title} outcome={outcome} />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Research anchors"
            description="External guidance used to shape this hospital trust and authority strategy."
            action={<ExternalLink className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border bg-background p-3 transition hover:border-primary/40"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                  {source.title}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.detail}</p>
              </a>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function calculatePositioningTrustScore(context: TrustContext): TrustScoreFactor[] {
  const centreCoverage = context.places.length ? context.matchedPlaces.length / context.places.length : 0;
  const hasReviews = context.totalReviews > 0;
  const ratingStrength = context.averageRating ? Math.min(1, context.averageRating / 5) : 0;
  const hasSocialAnalytics = Boolean(context.data.available && context.data.analytics?.totalPosts);
  const hasAuthoritySignals = Boolean(context.data.recommendations.length || context.data.intelligence?.competitors);
  const reviewStrength = hasReviews ? Math.min(1, (context.totalReviews / 250) * 0.55 + ratingStrength * 0.45) : 0;

  return [
    {
      key: "brand-consistency",
      label: "Brand consistency",
      weight: 15,
      score: weightedScore(15, centreCoverage * 0.65 + (context.gbpConnected ? 0.2 : 0) + (context.metaConnected ? 0.15 : 0)),
      status: centreCoverage >= 0.9 && context.gbpConnected ? "Evidence-based" : centreCoverage > 0 ? "Needs proof" : "Action needed",
      detail: "Centre matches, GBP readiness, social profile readiness and consistent hospital identity across patient touchpoints.",
    },
    {
      key: "message-alignment",
      label: "Message alignment",
      weight: 15,
      score: weightedScore(15, 0.72 + (hasSocialAnalytics ? 0.1 : 0) + (context.gbpConnected ? 0.08 : 0)),
      status: "Needs proof",
      detail: "Strategy uses the hospital promise, ENT focus, Hyderabad relevance, patient reassurance and clear CTAs; channel-level copy still needs auditing.",
    },
    {
      key: "authority-signals",
      label: "Authority signals",
      weight: 15,
      score: weightedScore(15, 0.55 + (hasAuthoritySignals ? 0.18 : 0) + (context.competitors.length ? 0.12 : 0)),
      status: hasAuthoritySignals ? "Evidence-based" : "Needs proof",
      detail: "Doctor-led education, reviewed service pages, source-backed FAQs, competitor context and content intelligence.",
    },
    {
      key: "doctor-credibility",
      label: "Doctor credibility",
      weight: 15,
      score: weightedScore(15, 0.62 + (hasSocialAnalytics ? 0.12 : 0)),
      status: "Needs proof",
      detail: "Doctor profiles, clinical review signals, procedure explainers and visible expert guidance are recommended but need asset-level proof checks.",
    },
    {
      key: "patient-proof",
      label: "Patient proof",
      weight: 10,
      score: weightedScore(10, Math.min(1, context.positiveSnippetCount / 8) * 0.55 + reviewStrength * 0.45),
      status: context.positiveSnippetCount ? "Evidence-based" : hasReviews ? "Needs proof" : "Action needed",
      detail: "Uses recurring positive review themes only as privacy-safe proof; consent is required before any identifiable patient story.",
    },
    {
      key: "social-proof",
      label: "Social proof",
      weight: 10,
      score: weightedScore(10, (hasSocialAnalytics ? 0.55 : 0.25) + (context.metaConnected ? 0.25 : 0) + (hasReviews ? 0.15 : 0)),
      status: hasSocialAnalytics ? "Evidence-based" : "Needs proof",
      detail: "Social reach, profile trust, GBP posts and shareable education should reinforce authority without replacing clinical proof.",
    },
    {
      key: "review-trust",
      label: "Review trust",
      weight: 10,
      score: weightedScore(10, reviewStrength * 0.75 + (context.gbpConnected ? 0.2 : 0)),
      status: hasReviews ? "Evidence-based" : "Action needed",
      detail: "Review volume, weighted rating, GBP connection and complaint-theme visibility shape reputation confidence.",
    },
    {
      key: "community-trust",
      label: "Community trust",
      weight: 10,
      score: weightedScore(10, 0.5 + (hospitalProfile.languages.length >= 3 ? 0.2 : 0) + (context.data.available ? 0.1 : 0)),
      status: "Needs proof",
      detail: "Local-language education, community awareness, school/family health campaigns and consent-based WhatsApp follow-through.",
    },
  ];
}

function buildTrustOpportunities(context: TrustContext): TrustOpportunity[] {
  const reviewDetail = context.averageRating
    ? `${integer(context.totalReviews)} public reviews with ${context.averageRating.toFixed(1)} weighted rating are visible across matched centres.`
    : "Review proof is limited until public listings and GBP ownership are fully connected.";
  const socialDetail = context.data.available && context.data.analytics
    ? `${integer(context.data.analytics.totalPosts)} social posts are available for performance context.`
    : "Social proof needs channel connection or current performance evidence.";

  return [
    {
      title: "Brand Consistency Analysis",
      analysis: "Hospital credibility starts with one recognizable identity across website, GBP, social profiles, doctor bios, locations and patient contact paths.",
      opportunities: [
        "Standardize hospital name, specialty, location names, phone, address and appointment CTAs across website, GBP and social bios.",
        "Create one voice guide for calm, educational, responsible and locally relevant ENT communication.",
        "Audit every centre page and profile for language consistency across English, Telugu and Hindi expectations.",
      ],
      evidence: `${context.matchedPlaces.length}/${context.places.length} centres are matched to public listing evidence.`,
      tone: context.matchedPlaces.length === context.places.length ? "success" : "warning",
      icon: ShieldCheck,
    },
    {
      title: "Message Alignment Analysis",
      analysis: "The core promise should connect ENT expertise, Hyderabad access, family reassurance, patient education and easy next steps.",
      opportunities: [
        "Turn the positioning promise into a repeatable message: responsible ENT guidance, multi-centre access and doctor-reviewed care education.",
        "Align high-intent CTAs so website pages, GBP posts and social content guide patients toward calls, WhatsApp, directions or appointment requests.",
        "Remove vague claims and replace them with operational strengths: centre access, languages, doctor review and patient-safe education.",
      ],
      evidence: hospitalProfile.promise,
      tone: "info",
      icon: Target,
    },
    {
      title: "Authority Building Opportunities",
      analysis: "Authority should come from useful guidance, clinical review, source-backed education and clear service depth rather than generic promotional claims.",
      opportunities: [
        "Publish doctor-reviewed explainers for sinus, hearing, throat, pediatric ENT and emergency warning-sign topics.",
        "Add source-backed FAQs and plain-language service pages that answer patient fears without diagnosing online.",
        "Use competitor gaps to choose topics where the hospital can be clearer, more useful and more locally relevant.",
      ],
      evidence: context.competitors.length ? `${context.competitors.length} competitor benchmarks are available for authority-gap context.` : "Competitor authority gaps need Places data before ranking claims are trusted.",
      tone: context.competitors.length ? "success" : "warning",
      icon: Microscope,
    },
    {
      title: "Doctor Credibility Opportunities",
      analysis: "Doctor credibility is strongest when patients can see expertise, review governance, procedure clarity and the human guide behind the hospital.",
      opportunities: [
        "Upgrade doctor profiles with credentials, specialties, clinical interests, languages and reviewed content ownership.",
        "Create short doctor videos that explain common ENT decisions, preparation steps and when consultation is appropriate.",
        "Attach a visible clinical review signal to education assets so patients know the guidance is doctor-approved.",
      ],
      evidence: hospitalProfile.governance,
      tone: "info",
      icon: Stethoscope,
    },
    {
      title: "Patient Proof Opportunities",
      analysis: "Patient proof should be consent-safe, privacy-aware and theme-based unless explicit documented consent exists.",
      opportunities: [
        "Convert recurring positive review themes into anonymous proof points for website, GBP and social copy.",
        "Create consent workflows before using patient stories, photos or identifiable experience details.",
        "Avoid before-and-after style proof unless compliance, consent and medical context are reviewed.",
      ],
      evidence: context.positiveSnippetCount ? `${context.positiveSnippetCount} positive public snippets can be reviewed for theme-level proof.` : "Positive proof themes need stronger review capture before use.",
      tone: context.positiveSnippetCount ? "success" : "warning",
      icon: Users,
    },
    {
      title: "Social Proof Opportunities",
      analysis: "Social proof should make the hospital familiar, helpful and human while reinforcing doctor authority and review trust.",
      opportunities: [
        "Repurpose doctor-led explainers into reels, carousels, GBP posts and YouTube Shorts.",
        "Use engagement patterns to identify which education formats patients save, share and revisit.",
        "Pair trust posts with visible CTAs and location cues so social attention can become appointments.",
      ],
      evidence: socialDetail,
      tone: context.data.available ? "success" : "warning",
      icon: Sparkles,
    },
    {
      title: "Review-Based Trust Opportunities",
      analysis: "Reviews are a conversion trust layer, but healthcare replies must protect privacy and testimonial use must avoid misleading proof.",
      opportunities: [
        "Build a weekly review request rhythm after suitable visits using polite QR or WhatsApp prompts.",
        "Reply to reviews with general, privacy-safe language that never confirms a patient relationship or discloses PHI.",
        "Escalate negative-review patterns into patient-experience tasks and report the operational fix internally.",
      ],
      evidence: reviewDetail,
      tone: context.totalReviews ? "success" : "warning",
      icon: MessageSquareText,
    },
    {
      title: "Community Trust Opportunities",
      analysis: "Community trust grows when the hospital is visibly useful to local families before they need an appointment.",
      opportunities: [
        "Create local-language care cards for common ENT concerns that families can share safely.",
        "Run school, parent and seasonal awareness topics around hearing, sinus, throat and allergy concerns.",
        "Use WhatsApp only for consented reminders, education cards and official appointment follow-through.",
      ],
      evidence: `${hospitalProfile.languages.join(", ")} language coverage is part of the hospital profile.`,
      tone: "info",
      icon: Languages,
    },
  ];
}

function buildTrustRoadmap(): TrustRoadmapStep[] {
  return [
    {
      period: "Days 1-30",
      title: "Trust foundation cleanup",
      owner: "Strategy + front desk",
      action: "Audit website, GBP, social bios, doctor profiles, location data, phone numbers, WhatsApp links and appointment CTAs.",
      proofAsset: "Trust message guide and centre consistency checklist",
      channel: "Website, GBP, Instagram, Facebook",
      expectedTrustMovement: "Patients see one consistent hospital identity and one clear next step.",
    },
    {
      period: "Days 31-60",
      title: "Authority proof publishing",
      owner: "Doctor + content team",
      action: "Publish doctor-reviewed explainers, profile upgrades, service FAQs, GBP trust posts and review-theme proof points.",
      proofAsset: "Doctor-led authority content set",
      channel: "Website, GBP, social, YouTube Shorts",
      expectedTrustMovement: "Hospital credibility becomes visible before the patient calls or messages.",
    },
    {
      period: "Days 61-90",
      title: "Proof loop and conversion lift",
      owner: "Admin + patient experience",
      action: "Run review requests, privacy-safe replies, complaint escalation, community care cards and conversion-path measurement.",
      proofAsset: "Monthly trust score and reputation movement report",
      channel: "GBP, WhatsApp, website analytics, front desk reporting",
      expectedTrustMovement: "Reputation signals support higher inquiry confidence and more appointment actions.",
    },
  ];
}

function buildTrustOutcomes(context: TrustContext): TrustOutcome[] {
  return [
    {
      title: "Higher trust",
      value: "Stronger confidence",
      detail: "Patients should find clear doctor-led education, consistent hospital identity and proof that the hospital communicates responsibly.",
      indicator: "Track branded search, profile visits, saves, shares and direct appointment questions.",
      icon: HeartHandshake,
    },
    {
      title: "Better reputation",
      value: context.totalReviews ? `${integer(context.totalReviews)} review baseline` : "Review baseline needed",
      detail: "A consistent request-and-response rhythm should make reputation stronger, fresher and safer to use as proof.",
      indicator: "Track review velocity, weighted rating, response coverage and recurring complaint themes.",
      icon: Star,
    },
    {
      title: "Increased conversions",
      value: "More ready-to-act patients",
      detail: "Trust proof should reduce hesitation and make calls, WhatsApp inquiries, directions and appointment requests easier.",
      indicator: "Track calls, WhatsApp inquiries, direction clicks, website actions and appointment requests.",
      icon: Route,
    },
  ];
}

function TrustFactorCard({ factor }: { factor: TrustScoreFactor }) {
  const percent = Math.round((factor.score / factor.weight) * 100);
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{factor.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{factor.score}/{factor.weight} points</p>
        </div>
        <StatusIndicator label={factor.status} tone={statusTone(factor.status)} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, Math.min(percent, 100))}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{factor.detail}</p>
    </div>
  );
}

function EvidenceMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function TrustOpportunityPanel({ opportunity }: { opportunity: TrustOpportunity }) {
  const Icon = opportunity.icon;
  return (
    <Panel className="p-5">
      <SectionHeader
        title={opportunity.title}
        description={opportunity.analysis}
        action={<Icon className="size-5 text-primary" aria-hidden />}
      />
      <div className="rounded-lg border bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Evidence label</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{opportunity.evidence}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {opportunity.opportunities.map((item) => (
          <li key={item} className="flex gap-2 rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function RoadmapCard({ step }: { step: TrustRoadmapStep }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusIndicator label={step.period} tone="info" />
        <p className="text-sm font-semibold text-foreground">{step.title}</p>
      </div>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        <RoadmapField label="Owner" value={step.owner} />
        <RoadmapField label="Action" value={step.action} />
        <RoadmapField label="Proof asset" value={step.proofAsset} />
        <RoadmapField label="Channel" value={step.channel} />
        <RoadmapField label="Expected trust movement" value={step.expectedTrustMovement} />
      </div>
    </div>
  );
}

function RoadmapField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function OutcomeCard({ outcome }: { outcome: TrustOutcome }) {
  const Icon = outcome.icon;
  return (
    <div className="rounded-lg border bg-background p-4">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{outcome.title}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{outcome.value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.detail}</p>
      <div className="mt-3 rounded-lg border bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Measure</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{outcome.indicator}</p>
      </div>
    </div>
  );
}

function calculateWeightedRating(places: LivePlaceLocation[]) {
  const rated = places.filter((place) => place.rating && place.reviews);
  const reviewTotal = rated.reduce((total, place) => total + (place.reviews ?? 0), 0);
  if (!reviewTotal) return undefined;
  return rated.reduce((total, place) => total + (place.rating ?? 0) * (place.reviews ?? 0), 0) / reviewTotal;
}

function uniqueCompetitors(competitors: PlaceCompetitor[]) {
  return Array.from(new Map(competitors.map((competitor) => [competitor.placeId, competitor])).values())
    .sort((left, right) => right.reviews - left.reviews)
    .slice(0, 8);
}

function weightedScore(weight: number, ratio: number) {
  return Math.max(0, Math.min(weight, Math.round(weight * Math.max(0, Math.min(1, ratio)))));
}

function factorPercent(factors: TrustScoreFactor[], key: string) {
  const factor = factors.find((item) => item.key === key);
  if (!factor) return 0;
  return Math.round((factor.score / factor.weight) * 100);
}

function authorityPercent(factors: TrustScoreFactor[]) {
  const authority = factors.filter((factor) => factor.key === "authority-signals" || factor.key === "doctor-credibility");
  const score = authority.reduce((total, factor) => total + factor.score, 0);
  const weight = authority.reduce((total, factor) => total + factor.weight, 0);
  return weight ? Math.round((score / weight) * 100) : 0;
}

function scoreState(score: number): SurfaceState {
  if (score >= 72) return "ready";
  if (score >= 45) return "degraded";
  return "empty";
}

function statusTone(status: TrustScoreFactor["status"]): Tone {
  if (status === "Evidence-based") return "success";
  if (status === "Needs proof") return "warning";
  return "danger";
}
