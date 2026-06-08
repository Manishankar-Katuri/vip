import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Gauge,
  MapPinned,
  MessageSquareText,
  Radar,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";

import { Panel, SectionHeader, StatusIndicator, Tabs, TabsContent, TabsList, TabsTrigger } from "@/design-system/primitives";
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
import type { ProductExperience } from "@/lib/product-experience";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";

type GBPStrategyPlanPageProps = {
  data: ProductExperience;
  basePath?: string;
};

type ActionPlan = {
  title: string;
  objective: string;
  owner: string;
  cadence: string;
  steps: string[];
};

type Workstream = {
  title: string;
  goal: string;
  icon: React.ReactNode;
  actions: string[];
};

type GBPHealthScore = {
  total: number;
  bands: Array<{
    label: string;
    score: number;
    max: number;
    detail: string;
    state: "complete" | "partial" | "audit";
  }>;
};

type GBPTask = {
  title: string;
  detail: string;
  impact: number;
  effort: number;
  score: number;
  category: string;
  expectedOutcomes: string[];
};

type OptimizationOpportunity = {
  group: "Missing information" | "Missing categories" | "Missing services" | "Missing photos";
  title: string;
  detail: string;
  action: string;
  state: "gap" | "audit" | "ready";
};

type CompetitorComparisonItem = {
  centre: string;
  competitor: string;
  categoryStatus: string;
  serviceStatus: string;
  photosStatus: string;
  reviewStatus: string;
  ratingStatus: string;
  postActivityStatus: string;
  ctaStatus: string;
};

type ExpectedOutcome = {
  title: string;
  detail: string;
  taskTitles: string[];
};

const actionPlans: ActionPlan[] = [
  {
    title: "Profile foundation reset",
    objective: "Make every centre listing accurate, complete and easy to act on.",
    owner: "Admin + Front office",
    cadence: "First 2 weeks, then monthly",
    steps: [
      "Confirm the exact business name, address, phone, website, hours and appointment path for every centre.",
      "Check that each centre has the right primary category and only relevant secondary categories.",
      "Add or refine services using patient language, not internal hospital terminology.",
      "Verify that holiday hours and temporary timing changes are updated before public holidays.",
    ],
  },
  {
    title: "Service relevance buildout",
    objective: "Help searchers and Google understand which ENT needs Harika serves.",
    owner: "Strategy + SEO",
    cadence: "Weekly until core services are complete",
    steps: [
      "Create a service list around high-intent ENT needs: sinus, allergy, hearing test, throat, voice, ear pain, pediatric ENT and vertigo.",
      "Write one plain-language service description for each listing service.",
      "Match each GBP service to a website page or section so the profile and site reinforce each other.",
      "Review all service wording for safe medical claims before publishing.",
    ],
  },
  {
    title: "GBP post rhythm",
    objective: "Keep the profile active with useful, approved patient-access and education updates.",
    owner: "Production",
    cadence: "1-2 posts per week",
    steps: [
      "Publish one centre/access post each week: hours, appointment route, service availability or directions.",
      "Repurpose one approved content-strategy asset into a short GBP update.",
      "Use one clear CTA per post: call, book, get directions, ask reception or read service details.",
      "Tag every post internally by purpose: access, education, trust, seasonal, or service.",
    ],
  },
  {
    title: "Review request and response workflow",
    objective: "Grow trust ethically while turning feedback into operational learning.",
    owner: "Front office + Admin",
    cadence: "Daily requests, weekly review",
    steps: [
      "Ask suitable patients for honest reviews consistently through reception, QR or WhatsApp follow-up.",
      "Do not offer incentives, filter only happy patients, or ask patients to rewrite negative experiences.",
      "Reply to every review with privacy-safe language that does not reveal patient information.",
      "Escalate repeated complaints into staff or operations tasks instead of treating them as marketing problems only.",
    ],
  },
  {
    title: "Photo and trust asset refresh",
    objective: "Make each centre feel real, current and easy to recognize before a patient visits.",
    owner: "Production + Centre team",
    cadence: "Monthly",
    steps: [
      "Upload exterior photos from likely patient approach directions.",
      "Add reception/interior photos that truthfully show the clinic environment.",
      "Add doctor and team photos that build familiarity without patient-identifiable details.",
      "Add privacy-safe service-context photos such as signage, facility areas or equipment.",
    ],
  },
];

const workstreams: Workstream[] = [
  {
    title: "Relevance strategy",
    goal: "Make Harika match the right local ENT searches.",
    icon: <Search className="size-5 text-primary" aria-hidden />,
    actions: [
      "Tighten primary and secondary categories.",
      "Use clear service names and descriptions.",
      "Align GBP services with SEO pages.",
      "Add Q&A for high-intent patient questions.",
    ],
  },
  {
    title: "Prominence strategy",
    goal: "Build visible proof that the centres are active and trusted.",
    icon: <TrendingUp className="size-5 text-primary" aria-hidden />,
    actions: [
      "Run a compliant review request workflow.",
      "Reply to every review.",
      "Upload fresh photos every month.",
      "Keep weekly GBP updates active.",
    ],
  },
  {
    title: "Conversion strategy",
    goal: "Make it obvious how a searcher should take the next step.",
    icon: <Route className="size-5 text-primary" aria-hidden />,
    actions: [
      "Verify phone, directions and website links.",
      "Use one CTA per post.",
      "Make appointment or WhatsApp paths visible.",
      "Remove dead-end links and unclear profile copy.",
    ],
  },
];

const weeklyRhythm = [
  {
    day: "Monday",
    task: "Choose the GBP action for each centre.",
    detail: "Pick one access update, one service update, or one trust-building task. Keep the weekly plan small enough to finish.",
  },
  {
    day: "Tuesday",
    task: "Draft and verify.",
    detail: "Write the GBP post, service copy, Q&A answer or review response template. Confirm facts with the centre team.",
  },
  {
    day: "Wednesday",
    task: "Clinical and brand review.",
    detail: "Send any medical education or symptom language for doctor review before publishing.",
  },
  {
    day: "Thursday",
    task: "Publish and update.",
    detail: "Publish approved posts, photos, service changes or Q&A updates. Confirm links and CTAs after publishing.",
  },
  {
    day: "Friday",
    task: "Review actions and blockers.",
    detail: "Check what was completed, what is blocked, and what needs staff, SEO, content or review-strategy follow-up.",
  },
];

const references = [
  {
    publisher: "Google Business Profile Help",
    title: "Local ranking: relevance, distance and prominence",
    url: "https://support.google.com/business/answer/4454429",
  },
  {
    publisher: "Google Business Profile Help",
    title: "Tips for business-specific photos",
    url: "https://support.google.com/business/answer/6123536",
  },
  {
    publisher: "Google Business Profile Help",
    title: "Prohibited and restricted content",
    url: "https://support.google.com/business/answer/2622994",
  },
  {
    publisher: "Google Business Profile APIs",
    title: "Business Profile Performance API",
    url: "https://developers.google.com/my-business/reference/performance/rest",
  },
  {
    publisher: "BrightLocal",
    title: "Local Consumer Review Survey",
    url: "https://www.brightlocal.com/learn/local-consumer-review-survey/",
  },
  {
    publisher: "BrightLocal",
    title: "Local SEO checklist",
    url: "https://www.brightlocal.com/learn/local-seo-checklist/",
  },
  {
    publisher: "Whitespark",
    title: "Local Search Ranking Factors",
    url: "https://whitespark.ca/local-search-ranking-factors/",
  },
  {
    publisher: "Moz Local",
    title: "Local SEO guide",
    url: "https://moz.com/learn/seo/local",
  },
];

export async function GBPStrategyPlanPage({
  data,
  basePath = "/admin/strategy",
}: GBPStrategyPlanPageProps) {
  const [places, integrations] = await Promise.all([
    loadPlaceLocations(),
    loadIntegrationHealth(),
  ]);
  const competitorGroups = await findCompetitorsForLocations(places, "Hyderabad", "ENT");
  const intelligence = buildGrowthIntelligence(data, places, integrations, competitorGroups);
  const recommendedTheme =
    data.intelligence?.marketContext?.recommendedThemes[0] ??
    data.intelligence?.marketContext?.healthcareSignals[0]?.title ??
    "local ENT access and patient education";

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Star className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">GBP strategy</p>
                  <h1 className="mt-1 text-balance text-3xl font-semibold sm:text-4xl">
                    Google Business Profile action plan
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
                A practical strategy plan for {hospitalProfile.name}: what to do, why it matters, and how the team should execute GBP work across profile accuracy, services, posts, reviews, photos and conversion paths.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusIndicator label="Plan first" tone="success" />
              <StatusIndicator label="Intelligence available" tone="info" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="plan" className="space-y-5">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="plan" className="px-4 py-2">
              Strategy Plan
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="px-4 py-2">
              Growth Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-5">
        <Panel className="p-5">
          <SectionHeader
            title="Immediate focus"
            description="The first screen should keep the team pointed at execution, not reporting."
            action={<Sparkles className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <FocusCard
              icon={<MapPinned className="size-5" aria-hidden />}
              title="Fix the profile foundation"
              detail="Names, addresses, phones, hours, categories, services, links and appointment paths must be clean before any growth work."
            />
            <FocusCard
              icon={<MessageSquareText className="size-5" aria-hidden />}
              title="Build trust every week"
              detail="Reviews, replies, photos, doctor-led posts and useful Q&A should make the profile feel active and credible."
            />
            <FocusCard
              icon={<Route className="size-5" aria-hidden />}
              title="Make action easy"
              detail="Every GBP update should guide patients to one next step: call, book, get directions, ask reception or read service details."
            />
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Core action plans"
            description="Each plan includes the objective, owner, cadence and exact steps to execute."
            action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-4 xl:grid-cols-2">
            {actionPlans.map((plan, index) => (
              <ActionPlanCard key={plan.title} plan={plan} index={index + 1} />
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-3">
          {workstreams.map((workstream) => (
            <WorkstreamCard key={workstream.title} workstream={workstream} />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Centre execution checklist"
              description="Repeat this checklist for each centre. Keep centre work separate so local facts stay accurate."
              action={<MapPinned className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3">
              {hospitalProfile.locations.map((location) => (
                <CentreChecklist key={location.name} name={location.name} />
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Weekly operating rhythm"
              description="A simple rhythm to keep GBP work moving without turning it into another dashboard."
              action={<Target className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {weeklyRhythm.map((item) => (
                <div key={item.day} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusIndicator label={item.day} tone="info" />
                    <p className="text-sm font-semibold">{item.task}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="p-5">
            <SectionHeader
              title="GBP content plan"
              description="What should be published on GBP and how each post should be used."
              action={<FileText className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <AssetPlan
                title="Access posts"
                items={[
                  "Use for centre hours, appointment routes, directions, service availability and holiday updates.",
                  "Keep copy short and factual.",
                  "CTA: call, book, get directions or ask reception.",
                ]}
              />
              <AssetPlan
                title="Education posts"
                items={[
                  `Use the current strategic theme: ${recommendedTheme}.`,
                  "Repurpose only doctor-reviewed content from the content strategy workflow.",
                  "Avoid diagnosis, fear language or outcome promises.",
                ]}
              />
              <AssetPlan
                title="Service posts"
                items={[
                  "Pick one service at a time: sinus, allergy, hearing, throat, voice or pediatric ENT.",
                  "Explain who it helps and how to contact the centre.",
                  "Link to the matching website service page where possible.",
                ]}
              />
              <AssetPlan
                title="Trust posts"
                items={[
                  "Use doctor/team presence, clinic access, language availability and patient-friendly process information.",
                  "Do not convert review praise into unsupported medical claims.",
                  "Keep all examples privacy-safe.",
                ]}
              />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Photo and Q&A playbook"
              description="Small profile improvements that make a centre easier to recognize and choose."
              action={<Camera className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              <PlaybookRow title="Exterior photos" detail="Add photos from the directions patients are likely to approach from, so the centre is easy to recognize." />
              <PlaybookRow title="Interior and reception photos" detail="Show a truthful, well-lit patient view of the centre environment." />
              <PlaybookRow title="Doctor and team photos" detail="Build familiarity while avoiding patient-identifiable information." />
              <PlaybookRow title="Q&A answers" detail="Answer common questions about timings, appointment routes, services, centres and consultation access." />
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <SectionHeader
            title="90-day task roadmap"
            description="The roadmap is written as execution steps, not as performance reporting."
            action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-4 xl:grid-cols-4">
            <RoadmapCard
              period="Days 1-14"
              title="Clean profile basics"
              tasks={[
                "Confirm all centre facts.",
                "Fix categories and services.",
                "Verify links and CTAs.",
                "Prepare review request copy.",
              ]}
            />
            <RoadmapCard
              period="Days 15-30"
              title="Build visible trust"
              tasks={[
                "Upload photo sets.",
                "Add Q&A answers.",
                "Start weekly GBP posts.",
                "Reply to existing reviews.",
              ]}
            />
            <RoadmapCard
              period="Days 31-60"
              title="Expand service relevance"
              tasks={[
                "Refine service descriptions.",
                "Map services to SEO pages.",
                "Publish service-led updates.",
                "Collect weekly review learnings.",
              ]}
            />
            <RoadmapCard
              period="Days 61-90"
              title="Improve and repeat"
              tasks={[
                "Keep only useful post types.",
                "Update blocked centre tasks.",
                "Refresh photos and Q&A.",
                "Plan the next 90 days.",
              ]}
            />
          </div>
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <Panel className="p-5">
            <SectionHeader
              title="Review and safety rules"
              description="These are action guardrails for the team before they request, reply or publish."
              action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <RuleCard title="Do" items={[
                "Ask for honest reviews consistently.",
                "Reply calmly and privately where needed.",
                "Use review themes to improve operations.",
                "Escalate serious complaints internally.",
              ]} />
              <RuleCard title="Avoid" items={[
                "Do not offer incentives.",
                "Do not ask only happy patients.",
                "Do not disclose patient information.",
                "Do not argue publicly or promise outcomes.",
              ]} />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeader
              title="Source-backed method"
              description="References are kept here for method support, not as intelligence data."
              action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="space-y-3">
              {references.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border bg-background p-3 transition hover:border-primary/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    {source.title}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </p>
                </a>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm">
          <div>
            <p className="font-semibold">Related strategy sections</p>
            <p className="mt-1 text-muted-foreground">Use these only when the GBP action needs content, review or SEO support.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={relatedStrategyHref(basePath, "seo")} className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 font-medium text-primary">
              SEO Strategy <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={relatedStrategyHref(basePath, "reviews")} className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 font-medium text-primary">
              Review Strategy <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={relatedStrategyHref(basePath, "content")} className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 font-medium text-primary">
              Content Strategy <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-5">
            <GrowthIntelligenceTab intelligence={intelligence} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function FocusCard({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ActionPlanCard({ plan, index }: { plan: ActionPlan; index: number }) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {index}
          </span>
          <div>
            <h3 className="text-sm font-semibold">{plan.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.objective}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusIndicator label={plan.owner} tone="info" />
          <StatusIndicator label={plan.cadence} tone="neutral" />
        </div>
      </div>
      <ol className="mt-4 space-y-2">
        {plan.steps.map((step, stepIndex) => (
          <li key={step} className="grid grid-cols-[1.75rem_1fr] gap-2 rounded-lg border bg-card p-3 text-sm leading-6 text-muted-foreground">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {stepIndex + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function WorkstreamCard({ workstream }: { workstream: Workstream }) {
  return (
    <Panel className="p-5">
      <SectionHeader title={workstream.title} description={workstream.goal} action={workstream.icon} />
      <ul className="space-y-3">
        {workstream.actions.map((action) => (
          <li key={action} className="flex gap-3 rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function CentreChecklist({ name }: { name: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{name}</p>
        <StatusIndicator label="Repeat monthly" tone="info" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          "Confirm hours, phone and directions",
          "Check categories and services",
          "Upload centre-specific photos",
          "Publish one useful GBP update",
          "Review and reply to new reviews",
          "Log blockers for staff or SEO follow-up",
        ].map((item) => (
          <p key={item} className="flex gap-2 rounded-lg border bg-card p-2 text-xs leading-5 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function AssetPlan({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaybookRow({ title, detail, icon }: { title: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3">
      {icon ?? <Camera className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function RoadmapCard({ period, title, tasks }: { period: string; title: string; tasks: string[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <StatusIndicator label={period} tone="info" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {tasks.map((task) => (
          <li key={task} className="flex gap-2">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{task}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function relatedStrategyHref(basePath: string, section: "seo" | "reviews" | "content") {
  if (basePath === "/admin/strategy") {
    return `${basePath}/${section}`;
  }

  if (section === "content") return "/strategy/content-strategy";
  if (section === "reviews") return "/strategy/review-strategy";
  return "/strategy/seo-strategy";
}

function GrowthIntelligenceTab({
  intelligence,
}: {
  intelligence: ReturnType<typeof buildGrowthIntelligence>;
}) {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5">
          <SectionHeader
            title="GBP Health Score"
            description="A compact readiness score based on profile completeness, review readiness, photos, conversion paths and known audit gaps."
            action={<Gauge className="size-5 text-primary" aria-hidden />}
          />
          <div className="rounded-lg border bg-primary/5 p-5">
            <p className="text-sm font-medium text-muted-foreground">Overall score</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight">{intelligence.health.total}/100</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Scores intentionally stay conservative when exact categories, services or post activity are unavailable.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {intelligence.health.bands.map((band) => (
              <ScoreBand key={band.label} band={band} />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Priority Tasks"
            description="Ranked by priority score: (impact x 2) - effort."
            action={<Sparkles className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {intelligence.tasks.map((task) => (
              <PriorityTaskCard key={task.title} task={task} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Listing Optimization Opportunities"
          description="Grouped by the exact areas requested. Unavailable category/service data is shown as audit work, not invented findings."
          action={<MapPinned className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["Missing information", "Missing categories", "Missing services", "Missing photos"] as OptimizationOpportunity["group"][]).map((group) => (
            <OpportunityGroup
              key={group}
              title={group}
              opportunities={intelligence.opportunities.filter((item) => item.group === group)}
            />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="p-5">
          <SectionHeader
            title="Posting Strategy"
            description="Recommended GBP post types and a repeatable weekly schedule."
            action={<FileText className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {intelligence.postTypes.map((item) => (
              <AssetPlan key={item.title} title={item.title} items={item.items} />
            ))}
          </div>
          <div className="mt-4 rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">Weekly posting schedule</p>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {weeklyRhythm.map((item) => (
                <div key={item.day} className="rounded-lg border bg-card p-3">
                  <StatusIndicator label={item.day} tone="info" />
                  <p className="mt-2 text-xs font-semibold">{item.task}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Review Growth Strategy"
            description="Review acquisition and response opportunities, kept compliant and privacy-safe."
            action={<MessageSquareText className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {intelligence.reviewStrategy.map((item) => (
              <PlaybookRow key={item.title} title={item.title} detail={item.detail} icon={<MessageSquareText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-5">
          <SectionHeader
            title="Local SEO Opportunities"
            description="Moz/BrightLocal-style local hygiene actions that support GBP visibility and conversions."
            action={<Search className="size-5 text-primary" aria-hidden />}
          />
          <ul className="space-y-3">
            {intelligence.localSeo.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Competitor GBP Comparison"
            description="Compact comparison against the strongest visible nearby listing per centre."
            action={<Radar className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {intelligence.competitors.map((item) => (
              <CompetitorComparisonCard key={`${item.centre}-${item.competitor}`} item={item} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="p-5">
          <SectionHeader
            title="Visibility Improvement Plan"
            description="Actions grouped by Google's local ranking model: relevance, prominence and conversion behavior."
            action={<TrendingUp className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {intelligence.visibilityPlan.map((plan) => (
              <AssetPlan key={plan.title} title={plan.title} items={plan.items} />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Expected Outcomes"
            description="Each outcome lists the ranked tasks expected to contribute to it."
            action={<Target className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {intelligence.outcomes.map((outcome) => (
              <ExpectedOutcomeCard key={outcome.title} outcome={outcome} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Source-backed method"
          description="Method references from Google, BrightLocal, Whitespark and Moz Local."
          action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {references.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border bg-background p-3 transition hover:border-primary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{source.publisher}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                {source.title}
                <ExternalLink className="size-3.5" aria-hidden />
              </p>
            </a>
          ))}
        </div>
      </Panel>
    </>
  );
}

function buildGrowthIntelligence(
  data: ProductExperience,
  places: LivePlaceLocation[],
  integrations: IntegrationHealth[],
  competitorGroups: PlaceCompetitorLocationGroup[],
) {
  const matchedPlaces = places.filter((place) => place.status === "Matched");
  const competitors = uniqueCompetitors(competitorGroups);
  const gbpConnected = integrations.some((integration) => integration.id === "gbp" && integration.status === "Connected");
  const health = buildHealthScore(places, matchedPlaces, gbpConnected);
  const tasks = buildPriorityTasks(places, matchedPlaces, gbpConnected);

  return {
    health,
    tasks,
    opportunities: buildOptimizationOpportunities(places),
    postTypes: buildRecommendedPostTypes(data),
    reviewStrategy: [
      {
        title: "Review acquisition opportunities",
        detail: "Use reception QR, post-consultation WhatsApp follow-up and staff prompts to ask for honest reviews consistently. Do not incentivize, pre-screen, or gate requests.",
      },
      {
        title: "Response workflow",
        detail: "Prepare privacy-safe response templates for praise, neutral feedback and complaints. Keep replies human and route sensitive issues to private follow-up.",
      },
      {
        title: "Negative review escalation",
        detail: "Create a Friday queue for repeated complaints, service delays, phone issues or centre-access confusion, then assign operational owners.",
      },
      {
        title: "Review monitoring",
        detail: "When owned GBP review access is connected, monitor reply coverage, rating movement, unresolved reviews and recurring service themes.",
      },
    ],
    localSeo: [
      "Confirm NAP consistency across GBP, website footer, centre pages, social profiles and major local directories.",
      "Map each GBP listing website URL to the best centre or service landing page, not a dead-end page.",
      "Create centre-page internal links from service pages and content articles to strengthen GBP landing-page relevance.",
      "Audit local citations for duplicate names, wrong phone numbers, old addresses or inconsistent business descriptions.",
      "Use consistent service language across GBP services, website headings, FAQs and content strategy assets.",
    ],
    competitors: buildCompetitorComparison(places, competitorGroups, competitors),
    visibilityPlan: [
      {
        title: "Relevance actions",
        items: [
          "Audit primary and secondary categories.",
          "Audit missing services and service descriptions.",
          "Align GBP services with SEO pages.",
          "Add Q&A answers for appointment, timing and service-intent questions.",
        ],
      },
      {
        title: "Prominence actions",
        items: [
          "Increase steady review requests.",
          "Reply to reviews with privacy-safe language.",
          "Upload fresh centre photos every month.",
          "Publish useful GBP posts weekly.",
        ],
      },
      {
        title: "Conversion actions",
        items: [
          "Verify call, direction, website and appointment links.",
          "Use one CTA per post.",
          "Add UTM links when tracking is ready.",
          "Connect outcome reporting to calls, directions, profile views and appointments.",
        ],
      },
    ],
    outcomes: buildExpectedOutcomes(tasks),
  };
}

function buildHealthScore(
  places: LivePlaceLocation[],
  matchedPlaces: LivePlaceLocation[],
  gbpConnected: boolean,
): GBPHealthScore {
  const listingCompleteness = Math.round((average(places.map((place) => {
    let score = 0;
    if (place.status === "Matched") score += 10;
    if (place.phone) score += 5;
    if (place.website) score += 5;
    if (place.mapsUrl) score += 5;
    if (place.weekdayText?.length) score += 5;
    return score;
  })) / 30) * 30);
  const categoriesServices = matchedPlaces.length ? 4 : 0;
  const photos = Math.round(Math.min(15, average(places.map((place) => Math.min(place.photoCount ?? 0, 10))) * 1.5));
  const reviewGrowth = Math.round(Math.min(20, average(places.map((place) => {
    let score = 0;
    if ((place.reviews ?? 0) > 0) score += 8;
    if ((place.rating ?? 0) >= 4) score += 5;
    if (place.reviewSnippets.length > 0) score += 4;
    if (gbpConnected) score += 3;
    return score;
  }))));
  const localSeoConversion = Math.round((average(places.map((place) => {
    let score = 0;
    if (place.phone) score += 4;
    if (place.website) score += 4;
    if (place.mapsUrl) score += 3;
    if (place.status === "Matched") score += 2;
    if (gbpConnected) score += 2;
    return score;
  })) / 15) * 15);

  const bands: GBPHealthScore["bands"] = [
    {
      label: "Listing completeness",
      score: listingCompleteness,
      max: 30,
      detail: "Checks matched listings, phone, website, Maps URL and hours where available.",
      state: bandState(listingCompleteness, 30),
    },
    {
      label: "Categories/services readiness",
      score: categoriesServices,
      max: 20,
      detail: "Exact category and service data is not available in the current source; audit required before scoring higher.",
      state: "audit",
    },
    {
      label: "Photos/profile freshness",
      score: photos,
      max: 15,
      detail: "Uses available photo count only; recency is unavailable and should be audited.",
      state: photos ? bandState(photos, 15) : "audit",
    },
    {
      label: "Review growth/readiness",
      score: reviewGrowth,
      max: 20,
      detail: "Uses visible review count, rating, snippets and owned GBP access readiness.",
      state: bandState(reviewGrowth, 20),
    },
    {
      label: "Local SEO/conversion readiness",
      score: localSeoConversion,
      max: 15,
      detail: "Checks phone, website, Maps URL, matched listing status and owned GBP access readiness.",
      state: bandState(localSeoConversion, 15),
    },
  ];

  return {
    total: bands.reduce((sum, band) => sum + band.score, 0),
    bands,
  };
}

function buildOptimizationOpportunities(places: LivePlaceLocation[]): OptimizationOpportunity[] {
  const missingInfo = places.flatMap((place) => {
    const missing = [
      !place.phone ? "phone" : null,
      !place.website ? "website link" : null,
      !place.mapsUrl ? "Maps URL" : null,
      !place.weekdayText?.length ? "hours" : null,
    ].filter(Boolean);

    return missing.length
      ? [{
          group: "Missing information" as const,
          title: `${place.centre}: ${missing.join(", ")}`,
          detail: "These profile fields affect patient action clarity and should be verified before growth work.",
          action: "Confirm the missing field with the centre team and update GBP.",
          state: "gap" as const,
        }]
      : [];
  });

  return [
    ...(missingInfo.length ? missingInfo : [{
      group: "Missing information" as const,
      title: "Monthly NAP check",
      detail: "No missing phone, website, Maps URL or hours were visible in the current data.",
      action: "Repeat the NAP audit monthly and before holiday-hour changes.",
      state: "ready" as const,
    }]),
    {
      group: "Missing categories",
      title: "Primary and secondary category audit",
      detail: "Exact GBP category data is unavailable in the current source.",
      action: "Compare owned categories against top local ENT competitors and keep only accurate categories.",
      state: "audit",
    },
    {
      group: "Missing services",
      title: "Service list audit",
      detail: "Exact GBP service data is unavailable in the current source.",
      action: "Audit and add services for sinus, allergy, hearing test, throat, voice, ear pain, pediatric ENT and vertigo where clinically appropriate.",
      state: "audit",
    },
    ...places.map((place) => ({
      group: "Missing photos" as const,
      title: `${place.centre}: ${place.photoCount === undefined ? "photo audit needed" : `${place.photoCount} photos visible`}`,
      detail: place.photoCount === undefined
        ? "Photo count is unavailable in the current source."
        : place.photoCount < 6
          ? "The profile should receive a monthly exterior, interior, team and service-context photo refresh."
          : "Photo count is available; recency still needs manual audit.",
      action: "Upload or verify exterior, reception, doctor/team and privacy-safe service-context photos.",
      state: place.photoCount !== undefined && place.photoCount >= 6 ? "ready" as const : "audit" as const,
    })),
  ];
}

function buildRecommendedPostTypes(data: ProductExperience) {
  const theme = data.intelligence?.marketContext?.recommendedThemes[0] ?? "local ENT access and patient education";

  return [
    {
      title: "Access updates",
      items: ["Hours, holiday timing, directions, appointment route and service availability.", "Use for quick patient clarity.", "CTA: call, get directions or book."],
    },
    {
      title: "Service posts",
      items: ["Feature one service at a time.", "Use patient-friendly language.", "Link to the matching service or centre page."],
    },
    {
      title: "Doctor-reviewed education",
      items: [`Use current theme: ${theme}.`, "Repurpose approved content only.", "Avoid diagnosis, fear language and outcome promises."],
    },
    {
      title: "Seasonal and trust posts",
      items: ["Holiday hours and seasonal ENT guidance.", "Doctor/team/process trust posts.", "Privacy-safe clinic photos and access reminders."],
    },
  ];
}

function buildPriorityTasks(
  places: LivePlaceLocation[],
  matchedPlaces: LivePlaceLocation[],
  gbpConnected: boolean,
): GBPTask[] {
  const hasMissingInfo = places.some((place) => !place.phone || !place.website || !place.mapsUrl || !place.weekdayText?.length);
  const hasLowPhotos = places.some((place) => place.photoCount === undefined || place.photoCount < 6);
  const hasReviews = places.some((place) => (place.reviews ?? 0) > 0);
  const tasks: Omit<GBPTask, "score">[] = [
    {
      title: "Audit GBP categories",
      detail: "Exact category data is unavailable; audit primary and secondary categories against relevant ENT competitors.",
      impact: 5,
      effort: 2,
      category: "Listing Optimization",
      expectedOutcomes: ["More profile views", "More calls"],
    },
    {
      title: "Build missing services list",
      detail: "Audit and add accurate ENT service entries, then align each service to a website page or section.",
      impact: 5,
      effort: 3,
      category: "Local SEO",
      expectedOutcomes: ["More profile views", "More appointments"],
    },
    {
      title: hasMissingInfo ? "Fix missing profile information" : "Schedule monthly profile information check",
      detail: hasMissingInfo
        ? "Update missing phone, website, Maps URL or hours fields before deeper optimization."
        : "Keep NAP, hours, website and appointment paths verified monthly.",
      impact: 5,
      effort: hasMissingInfo ? 2 : 1,
      category: "Listing Optimization",
      expectedOutcomes: ["More calls", "More direction requests", "More appointments"],
    },
    {
      title: hasLowPhotos ? "Refresh centre photo sets" : "Audit photo recency",
      detail: "Upload or verify exterior, interior, team and service-context photos for each centre.",
      impact: 4,
      effort: 3,
      category: "Listing Optimization",
      expectedOutcomes: ["More profile views", "More direction requests"],
    },
    {
      title: hasReviews ? "Systemize review requests and replies" : "Launch review acquisition workflow",
      detail: "Use QR/reception/WhatsApp prompts, reply to every review and route complaints into staff tasks.",
      impact: 5,
      effort: 3,
      category: "Review Growth",
      expectedOutcomes: ["More calls", "More appointments"],
    },
    {
      title: "Publish weekly GBP posts",
      detail: "Run access, service, education and trust posts using one clear CTA per post.",
      impact: 4,
      effort: 2,
      category: "Posting Strategy",
      expectedOutcomes: ["More profile views", "More calls"],
    },
    {
      title: "Clean local SEO citation consistency",
      detail: "Audit NAP consistency across website, social profiles and major directories.",
      impact: 4,
      effort: 3,
      category: "Local SEO",
      expectedOutcomes: ["More profile views"],
    },
    {
      title: gbpConnected ? "Use owned GBP performance for weekly optimization" : "Connect owned GBP performance access",
      detail: gbpConnected
        ? "Use profile views, search terms, calls, directions and website clicks to refine the weekly task queue."
        : "Owned performance access is needed for profile views, calls, directions, website clicks and search terms.",
      impact: 5,
      effort: gbpConnected ? 2 : 4,
      category: "Measurement",
      expectedOutcomes: ["More calls", "More direction requests", "More profile views", "More appointments"],
    },
    {
      title: matchedPlaces.length ? "Map centre pages to GBP landing URLs" : "Confirm centre listing ownership",
      detail: matchedPlaces.length
        ? "Ensure every GBP website link points to the best centre/service destination and has internal links from relevant pages."
        : "Confirm the correct listing for each centre before assigning local SEO actions.",
      impact: 4,
      effort: 2,
      category: "Local SEO",
      expectedOutcomes: ["More appointments", "More calls"],
    },
  ];

  return tasks
    .map((task) => ({ ...task, score: task.impact * 2 - task.effort }))
    .sort((left, right) => right.score - left.score || right.impact - left.impact);
}

function buildCompetitorComparison(
  places: LivePlaceLocation[],
  competitorGroups: PlaceCompetitorLocationGroup[],
  competitors: PlaceCompetitor[],
): CompetitorComparisonItem[] {
  if (!competitors.length) {
    return [{
      centre: "All centres",
      competitor: "Audit needed",
      categoryStatus: "Audit needed",
      serviceStatus: "Audit needed",
      photosStatus: "Audit needed",
      reviewStatus: "Audit needed",
      ratingStatus: "Audit needed",
      postActivityStatus: "Audit needed",
      ctaStatus: "Audit needed",
    }];
  }

  return competitorGroups.map((group) => {
    const own = places.find((place) => place.centre === group.centre);
    const competitor = group.competitors[0];

    if (!competitor) {
      return {
        centre: group.centre,
        competitor: "Audit needed",
        categoryStatus: "Audit needed",
        serviceStatus: "Audit needed",
        photosStatus: "Audit needed",
        reviewStatus: "Audit needed",
        ratingStatus: "Audit needed",
        postActivityStatus: "Audit needed",
        ctaStatus: "Audit needed",
      };
    }

    return {
      centre: group.centre,
      competitor: competitor.name,
      categoryStatus: "Audit needed",
      serviceStatus: "Audit needed",
      photosStatus: compareOptionalNumber(own?.photoCount, competitor.photoCount, "Own profile stronger", "Competitor has more visible photos"),
      reviewStatus: compareOptionalNumber(own?.reviews, competitor.reviews, "Own review count stronger", "Competitor has more visible reviews"),
      ratingStatus: compareOptionalNumber(own?.rating, competitor.rating, "Own rating stronger", "Competitor rating stronger"),
      postActivityStatus: "Audit needed",
      ctaStatus: competitor.website || competitor.mapsUrl ? "Competitor CTA visible" : "Audit needed",
    };
  });
}

function buildExpectedOutcomes(tasks: GBPTask[]): ExpectedOutcome[] {
  const outcomes = ["More calls", "More direction requests", "More profile views", "More appointments"];

  return outcomes.map((title) => ({
    title,
    detail: outcomeDetail(title),
    taskTitles: tasks
      .filter((task) => task.expectedOutcomes.includes(title))
      .slice(0, 4)
      .map((task) => task.title),
  }));
}

function ScoreBand({ band }: { band: GBPHealthScore["bands"][number] }) {
  const tone = band.state === "complete" ? "success" : band.state === "partial" ? "warning" : "neutral";
  const percent = Math.round((band.score / band.max) * 100);

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{band.label}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{band.detail}</p>
        </div>
        <StatusIndicator label={`${band.score}/${band.max}`} tone={tone} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PriorityTaskCard({ task }: { task: GBPTask }) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator label={task.category} tone="info" />
            <StatusIndicator label={`Score ${task.score}`} tone="success" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">{task.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.detail}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <StatusIndicator label={`Impact ${task.impact}/5`} tone="success" />
          <StatusIndicator label={`Effort ${task.effort}/5`} tone={task.effort <= 2 ? "success" : "warning"} />
        </div>
      </div>
    </article>
  );
}

function OpportunityGroup({
  title,
  opportunities,
}: {
  title: string;
  opportunities: OptimizationOpportunity[];
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-3">
        {opportunities.map((item) => (
          <div key={`${item.group}-${item.title}`} className="rounded-lg border bg-card p-3">
            <StatusIndicator label={opportunityLabel(item.state)} tone={opportunityTone(item.state)} />
            <p className="mt-2 text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            <p className="mt-2 text-xs font-medium text-foreground">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorComparisonCard({ item }: { item: CompetitorComparisonItem }) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.centre}</p>
          <p className="mt-1 text-xs text-muted-foreground">Compared with: {item.competitor}</p>
        </div>
        <StatusIndicator label="Comparison" tone="info" />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatus label="Categories" value={item.categoryStatus} />
        <MiniStatus label="Services" value={item.serviceStatus} />
        <MiniStatus label="Photos" value={item.photosStatus} />
        <MiniStatus label="Reviews" value={item.reviewStatus} />
        <MiniStatus label="Rating" value={item.ratingStatus} />
        <MiniStatus label="Posts" value={item.postActivityStatus} />
        <MiniStatus label="Website/CTA" value={item.ctaStatus} />
      </div>
    </article>
  );
}

function ExpectedOutcomeCard({ outcome }: { outcome: ExpectedOutcome }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">{outcome.title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {outcome.taskTitles.map((title) => (
          <StatusIndicator key={title} label={title} tone="info" />
        ))}
      </div>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  const audit = value === "Audit needed";

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
      {audit && <p className="mt-1 text-[11px] text-muted-foreground">Do not infer from unavailable data.</p>}
    </div>
  );
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

  return Array.from(competitors.values()).sort((left, right) => right.reviews - left.reviews);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bandState(score: number, max: number): GBPHealthScore["bands"][number]["state"] {
  if (score >= max * 0.8) return "complete";
  if (score > 0) return "partial";
  return "audit";
}

function compareOptionalNumber(
  own: number | undefined,
  competitor: number | undefined,
  ownWins: string,
  competitorWins: string,
) {
  if (own === undefined || competitor === undefined) return "Audit needed";
  if (own >= competitor) return ownWins;
  return competitorWins;
}

function opportunityLabel(state: OptimizationOpportunity["state"]) {
  if (state === "ready") return "Ready";
  if (state === "gap") return "Gap";
  return "Audit needed";
}

function opportunityTone(state: OptimizationOpportunity["state"]): Tone {
  if (state === "ready") return "success";
  if (state === "gap") return "warning";
  return "neutral";
}

function outcomeDetail(title: string) {
  if (title === "More calls") return "Improve phone visibility, trust signals, relevant services and post CTAs.";
  if (title === "More direction requests") return "Improve centre facts, Maps clarity, photos and access posts.";
  if (title === "More profile views") return "Improve categories, services, posts, reviews, photos and local SEO consistency.";
  return "Improve appointment paths, service-page alignment, review trust and clear CTAs.";
}
