"use client";

import {
  Activity,
  ArrowRight,
  Database,
  ExternalLink,
  FileText,
  Languages,
  MapPinned,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Video,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";

type TrendWatchItem = {
  theme: string;
  terms: string[];
  location: string;
  window: string;
  angle: string;
  interpretation: string;
  action: string;
  confidence: "High" | "Medium";
  href: string;
};

type PriorityTrend = {
  title: string;
  signal: string;
  whyItMatters: string;
  recommendedAction: string;
  source: string;
  sourceUrl: string;
  state: SurfaceState;
  icon: LucideIcon;
};

type Opportunity = {
  trend: string;
  patientQuestion: string;
  content: string;
  channel: string;
};

type EvidenceSource = {
  title: string;
  sourceType: string;
  date: string;
  whyItMatters: string;
  href: string;
};

const googleTrendWatchlist: TrendWatchItem[] = [
  {
    theme: "Sinus and blocked nose intent",
    terms: ["sinus infection", "blocked nose", "sinus doctor"],
    location: "India, Hyderabad focus",
    window: "Past 12 months",
    angle: "Compare sinus care terms before monsoon, winter, and pollution-heavy weeks.",
    interpretation: "Use as directional search interest only. It does not prove diagnosis volume.",
    action: "Prepare doctor-reviewed sinus symptom, treatment pathway, and when-to-consult explainers.",
    confidence: "High",
    href: "https://trends.google.com/trends/explore?date=today%2012-m&geo=IN&q=sinus%20infection,blocked%20nose,sinus%20doctor",
  },
  {
    theme: "Local ENT discovery",
    terms: ["ENT doctor near me", "ENT specialist Hyderabad", "ENT clinic Kondapur"],
    location: "India, local modifiers",
    window: "Past 12 months",
    angle: "Track whether local specialist searches are rising compared with generic ENT queries.",
    interpretation: "Local search interest should guide SEO pages and GBP posts, not clinical claims.",
    action: "Strengthen centre pages, GBP services, appointment CTAs, and Hyderabad/Kondapur FAQs.",
    confidence: "High",
    href: "https://trends.google.com/trends/explore?date=today%2012-m&geo=IN&q=ENT%20doctor%20near%20me,ENT%20specialist%20Hyderabad,ENT%20clinic%20Kondapur",
  },
  {
    theme: "Ear and hearing care",
    terms: ["ear pain", "hearing test", "tinnitus"],
    location: "India",
    window: "Past 12 months",
    angle: "Watch education demand around symptoms, screening, and persistent ringing.",
    interpretation: "Search interest points to patient questions; doctors should decide exact advice.",
    action: "Create hearing-screening reels, ear-pain triage FAQs, and tinnitus consultation guidance.",
    confidence: "Medium",
    href: "https://trends.google.com/trends/explore?date=today%2012-m&geo=IN&q=ear%20pain,hearing%20test,tinnitus",
  },
  {
    theme: "Throat and pediatric ENT",
    terms: ["throat infection", "tonsils", "adenoids"],
    location: "India",
    window: "Past 12 months",
    angle: "Compare seasonal throat-care interest with parent-facing tonsil and adenoid searches.",
    interpretation: "Avoid antibiotic-forward messaging; use symptom education and review prompts.",
    action: "Publish Telugu and English FAQs on sore throat, tonsils, adenoids, and doctor review timing.",
    confidence: "Medium",
    href: "https://trends.google.com/trends/explore?date=today%2012-m&geo=IN&q=throat%20infection,tonsils,adenoids",
  },
  {
    theme: "Allergy and pollution response",
    terms: ["allergy", "dust allergy", "breathing problem"],
    location: "India",
    window: "Past 12 months",
    angle: "Watch allergy and breathing queries around pollution and weather shifts.",
    interpretation: "Use this as a care-navigation trigger, not proof of specific disease burden.",
    action: "Plan allergy-season posts, pollution-day ENT tips, and when-to-seek-care content.",
    confidence: "Medium",
    href: "https://trends.google.com/trends/explore?date=today%2012-m&geo=IN&q=allergy,dust%20allergy,breathing%20problem",
  },
];

const priorityTrends: PriorityTrend[] = [
  {
    title: "Google Trends search interest",
    signal: "ENT searches should be watched across sinus, local doctor discovery, hearing, throat, allergy, and pediatric topics.",
    whyItMatters: "Google Trends can reveal changing patient questions before social and GBP performance catches up.",
    recommendedAction: "Use curated Trends links in v1 and add API-ready storage later if Google Trends API alpha access is approved.",
    source: "Google Trends Help",
    sourceUrl: "https://support.google.com/trends/answer/4359550",
    state: "ready",
    icon: Search,
  },
  {
    title: "Digital health adoption",
    signal: "ABDM crossed 90 crore ABHA accounts and 100 crore ABHA-linked health records in May 2026.",
    whyItMatters: "Patients are increasingly comfortable with digital health identity, records, and care journeys.",
    recommendedAction: "Make appointment, record, and follow-up messaging feel modern, simple, and consent-aware.",
    source: "Press Information Bureau",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2266979",
    state: "ready",
    icon: Database,
  },
  {
    title: "Health video discovery",
    signal: "Google reported more than 300 billion India views on health content on YouTube last year.",
    whyItMatters: "Doctor-led short video should be treated as a primary patient education channel.",
    recommendedAction: "Turn top ENT FAQs into clinically reviewed reels, Shorts, and YouTube explainers.",
    source: "Google India Blog",
    sourceUrl: "https://blog.google/intl/en-in/products/platforms/new-ways-were-supporting-health-and-well-being-in-india/",
    state: "ready",
    icon: Video,
  },
  {
    title: "Respiratory seasonality",
    signal: "NCDC surveillance reported 2,400 H1N1 cases and 13 deaths as of May 31, 2025.",
    whyItMatters: "Respiratory spikes should trigger timely ENT education on symptoms, prevention, and consultation timing.",
    recommendedAction: "Create a seasonal respiratory watch workflow with doctor approval before publishing.",
    source: "NCDC H1N1 surveillance",
    sourceUrl: "https://ncdc.mohfw.gov.in/wp-content/uploads/2025/08/Influenza_June2025.pdf",
    state: "ready",
    icon: Activity,
  },
  {
    title: "Pollution and respiratory burden",
    signal: "State of Global Air 2025 tracks air pollution exposure and health burden across countries.",
    whyItMatters: "Pollution and dust are practical triggers for allergy, sinus, throat, and breathing guidance.",
    recommendedAction: "Plan pollution-day ENT guidance without making unsupported diagnosis or treatment claims.",
    source: "State of Global Air 2025",
    sourceUrl: "https://www.stateofglobalair.org/resources/report/state-global-air-report-2025",
    state: "ready",
    icon: Wind,
  },
  {
    title: "Antibiotic stewardship",
    signal: "ICMR AMR reporting supports cautious, evidence-led antibiotic communication.",
    whyItMatters: "ENT content often touches sore throat, sinus, cough, and ear infection. Casual antibiotic framing is risky.",
    recommendedAction: "Add clinical review guardrails to all infection-related content before publication.",
    source: "ICMR AMR Surveillance Network 2024",
    sourceUrl: "https://www.icmr.gov.in/icmrobject/uploads/Report/1763981012_icmramrsnannualreport2024.pdf",
    state: "ready",
    icon: ShieldCheck,
  },
];

const opportunities: Opportunity[] = [
  {
    trend: "Sinus and allergy demand",
    patientQuestion: "Is this cold, allergy, or sinus?",
    content: "Doctor-led sinus explainer with consultation triggers and prevention basics.",
    channel: "SEO, Instagram, YouTube Shorts",
  },
  {
    trend: "Local ENT discovery",
    patientQuestion: "Which ENT doctor is near me?",
    content: "Centre pages, GBP services, doctor profiles, and Kondapur/Hyderabad location FAQs.",
    channel: "SEO, GBP, website",
  },
  {
    trend: "Hearing and tinnitus",
    patientQuestion: "When should I get a hearing test?",
    content: "Hearing-screening checklist and tinnitus consultation guidance.",
    channel: "Instagram carousel, YouTube, GBP post",
  },
  {
    trend: "Pediatric throat care",
    patientQuestion: "When do tonsils or adenoids need doctor review?",
    content: "Parent-facing Telugu and English FAQ with clinical approval.",
    channel: "WhatsApp, SEO, Instagram",
  },
  {
    trend: "Respiratory seasonality",
    patientQuestion: "When should flu-like symptoms be checked?",
    content: "Seasonal respiratory care guide with prevention and red-flag language reviewed by a doctor.",
    channel: "GBP, Instagram, waiting-room display",
  },
];

const evidenceSources: EvidenceSource[] = [
  {
    title: "Google Trends compare terms",
    sourceType: "Search interest method",
    date: "Current help documentation",
    whyItMatters: "Explains how terms and topics should be compared and why search terms need careful interpretation.",
    href: "https://support.google.com/trends/answer/4359550",
  },
  {
    title: "Google Trends related and rising searches",
    sourceType: "Search interest method",
    date: "Current help documentation",
    whyItMatters: "Supports the watchlist format for related and rising query angles.",
    href: "https://support.google.com/trends/answer/4355000",
  },
  {
    title: "Google Trends API alpha",
    sourceType: "Future integration path",
    date: "2025",
    whyItMatters: "Gives VIP an upgrade path from curated links to authorized programmatic trend pulls.",
    href: "https://developers.google.com/search/apis/trends",
  },
  {
    title: "ABDM digital health milestones",
    sourceType: "Government source",
    date: "May 2026",
    whyItMatters: "Shows digital health adoption is now large enough to influence patient communication expectations.",
    href: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2264241&lang=1&reg=3",
  },
  {
    title: "Google India health and YouTube",
    sourceType: "Platform source",
    date: "November 2025",
    whyItMatters: "Shows health video discovery is a major India behavior, so doctor-led video belongs in the strategy.",
    href: "https://blog.google/intl/en-in/products/platforms/new-ways-were-supporting-health-and-well-being-in-india/",
  },
  {
    title: "NCDC H1N1 surveillance",
    sourceType: "Public-health surveillance",
    date: "May 31, 2025",
    whyItMatters: "Gives a credible basis for respiratory-season watch content.",
    href: "https://ncdc.mohfw.gov.in/wp-content/uploads/2025/08/Influenza_June2025.pdf",
  },
  {
    title: "State of Global Air 2025",
    sourceType: "Public-health research",
    date: "2025",
    whyItMatters: "Supports pollution-aware respiratory and ENT education planning.",
    href: "https://www.stateofglobalair.org/resources/report/state-global-air-report-2025",
  },
  {
    title: "ICMR AMR Surveillance Network 2024",
    sourceType: "Clinical guardrail",
    date: "2024 report",
    whyItMatters: "Supports careful antibiotic messaging for infection-related ENT content.",
    href: "https://www.icmr.gov.in/icmrobject/uploads/Report/1763981012_icmramrsnannualreport2024.pdf",
  },
];

const actions: IntelligenceAction[] = [
  {
    title: "Build the ENT Google Trends review rhythm",
    detail: "Review the curated watchlist weekly and capture notable rising queries before content planning.",
    owner: "Growth",
    due: "Weekly",
    state: "ready",
  },
  {
    title: "Draft Telugu and English FAQ clusters",
    detail: "Prioritize sinus, allergy, hearing test, throat infection, tonsils, adenoids, and ear pain FAQs.",
    owner: "Content",
    due: "This week",
    state: "ready",
  },
  {
    title: "Create doctor-led short video scripts",
    detail: "Turn high-intent patient questions into approved Instagram Reels and YouTube Shorts.",
    owner: "Doctor review",
    due: "Next 7 days",
    state: "degraded",
  },
  {
    title: "Update GBP and SEO topic backlog",
    detail: "Convert trend themes into GBP posts, service-page improvements, and location FAQ tasks.",
    owner: "SEO",
    due: "Next sprint",
    state: "ready",
  },
  {
    title: "Apply clinical claim guardrails",
    detail: "Require doctor review before publishing infection, antibiotic, respiratory, or pediatric ENT advice.",
    owner: "Clinical",
    due: "Always on",
    state: "ready",
  },
];

const metrics: IntelligenceMetric[] = [
  {
    label: "Search themes tracked",
    value: String(googleTrendWatchlist.length),
    detail: "Curated Google Trends links for ENT, local discovery, allergy, respiratory, throat, and hearing searches.",
    state: "ready",
    icon: Search,
  },
  {
    label: "Public-health signals",
    value: "3",
    detail: "Respiratory seasonality, pollution burden, and antibiotic stewardship are included as guardrails.",
    state: "ready",
    icon: Stethoscope,
  },
  {
    label: "Patient trust signals",
    value: "2",
    detail: "Digital health adoption and health video discovery shape the channel strategy.",
    state: "ready",
    icon: ShieldCheck,
  },
  {
    label: "Content opportunities",
    value: String(opportunities.length),
    detail: "Each opportunity maps a trend to a patient question, asset type, and channel.",
    state: "ready",
    icon: FileText,
  },
];

export function AdminTrendIntelligencePage() {
  const { activeHospital } = useHospital();
  const selectedHospital = activeHospital ?? DEMO_HOSPITALS[0];

  return (
    <main className="min-h-screen bg-background">
      <IntelligenceHero
        eyebrow="Trend intelligence"
        title={`${selectedHospital.name} healthcare trend intelligence`}
        description="Curated healthcare trend intelligence combining Google Trends search-interest links, public-health evidence, and practical VIP content actions. Google Trends is treated as directional attention data, not patient volume or diagnosis demand."
        icon={TrendingUp}
        state="ready"
      >
        <StatusIndicator label="Curated + Google Trends links" tone="info" />
        <StatusIndicator label="Doctor review required" tone="warning" />
      </IntelligenceHero>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <AlertBanner
          title="Google Trends interpretation guardrail"
          message="Trend scores and rising queries show relative search interest for a selected region and time window. They should guide content planning, but they do not prove actual patient volume, diagnosis prevalence, or treatment demand."
          tone="info"
        />

        <IntelligenceMetricGrid metrics={metrics} />

        <Panel className="p-5">
          <SectionHeader
            title="Google Trends watchlist"
            description="Curated ENT and local patient-search themes for weekly review. Links open Google Trends with the chosen terms."
            action={<StatusIndicator label={`${googleTrendWatchlist.length} live links`} tone="success" />}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {googleTrendWatchlist.map((item) => (
              <a
                key={item.theme}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-full flex-col rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.theme}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.location} | {item.window}
                    </p>
                  </div>
                  <StatusIndicator label={`${item.confidence} confidence`} tone={item.confidence === "High" ? "success" : "warning"} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.terms.map((term) => (
                    <span key={term} className="rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {term}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.angle}</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{item.action}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.interpretation}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                  Open in Google Trends
                  <ExternalLink className="size-4" aria-hidden />
                </span>
              </a>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Priority trend cards"
              description="Evidence-backed signals that should influence campaign, SEO, GBP, and social planning."
              action={<StatusIndicator label="Evidence backed" tone="success" />}
            />
            <div className="space-y-3">
              {priorityTrends.map((trend) => (
                <a
                  key={trend.title}
                  href={trend.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-3 rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:bg-info/30 md:grid-cols-[auto_1fr_auto]"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
                    <trend.icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{trend.title}</h2>
                      <StatusIndicator label={trend.source} tone={surfaceTone[trend.state]} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground">{trend.signal}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{trend.whyItMatters}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      <span className="font-medium text-foreground">VIP action:</span> {trend.recommendedAction}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-primary md:mt-1" aria-hidden />
                </a>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Clinical publishing guardrails"
              description="Trend intelligence should increase relevance without overstating medical certainty."
              action={<StatusIndicator label="Required" tone="warning" />}
            />
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <Guardrail icon={ShieldCheck} title="No diagnosis claims" detail="Use trends to identify patient questions, not to claim disease prevalence or urgency." />
              <Guardrail icon={Stethoscope} title="Doctor-reviewed advice" detail="Any infection, antibiotic, pediatric, or respiratory guidance needs clinical approval." />
              <Guardrail icon={Languages} title="Local language clarity" detail="Telugu and English FAQs should use simple care-navigation language." />
              <Guardrail icon={MapPinned} title="Local intent responsibly" detail="Hyderabad and Kondapur targeting belongs in SEO and GBP context, not medical claims." />
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Opportunity matrix"
            description="How trend attention becomes useful patient education and discoverability work."
            action={<StatusIndicator label={`${opportunities.length} opportunities`} tone="info" />}
          />
          <div className="overflow-hidden rounded-lg border">
            <div className="grid bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid-cols-[1fr_1.2fr_1.5fr_1fr]">
              <span>Trend</span>
              <span>Patient question</span>
              <span>Recommended content</span>
              <span>Channel</span>
            </div>
            {opportunities.map((opportunity) => (
              <div
                key={`${opportunity.trend}-${opportunity.channel}`}
                className="grid gap-2 border-t bg-background px-4 py-4 text-sm md:grid-cols-[1fr_1.2fr_1.5fr_1fr]"
              >
                <p className="font-semibold">{opportunity.trend}</p>
                <p className="text-muted-foreground">{opportunity.patientQuestion}</p>
                <p className="text-muted-foreground">{opportunity.content}</p>
                <p className="font-medium text-primary">{opportunity.channel}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Evidence sources"
              description="Credible sources used for the curated trend intelligence layer."
              action={<StatusIndicator label={`${evidenceSources.length} sources`} tone="success" />}
            />
            <div className="space-y-3">
              {evidenceSources.map((source) => (
                <a
                  key={source.title}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 rounded-lg border bg-background p-3 transition hover:border-primary/40 hover:bg-info/30"
                >
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{source.title}</span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">
                      {source.sourceType} | {source.date}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{source.whyItMatters}</span>
                  </span>
                </a>
              ))}
            </div>
          </Panel>

          <IntelligenceActionQueue
            title="Trend action queue"
            description="Concrete work VIP can take from trend monitoring into publishing and discoverability."
            actions={actions}
          />
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="Future live integration path"
            description="The page is intentionally built for curated v1 and a safer live data upgrade later."
            action={<StatusIndicator label="API-ready later" tone="info" />}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "V1 now",
                detail: "Curated Google Trends links and evidence-backed insights with explicit interpretation limits.",
              },
              {
                title: "Next",
                detail: "Store weekly reviewed search themes, rising query notes, source dates, and recommended actions.",
              },
              {
                title: "Later",
                detail: "Use the Google Trends API alpha only after access, governance, and quota handling are confirmed.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="size-4 text-primary" aria-hidden />
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Guardrail({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1">{detail}</p>
      </div>
    </div>
  );
}
