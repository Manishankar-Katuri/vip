import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  HeartPulse,
  Image,
  LineChart,
  Megaphone,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, StatusIndicator } from "@/design-system/primitives";
import {
  AICollaborationPanel,
  AutomationSummary,
  CommandCenterHero,
  ContextTabs,
  EvidenceCard as IntelligenceEvidenceCard,
  InsightTimeline,
  MotionReveal,
} from "@/components/intelligence-os";
import type { Role, Tone } from "@/design-system/theme";
import { getProductExperience, type ProductExperience } from "@/lib/product-experience";

type LiveState = "ready" | "empty" | "degraded" | "mock" | "error";

type RoleHubConfig = {
  role: Role;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  heroIcon: LucideIcon;
  accent: string;
  metrics: Array<{ label: string; value: string; detail: string; state: LiveState; icon: LucideIcon }>;
  actionTitle: string;
  actions: Array<{ title: string; detail: string; owner: string; due: string; state: LiveState; href: string }>;
  evidenceTitle: string;
  evidence: Array<{ title: string; detail: string; state: LiveState; icon: LucideIcon }>;
  workflow: Array<{ label: string; detail: string; state: LiveState }>;
};

const stateTone: Record<LiveState, Tone> = {
  ready: "success",
  empty: "neutral",
  degraded: "warning",
  mock: "info",
  error: "danger",
};

const stateLabel: Record<LiveState, string> = {
  ready: "Live",
  empty: "Empty",
  degraded: "Degraded",
  mock: "Mock",
  error: "Error",
};

export async function RoleHubPage({ role }: { role: Role }) {
  const experience = await getProductExperience();
  const config = createRoleConfig(role, experience);
  const contextTabs = createContextTabs(role);

  return (
    <main className="min-h-screen bg-background intelligence-grid">
      <section className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <MotionReveal>
          <CommandCenterHero
            eyebrow={config.eyebrow}
            title={config.title}
            summary={config.description}
            meta={experience.available ? "Live data connected" : "Fallback states visible"}
            status={experience.available ? "live" : "fallback"}
          >
            <Button asChild size="lg">
              <Link href={config.primaryAction.href}>
                {config.primaryAction.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={config.secondaryAction.href}>{config.secondaryAction.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/strategy/content-strategy">Content Strategy</Link>
            </Button>
          </CommandCenterHero>
        </MotionReveal>

        <ContextTabs items={contextTabs} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {config.metrics.map((metric, index) => (
            <MotionReveal key={metric.label} className={index > 0 ? "delay-100" : undefined}>
              <RoleMetricTile {...metric} />
            </MotionReveal>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <RoleIntelligenceLane
            title={config.actionTitle}
            description="Decisions and blockers appear before supporting evidence."
            icon={config.heroIcon}
            status={experience.available ? "live" : "fallback"}
          >
            <div className="space-y-3">
              {config.actions.map((action) => (
                <ActionRow key={action.title} {...action} />
              ))}
            </div>
          </RoleIntelligenceLane>

          <AICollaborationPanel
            title={aiTitleForRole(role)}
            summary={aiSummaryForRole(role)}
            prompts={aiPromptsForRole(role)}
            status={experience.available ? "live" : "fallback"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <RoleIntelligenceLane title="Workflow pulse" description="A compact proof trail for the current role." icon={Workflow} status="ready">
            <InsightTimeline
              items={config.workflow.map((step) => ({
                title: step.label,
                detail: `${stateLabel[step.state]}: ${step.detail}`,
                tone: stateTone[step.state],
              }))}
            />
          </RoleIntelligenceLane>

          <AutomationSummary
            items={[
              { label:"Rules active", value: role === "production" ? "4" : role === "staff" ? "2" : "3", detail:"Automations available to this workspace.", status: experience.available ? "live" : "fallback" },
              { label:"Exceptions", value: config.metrics.some((metric) => metric.state === "degraded") ? "2" : "0", detail:"Needs human review before continuing.", status: config.metrics.some((metric) => metric.state === "degraded") ? "degraded" : "ready" },
              { label:"Handoffs", value: String(config.actions.length), detail:"Actions linked to routed workflows.", status:"ready" },
            ]}
          />
        </div>

        <RoleIntelligenceLane
          title={config.evidenceTitle}
          description="Feature tiles show the intended data source and whether the live connection is ready."
          icon={Database}
          status={experience.available ? "live" : "fallback"}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {config.evidence.map((item) => (
              <IntelligenceEvidenceCard
                key={item.title}
                label={stateLabel[item.state]}
                title={item.title}
                detail={item.detail}
                status={item.state === "ready" ? "ready" : item.state === "degraded" ? "degraded" : item.state === "empty" ? "empty" : "fallback"}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link className="text-sm font-medium text-primary hover:underline" href="/design-mockups">Open mockup board</Link>
          </div>
        </RoleIntelligenceLane>
      </section>
    </main>
  );
}

function RoleMetricTile({ label, value, detail, state, icon: Icon }: RoleHubConfig["metrics"][number]) {
  return (
    <article className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg border bg-background text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <StatusIndicator label={stateLabel[state]} tone={stateTone[state]} />
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </article>
  );
}

function RoleIntelligenceLane({
  title,
  description,
  icon: Icon,
  status,
  children,
}: {
  title:string;
  description:string;
  icon:LucideIcon;
  status:"live" | "fallback" | "empty" | "degraded" | "ready";
  children:React.ReactNode;
}) {
  const tone = status === "live" || status === "ready" ? "success" : status === "degraded" || status === "fallback" ? "warning" : "neutral";

  return (
    <section className="rounded-xl border border-border/65 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
        <StatusIndicator label={status} tone={tone} />
      </div>
      {children}
    </section>
  );
}

function ActionRow({ title, detail, owner, due, state, href }: RoleHubConfig["actions"][number]) {
  return (
    <Link href={href} className="group grid gap-3 rounded-lg border border-border/70 bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/35 hover:shadow-[var(--shadow-raised)] md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <StatusIndicator label={stateLabel[state]} tone={stateTone[state]} />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      <div className="flex items-center gap-4 text-sm md:justify-end">
        <span className="text-muted-foreground">{owner}</span>
        <span className="font-medium">{due}</span>
        <ArrowRight className="size-4 text-primary transition group-hover:translate-x-0.5" aria-hidden />
      </div>
    </Link>
  );
}

function createContextTabs(role: Role) {
  if (role === "production") {
    return [
      { label:"Command", href:"/production", active:true },
      { label:"Calendar", href:"/production/content-calendar" },
      { label:"Generator", href:"/production/content-generator" },
      { label:"Recommendations", href:"/production/recommendations" },
      { label:"Analytics", href:"/production/analytics" },
    ];
  }

  if (role === "doctor") {
    return [
      { label:"Briefing", href:"/doctor", active:true },
      { label:"Approvals", href:"/doctor/approvals" },
      { label:"Growth Report", href:"/doctor/executive-growth-report" },
      { label:"Momentum", href:"/doctor/reputation" },
      { label:"Summary", href:"/doctor/summary" },
    ];
  }

  if (role === "staff") {
    return [
      { label:"Overview", href:"/staff", active:true },
      { label:"Tasks", href:"/staff/tasks" },
      { label:"Uploads", href:"/staff/uploads" },
      { label:"Requests", href:"/staff/requests" },
      { label:"Approvals", href:"/staff/approvals" },
    ];
  }

  return [
    { label:"Overview", href:"/admin", active:true },
    { label:"Strategy", href:"/admin/strategy/content" },
    { label:"Analytics", href:"/admin/analytics" },
    { label:"Workflows", href:"/admin/workflows" },
    { label:"Teams", href:"/admin/teams" },
  ];
}

function aiTitleForRole(role: Role) {
  if (role === "doctor") return "Clinical decision companion";
  if (role === "production") return "Campaign execution copilot";
  if (role === "staff") return "Operations handoff assistant";
  return "Executive intelligence analyst";
}

function aiSummaryForRole(role: Role) {
  if (role === "doctor") return "Ask for a risk-aware content summary, reputation context, or the safest approval path before making a clinical decision.";
  if (role === "production") return "Ask VIP to turn a recommendation into a brief, identify publishing blockers, or explain why a campaign should move next.";
  if (role === "staff") return "Ask VIP which uploads, requests, or clinic confirmations unblock production work today.";
  return "Ask VIP to summarize portfolio risk, integration health, permissions, or the next executive decision.";
}

function aiPromptsForRole(role: Role) {
  if (role === "doctor") {
    return ["What needs my approval today?", "Which content has clinical risk?", "Summarize reputation movement"];
  }

  if (role === "production") {
    return ["Turn top recommendation into a brief", "Show blocked publishing work", "Explain campaign performance"];
  }

  if (role === "staff") {
    return ["What should the clinic upload now?", "Which requests are blocked?", "Show handoffs due today"];
  }

  return ["Summarize portfolio risk", "Show degraded integrations", "What should leadership decide next?"];
}

function createRoleConfig(role: Role, experience: ProductExperience): RoleHubConfig {
  const liveState: LiveState = experience.available ? "ready" : "mock";
  const workspaceName = experience.workspaceName;
  const recommendationCount = String(experience.recommendations.length || 4);
  const automationCount = String(experience.operationalCounts.automations || 0);

  if (role === "admin") {
    return {
      role,
      eyebrow: "Admin command centre",
      title: "Control hospitals, users, integrations, and AI operations from one desk.",
      description: `Portfolio view for ${workspaceName}. Admins see readiness, failures, permissions, and delivery health before drilling into individual hospitals.`,
      primaryAction: { label: "Manage hospitals", href: "/admin/hospitals" },
      secondaryAction: { label: "Review users", href: "/admin/users" },
      heroIcon: Building2,
      accent: "slate",
      metrics: [
        { label: "Hospitals in scope", value: experience.available ? "1+" : "Demo", detail: "Portfolio readiness and onboarding state.", state: liveState, icon: Building2 },
        { label: "AI recommendations", value: recommendationCount, detail: "Ranked opportunities awaiting governance.", state: liveState, icon: Sparkles },
        { label: "Automations", value: automationCount, detail: "Execution records and retries.", state: experience.operationalCounts.automations ? "ready" : "empty", icon: Activity },
        { label: "System risks", value: "4", detail: "Connectors and proof gaps surfaced.", state: "degraded", icon: AlertTriangle },
      ],
      actionTitle: "Admin decisions",
      actions: [
        { title: "Resolve production calendar schema drift", detail: "API build reports a content calendar relation mismatch. This blocks backend release confidence.", owner: "Platform", due: "Now", state: "error", href: "/admin/workflows" },
        { title: "Confirm hospital onboarding roles", detail: "Map global admins, hospital doctors, production operators, and staff before wider rollout.", owner: "Admin", due: "Today", state: "ready", href: "/admin/users" },
        { title: "Audit integration readiness", detail: "Google reviews, listings, SEO, and event proof must show live, degraded, or empty states.", owner: "Ops", due: "This week", state: "degraded", href: "/admin/integrations" },
      ],
      evidenceTitle: "Platform feature map",
      evidence: [
        { title: "RBAC and invitations", detail: "Users, roles, invite acceptance, and audit logs are modeled and have UI routes.", state: "ready", icon: Users },
        { title: "Hospital context", detail: "Active hospital selection drives role-aware data views.", state: "ready", icon: Building2 },
        { title: "Integration health", detail: "Connectors need clearer authorization and failure reporting.", state: "degraded", icon: RadioTower },
        { title: "AI operations", detail: "Recommendation and automation engines are tested, but API wiring remains uneven.", state: liveState, icon: Database },
      ],
      workflow: [
        { label: "Hospital setup", detail: "Request, workspace, invite, and context setup.", state: "ready" },
        { label: "Permissions", detail: "Role gates determine navigation and page access.", state: "ready" },
        { label: "Operational proof", detail: "Outbox, workflow, automation, and audit views become the health layer.", state: "degraded" },
      ],
    };
  }

  if (role === "doctor") {
    return {
      role,
      eyebrow: "Doctor briefing",
      title: "Approve patient-facing content with evidence, risk, and clear clinical choices.",
      description: "The doctor workspace keeps leadership focused on decisions: what needs approval, why it matters, what evidence supports it, and what happens next.",
      primaryAction: { label: "Open approvals", href: "/doctor/approvals" },
      secondaryAction: { label: "Morning briefing", href: "/doctor/morning-briefing" },
      heroIcon: HeartPulse,
      accent: "emerald",
      metrics: [
        { label: "Approvals due", value: "3", detail: "Clinical review items before scheduling.", state: liveState, icon: ClipboardCheck },
        { label: "Reputation signal", value: experience.available ? "Measured" : "Demo", detail: "Patient-facing evidence and review trends.", state: liveState, icon: MessageSquareText },
        { label: "Clinical risk", value: "Medium", detail: "Flagged when claims need tighter wording.", state: "degraded", icon: ShieldCheck },
        { label: "Growth outlook", value: experience.intelligence?.predictions7Day.length ? "7 day" : "Pending", detail: "Forecasting appears when enough measurements exist.", state: experience.intelligence?.predictions7Day.length ? "ready" : "empty", icon: LineChart },
      ],
      actionTitle: "Clinical decisions",
      actions: [
        { title: "Review ENT awareness script", detail: "Patient education content is ready with caption, CTA, and evidence notes.", owner: "Doctor", due: "Today", state: liveState, href: "/doctor/approvals" },
        { title: "Request safer wording on symptom claims", detail: "The risk panel flags language that could read like diagnosis guidance.", owner: "Doctor", due: "Today", state: "degraded", href: "/doctor/approvals" },
        { title: "Inspect reputation momentum", detail: "Review themes and discoverability evidence before next campaign approval.", owner: "Doctor", due: "Weekly", state: liveState, href: "/doctor/reputation" },
      ],
      evidenceTitle: "Clinical evidence surfaces",
      evidence: [
        { title: "Morning briefing", detail: "Daily decisions, risks, and recommendations for leadership.", state: liveState, icon: Bell },
        { title: "Approval proof", detail: "Approve, request changes, or hold content with reason capture.", state: "ready", icon: ClipboardCheck },
        { title: "Reputation intelligence", detail: "Review persistence and GBP authorization still need hardening.", state: "degraded", icon: MessageSquareText },
        { title: "Strategy summary", detail: "AI recommendations become usable when evidence and risk are visible.", state: liveState, icon: Sparkles },
      ],
      workflow: [
        { label: "Brief", detail: "Doctor sees only decisions that matter.", state: liveState },
        { label: "Review", detail: "Evidence and clinical risk sit beside the content.", state: "ready" },
        { label: "Approve", detail: "Decision moves production toward scheduling.", state: "ready" },
      ],
    };
  }

  if (role === "production") {
    return {
      role,
      eyebrow: "Production workspace",
      title: "Move content from idea to approved, scheduled, published, and measured.",
      description: "Production sees throughput, blockers, calendar readiness, scripts, media, recommendations, and live status without hunting across disconnected pages.",
      primaryAction: { label: "Open content calendar", href: "/production/content-calendar" },
      secondaryAction: { label: "Command centre", href: "/production/command-centre" },
      heroIcon: Megaphone,
      accent: "blue",
      metrics: [
        { label: "Pipeline items", value: "18", detail: "Draft, review, approved, and scheduled work.", state: liveState, icon: FileText },
        { label: "Scripts ready", value: "6", detail: "Script Studio queue for doctor review.", state: "mock", icon: Sparkles },
        { label: "Campaigns active", value: "4", detail: "Current production workstreams.", state: liveState, icon: Megaphone },
        { label: "Publishing risk", value: "2", detail: "Blocked by approval or missing assets.", state: "degraded", icon: AlertTriangle },
      ],
      actionTitle: "Production queue",
      actions: [
        { title: "Finish World No Tobacco Day brief", detail: "Script and caption need final review before scheduling.", owner: "Production", due: "Today", state: liveState, href: "/production/content-calendar" },
        { title: "Attach approved clinic images", detail: "Media asset rights and alt text must be completed.", owner: "Staff", due: "Today", state: "degraded", href: "/production/library" },
        { title: "Check recommendation-to-workflow handoff", detail: "AI recommendation exists, but automation handoff should show proof state.", owner: "Ops", due: "This week", state: "mock", href: "/production/recommendations" },
      ],
      evidenceTitle: "Production capability map",
      evidence: [
        { title: "Content calendar", detail: "Calendar models and UI exist; API has a current build mismatch to fix.", state: "degraded", icon: CalendarDays },
        { title: "Script Studio", detail: "Planned flow exists, but generation is still marked future in docs.", state: "mock", icon: Sparkles },
        { title: "Media library", detail: "Asset intake and campaign linking are present in the UI layer.", state: liveState, icon: Image },
        { title: "Social intelligence", detail: "Measured analytics appear when stored social data exists.", state: liveState, icon: BarChart3 },
      ],
      workflow: [
        { label: "Plan", detail: "AI recommendation enters production planning.", state: liveState },
        { label: "Produce", detail: "Script, media, caption, and channel package are assembled.", state: "mock" },
        { label: "Approve", detail: "Doctor sign-off unlocks schedule.", state: "ready" },
        { label: "Measure", detail: "Engagement and outcome signals feed back into recommendations.", state: liveState },
      ],
    };
  }

  return {
    role,
    eyebrow: "Staff workspace",
    title: "Complete clinic tasks, uploads, and requests without entering the production maze.",
    description: "Staff get a focused task board: what to upload, what information production needs, what is blocked, and what has been accepted.",
    primaryAction: { label: "Open tasks", href: "/staff/tasks" },
    secondaryAction: { label: "Upload assets", href: "/staff/uploads" },
    heroIcon: UploadCloud,
    accent: "amber",
    metrics: [
      { label: "Tasks assigned", value: "7", detail: "Clinic inputs needed for production.", state: "mock", icon: ClipboardCheck },
      { label: "Uploads pending", value: "3", detail: "Images, doctor notes, or service details.", state: "mock", icon: UploadCloud },
      { label: "Requests open", value: "5", detail: "Questions from production.", state: "mock", icon: MessageSquareText },
      { label: "Blocked items", value: "2", detail: "Waiting on doctor or production action.", state: "degraded", icon: Clock3 },
    ],
    actionTitle: "Staff worklist",
    actions: [
      { title: "Upload clinic exterior and reception photos", detail: "Production needs current images for listing and campaign assets.", owner: "Staff", due: "Today", state: "mock", href: "/staff/uploads" },
      { title: "Confirm weekend consultation hours", detail: "Calendar copy and GBP updates are blocked until this is confirmed.", owner: "Front desk", due: "Today", state: "degraded", href: "/staff/tasks" },
      { title: "Answer doctor availability request", detail: "Campaign scheduling needs reviewed availability windows.", owner: "Staff", due: "Tomorrow", state: "mock", href: "/staff/requests" },
    ],
    evidenceTitle: "Staff support surfaces",
    evidence: [
      { title: "Tasks", detail: "Simple due-date worklist with completion state.", state: "mock", icon: ClipboardCheck },
      { title: "Uploads", detail: "Asset collection and handoff to production.", state: "mock", icon: UploadCloud },
      { title: "Requests", detail: "Production asks and clinic responses stay trackable.", state: "mock", icon: MessageSquareText },
      { title: "Approval support", detail: "Staff can see whether their inputs cleared review.", state: "empty", icon: CheckCircle2 },
    ],
    workflow: [
      { label: "Request", detail: "Production asks for clinic input.", state: "mock" },
      { label: "Upload", detail: "Staff attaches assets or confirms details.", state: "mock" },
      { label: "Clear", detail: "Production and doctor review the item.", state: "empty" },
    ],
  };
}
