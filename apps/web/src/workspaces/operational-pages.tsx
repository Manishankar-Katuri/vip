import {
  CampaignCalendar,
  RealKpis,
  SourceNotice,
  TopContentTable,
  type LiveData,
} from "@/components/operations/operational-surfaces";
import { DoctorApprovalCenter } from "@/components/approvals/doctor-approval-center";
import { CampaignWorkspace, ContentPipelineBoard, RecommendationActionCenter } from "@/components/campaigns/production-workspace-surfaces";
import {
  AutomationMonitor,
  HospitalPortfolioGrid,
  ProductionTeamOversight,
  StaffRequests,
  StaffTaskTracker,
} from "@/components/operations/role-depth-surfaces";
import { StaffUploadWorkflow } from "@/components/operations/staff-upload-workflow";
import { OperationalTimeline } from "@/components/timelines/operational-timeline";
import { WorkflowJourney } from "@/components/workflows/workflow-journey";
import { LiveActivityStream } from "@/activity/live-activity-stream";
import { WorkflowAuditTrail } from "@/audit/workflow-audit-trail";
import { OperationalCalendar } from "@/calendars/operational-calendar";
import { WorkflowParticipants } from "@/collaboration/workflow-participants";
import { AlertBanner } from "@/design-system/primitives";
import type { Role } from "@/design-system/theme";
import { WorkspaceShell } from "@/layouts/workspace-shell";
import { getProductExperience, percent } from "@/lib/product-experience";
import { MediaLibrary } from "@/media/media-library";
import { CampaignOperationsCenter } from "@/archives/campaign-operations-center";
import { ExecutiveReporting, OperationalKpis } from "@/reporting/executive-reporting";
import { ExecutiveGrowthReporting } from "@/reporting/executive-growth-reporting";
import { ExecutiveInsights } from "@/insights/executive-insights";
import { RecommendationDetailPage, RecommendationIntelligenceCenter, RecommendationUnavailablePage } from "@/intelligence/recommendation-intelligence-center";
import { SocialPatternIntelligence } from "@/intelligence/social-pattern-intelligence";
import { PredictiveIntelligence } from "@/forecasting/predictive-intelligence";
import { AIStrategyWorkspace } from "@/strategies/ai-strategy-workspace";
import { CompetitorIntelligenceCenter } from "@/competitors/competitor-intelligence-center";
import { OpportunityEngineVisualization } from "@/opportunities/opportunity-engine-visualization";
import { ExecutiveAIBriefing } from "@/executive-ai/executive-ai-briefing";

type AdminSection = "overview" | "hospitals" | "analytics" | "reports" | "workflows" | "automation" | "ai" | "approvals" | "teams";
type ProductionSection = "overview" | "content" | "campaigns" | "recommendations" | "calendar" | "analytics" | "workflows" | "library";
type StaffSection = "overview" | "tasks" | "uploads" | "requests" | "approvals";
type DoctorSection = "overview" | "approvals" | "reports" | "reputation" | "summary";
export type OperationalSection = AdminSection | ProductionSection | StaffSection | DoctorSection;

const headings: Record<Role, Record<string, { label: string; title: string; subtitle: string }>> = {
  admin: {
    overview: { label: "Intelligence", title: "Portfolio growth intelligence", subtitle: "Predictive healthcare social insights, opportunity rankings, and competitive positioning." },
    hospitals: { label: "Market", title: "Hospital market intelligence", subtitle: "Local visibility benchmarks, engagement comparisons, and healthcare opportunity gaps." },
    analytics: { label: "Forecasting", title: "Predictive analytics center", subtitle: "Growth trajectory, engagement risk, audience momentum, and content pattern evidence." },
    reports: { label: "Briefings", title: "Executive AI reporting", subtitle: "Leadership-ready growth and market intelligence summaries." },
    workflows: { label: "Workflows", title: "Workflow monitoring", subtitle: "Track movement from insight through review, publishing, and measurement." },
    automation: { label: "Automation", title: "Automation health", subtitle: "Execution status, retries, and operational queue activity." },
    ai: { label: "Recommendations", title: "AI recommendation intelligence", subtitle: "Prioritized growth opportunities with confidence, outcome forecasts, and evidence." },
    approvals: { label: "Approvals", title: "Approval governance", subtitle: "Clinical review demand and production bottlenecks." },
    teams: { label: "Teams", title: "Production team throughput", subtitle: "Campaign flow and workload readiness." },
  },
  production: {
    overview: { label: "Strategy", title: "AI-assisted campaign execution", subtitle: "Turn measured healthcare social opportunities into clinically responsible content decisions." },
    content: { label: "Optimization", title: "Performance-driven content optimization", subtitle: "Refine content using strategy signals, clinical approval, and measured response." },
    campaigns: { label: "Campaigns", title: "AI campaign strategy workspace", subtitle: "Adopt growth plans with reasoning, projected outcomes, and timing intelligence." },
    recommendations: { label: "Recommendations", title: "Recommendation execution center", subtitle: "Prioritize evidence-led healthcare growth actions before production execution." },
    calendar: { label: "Calendar", title: "Campaign calendar", subtitle: "Performance-backed publishing windows available after approval." },
    analytics: { label: "Forecasting", title: "Campaign performance intelligence", subtitle: "Predicted response, momentum patterns, and optimization windows." },
    workflows: { label: "Workflows", title: "Execution workflow", subtitle: "Trace each step from recommendation to analytics tracking." },
    library: { label: "Media Library", title: "Media library", subtitle: "Approved, reusable and campaign-linked assets for responsible publishing." },
  },
  staff: {
    overview: { label: "Overview", title: "Clinic coordination", subtitle: "Straightforward tasks and uploads supporting accurate patient communication." },
    tasks: { label: "Tasks", title: "Tasks requiring attention", subtitle: "Submit clinic information and track completion with minimal overhead." },
    uploads: { label: "Uploads", title: "Upload materials", subtitle: "Provide approved clinic assets for production review." },
    requests: { label: "Requests", title: "Production requests", subtitle: "Questions and asset needs raised for the clinic." },
    approvals: { label: "Approvals", title: "Submission status", subtitle: "Track clinic inputs moving through production review." },
  },
  doctor: {
    overview: { label: "Briefing", title: "AI executive intelligence briefing", subtitle: "The analysis is prepared: growth outlook, reputation risk, and decisions needing clinical leadership." },
    approvals: { label: "Approvals", title: "Pending approvals", subtitle: "Clinical decisions required before patient-facing publication." },
    reports: { label: "Reports", title: "Executive growth report", subtitle: "Export-ready measured outcomes, forecasts, and trustworthy AI summaries." },
    reputation: { label: "Reputation", title: "Reputation and momentum intelligence", subtitle: "Patient-facing content signals, trend risk, and evidence basis." },
    summary: { label: "Summary", title: "Strategic AI summary", subtitle: "Measured growth intelligence translated into clinical leadership decisions." },
  },
};

export async function OperationalWorkspacePage({ role, section }: { role: Role; section: OperationalSection }) {
  const data = await getProductExperience();
  const heading = headings[role][section];

  return (
    <WorkspaceShell role={role} section={heading.label} title={heading.title} subtitle={heading.subtitle}>
      <div className="space-y-5">
        <SourceNotice data={data} />
        {data.available && data.analytics ? (
          <RoleContent role={role} section={section} data={data as LiveData} />
        ) : (
          <OperationalOnlyContent role={role} section={section} />
        )}
      </div>
    </WorkspaceShell>
  );
}

function OperationalOnlyContent({ role, section }: { role: Role; section: OperationalSection }) {
  if (role === "staff") return <StaffContent section={section as StaffSection} />;
  if (role === "doctor") {
        if (section === "reports") return <ExecutiveGrowthReporting role="doctor" data={undefined} />;
    return (
      <>
        <OperationalKpis />
        <ExecutiveInsights role="doctor" />
        <DoctorApprovalCenter />
        <WorkflowParticipants />
        <div className="grid gap-5 xl:grid-cols-2">
          <LiveActivityStream role="doctor" />
          <WorkflowAuditTrail role="doctor" />
        </div>
      </>
    );
  }
  if (role === "admin") {
    if (section === "reports") return <ExecutiveGrowthReporting role="admin" data={undefined} />;
    if (section === "analytics") return <ExecutiveReporting role="admin" />;
    return (
      <>
        <OperationalKpis />
        <ExecutiveInsights role="admin" />
        <ProductionTeamOversight />
        <WorkflowParticipants />
        <div className="grid gap-5 xl:grid-cols-2">
          <LiveActivityStream role="admin" />
          <WorkflowAuditTrail role="admin" />
        </div>
      </>
    );
  }
  if (section === "calendar") return <OperationalCalendar />;
  if (section === "campaigns") return <><CampaignOperationsCenter /><CampaignWorkspace /><WorkflowAuditTrail role="production" /></>;
  if (section === "recommendations") return <RecommendationUnavailablePage />;
  if (section === "library") return <MediaLibrary role="production" />;
  return (
    <>
      <ContentPipelineBoard />
      <WorkflowParticipants />
      <div className="grid gap-5 xl:grid-cols-2">
        <LiveActivityStream role="production" />
        <WorkflowAuditTrail role="production" />
      </div>
    </>
  );
}

function RoleContent({ role, section, data }: { role: Role; section: OperationalSection; data: LiveData }) {
  if (role === "admin") return <AdminContent section={section as AdminSection} data={data} />;
  if (role === "production") return <ProductionContent section={section as ProductionSection} data={data} />;
  if (role === "staff") return <StaffContent section={section as StaffSection} />;
  return <DoctorContent section={section as DoctorSection} data={data} />;
}

function AdminContent({ section, data }: { section: AdminSection; data: LiveData }) {
  if (section === "hospitals") return <><CompetitorIntelligenceCenter data={data} /><HospitalPortfolioGrid connectedName={data.workspaceName} engagement={percent(data.analytics.avgEngagementRate)} /></>;
  if (section === "analytics") return <><PredictiveIntelligence data={data} /><SocialPatternIntelligence data={data} /><CompetitorIntelligenceCenter data={data} /></>;
  if (section === "reports") return <ExecutiveGrowthReporting role="admin" data={data} />;
  if (section === "workflows") return <><ProductionTeamOversight /><WorkflowJourney /><div className="grid gap-5 xl:grid-cols-2"><LiveActivityStream role="admin" /><WorkflowAuditTrail role="admin" /></div></>;
  if (section === "automation") return <><AutomationMonitor /><OperationalTimeline /></>;
  if (section === "ai") return <><RecommendationIntelligenceCenter data={data} /><OpportunityEngineVisualization data={data} /></>;
  if (section === "approvals") return <><ProductionTeamOversight /><WorkflowParticipants /><WorkflowAuditTrail role="admin" /></>;
  if (section === "teams") return <ProductionTeamOversight />;
  return (
    <>
      <ExecutiveAIBriefing data={data} role="admin" />
      <RealKpis data={data} />
      <PredictiveIntelligence data={data} />
      <OpportunityEngineVisualization data={data} />
      <CompetitorIntelligenceCenter data={data} />
    </>
  );
}

function ProductionContent({ section, data }: { section: ProductionSection; data: LiveData }) {
  if (section === "content") return <><SocialPatternIntelligence data={data} /><CampaignOperationsCenter /><ContentPipelineBoard /></>;
  if (section === "campaigns") return <><AIStrategyWorkspace data={data} /><CampaignWorkspace /></>;
  if (section === "recommendations") return <><RecommendationDetailPage data={data} /><RecommendationActionCenter recommendations={data.recommendations} /></>;
  if (section === "calendar") return <><OperationalCalendar /><CampaignCalendar data={data} /></>;
  if (section === "analytics") return <><PredictiveIntelligence data={data} /><SocialPatternIntelligence data={data} /><TopContentTable data={data} /></>;
  if (section === "workflows") return <><WorkflowJourney /><WorkflowParticipants /><div className="grid gap-5 xl:grid-cols-2"><LiveActivityStream role="production" /><WorkflowAuditTrail role="production" /></div></>;
  if (section === "library") return <MediaLibrary role="production" />;
  return (
    <>
      <AIStrategyWorkspace data={data} compact />
      <RealKpis data={data} />
      <RecommendationIntelligenceCenter data={data} limit={2} />
      <SocialPatternIntelligence data={data} />
      <RecommendationActionCenter recommendations={data.recommendations} compact />
    </>
  );
}

function StaffContent({ section }: { section: StaffSection }) {
  if (section === "uploads") return <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><StaffUploadWorkflow /><MediaLibrary role="staff" compact /></div>;
  if (section === "requests") return <StaffRequests />;
  if (section === "approvals") return <><StaffTaskTracker /><LiveActivityStream role="staff" limit={5} /></>;
  return (
    <>
      <AlertBanner title="One action due today" message="Confirm weekend consultation hours so production can validate patient-facing guidance." tone="warning" />
      <StaffTaskTracker />
      {section === "overview" && <StaffRequests />}
      {section === "overview" && <LiveActivityStream role="staff" limit={4} />}
    </>
  );
}

function DoctorContent({ section, data }: { section: DoctorSection; data: LiveData }) {
  if (section === "approvals") return <><DoctorApprovalCenter recommendations={data.recommendations} /><WorkflowParticipants /><div className="grid gap-5 xl:grid-cols-2"><LiveActivityStream role="doctor" limit={6} /><WorkflowAuditTrail role="doctor" /></div></>;
  if (section === "reports") return <ExecutiveGrowthReporting role="doctor" data={data} />;
  if (section === "reputation") return <><ExecutiveAIBriefing data={data} role="doctor" /><PredictiveIntelligence data={data} /><SocialPatternIntelligence data={data} /></>;
  if (section === "summary") return <><ExecutiveAIBriefing data={data} role="doctor" /><RecommendationIntelligenceCenter data={data} limit={2} /><DoctorApprovalCenter recommendations={data.recommendations.slice(0, 1)} /></>;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AlertBanner title="Approval required today" message="One patient-facing education asset is ready for your clinical decision." tone="warning" />
      <ExecutiveAIBriefing data={data} role="doctor" />
      <RealKpis data={data} executive />
      <PredictiveIntelligence data={data} />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <DoctorApprovalCenter recommendations={data.recommendations.slice(0, 1)} />
        <RecommendationIntelligenceCenter data={data} limit={1} />
      </div>
    </div>
  );
}
