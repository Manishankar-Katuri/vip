"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Globe2,
  HeartHandshake,
  MapPin,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  PhoneCall,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useHospital } from "@/hooks/useHospital";
import { DEMO_HOSPITALS } from "@/lib/demo-hospitals";
import type { ProductExperience } from "@/lib/product-experience";
import { hasPermission, PERMISSIONS } from "@/permissions-core";

type OnlinePresenceStrategyProps = {
  data: ProductExperience;
  basePath?: string;
};

type ActionSection = {
  slug: string;
  title: string;
  purpose: string;
  outcome: string;
  icon: typeof Target;
  actions: string[];
};

type SeoImpact = "High" | "Medium" | "Low";
type SeoDifficulty = "Low" | "Medium" | "High";
type SeoTimeToResults = "2-4 weeks" | "1-3 months" | "3-6 months";
type SeoActionLabel = "Do first" | "Quick win" | "Needs clinical review" | "Technical setup" | "Longer-term authority";

type SeoGrowthAction = {
  title: string;
  category: string;
  action: string;
  asset: string;
  targetTerms: string[];
  expectedImpact: string;
  owner: string;
  timing: string;
  label: SeoActionLabel;
  impact: SeoImpact;
  difficulty: SeoDifficulty;
  timeToResults: SeoTimeToResults;
  priorityScore: number;
};

type SeoHealthFactor = {
  label: string;
  score: number;
  detail: string;
};

type SeoHealthScore = {
  score: number;
  summary: string;
  factors: SeoHealthFactor[];
};

type SeoOpportunity = SeoGrowthAction & {
  whyItMatters: string;
};

type SeoRoadmapWeek = {
  week: string;
  title: string;
  actions: string[];
  owner: string;
  expectedResult: string;
};

type SeoExpectedOutcome = {
  title: string;
  value: string;
  detail: string;
  basis: string;
};

type ConversionOpportunityGroup = {
  title: string;
  channel: string;
  icon: typeof Target;
  metric: string;
  revenueSignal: string;
  actions: string[];
};

type ConversionPlanItem = {
  horizon: string;
  title: string;
  owner: string;
  action: string;
  expectedLift: string;
};

const sourceLinks = [
  {
    publisher: "Google Business Profile",
    title: "Improve local ranking",
    url: "https://support.google.com/business/answer/7091/improve-your-local-ranking-on-google",
  },
  {
    publisher: "Google Search Central",
    title: "SEO Starter Guide",
    url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
  },
  {
    publisher: "Google Search Central",
    title: "Helpful, reliable content",
    url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
  },
  {
    publisher: "Think with Google",
    title: "Discovery to decision journey",
    url: "https://business.google.com/us/think/consumer-insights/navigating-purchase-behavior-and-decision-making",
  },
  {
    publisher: "Google Search Console",
    title: "Performance report",
    url: "https://support.google.com/webmasters/answer/7576553?hl=en-GB",
  },
  {
    publisher: "Semrush",
    title: "Keyword Gap",
    url: "https://www.semrush.com/kb/28-keyword-gap",
  },
  {
    publisher: "Semrush",
    title: "Local SEO audit",
    url: "https://www.semrush.com/blog/local-seo-audit/",
  },
  {
    publisher: "Ahrefs",
    title: "Content gap analysis",
    url: "https://ahrefs.com/blog/content-gap-analysis/",
  },
  {
    publisher: "Ahrefs",
    title: "Link building",
    url: "https://ahrefs.com/seo/link-building",
  },
  {
    publisher: "SurferSEO",
    title: "Topical Map",
    url: "https://docs.surferseo.com/en/articles/9383782-topical-map",
  },
];

const conversionResearchLinks = [
  {
    publisher: "HubSpot",
    title: "Create calls-to-action",
    url: "https://knowledge.hubspot.com/ctas/create-calls-to-action?web=1",
    takeaway: "Use CTAs for appointment, WhatsApp, meeting and page paths; track clicks and test performance.",
  },
  {
    publisher: "Google Analytics",
    title: "About key events",
    url: "https://support.google.com/analytics/answer/9267568?hl=en-GB",
    takeaway: "Mark appointment submits, call taps, WhatsApp clicks and GBP actions as business-critical events.",
  },
  {
    publisher: "Hotjar",
    title: "What is Hotjar?",
    url: "https://help.hotjar.com/hc/en-us/articles/36820019634961-What-is-Hotjar",
    takeaway: "Use heatmaps, recordings, surveys and funnels to find where patients hesitate or drop off.",
  },
  {
    publisher: "Salesforce",
    title: "Convert qualified leads",
    url: "https://help.salesforce.com/s/articleView?id=sales.leads_convert.htm&language=en_US&type=5",
    takeaway: "Preserve lead source, qualification, ownership and opportunity movement after inquiry capture.",
  },
  {
    publisher: "Google Business Profile",
    title: "Business Profile Performance API",
    url: "https://developers.google.com/my-business/reference/performance/rest",
    takeaway: "Treat calls, website clicks and direction requests as profile-level conversion actions.",
  },
  {
    publisher: "WhatsApp Business",
    title: "Business Messaging Policy",
    url: "https://whatsappbusiness.com/policy/",
    takeaway: "Keep WhatsApp conversion paths consent-led, policy-safe and routed away from medical advice in chat.",
  },
];

const whatsappSourceLinks = [
  {
    publisher: "WhatsApp Business",
    title: "Business Platform Features",
    url: "https://whatsappbusiness.com/products/business-platform-features/",
  },
  {
    publisher: "WhatsApp Business",
    title: "Best practices for marketing messages",
    url: "https://whatsappbusiness.com/wp-content/uploads/2026/04/Best-Practices-for-Marketing-Messages-on-WhatsApp-.pdf",
  },
  {
    publisher: "HubSpot",
    title: "WhatsApp templates and workflows",
    url: "https://knowledge.hubspot.com/templates/use-whatsapp-message-templates-in-hubspot",
  },
  {
    publisher: "HubSpot",
    title: "WhatsApp CRM integration",
    url: "https://www.hubspot.com/centralize-automate-whatsapp-crm",
  },
  {
    publisher: "Intercom",
    title: "Inbox setup and routing",
    url: "https://www.intercom.com/help/en/articles/10223008-setting-up-the-inbox",
  },
  {
    publisher: "Intercom",
    title: "Workflows builder",
    url: "https://www.intercom.com/help/en/articles/6611595-using-the-workflows-builder",
  },
  {
    publisher: "Zendesk",
    title: "First reply time",
    url: "https://www.zendesk.com/blog/analytics-and-data/customer-analytics/first-reply-time/",
  },
  {
    publisher: "Zendesk",
    title: "WhatsApp template messages",
    url: "https://support.zendesk.com/hc/en-us/articles/5869718332954-Working-with-WhatsApp-template-messages",
  },
];

export function OnlinePresenceStrategyPage({ data }: OnlinePresenceStrategyProps) {
  return <StrategyOverviewPage data={data} />;
}

export function StrategyOverviewPage({ data, basePath = "/strategy" }: OnlinePresenceStrategyProps) {
  const { activeHospital, currentUser } = useHospital();
  const displayHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const canViewStrategy =
    !currentUser ||
    hasPermission(currentUser, PERMISSIONS.VIEW_STRATEGY);
  const sections = buildActionSections(data);

  return (
    <PermissionGate fallback={<AccessDenied />}>
      {!canViewStrategy ? (
        <AccessDenied />
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
                  Strategy
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
                  Strategy sections for visibility, trust and patient enquiries
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
                  A focused strategy workspace for {displayHospital.name}: content, Google Business Profile, reviews, SEO, social, WhatsApp, competitor gaps and conversion paths are now split into their own action pages.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusIndicator label="Action-first strategy" tone="success" />
                <StatusIndicator label="Healthcare-safe growth" tone="warning" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <HeroFact
                icon={<Target />}
                label="Main goal"
                value="Make the hospital easier to find, easier to trust and easier to contact."
              />
              <HeroFact
                icon={<Route />}
                label="Strategy rule"
                value="Every channel should move people one step closer to a verified appointment path."
              />
              <HeroFact
                icon={<ShieldCheck />}
                label="Guardrail"
                value="Grow visibility without unsafe medical claims, privacy risk or fear-based messaging."
              />
            </div>
          </section>

          <Panel className="p-5">
            <SectionHeader
              title="Priority Actions"
              description="Open each strategy subsection as its own page."
              action={<Sparkles className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <ContentStrategyCard basePath={basePath} />
              {sections.map((section) => (
                <ActionSectionCard key={section.title} section={section} basePath={basePath} />
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="90-Day Execution Sequence"
                description="Keep the work ordered so the team does not try to fix every channel at once."
                action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
              />
              <div className="space-y-3">
                {[
                  {
                    period: "Days 1-30",
                    title: "Fix discoverability basics",
                    detail: "Clean up GBP, service pages, contact paths, review response workflow and profile consistency.",
                  },
                  {
                    period: "Days 31-60",
                    title: "Build trust and demand",
                    detail: "Publish doctor-led search/social content, collect reviews, answer common questions and improve local proof.",
                  },
                  {
                    period: "Days 61-90",
                    title: "Scale what converts",
                    detail: "Double down on channels and topics that create calls, directions, WhatsApp enquiries and appointment requests.",
                  },
                ].map((item) => (
                  <div key={item.period} className="rounded-lg border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusIndicator label={item.period} tone="info" />
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Weekly Operating Rhythm"
                description="A simple rhythm to keep the strategy moving."
                action={<CheckCircle2 className="size-5 text-primary" aria-hidden />}
              />
              <div className="space-y-3">
                {[
                  "Monday: choose the week’s GBP, SEO, content and review actions.",
                  "Tuesday-Wednesday: produce and approve doctor-led content and profile updates.",
                  "Thursday: publish, distribute and update conversion paths.",
                  "Friday: review enquiries, reviews, calls, directions and competitor movement.",
                  "Monthly: decide what to stop, continue or scale.",
                ].map((item) => (
                  <p key={item} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                    {item}
                  </p>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <SectionHeader
              title="Measurement Focus"
              description="Track only the numbers that show online presence is becoming real business movement."
              action={<StatusIndicator label="Outcome-led" tone="success" />}
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Findability", "GBP views, search visibility, branded searches and profile completeness."],
                ["Trust", "Review volume, review quality, response completion and doctor-authority content."],
                ["Intent", "Calls, directions, WhatsApp enquiries, website actions and appointment requests."],
                ["Learning", "Which topics, channels and CTAs lead to actual patient enquiries."],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="Safety Rules"
                description="These rules apply across GBP, SEO, social, reviews, WhatsApp and ads."
                action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "Use doctor review for medical education, symptoms, procedures and awareness content.",
                  "Do not promise outcomes, diagnose in captions or use fear as a conversion tactic.",
                  "Do not use patient stories, photos or identifiable details without documented consent.",
                  "Reply to reviews without revealing patient information or arguing publicly.",
                  "Use competitor intelligence to find gaps, not to copy claims, captions or creative.",
                  "Keep WhatsApp consent-based and avoid unsolicited medical advice.",
                ].map((rule) => (
                  <p key={rule} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                    {rule}
                  </p>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Reference Anchors"
                description="Sources used to shape the strategy."
                action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
              />
              <div className="space-y-3">
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
                      <ExternalLink className="size-3.5" />
                    </p>
                  </a>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <SectionHeader
              title="Content Strategy Connection"
              description="Content strategy remains one of the core strategy subsections for calendars, scripts, captions, timing and clinical review."
              action={<Link href={contentStrategyHref(basePath)} className="text-sm font-semibold text-primary hover:underline">Open content strategy</Link>}
            />
          </Panel>
        </div>
      )}
    </PermissionGate>
  );
}

function WhatsAppStrategyWorkspace({
  data,
  section,
  hospitalName,
  hospitalSpecialty,
  hospitalCity,
}: {
  data: ProductExperience;
  section: ActionSection;
  hospitalName: string;
  hospitalSpecialty: string | null;
  hospitalCity: string | null;
}) {
  const healthScore = buildWhatsAppHealthScore(data);
  const roiActions = buildWhatsAppRoiActions();
  const responsePlan = buildResponseImprovementPlan();
  const leadFollowUps = buildLeadFollowUpStrategy();
  const appointmentStrategy = buildAppointmentConversionStrategy(hospitalSpecialty);
  const automationOpportunities = buildAutomationOpportunities();
  const departmentOpportunities = buildDepartmentOpportunities(hospitalSpecialty, hospitalCity);
  const flowImprovements = buildConversationFlowImprovements();
  const dropOffRecovery = buildDropOffRecoveryPlan();
  const weeklyPlan = buildWeeklyExecutionPlan();
  const expectedOutcomes = buildExpectedWhatsAppOutcomes(data.available);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
              WhatsApp Conversion Growth
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
              WhatsApp Conversion Growth Strategy Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
              Turn WhatsApp from a loose inbox into a conversion operating system for {hospitalName}: faster replies, cleaner lead follow-up, stronger appointment booking and measurable recovery of missed conversations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusIndicator label="ROI-prioritized" tone="success" />
            <StatusIndicator label="No live attribution claim" tone="warning" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <HeroFact
            icon={<MessageCircle />}
            label="Core outcome"
            value="Faster responses, more appointment-ready conversations and better conversion rates."
          />
          <HeroFact
            icon={<Target />}
            label="Conversion rule"
            value="Every inbound chat needs an owner, status, next step and recovery path."
          />
          <HeroFact
            icon={<ShieldCheck />}
            label="Guardrail"
            value="Use templates, consent, 24-hour window discipline and consultation handoff for medical questions."
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="WhatsApp Health Score"
            description="Weighted readiness score for conversion operations."
            action={<StatusIndicator label={healthScore.status} tone={healthScore.tone} />}
          />
          <div className="rounded-lg border bg-primary/5 p-5">
            <p className="text-5xl font-semibold tracking-normal text-foreground">{healthScore.score}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{healthScore.summary}</p>
          </div>
          <div className="mt-4 grid gap-3">
            {healthScore.categories.map((category) => (
              <div key={category.name} className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{category.name}</p>
                  <StatusIndicator label={`${category.score}/100`} tone={category.tone} />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="ROI-Prioritized Action Queue"
            description="Start with the fixes most likely to improve appointments and conversion quickly."
            action={<Target className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {roiActions.map((item) => (
              <div key={item.priority} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusIndicator label={item.priority} tone={item.tone} />
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <CompactField label="Action" value={item.action} />
                  <CompactField label="ROI impact" value={item.roiImpact} />
                  <CompactField label="Time to impact" value={item.timeToImpact} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Response Improvement Plan"
          description="Reduce first response time and prevent chats from aging into lost leads."
          action={<section.icon className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {responsePlan.map((item) => (
            <ConversionStrategyCard key={item.title} item={item} />
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader
          title="Lead Follow-Up Strategy"
          description="Make every inquiry visible, owned and recoverable."
          action={<Route className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {leadFollowUps.map((item) => (
            <StageCard key={item.stage} item={item} />
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader
          title="Appointment Conversion Strategy"
          description="Convert intent into a confirmed appointment path without asking patients to repeat themselves."
          action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {appointmentStrategy.map((item) => (
            <ConversionStrategyCard key={item.title} item={item} />
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader
          title="Automation Opportunities"
          description="Automate repetitive steps while keeping meaningful and clinical conversations human-led."
          action={<Sparkles className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {automationOpportunities.map((item) => (
            <ConversionStrategyCard key={item.title} item={item} />
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader
          title="Department-Specific Opportunities"
          description="Route conversations to the right owner before response delays create drop-off."
          action={<Building2 className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {departmentOpportunities.map((item) => (
            <StageCard key={item.stage} item={item} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Conversation Flow Improvements"
            description="Shorten the route from first message to clear intent, owner and next step."
            action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {flowImprovements.map((item) => (
              <ConversionStrategyCard key={item.title} item={item} />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Drop-Off Recovery Opportunities"
            description="Recover conversations before the 24-hour window, then use approved templates where allowed."
            action={<StatusIndicator label="Recovery" tone="warning" />}
          />
          <div className="space-y-3">
            {dropOffRecovery.map((item) => (
              <StageCard key={item.stage} item={item} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Weekly Execution Plan"
          description="A one-week operating rhythm for improving response speed, booking conversion and recovery."
          action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-5">
          {weeklyPlan.map((item) => (
            <StageCard key={item.stage} item={item} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Expected Outcomes"
            description="The dashboard is designed to move operating metrics, then appointment conversion."
            action={<StatusIndicator label={data.available ? "Track weekly" : "Instrument first"} tone={data.available ? "success" : "warning"} />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {expectedOutcomes.map((item) => (
              <div key={item.title} className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">ROI basis: {item.roiBasis}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Source Anchors"
            description="Research references behind the conversion dashboard."
            action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {whatsappSourceLinks.map((source) => (
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
                  <ExternalLink className="size-3.5" />
                </p>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-primary/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function ConversionStrategyCard({
  item,
}: {
  item: { title: string; detail: string; action: string; measure: string; roi: string; tone?: "success" | "warning" | "info" | "neutral" };
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusIndicator label={item.roi} tone={item.tone ?? "info"} />
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CompactField label="Action" value={item.action} />
        <CompactField label="Measure" value={item.measure} />
      </div>
    </div>
  );
}

function StageCard({
  item,
}: {
  item: { stage: string; action: string; owner: string; measure: string; tone?: "success" | "warning" | "info" | "neutral" };
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <StatusIndicator label={item.stage} tone={item.tone ?? "info"} />
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.action}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner: {item.owner}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">Measure: {item.measure}</p>
    </div>
  );
}

function ConversionPathStrategyDashboard({
  data,
  section,
  hospitalName,
  hospitalSpecialty,
  hospitalCity,
}: {
  data: ProductExperience;
  section: ActionSection;
  hospitalName: string;
  hospitalSpecialty: string | null;
  hospitalCity: string | null;
}) {
  const specialty = hospitalSpecialty ?? "hospital";
  const city = hospitalCity ?? "local market";
  const measurementStatus = data.available ? "Strategy signals available" : "Setup-labeled baseline";
  const funnel = buildConversionFunnel();
  const opportunityGroups = buildConversionOpportunityGroups(specialty, city);
  const dropOffs = buildConversionDropOffs();
  const plan = buildConversionImprovementPlan();
  const roadmap = buildWeeklyConversionRoadmap();
  const outcomes = buildConversionExpectedOutcomes();

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
              Hospital conversion optimization dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
              Conversion Path Strategy
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
              A revenue-driving action dashboard for {hospitalName}: tighten the path from search, website, WhatsApp and GBP interest into qualified inquiries and booked appointments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusIndicator label={measurementStatus} tone="warning" />
            <StatusIndicator label="Revenue-priority actions" tone="success" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <HeroFact
            icon={<BarChart3 />}
            label="Conversion health score"
            value="68 / 100 modeled baseline. Strong intent paths exist, but tracking, missed-call recovery and booking handoff need tightening."
          />
          <HeroFact
            icon={<CalendarCheck />}
            label="Appointment impact focus"
            value="Move every high-intent visitor toward call, WhatsApp, booking or reception follow-up with fewer dead ends."
          />
          <HeroFact
            icon={<ShieldCheck />}
            label="Healthcare guardrail"
            value="No diagnosis by chat, no outcome promises, no patient-identifiable proof, and every medical question routes to consultation."
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Conversion Health Score"
            description="Modeled strategic baseline until GA4, call, GBP, WhatsApp and CRM attribution are fully connected."
            action={<StatusIndicator label="68 / 100" tone="warning" />}
          />
          <div className="space-y-3">
            {[
              ["Contact visibility", "76", "Phone, WhatsApp and appointment paths are visible, but not yet measured consistently."],
              ["Tracking readiness", "52", "GA4 key events and CRM source fields need clean setup before attribution claims."],
              ["Lead quality handoff", "63", "Inquiry capture exists; qualification, owner and appointment outcome fields need stricter routing."],
              ["Drop-off learning", "58", "Hotjar-style heatmaps, recordings, surveys and funnels should explain where users hesitate."],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <StatusIndicator label={`${value}/100`} tone={Number(value) >= 70 ? "success" : "warning"} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Funnel Analysis"
            description="The hospital journey to measure before claiming conversion lift."
            action={<Route className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {funnel.map((step, index) => (
              <div key={step.stage} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{step.stage}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.action}</p>
                <div className="mt-3 rounded-lg border bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Measure</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.measure}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Revenue-Driving Conversion Opportunities"
          description="Prioritize actions that create appointments, inquiries and better lead quality."
          action={<section.icon className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {opportunityGroups.map((group) => (
            <ConversionOpportunityCard key={group.title} group={group} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Drop-Off Analysis"
            description="Use GA4 key events to quantify the leak and Hotjar-style behavior evidence to explain it."
            action={<MousePointerClick className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {dropOffs.map((item) => (
              <div key={item.stage} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.stage}</p>
                  <StatusIndicator label={item.risk} tone={item.risk === "High revenue leak" ? "danger" : "warning"} />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.symptom}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">Fix:</span> {item.fix}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Expected Outcomes"
            description="Outcomes are directional until live attribution confirms actual lift."
            action={<TrendingUp className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {outcomes.map((outcome) => (
              <div key={outcome.title} className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <outcome.icon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{outcome.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{outcome.detail}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary">{outcome.measure}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Conversion Improvement Plan"
          description="The order favors high-intent, low-friction work before deeper automation."
          action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.map((item) => (
            <ConversionPlanCard key={item.horizon} item={item} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Weekly Action Roadmap"
            description="A weekly operating cadence for reception, marketing, strategy and CRM owners."
            action={<CalendarCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {roadmap.map((item) => (
              <div key={item.week} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusIndicator label={item.week} tone="info" />
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {item.actions.map((action) => (
                    <li key={action} className="flex gap-2">
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Source-Backed Method"
            description="Research anchors used to shape this conversion dashboard."
            action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {conversionResearchLinks.map((source) => (
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
                  <ExternalLink className="size-3.5" aria-hidden />
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.takeaway}</p>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ConversionOpportunityCard({ group }: { group: ConversionOpportunityGroup }) {
  const Icon = group.icon;

  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{group.channel}</p>
            <h3 className="mt-1 text-sm font-semibold text-foreground">{group.title}</h3>
          </div>
        </div>
        <StatusIndicator label={group.metric} tone="info" />
      </div>
      <p className="mt-3 rounded-lg border bg-primary/5 p-3 text-sm leading-6 text-muted-foreground">
        <span className="font-semibold text-foreground">Revenue signal:</span> {group.revenueSignal}
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
        {group.actions.map((action) => (
          <li key={action} className="flex gap-2">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ConversionPlanCard({ item }: { item: ConversionPlanItem }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <StatusIndicator label={item.horizon} tone="info" />
      <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.action}</p>
      <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
        <p><span className="font-semibold text-foreground">Owner:</span> {item.owner}</p>
        <p><span className="font-semibold text-foreground">Expected lift:</span> {item.expectedLift}</p>
      </div>
    </div>
  );
}

function buildConversionFunnel() {
  return [
    {
      stage: "Discovery",
      action: "Patient sees GBP, search result, social post, referral link or branded search result.",
      measure: "GBP views, landing-page sessions, source/medium and campaign-tagged visits.",
    },
    {
      stage: "Landing or profile visit",
      action: "Patient evaluates service relevance, doctor trust, location, timings and access route.",
      measure: "Landing-page engagement, GBP website clicks, scroll depth and Hotjar heatmap attention.",
    },
    {
      stage: "Contact intent",
      action: "Patient taps call, WhatsApp, booking, directions or appointment CTA.",
      measure: "GA4 key events for call taps, WhatsApp clicks, booking starts and direction clicks.",
    },
    {
      stage: "Inquiry",
      action: "Reception, WhatsApp or form captures the need, location, preferred timing and contact details.",
      measure: "Lead source, inquiry reason, response time, missed calls, form completion and chat handoff.",
    },
    {
      stage: "Booked appointment",
      action: "Inquiry turns into a confirmed appointment with doctor, location and time clarity.",
      measure: "Booking confirmation, no-show risk, reminder status and source-to-booking conversion.",
    },
    {
      stage: "Qualified consultation",
      action: "Lead quality is reviewed by service need, urgency, fit, repeat potential and revenue relevance.",
      measure: "Salesforce-style lead status, owner, qualification notes and opportunity movement.",
    },
  ];
}

function buildConversionOpportunityGroups(specialty: string, city: string): ConversionOpportunityGroup[] {
  return [
    {
      title: "Call Conversion Opportunities",
      channel: "Calls",
      icon: PhoneCall,
      metric: "High intent",
      revenueSignal: "Calls are usually the shortest path from concern to appointment, especially for urgent or local access questions.",
      actions: [
        "Place tap-to-call above the fold on mobile service pages and sticky footer actions.",
        "Track call taps as GA4 key events and tag phone sources for GBP, website and campaign routes.",
        "Create missed-call recovery within one working hour with source and service noted.",
        "Give reception a short qualification script: service need, location, preferred doctor/time and booking next step.",
      ],
    },
    {
      title: "Website Conversion Opportunities",
      channel: "Website",
      icon: Globe2,
      metric: "CTA clarity",
      revenueSignal: `High-intent ${specialty} visitors need one obvious next action after reading service, doctor and location content.`,
      actions: [
        "Use one primary CTA per service page: book appointment, call reception or ask on WhatsApp.",
        "Add mobile sticky actions for call, WhatsApp and booking without covering page content.",
        "Simplify forms to name, phone, service need, preferred location and preferred time.",
        "Use Hotjar recordings, heatmaps and surveys to find ignored CTAs, scroll drop-offs and confusing copy.",
      ],
    },
    {
      title: "WhatsApp Conversion Opportunities",
      channel: "WhatsApp",
      icon: MessageCircle,
      metric: "Consent-led",
      revenueSignal: "WhatsApp can turn questions into booked visits when staff route quickly and avoid medical advice in chat.",
      actions: [
        "Use consented WhatsApp entry points with clear purpose, opt-out route and staffed response hours.",
        "Create quick replies for appointment help, reports to bring, location questions and consultation routing.",
        "Ask qualification prompts before handoff: concern category, location, preferred time and existing/new patient.",
        "Escalate personal symptoms, prescriptions and urgent concerns to call or consultation instead of chat diagnosis.",
      ],
    },
    {
      title: "GBP Conversion Opportunities",
      channel: "Google Business Profile",
      icon: MapPin,
      metric: "Local action",
      revenueSignal: `GBP is the local landing page for ${city}; calls, website clicks and directions should lead to measurable booking movement.`,
      actions: [
        "Verify call, website, directions and appointment links for every centre listing.",
        "Add UTM parameters to GBP website and appointment links where appropriate.",
        "Align GBP services with website service pages and appointment CTAs.",
        "Review calls, website clicks, directions and post actions weekly as conversion proxies.",
      ],
    },
    {
      title: "Booking Optimization Opportunities",
      channel: "Booking",
      icon: CalendarCheck,
      metric: "Appointment path",
      revenueSignal: "Every extra field, unclear doctor choice or delayed confirmation can turn a qualified lead into a lost appointment.",
      actions: [
        "Reduce booking friction by asking only for details needed to confirm the appointment.",
        "Show doctor, location, timing and callback expectation before the patient submits.",
        "Send confirmation and preparation instructions by SMS or WhatsApp after booking.",
        "Record source, service need and booking outcome so lead quality can be reviewed weekly.",
      ],
    },
  ];
}

function buildConversionDropOffs() {
  return [
    {
      stage: "Profile or page visit without contact action",
      risk: "High revenue leak",
      symptom: "Users read service content or GBP details but do not tap call, WhatsApp, booking or directions.",
      fix: "Move primary CTAs higher, make mobile actions persistent, and test CTA wording through tracked HubSpot-style CTA variants.",
    },
    {
      stage: "Contact tap without captured inquiry",
      risk: "High revenue leak",
      symptom: "Call taps and WhatsApp clicks happen, but missed calls, unanswered chats or untagged inquiries break attribution.",
      fix: "Add missed-call recovery, WhatsApp owner assignment and source fields before scaling campaign traffic.",
    },
    {
      stage: "Inquiry without appointment",
      risk: "Medium revenue leak",
      symptom: "Patients ask questions, but the team does not consistently convert suitable inquiries into confirmed appointment slots.",
      fix: "Use a reception qualification script, booking handoff checklist and follow-up task for every qualified inquiry.",
    },
    {
      stage: "Appointment without lead quality learning",
      risk: "Medium revenue leak",
      symptom: "Booked appointments are not tied back to service, source, quality or repeat potential.",
      fix: "Use Salesforce-style lead source, owner, status and qualification fields so the strategy can optimize for good leads.",
    },
  ];
}

function buildConversionImprovementPlan(): ConversionPlanItem[] {
  return [
    {
      horizon: "Week 1",
      title: "Instrument the money actions",
      owner: "Analytics + Strategy",
      action: "Define GA4 key events for call taps, WhatsApp clicks, booking starts, form submits and GBP appointment links.",
      expectedLift: "Cleaner attribution and faster identification of the highest-value paths.",
    },
    {
      horizon: "Week 2",
      title: "Fix contact friction",
      owner: "Website + Reception",
      action: "Add visible mobile CTAs, simplify booking fields and confirm every phone, WhatsApp and appointment link.",
      expectedLift: "More inquiries from existing traffic before increasing acquisition spend.",
    },
    {
      horizon: "Week 3",
      title: "Improve lead handoff",
      owner: "Front office + CRM",
      action: "Standardize inquiry source, service need, owner, follow-up status and appointment outcome fields.",
      expectedLift: "Better lead quality visibility and fewer qualified inquiries lost after first contact.",
    },
    {
      horizon: "Week 4",
      title: "Use behavior evidence",
      owner: "Strategy + Production",
      action: "Review Hotjar-style heatmaps, recordings, funnels and surveys to explain CTA misses and form abandonment.",
      expectedLift: "Sharper page changes based on observed friction, not guesswork.",
    },
  ];
}

function buildWeeklyConversionRoadmap() {
  return [
    {
      week: "Monday",
      title: "Review conversion health",
      actions: [
        "Check call taps, WhatsApp clicks, booking starts and GBP actions.",
        "List the top three revenue leaks from the prior week.",
      ],
    },
    {
      week: "Tuesday",
      title: "Fix one high-intent page",
      actions: [
        "Improve CTA placement, booking route and service-page next step.",
        "Confirm mobile layout and sticky action behavior.",
      ],
    },
    {
      week: "Wednesday",
      title: "Tighten inquiry handling",
      actions: [
        "Audit missed calls, WhatsApp response time and form follow-up.",
        "Coach reception on the qualification script and booking handoff.",
      ],
    },
    {
      week: "Thursday",
      title: "Update GBP and WhatsApp routes",
      actions: [
        "Verify GBP links, appointment URL, UTM tags and centre contact facts.",
        "Update WhatsApp quick replies and safe escalation language.",
      ],
    },
    {
      week: "Friday",
      title: "Decide what to scale",
      actions: [
        "Compare appointment movement by channel and service need.",
        "Choose next week's page, CTA, call or WhatsApp improvement.",
      ],
    },
  ];
}

function buildConversionExpectedOutcomes() {
  return [
    {
      title: "More appointments",
      icon: CalendarCheck,
      detail: "More high-intent visitors should reach a confirmed appointment path through clearer CTAs, faster call recovery and simpler booking.",
      measure: "Booked appointments by source and service need.",
    },
    {
      title: "More inquiries",
      icon: MessageCircle,
      detail: "Calls, WhatsApp and forms should capture more existing demand before the team increases content or ad volume.",
      measure: "Qualified inquiries, response time and contact-action rate.",
    },
    {
      title: "Better lead quality",
      icon: Users,
      detail: "Lead source, service category, location, owner and appointment outcome should show which channels create useful inquiries.",
      measure: "Lead qualification rate and source-to-appointment movement.",
    },
  ];
}

export function OnlinePresencePriorityPage({
  data,
  slug,
}: OnlinePresenceStrategyProps & {
  slug: string;
}) {
  return <StrategySubsectionPage data={data} slug={slug} />;
}

export function StrategySubsectionPage({
  data,
  slug,
  basePath = "/strategy",
}: OnlinePresenceStrategyProps & {
  slug: string;
}) {
  const { activeHospital, currentUser } = useHospital();
  const displayHospital = activeHospital ?? DEMO_HOSPITALS[0];
  const canViewStrategy =
    !currentUser ||
    hasPermission(currentUser, PERMISSIONS.VIEW_STRATEGY);
  const section = buildActionSections(data).find((item) => item.slug === slug);

  return (
    <PermissionGate fallback={<AccessDenied />}>
      {!canViewStrategy ? (
        <AccessDenied />
      ) : !section ? (
        <Panel className="p-6">
          <SectionHeader
            title="Strategy section not found"
            description="This strategy subsection does not exist yet."
            action={<Link href={basePath} className="text-sm font-semibold text-primary hover:underline">Back to strategy</Link>}
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to strategy
          </Link>

          {section.slug === "whatsapp-community-strategy" ? (
            <WhatsAppStrategyWorkspace
              data={data}
              section={section}
              hospitalName={displayHospital.name}
              hospitalSpecialty={displayHospital.specialty}
              hospitalCity={displayHospital.city}
            />
          ) : section.slug === "seo-strategy" ? (
            <SeoStrategyDeepDive section={section} data={data} hospitalName={displayHospital.name} />
          ) : section.slug === "conversion-path-strategy" ? (
            <ConversionPathStrategyDashboard
              data={data}
              section={section}
              hospitalName={displayHospital.name}
              hospitalSpecialty={displayHospital.specialty}
              hospitalCity={displayHospital.city}
            />
          ) : (
            <>
          <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
                  Strategy Subsection
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
                  {section.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
                  {section.purpose} This page turns that priority into a focused action plan for {displayHospital.name}.
                </p>
              </div>
              <StatusIndicator label="Action plan" tone="success" />
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="Actions To Take"
                description="The core work for this priority."
                action={<section.icon className="size-5 text-primary" aria-hidden />}
              />
              <ul className="space-y-3">
                {section.actions.map((action) => (
                  <li key={action} className="flex gap-3 rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Expected Outcome"
                description="What this priority should improve."
                action={<StatusIndicator label="Business result" tone="info" />}
              />
              <div className="rounded-lg border bg-primary/5 p-4">
                <p className="text-sm leading-6 text-muted-foreground">{section.outcome}</p>
              </div>
              <div className="mt-4 rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">How to judge progress</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Look for clearer visibility, stronger trust signals and more people taking the next step through calls, directions, WhatsApp, website actions or appointment requests.
                </p>
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <SectionHeader
              title="Execution Sequence"
              description="A simple rollout sequence for this action area."
              action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
            />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  period: "First 2 weeks",
                  title: "Clean up the foundation",
                  detail: "Fix missing information, unclear messaging, broken next steps and approval gaps.",
                },
                {
                  period: "Weeks 3-6",
                  title: "Publish and distribute",
                  detail: "Create the priority assets, publish them through the right channels and route people to verified contact paths.",
                },
                {
                  period: "Weeks 7-12",
                  title: "Improve and scale",
                  detail: "Keep what creates intent, stop what does not, and turn repeated learnings into the next strategy cycle.",
                },
              ].map((item) => (
                <div key={item.period} className="rounded-lg border bg-background p-4">
                  <StatusIndicator label={item.period} tone="info" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
            <Panel className="p-5">
              <SectionHeader
                title="Do / Avoid"
                description="Keep the work sharp and healthcare-safe."
                action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">Do</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Use clear patient language.</li>
                    <li>Keep the next step obvious.</li>
                    <li>Show doctor credibility and local access.</li>
                    <li>Review medical content before publishing.</li>
                  </ul>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">Avoid</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Do not promise outcomes.</li>
                    <li>Do not reveal patient information.</li>
                    <li>Do not copy competitor claims or captions.</li>
                    <li>Do not send unsolicited medical advice.</li>
                  </ul>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHeader
                title="Related References"
                description="Useful source anchors for this priority."
                action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
              />
              <div className="space-y-3">
                {sourceLinks.slice(0, 3).map((source) => (
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
                      <ExternalLink className="size-3.5" />
                    </p>
                  </a>
                ))}
              </div>
            </Panel>
          </div>
            </>
          )}
        </div>
      )}
    </PermissionGate>
  );
}

function SeoStrategyDeepDive({
  section,
  data,
  hospitalName,
}: {
  section: ActionSection;
  data: ProductExperience;
  hospitalName: string;
}) {
  const health = buildSeoHealthScore(data);
  const servicePages = buildServicePageOpportunities(data);
  const missingKeywords = buildMissingKeywordActions(data);
  const localSeo = buildLocalSeoOpportunities();
  const contentSeo = buildContentSeoOpportunities(data);
  const competitorGaps = buildCompetitorKeywordGaps(data);
  const technicalPriorities = buildTechnicalSeoPriorities();
  const linkBuilding = buildLinkBuildingOpportunities();
  const roadmap = buildWeeklySeoRoadmap(data);
  const outcomes = buildExpectedSeoOutcomes(data);
  const topActions = [
    ...servicePages,
    ...missingKeywords,
    ...localSeo,
    ...contentSeo,
    ...competitorGaps,
    ...technicalPriorities,
    ...linkBuilding,
  ].sort((left, right) => right.priorityScore - left.priorityScore).slice(0, 5);

  return (
    <>
      <section className="rounded-lg bg-slate-950 p-6 text-white shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-200">
              Deep SEO Strategy
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
              Hospital SEO Growth Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">
              {section.purpose} This dashboard converts research from Google Search Central, Semrush, Ahrefs and SurferSEO into prioritized hospital SEO actions for {hospitalName}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusIndicator label="Impact scored" tone="success" />
            <StatusIndicator label="Healthcare-safe" tone="warning" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="SEO Health Score"
            description="Composite score across content, local, technical, tracking, internal-link and authority readiness."
            action={<StatusIndicator label={`${health.score}/100`} tone={health.score >= 70 ? "success" : health.score >= 50 ? "warning" : "danger"} />}
          />
          <div className="rounded-lg border bg-primary/5 p-5">
            <p className="text-4xl font-semibold text-foreground">{health.score}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{health.summary}</p>
          </div>
          <div className="mt-4 space-y-2">
            {health.factors.map((factor) => (
              <div key={factor.label} className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{factor.label}</p>
                  <StatusIndicator label={`${factor.score}/100`} tone={factor.score >= 70 ? "success" : factor.score >= 50 ? "warning" : "danger"} />
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{factor.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Top Priority Actions"
            description="Sorted by impact, difficulty and time-to-results."
            action={<Target className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {topActions.map((item, index) => (
              <SeoGrowthActionCard key={`${item.category}-${item.title}`} action={item} rank={index + 1} compact />
            ))}
          </div>
        </Panel>
      </div>

      <SeoDashboardSection
        title="Service Page Opportunities"
        description="Service and trust pages the hospital should create or improve first."
        actions={servicePages}
      />

      <SeoDashboardSection
        title="Missing Keywords"
        description="Keyword clusters that need a matching page or article, not just mentions inside generic copy."
        actions={missingKeywords}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SeoDashboardSection
          title="Local SEO Opportunities"
          description="Actions that improve centre discoverability, GBP alignment and local patient intent."
          actions={localSeo}
        />
        <SeoDashboardSection
          title="Content SEO Opportunities"
          description="Article and page briefs based on topical map and content-gap thinking."
          actions={contentSeo}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SeoDashboardSection
          title="Competitor Keyword Gaps"
          description="Competitor observations converted into execution tasks."
          actions={competitorGaps}
        />
        <SeoDashboardSection
          title="Technical SEO Priorities"
          description="Technical work that helps the new content rank and convert."
          actions={technicalPriorities}
        />
      </div>

      <SeoDashboardSection
        title="Link Building Opportunities"
        description="Authority-building work for local citations, associations, partnerships and health resources."
        actions={linkBuilding}
      />

      <Panel className="p-5">
        <SectionHeader
          title="Weekly SEO Roadmap"
          description="Eight-week action sequence from foundation to publishing, technical support and authority growth."
          action={<ClipboardCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roadmap.map((item) => (
            <div key={item.week} className="rounded-lg border bg-background p-4">
              <StatusIndicator label={item.week} tone="info" />
              <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                {item.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Owner:</span> {item.owner}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Expected:</span> {item.expectedResult}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Panel className="p-5">
          <SectionHeader
            title="Expected Outcomes"
            description="Directional growth estimates. These are not ranking guarantees."
            action={<Sparkles className="size-5 text-primary" aria-hidden />}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <div key={outcome.title} className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{outcome.title}</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{outcome.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{outcome.detail}</p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground">Basis:</span> {outcome.basis}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionHeader
            title="Research Anchors"
            description="Sources used to shape the dashboard actions."
            action={<BookOpenCheck className="size-5 text-primary" aria-hidden />}
          />
          <div className="space-y-3">
            {sourceLinks.filter((source) => /Google Search|Semrush|Ahrefs|Surfer/i.test(`${source.publisher} ${source.title}`)).map((source) => (
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
                  <ExternalLink className="size-3.5" />
                </p>
              </a>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionHeader
          title="Healthcare SEO Guardrails"
          description="Keep the dashboard actionable without unsafe claims."
          action={<ShieldCheck className="size-5 text-primary" aria-hidden />}
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Expected outcomes are directional estimates, not ranking guarantees.",
            "Medical education pages require doctor review before publishing.",
            "Use keyword and competitor gaps to guide content, not to claim superiority.",
            "Measure leads through calls, WhatsApp, directions and appointment clicks.",
          ].map((rule) => (
            <p key={rule} className="rounded-lg border bg-background p-3 text-sm leading-6 text-muted-foreground">
              {rule}
            </p>
          ))}
        </div>
      </Panel>
    </>
  );
}

function SeoDashboardSection({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: SeoOpportunity[];
}) {
  return (
    <Panel className="p-5">
      <SectionHeader
        title={title}
        description={description}
        action={<StatusIndicator label={`${actions.length} actions`} tone="info" />}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {actions.map((action) => (
          <SeoGrowthActionCard key={`${action.category}-${action.title}`} action={action} />
        ))}
      </div>
    </Panel>
  );
}

function SeoGrowthActionCard({
  action,
  rank,
  compact = false,
}: {
  action: SeoOpportunity;
  rank?: number;
  compact?: boolean;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {rank && <StatusIndicator label={`#${rank}`} tone="success" />}
            <StatusIndicator label={action.label} tone={labelTone(action.label)} />
            <StatusIndicator label={`Score ${action.priorityScore}`} tone="info" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-foreground">{action.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Do this:</span> {action.action}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CompactField label="Create / improve" value={action.asset} />
        <CompactField label="Target terms" value={action.targetTerms.join(", ")} />
        {!compact && <CompactField label="Why it matters" value={action.whyItMatters} />}
        <CompactField label="Expected effect" value={action.expectedImpact} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusIndicator label={`Impact: ${action.impact}`} tone={action.impact === "High" ? "success" : action.impact === "Medium" ? "info" : "neutral"} />
        <StatusIndicator label={`Difficulty: ${action.difficulty}`} tone={action.difficulty === "Low" ? "success" : action.difficulty === "Medium" ? "warning" : "danger"} />
        <StatusIndicator label={action.timeToResults} tone={action.timeToResults === "2-4 weeks" ? "success" : action.timeToResults === "1-3 months" ? "info" : "neutral"} />
        <StatusIndicator label={action.owner} tone="neutral" />
      </div>
    </article>
  );
}

function buildSeoHealthScore(data: ProductExperience): SeoHealthScore {
  const hasMarket = Boolean(data.intelligence?.marketContext);
  const hasCompetitors = Boolean(data.intelligence?.competitors?.opportunityGaps.length);
  const hasRecommendations = data.recommendations.length > 0;
  const factors: SeoHealthFactor[] = [
    {
      label: "Content coverage",
      score: hasMarket ? 58 : 42,
      detail: "Core ENT service clusters exist as strategy targets, but sinus, hearing, pediatric ENT and throat/voice need stronger landing pages.",
    },
    {
      label: "Local SEO readiness",
      score: 52,
      detail: "Centre pages, NAP validation, GBP-to-page mapping and local schema still need execution.",
    },
    {
      label: "Technical readiness",
      score: 55,
      detail: "Metadata, internal linking, structured data, mobile CTAs and index checks are defined but not fully implemented.",
    },
    {
      label: "Tracking readiness",
      score: data.available ? 46 : 34,
      detail: "Search Console, GBP performance and conversion events should be connected before outcome claims are trusted.",
    },
    {
      label: "Internal link readiness",
      score: 50,
      detail: "New service pages need deliberate links from homepage, doctor pages, FAQs, articles and centre pages.",
    },
    {
      label: "Authority and links",
      score: hasCompetitors || hasRecommendations ? 44 : 36,
      detail: "Local citations, doctor associations, partner links and unlinked mentions are mostly future work.",
    },
  ];

  const score = Math.round(factors.reduce((total, factor) => total + factor.score, 0) / factors.length);
  return {
    score,
    summary: "SEO foundation is usable, but growth depends on building missing service pages, local pages, keyword-mapped articles, conversion tracking and authority links.",
    factors,
  };
}

function buildServicePageOpportunities(data: ProductExperience): SeoOpportunity[] {
  const context = data.intelligence?.marketContext;
  const marketTheme =
    context?.recommendedThemes[0] ??
    context?.healthcareSignals[0]?.title ??
    "local ENT care in Hyderabad";

  return sortSeoActions([
    seoAction({
      title: "Create a sinus care service hub",
      category: "Service Page",
      action: "Build a doctor-reviewed sinus page with symptoms, consultation timing, FAQs, internal links and appointment CTA.",
      asset: "Sinus care service page",
      targetTerms: ["sinus specialist Hyderabad", "blocked nose ENT", "sinus infection doctor"],
      expectedImpact: "Improves relevance for high-intent sinus searches and creates a clear landing page for content and GBP links.",
      whyItMatters: `The current strategy theme is ${marketTheme}; sinus is a strong patient-question cluster for ENT.`,
      owner: "SEO + Clinical",
      timing: "Week 2",
      label: "Do first",
      impact: "High",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
    seoAction({
      title: "Build a hearing screening page",
      category: "Service Page",
      action: "Create a page explaining hearing-test readiness, symptoms, screening flow and call/appointment paths.",
      asset: "Hearing screening service page",
      targetTerms: ["hearing test Hyderabad", "hearing loss symptoms", "ear specialist near me"],
      expectedImpact: "Captures testing and symptom intent currently too specific for a generic ENT page.",
      whyItMatters: "Hearing care is a high-intent cluster with clear conversion potential.",
      owner: "SEO + Clinical",
      timing: "Week 3",
      label: "Needs clinical review",
      impact: "High",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
    seoAction({
      title: "Create pediatric ENT parent page",
      category: "Service Page",
      action: "Publish a parent-facing page for tonsils, adenoids, repeated ear infections and when to see an ENT.",
      asset: "Pediatric ENT service page",
      targetTerms: ["child ENT doctor", "tonsils doctor for child", "adenoid specialist"],
      expectedImpact: "Builds trust and topical coverage for family decision-makers.",
      whyItMatters: "Pediatric pages need careful, helpful wording and strong clinical review.",
      owner: "Clinical + SEO",
      timing: "Week 4",
      label: "Needs clinical review",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
    seoAction({
      title: "Add throat and voice care page",
      category: "Service Page",
      action: "Create a service article for persistent throat pain, voice change, vocal cord evaluation and safe next steps.",
      asset: "Throat and voice care page",
      targetTerms: ["voice change doctor", "throat pain ENT", "vocal cord specialist"],
      expectedImpact: "Expands service coverage into a distinct query cluster.",
      whyItMatters: "This catches symptom searches that should not be buried inside broad ENT content.",
      owner: "Clinical + SEO",
      timing: "Week 5",
      label: "Needs clinical review",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
  ]);
}

function buildMissingKeywordActions(data: ProductExperience): SeoOpportunity[] {
  const theme = data.intelligence?.marketContext?.recommendedThemes[0] ?? "local ENT search demand";
  return sortSeoActions([
    seoAction({
      title: "Target local ENT near-me modifiers",
      category: "Missing Keywords",
      action: "Add centre-specific sections and FAQs for Hyderabad, Kondapur, Chandanagar and Vanasthalipuram ENT searches.",
      asset: "Centre pages + location FAQs",
      targetTerms: ["ENT doctor near me", "ENT clinic Kondapur", "ENT specialist Hyderabad"],
      expectedImpact: "Improves local relevance for searches where distance and centre clarity matter.",
      whyItMatters: "Local modifiers are practical lead-driving terms, not just awareness keywords.",
      owner: "SEO + Operations",
      timing: "Week 1",
      label: "Quick win",
      impact: "High",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Add sinus symptom variants",
      category: "Missing Keywords",
      action: "Add FAQ sections around blocked nose, sinus headache, sinus infection and when to consult.",
      asset: "Sinus FAQ block",
      targetTerms: ["blocked nose ENT", "sinus headache", "sinus infection doctor"],
      expectedImpact: "Creates long-tail relevance without stuffing terms into generic copy.",
      whyItMatters: `This directly supports ${theme} with patient-language questions.`,
      owner: "SEO + Clinical",
      timing: "Week 2",
      label: "Do first",
      impact: "High",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Cover comparison-stage branded trust",
      category: "Missing Keywords",
      action: "Create stronger doctor, reviews, phone and location proof sections on homepage and doctor pages.",
      asset: "Branded trust page sections",
      targetTerms: ["Harika ENT reviews", "Harika ENT phone number", "Dr Harika ENT hospital"],
      expectedImpact: "Improves conversion from people validating the hospital before calling.",
      whyItMatters: "Branded trust queries often sit closest to lead action.",
      owner: "SEO + Reputation",
      timing: "Week 3",
      label: "Quick win",
      impact: "Medium",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
  ]);
}

function buildLocalSeoOpportunities(): SeoOpportunity[] {
  return sortSeoActions([
    seoAction({
      title: "Map every GBP listing to the right centre page",
      category: "Local SEO",
      action: "Confirm each GBP website URL points to the matching centre page, not only the homepage.",
      asset: "GBP-to-location-page mapping",
      targetTerms: ["ENT clinic Kondapur", "ENT hospital near me", "ENT specialist Hyderabad"],
      expectedImpact: "Improves local landing relevance and patient routing from Maps/profile actions.",
      whyItMatters: "Google local ranking guidance emphasizes relevance, distance and prominence.",
      owner: "Operations + SEO",
      timing: "Week 1",
      label: "Quick win",
      impact: "High",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Verify NAP and service consistency",
      category: "Local SEO",
      action: "Make name, address, phone, hours, services and appointment links consistent across GBP, website and citations.",
      asset: "NAP consistency checklist",
      targetTerms: ["ENT doctor near me", "ENT clinic Hyderabad", "ENT hospital Hyderabad"],
      expectedImpact: "Reduces local trust friction and supports profile/page consistency.",
      whyItMatters: "Local pages cannot work if business facts are inconsistent.",
      owner: "Operations",
      timing: "Week 1",
      label: "Do first",
      impact: "High",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Add local business schema readiness",
      category: "Local SEO",
      action: "Prepare LocalBusiness/medical organization, breadcrumb and service schema for centre and service pages.",
      asset: "Structured data implementation",
      targetTerms: ["centre pages", "service pages", "doctor profile"],
      expectedImpact: "Helps search engines understand business identity, location and page hierarchy.",
      whyItMatters: "Structured data supports clarity but should not be presented as a rich-result guarantee.",
      owner: "Engineering",
      timing: "Week 6",
      label: "Technical setup",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
  ]);
}

function buildContentSeoOpportunities(data: ProductExperience): SeoOpportunity[] {
  const topic = data.intelligence?.marketContext?.healthcareSignals[0]?.title ?? "seasonal ENT patient questions";
  return sortSeoActions([
    seoAction({
      title: "Publish sinus care pillar article",
      category: "Content SEO",
      action: "Write a clinically reviewed article answering symptoms, when to consult, what happens in consultation and FAQs.",
      asset: "Sinus care article",
      targetTerms: ["sinus care Hyderabad", "blocked nose", "sinus symptoms"],
      expectedImpact: "Builds topical depth around the highest-priority service hub.",
      whyItMatters: "Ahrefs and Surfer-style content gap/topical map thinking favors complete topic coverage.",
      owner: "Content + Clinical",
      timing: "Week 2",
      label: "Do first",
      impact: "High",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
    seoAction({
      title: "Create hearing-test checklist",
      category: "Content SEO",
      action: "Create a checklist article patients can read before booking a hearing test.",
      asset: "Hearing test checklist article",
      targetTerms: ["when to get hearing test", "hearing test Hyderabad", "hearing loss symptoms"],
      expectedImpact: "Captures informational intent and routes it to a service-page CTA.",
      whyItMatters: "Good hospital SEO answers the question and gives the next safe step.",
      owner: "Content + Clinical",
      timing: "Week 4",
      label: "Needs clinical review",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
    seoAction({
      title: `Turn ${topic} into a helpful guide`,
      category: "Content SEO",
      action: "Create one guide from the current healthcare signal with prevention basics and consultation timing.",
      asset: "Helpful seasonal/local guide",
      targetTerms: ["seasonal ENT care", "allergy ENT", "local ENT advice"],
      expectedImpact: "Adds timely topical relevance while staying medically responsible.",
      whyItMatters: "Trend context should become reviewed patient education, not raw trend display.",
      owner: "Content + Clinical",
      timing: "Week 5",
      label: "Needs clinical review",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
  ]);
}

function buildCompetitorKeywordGaps(data: ProductExperience): SeoOpportunity[] {
  const competitorGap =
    data.intelligence?.competitors?.opportunityGaps[0] ??
    data.intelligence?.marketContext?.competitorPatterns.opportunityGaps[0] ??
    "competitors appear stronger on service proof, review proof or local page clarity";

  return sortSeoActions([
    seoAction({
      title: "Convert competitor gap into a page improvement",
      category: "Competitor Gap",
      action: `Use this gap as the monthly page task: ${competitorGap}. Add missing proof, FAQ copy or local/service clarity.`,
      asset: "Competitor-gap page update",
      targetTerms: ["ENT services Hyderabad", "ENT reviews Hyderabad", "best ENT clinic Hyderabad"],
      expectedImpact: "Improves comparison-stage pages where patients evaluate trust before contacting.",
      whyItMatters: "Semrush/Ahrefs keyword-gap thinking is useful only when gaps become page tasks.",
      owner: "Strategy + SEO",
      timing: "Week 6",
      label: "Do first",
      impact: "Medium",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Add review and doctor proof sections",
      category: "Competitor Gap",
      action: "Strengthen doctor expertise, review themes, centre photos and clear CTAs on service pages.",
      asset: "Trust proof modules",
      targetTerms: ["ENT doctor Hyderabad reviews", "Harika ENT reviews", "ENT specialist Hyderabad"],
      expectedImpact: "Helps pages compete beyond keywords by improving trust and conversion.",
      whyItMatters: "Healthcare pages need proof and safety, not only keyword coverage.",
      owner: "SEO + Reputation",
      timing: "Week 6",
      label: "Quick win",
      impact: "Medium",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
  ]);
}

function buildTechnicalSeoPriorities(): SeoOpportunity[] {
  return sortSeoActions([
    seoAction({
      title: "Create unique metadata for every service and location page",
      category: "Technical SEO",
      action: "Write titles/descriptions around service, location, patient intent and next action.",
      asset: "Metadata set",
      targetTerms: ["sinus specialist Hyderabad", "ENT clinic Kondapur", "hearing test Hyderabad"],
      expectedImpact: "Improves search-result relevance and CTR when impressions begin.",
      whyItMatters: "Google guidance favors clear, useful page titles and snippets.",
      owner: "SEO",
      timing: "Week 2",
      label: "Quick win",
      impact: "High",
      difficulty: "Low",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Build internal links between hubs, articles and CTAs",
      category: "Technical SEO",
      action: "Link homepage, service overview, doctor profiles, FAQs, articles, centre pages and appointment/contact pages.",
      asset: "Internal link map",
      targetTerms: ["service clusters", "location clusters", "doctor trust pages"],
      expectedImpact: "Helps search engines and patients move through the site naturally.",
      whyItMatters: "Content hubs need internal links to work as a topical map.",
      owner: "SEO + Engineering",
      timing: "Week 3",
      label: "Do first",
      impact: "High",
      difficulty: "Medium",
      timeToResults: "2-4 weeks",
    }),
    seoAction({
      title: "Connect Search Console and conversion events",
      category: "Technical SEO",
      action: "Track queries/pages plus call, WhatsApp, directions and appointment clicks.",
      asset: "SEO measurement setup",
      targetTerms: ["organic leads", "service page visits", "local page actions"],
      expectedImpact: "Shows which rankings and pages actually create patient-intent leads.",
      whyItMatters: "Without tracking, traffic growth cannot be tied to lead growth.",
      owner: "Analytics",
      timing: "Week 1",
      label: "Technical setup",
      impact: "High",
      difficulty: "Medium",
      timeToResults: "2-4 weeks",
    }),
  ]);
}

function buildLinkBuildingOpportunities(): SeoOpportunity[] {
  return sortSeoActions([
    seoAction({
      title: "Build local citation consistency",
      category: "Link Building",
      action: "Submit or update hospital profiles on credible local directories and healthcare listing sites with consistent NAP.",
      asset: "Local citation list",
      targetTerms: ["hospital listing Hyderabad", "ENT clinic listing", "local medical directory"],
      expectedImpact: "Supports local prominence and trust signals over time.",
      whyItMatters: "Ahrefs-style link building emphasizes earning authority from relevant sources.",
      owner: "SEO + Operations",
      timing: "Weeks 5-8",
      label: "Longer-term authority",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "3-6 months",
    }),
    seoAction({
      title: "Pursue doctor association and partner links",
      category: "Link Building",
      action: "Identify doctor associations, hospital partners, event pages and community health resources that can link to doctor or service pages.",
      asset: "Partner outreach list",
      targetTerms: ["doctor profile", "ENT specialist", "hospital partner"],
      expectedImpact: "Builds authority for trust-heavy pages and branded discovery.",
      whyItMatters: "Healthcare authority links should come from relevant, credible, non-spam sources.",
      owner: "Strategy + Admin",
      timing: "Weeks 6-8",
      label: "Longer-term authority",
      impact: "Medium",
      difficulty: "High",
      timeToResults: "3-6 months",
    }),
    seoAction({
      title: "Find unlinked brand mentions",
      category: "Link Building",
      action: "Look for existing mentions of the hospital, doctors, events or community work and request appropriate links.",
      asset: "Unlinked mention outreach",
      targetTerms: ["Harika ENT", "doctor name", "hospital event"],
      expectedImpact: "Turns existing reputation into authority signals with less effort than cold outreach.",
      whyItMatters: "This is often the easiest authority-building starting point.",
      owner: "SEO + Reputation",
      timing: "Weeks 7-8",
      label: "Quick win",
      impact: "Medium",
      difficulty: "Medium",
      timeToResults: "1-3 months",
    }),
  ]);
}

function buildWeeklySeoRoadmap(data: ProductExperience): SeoRoadmapWeek[] {
  const theme = data.intelligence?.marketContext?.recommendedThemes[0] ?? "priority ENT service pages";
  return [
    {
      week: "Week 1",
      title: "Set foundation",
      actions: ["Connect Search Console plan", "Verify centre NAP", "Map GBP listings to pages"],
      owner: "Analytics + Operations",
      expectedResult: "Measurement and local facts ready for SEO execution.",
    },
    {
      week: "Week 2",
      title: "Launch sinus hub",
      actions: ["Draft sinus service page", "Add sinus FAQ terms", "Write metadata and CTA"],
      owner: "SEO + Clinical",
      expectedResult: "First high-intent service cluster ready for approval.",
    },
    {
      week: "Week 3",
      title: "Build local pages",
      actions: ["Refresh centre pages", "Add nearby-area copy", "Add directions and WhatsApp CTAs"],
      owner: "SEO + Operations",
      expectedResult: "Local discovery pages ready for GBP and organic traffic.",
    },
    {
      week: "Week 4",
      title: "Expand service coverage",
      actions: ["Draft hearing page", "Draft pediatric ENT FAQ", "Add internal links"],
      owner: "SEO + Clinical",
      expectedResult: "More service-intent clusters move from missing to covered.",
    },
    {
      week: "Week 5",
      title: "Publish helpful content",
      actions: [`Create guide for ${theme}`, "Add doctor review", "Link to service pages"],
      owner: "Content + Clinical",
      expectedResult: "Helpful content supports service pages without unsafe claims.",
    },
    {
      week: "Week 6",
      title: "Close competitor gaps",
      actions: ["Review competitor pages", "Add missing proof sections", "Improve review/doctor trust copy"],
      owner: "Strategy + SEO",
      expectedResult: "Comparison-stage pages become stronger and clearer.",
    },
    {
      week: "Week 7",
      title: "Add technical support",
      actions: ["Prepare schema readiness", "Check mobile CTAs", "Confirm index and internal links"],
      owner: "Engineering + SEO",
      expectedResult: "Published pages are easier to crawl, understand and act on.",
    },
    {
      week: "Week 8",
      title: "Start authority work",
      actions: ["Build citation list", "Find partner link targets", "Check unlinked mentions"],
      owner: "SEO + Admin",
      expectedResult: "Longer-term authority work starts after on-site basics are live.",
    },
  ];
}

function buildExpectedSeoOutcomes(data: ProductExperience): SeoExpectedOutcome[] {
  const actionCount = data.available ? "measured after tracking" : "directional until tracking connects";
  return [
    {
      title: "Ranking growth",
      value: "8-15 target terms",
      detail: "Service, local and FAQ pages should begin creating impressions for priority ENT clusters.",
      basis: `Expected over 60-90 days; ${actionCount}.`,
    },
    {
      title: "Organic traffic growth",
      value: "20-35%",
      detail: "Growth should come from service pages, location pages and helpful articles, not generic homepage traffic alone.",
      basis: "Directional estimate after content is indexed and internally linked.",
    },
    {
      title: "Lead growth",
      value: "10-20%",
      detail: "Lead lift should be measured through calls, WhatsApp, directions and appointment clicks from SEO pages.",
      basis: "Requires conversion tracking before attribution is treated as reliable.",
    },
  ];
}

function seoAction(input: Omit<SeoOpportunity, "priorityScore">): SeoOpportunity {
  return {
    ...input,
    priorityScore: scoreSeoAction(input.impact, input.difficulty, input.timeToResults),
  };
}

function sortSeoActions(actions: SeoOpportunity[]) {
  return actions.sort((left, right) => right.priorityScore - left.priorityScore);
}

function scoreSeoAction(impact: SeoImpact, difficulty: SeoDifficulty, timeToResults: SeoTimeToResults) {
  const impactScore = { High: 50, Medium: 35, Low: 20 }[impact];
  const difficultyScore = { Low: 25, Medium: 15, High: 5 }[difficulty];
  const speedScore = { "2-4 weeks": 25, "1-3 months": 15, "3-6 months": 8 }[timeToResults];
  return impactScore + difficultyScore + speedScore;
}

function labelTone(label: SeoActionLabel) {
  if (label === "Do first" || label === "Quick win") return "success" as const;
  if (label === "Needs clinical review" || label === "Technical setup") return "warning" as const;
  return "info" as const;
}

function buildWhatsAppHealthScore(data: ProductExperience) {
  const hasOperationalData = data.available;
  const categories = [
    {
      name: "Response speed",
      score: hasOperationalData ? 62 : 45,
      detail: "First response target, owner assignment and SLA breach visibility need to be explicit.",
      tone: "warning" as const,
    },
    {
      name: "Lead follow-up",
      score: hasOperationalData ? 58 : 42,
      detail: "New, warm, no-reply and inactive leads need separate follow-up states.",
      tone: "warning" as const,
    },
    {
      name: "Appointment conversion",
      score: hasOperationalData ? 64 : 48,
      detail: "Intent detection and booking CTAs are present conceptually, but conversion tracking must be instrumented.",
      tone: "warning" as const,
    },
    {
      name: "Automation readiness",
      score: hasOperationalData ? 55 : 38,
      detail: "Templates, routing, reminders and recovery flows are high-ROI automation candidates.",
      tone: "warning" as const,
    },
    {
      name: "Department routing",
      score: hasOperationalData ? 60 : 44,
      detail: "Reception, clinical, billing, reports and urgent-care paths need clear handoff rules.",
      tone: "warning" as const,
    },
    {
      name: "Drop-off recovery",
      score: hasOperationalData ? 52 : 35,
      detail: "Missed reply and 24-hour recovery rules are the biggest preventable loss area.",
      tone: "warning" as const,
    },
  ];
  const score = Math.round(categories.reduce((total, item) => total + item.score, 0) / categories.length);
  return {
    score,
    status: score >= 75 ? "Healthy" : score >= 55 ? "Needs focus" : "Setup needed",
    tone: score >= 75 ? "success" as const : "warning" as const,
    summary: hasOperationalData
      ? "VIP intelligence exists, but direct WhatsApp conversion attribution should still be treated as a setup gap until inquiry and appointment events are connected."
      : "No direct WhatsApp analytics are connected yet. Use this readiness score as an execution model, not a live performance claim.",
    categories,
  };
}

function buildWhatsAppRoiActions() {
  return [
    {
      priority: "P1",
      title: "Response SLA and triage",
      action: "Set a first-response target, owner queue and escalation rule for every inbound WhatsApp chat.",
      roiImpact: "Highest impact: prevents interested patients from cooling before reception responds.",
      timeToImpact: "1 week",
      tone: "warning" as const,
    },
    {
      priority: "P2",
      title: "Missed lead follow-up",
      action: "Create no-reply and missed-message recovery states with same-day and next-day tasks.",
      roiImpact: "High impact: recovers leads that already showed intent.",
      timeToImpact: "1-2 weeks",
      tone: "warning" as const,
    },
    {
      priority: "P3",
      title: "Appointment booking conversion",
      action: "Move appointment-intent chats into a fixed booking flow with one clear CTA.",
      roiImpact: "High impact: turns conversation volume into scheduled visits.",
      timeToImpact: "2 weeks",
      tone: "success" as const,
    },
    {
      priority: "P4",
      title: "Department routing",
      action: "Route reception, reports, billing, pharmacy, specialty and urgent guidance to owners.",
      roiImpact: "Medium-high impact: reduces handoff delays and repeated patient questions.",
      timeToImpact: "2-3 weeks",
      tone: "info" as const,
    },
    {
      priority: "P5",
      title: "Automation and flow optimization",
      action: "Automate greeting, qualification, reminders and recovery without automating clinical advice.",
      roiImpact: "Medium impact now, compounding impact once lead stages are measured.",
      timeToImpact: "3-4 weeks",
      tone: "info" as const,
    },
  ];
}

function buildResponseImprovementPlan() {
  return [
    {
      title: "First response target",
      detail: "Use a reception-visible SLA so new WhatsApp inquiries are acknowledged quickly during business hours.",
      action: "Set target: acknowledge within 5 minutes during staffed hours; mark owner before asking follow-up questions.",
      measure: "Median first response time and SLA breach count.",
      roi: "High ROI",
      tone: "warning" as const,
    },
    {
      title: "Office-hours handling",
      detail: "Set expectation when staff are offline and avoid silent overnight or weekend drop-offs.",
      action: "Send an auto-acknowledgement with hours, emergency disclaimer and next business-hour promise.",
      measure: "Out-of-hours chats recovered next business day.",
      roi: "High ROI",
      tone: "warning" as const,
    },
    {
      title: "Ownership and escalation",
      detail: "Every chat should belong to reception, clinical review, billing, reports or admin.",
      action: "Tag owner and urgency after the first intent question; escalate medical questions to consultation.",
      measure: "Unassigned chats and handoff delay.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "SLA breach recovery",
      detail: "Delayed replies need a recovery script and a booked next step instead of an apology-only response.",
      action: "Create a missed-reply macro: acknowledge delay, confirm need, offer appointment/call route.",
      measure: "Recovered conversations after SLA breach.",
      roi: "High ROI",
      tone: "warning" as const,
    },
  ];
}

function buildLeadFollowUpStrategy() {
  return [
    {
      stage: "New lead",
      action: "Acknowledge, capture intent, assign owner and ask one qualifying question.",
      owner: "Reception",
      measure: "New leads assigned within SLA",
      tone: "success" as const,
    },
    {
      stage: "No reply",
      action: "Send a polite same-day follow-up with the next useful appointment or call option.",
      owner: "Reception",
      measure: "No-reply recovery rate",
      tone: "warning" as const,
    },
    {
      stage: "Warm lead",
      action: "Move patients asking about timing, location, cost or availability into appointment booking.",
      owner: "Reception + department owner",
      measure: "Warm lead to booking rate",
      tone: "success" as const,
    },
    {
      stage: "Inactive lead",
      action: "Use an approved reactivation template only where consent and message purpose are valid.",
      owner: "Growth operations",
      measure: "Reactivation replies and opt-outs",
      tone: "info" as const,
    },
    {
      stage: "Converted",
      action: "Confirm appointment details, remind before visit and record source for attribution.",
      owner: "Reception",
      measure: "Booked and attended appointments",
      tone: "success" as const,
    },
  ];
}

function buildAppointmentConversionStrategy(specialty: string | null) {
  const specialtyLabel = specialty?.trim() || "care";
  return [
    {
      title: "Appointment-intent detection",
      detail: "Detect phrases around appointment, doctor availability, location, reports, fees and consultation timing.",
      action: "Tag appointment intent and route to reception before answering long informational questions.",
      measure: "Appointment-intent chats identified.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "Booking CTA",
      detail: "Use one clear booking step instead of multiple competing links or open-ended replies.",
      action: "Offer call, appointment form or reception callback with a preferred time slot.",
      measure: "CTA acceptance rate.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "Required details",
      detail: `Collect only what reception needs to prepare a ${specialtyLabel} appointment.`,
      action: "Ask name, preferred centre/time, contact number and existing report availability.",
      measure: "Complete booking handoff rate.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "Confirmation",
      detail: "Close the loop with appointment details, centre address and arrival/report instructions.",
      action: "Send a confirmation template after booking is recorded.",
      measure: "Confirmed appointments and repeated clarification questions.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "Reminder",
      detail: "Reduce no-shows and last-minute confusion with a timely reminder.",
      action: "Send an approved reminder the day before or morning of the appointment.",
      measure: "Reminder replies and attendance rate.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "No-show recovery",
      detail: "Recover missed appointments without pressure or clinical claims.",
      action: "Offer a reschedule path and call route after a missed appointment.",
      measure: "Rescheduled appointments.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
  ];
}

function buildAutomationOpportunities() {
  return [
    {
      title: "Greeting and expectation setting",
      detail: "Give immediate confidence that the message was received and tell patients when to expect a human reply.",
      action: "Auto-send greeting with office hours, emergency disclaimer and one intent prompt.",
      measure: "Acknowledgement coverage and first human reply time.",
      roi: "High ROI",
      tone: "warning" as const,
    },
    {
      title: "Lead qualification",
      detail: "Collect enough context for routing without turning the chat into a long form.",
      action: "Ask one branch question: appointment, reports, billing, location, clinical concern or other.",
      measure: "Correct routing rate.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "Routing",
      detail: "Use conditional paths so departments see only conversations they can resolve.",
      action: "Route by tag and owner; put specific rules above catch-all routing.",
      measure: "Handoff time and unassigned queue size.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "Appointment reminders",
      detail: "Automate logistical reminders while keeping medical advice out of templates.",
      action: "Template reminder with centre, time, report checklist and call route.",
      measure: "Attendance and reschedule rate.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "Post-consult feedback",
      detail: "Create a privacy-safe feedback or review path after suitable visits.",
      action: "Trigger only after staff marks the request as appropriate.",
      measure: "Feedback completion and review quality.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "Recovery templates",
      detail: "Use approved templates after the WhatsApp service window when allowed and useful.",
      action: "Create missed-reply, inactive-lead and reschedule templates.",
      measure: "Recovered replies and opt-outs.",
      roi: "High ROI",
      tone: "warning" as const,
    },
  ];
}

function buildDepartmentOpportunities(specialty: string | null, city: string | null) {
  const location = city ? `${city} ` : "";
  const specialtyOwner = specialty?.trim() || "clinical";
  return [
    {
      stage: "Reception",
      action: "Own new leads, appointment timing, callback requests and centre/location questions.",
      owner: "Front desk",
      measure: "New lead to booked appointment",
      tone: "success" as const,
    },
    {
      stage: specialtyOwner,
      action: `Route ${location}${specialtyOwner} questions to consultation guidance, not diagnosis in chat.`,
      owner: "Clinical reviewer",
      measure: "Clinical escalations handled safely",
      tone: "warning" as const,
    },
    {
      stage: "Reports",
      action: "Clarify report availability, review appointment needs and document handoff status.",
      owner: "Reports desk",
      measure: "Report-related repeats reduced",
      tone: "info" as const,
    },
    {
      stage: "Billing",
      action: "Handle billing and package questions separately from clinical advice.",
      owner: "Billing team",
      measure: "Billing resolution time",
      tone: "info" as const,
    },
    {
      stage: "Pharmacy",
      action: "Route medicine availability or pickup logistics without prescribing in chat.",
      owner: "Pharmacy desk",
      measure: "Pharmacy handoff completion",
      tone: "info" as const,
    },
    {
      stage: "Emergency",
      action: "Use urgent-care disclaimer and direct people to emergency/reception call paths immediately.",
      owner: "Reception + clinical protocol",
      measure: "Urgent chats escalated",
      tone: "warning" as const,
    },
  ];
}

function buildConversationFlowImprovements() {
  return [
    {
      title: "Shorter opening flow",
      detail: "Replace long education-first replies with a quick intent capture.",
      action: "Start with: appointment, reports, billing, location, doctor availability or other.",
      measure: "Intent captured within first two messages.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "One clear CTA",
      detail: "Avoid sending multiple links or vague 'please visit' instructions.",
      action: "Use one next step per intent: book, call, share reports, get directions or wait for owner.",
      measure: "CTA completion rate.",
      roi: "High ROI",
      tone: "success" as const,
    },
    {
      title: "Human handoff rule",
      detail: "Automation should bridge the gap until the right person responds.",
      action: "Escalate clinical, pricing-sensitive, complaint and urgent messages to a human owner.",
      measure: "Automated-to-human handoff time.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
    {
      title: "Template discipline",
      detail: "Use templates for expected, timely, relevant messages and monitor engagement quality.",
      action: "Review template reply rate, opt-outs, errors and appointment movement weekly.",
      measure: "Template engagement and quality signals.",
      roi: "Medium ROI",
      tone: "info" as const,
    },
  ];
}

function buildDropOffRecoveryPlan() {
  return [
    {
      stage: "15 minutes",
      action: "Flag no-owner or no-human-reply conversations for reception intervention.",
      owner: "Reception lead",
      measure: "SLA breach prevented",
      tone: "warning" as const,
    },
    {
      stage: "Same day",
      action: "Send a short follow-up with one booking or callback option.",
      owner: "Reception",
      measure: "Same-day recovery replies",
      tone: "success" as const,
    },
    {
      stage: "24 hours",
      action: "Check WhatsApp window status; use approved template only where permitted and relevant.",
      owner: "Growth operations",
      measure: "24-hour recovery attempts",
      tone: "warning" as const,
    },
    {
      stage: "3 days",
      action: "Recover warm leads with a polite, value-based follow-up and opt-out awareness.",
      owner: "Growth operations",
      measure: "Reactivated leads",
      tone: "info" as const,
    },
    {
      stage: "Weekly",
      action: "Review drop-off reasons and fix the flow, template, owner or staffing gap that caused them.",
      owner: "Strategy lead",
      measure: "Drop-off reasons reduced",
      tone: "info" as const,
    },
  ];
}

function buildWeeklyExecutionPlan() {
  return [
    {
      stage: "Monday",
      action: "Review WhatsApp queue, missed leads, SLA breaches and appointment-intent chats.",
      owner: "Strategy + reception",
      measure: "Priority queue created",
      tone: "warning" as const,
    },
    {
      stage: "Tuesday",
      action: "Update scripts, macros and templates for the top repeated conversion blockers.",
      owner: "Growth operations",
      measure: "Scripts approved",
      tone: "info" as const,
    },
    {
      stage: "Wednesday",
      action: "Improve automation, tags, routing rules and owner views.",
      owner: "Operations",
      measure: "Routing rules updated",
      tone: "info" as const,
    },
    {
      stage: "Thursday",
      action: "Focus appointment conversion: booking CTA, reminders, confirmations and no-show recovery.",
      owner: "Reception lead",
      measure: "Booking actions completed",
      tone: "success" as const,
    },
    {
      stage: "Friday",
      action: "Review ROI: response speed, bookings, conversion rate, recovered leads and opt-outs.",
      owner: "Leadership + strategy",
      measure: "Continue/stop/scale decision",
      tone: "success" as const,
    },
  ];
}

function buildExpectedWhatsAppOutcomes(hasData: boolean) {
  return [
    {
      title: "Faster responses",
      detail: "Response SLA, assignment and breach recovery should reduce median first response time.",
      roiBasis: "Fewer cold leads and less patient uncertainty.",
    },
    {
      title: "More appointments",
      detail: "Appointment-intent detection, one CTA and confirmation templates should turn more chats into booked visits.",
      roiBasis: "More qualified appointment movement from existing demand.",
    },
    {
      title: "Better conversion rates",
      detail: "Lead states, follow-up rules and drop-off recovery should improve conversion from inquiry to appointment.",
      roiBasis: "Higher value from the same WhatsApp traffic.",
    },
    {
      title: hasData ? "Cleaner optimization loop" : "Instrumentation-first reporting",
      detail: hasData
        ? "Use available VIP intelligence, but connect WhatsApp-specific inquiry and appointment events before claiming channel ROI."
        : "Start by measuring response time, lead status, booking movement, recovery replies and opt-outs.",
      roiBasis: "Decision quality improves when operations and outcomes are measured together.",
    },
  ];
}

function buildActionSections(data: ProductExperience): ActionSection[] {
  const marketTheme =
    data.intelligence?.marketContext?.recommendedThemes[0] ??
    data.intelligence?.marketContext?.healthcareSignals[0]?.title ??
    "local patient questions and seasonal health needs";
  const recommendation =
    data.recommendations[0]?.title ??
    "the highest-priority visibility and trust opportunity";

  return [
    {
      slug: "gbp-strategy",
      title: "Google Business Profile Strategy",
      purpose: "Win local discovery when people search nearby or compare options on Maps.",
      outcome: "More profile visits, calls, directions and appointment intent.",
      icon: MapPin,
      actions: [
        "Complete every profile field: services, categories, location, hours, phone, website, appointment link and accessibility details.",
        "Add fresh clinic, doctor, reception and facility photos every month.",
        "Publish weekly GBP updates for services, seasonal guidance, doctor availability and verified contact routes.",
        "Add short FAQs that answer high-intent patient questions in simple language.",
        "Keep the language on GBP, website service pages and social CTAs consistent.",
      ],
    },
    {
      slug: "seo-strategy",
      title: "SEO Strategy",
      purpose: "Make the website visible for high-intent health and service searches.",
      outcome: "More branded search, service-page visits and qualified website actions.",
      icon: Globe2,
      actions: [
        "Local discovery: strengthen centre pages, GBP alignment, near-me intent, NAP consistency and verified contact paths.",
        "Service intent: map sinus, hearing, pediatric ENT, throat/voice and branded trust searches to clear reviewed pages.",
        "Helpful healthcare content: use doctor-reviewed YMYL guidance, plain-language FAQs and no unsafe medical claims.",
        "Competitor and content gaps: use competitor patterns, review gaps, missing pages and underserved local-language topics.",
        `Conversion and measurement: connect phone, WhatsApp, appointment clicks and Search Console page/query tracking around ${marketTheme}.`,
      ],
    },
    {
      slug: "review-strategy",
      title: "Review And Reputation Strategy",
      purpose: "Turn patient experience into public trust signals.",
      outcome: "Stronger local confidence and better conversion from search and social.",
      icon: Star,
      actions: [
        "Set up a polite QR or WhatsApp review request after suitable consultations.",
        "Reply to every review with a calm, privacy-safe and human response.",
        "Create a weekly review summary: praise themes, complaint themes and operational fixes.",
        "Use recurring positive themes as proof points in website and profile copy.",
        "Escalate negative review patterns into patient-experience improvement tasks.",
      ],
    },
    {
      slug: "social-presence-strategy",
      title: "Social Presence Strategy",
      purpose: "Build familiarity, doctor trust and regular visibility.",
      outcome: "More saves, shares, profile visits and trust before a patient contacts the clinic.",
      icon: Megaphone,
      actions: [
        "Use doctor-led reels for trust and short explainers for common patient questions.",
        "Use carousels/checklists for saveable education and family sharing.",
        "Repurpose approved content into Instagram, Facebook, YouTube Shorts and GBP posts.",
        "Avoid posting more just to post more; keep every post attached to trust, search, review or conversion goals.",
        "Use the content strategy page for calendar, scripts, captions and clinical approval.",
      ],
    },
    {
      slug: "whatsapp-community-strategy",
      title: "WhatsApp And Community Strategy",
      purpose: "Use direct communication carefully for follow-through, not spam.",
      outcome: "Better repeat contact, family sharing and appointment readiness.",
      icon: MessageCircle,
      actions: [
        "Use WhatsApp only for consented patients, families or community lists.",
        "Share approved bilingual care cards, reminders and FAQs.",
        "Route personal medical questions to consultation or official contact paths.",
        "Collect common questions and turn them into public content topics.",
        "Keep messages short, useful and easy to forward inside family groups.",
      ],
    },
    {
      slug: "competitor-gap-strategy",
      title: "Competitor Gap Strategy",
      purpose: "Know where competitors are visible and choose a sharper position.",
      outcome: "Clearer differentiation and less generic content.",
      icon: Building2,
      actions: [
        "Track competitor GBP completeness, review velocity, posting cadence, service-page clarity and social themes.",
        "Identify gaps they are not owning: doctor explanation, local language, patient experience, seasonal care or convenience.",
        "Respond with a distinct value proposition instead of copying formats or claims.",
        "Update positioning monthly based on what competitors are doing and what patients respond to.",
        `Use ${recommendation} as a weekly input when choosing which gap to attack first.`,
      ],
    },
    {
      slug: "conversion-path-strategy",
      title: "Conversion Path Strategy",
      purpose: "Make it easy for interested people to take the next step.",
      outcome: "More calls, directions, WhatsApp enquiries and appointment requests.",
      icon: Route,
      actions: [
        "Make phone, directions, WhatsApp and appointment links visible on GBP, website and social profiles.",
        "Use one clear CTA per asset: call, book, get directions, ask reception or read service details.",
        "Remove dead ends from posts and pages by linking to the next useful action.",
        "Align CTAs with patient intent: education posts should guide gently, high-intent pages should ask for action.",
        "Review the full journey monthly from Google search to appointment request.",
      ],
    },
    {
      slug: "positioning-trust-strategy",
      title: "Positioning And Trust Strategy",
      purpose: "Give patients a clear reason to choose this hospital.",
      outcome: "Higher recall, stronger trust and better branded search.",
      icon: HeartHandshake,
      actions: [
        "Make doctor expertise visible across website, GBP, social bios and content.",
        "Repeat the same trust message everywhere: specialty, location, access, language and patient care quality.",
        "Use real operational strengths as positioning, not vague claims.",
        "Show the human side of the clinic through doctor, staff and patient-experience content.",
        "Keep the tone calm, educational, responsible and locally relevant.",
      ],
    },
  ];
}

function ActionSectionCard({ section, basePath }: { section: ActionSection; basePath: string }) {
  const Icon = section.icon;

  return (
    <Link href={strategySectionHref(basePath, section.slug)} className="block rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{section.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.purpose}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Expected outcome</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.outcome}</p>
      </div>

      <ul className="mt-4 space-y-2">
        {section.actions.slice(0, 3).map((action) => (
          <li key={action} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-semibold text-primary">Open full action plan</p>
    </Link>
  );
}

function ContentStrategyCard({ basePath }: { basePath: string }) {
  return (
    <Link href={contentStrategyHref(basePath)} className="block rounded-lg border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpenCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Content Strategy</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Plan doctor-led topics, calendars, scripts, captions, channel formats and clinical approval.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Expected outcome</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          A governed content calendar that supports GBP, SEO, reviews, social, WhatsApp and conversion goals.
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {[
          "Choose weekly themes from intelligence and market context.",
          "Assign formats across Reels, carousels, GBP updates, Shorts and WhatsApp cards.",
          "Keep clinical review attached before publishing.",
        ].map((action) => (
          <li key={action} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm font-semibold text-primary">Open content strategy</p>
    </Link>
  );
}

function contentStrategyHref(basePath: string) {
  return basePath === "/admin/strategy"
    ? "/admin/strategy/content"
    : "/strategy/content-strategy";
}

function strategySectionHref(basePath: string, slug: string) {
  if (basePath === "/admin/strategy") {
    const adminPaths: Record<string, string> = {
      "gbp-strategy": "gbp",
      "seo-strategy": "seo",
      "review-strategy": "reviews",
      "social-presence-strategy": "social",
      "whatsapp-community-strategy": "whatsapp",
      "competitor-gap-strategy": "competitor-gap",
      "conversion-path-strategy": "conversion-path",
      "positioning-trust-strategy": "positioning",
    };

    return `${basePath}/${adminPaths[slug] ?? slug}`;
  }

  return `${basePath}/${slug}`;
}

function HeroFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-200 [&_svg]:size-4">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function AccessDenied() {
  return (
    <Panel className="p-6">
      <SectionHeader
        title="Strategy access required"
        description="This workspace section is available to users with strategy visibility permissions."
      />
    </Panel>
  );
}
