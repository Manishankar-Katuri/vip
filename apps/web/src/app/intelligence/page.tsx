import { intelligenceLanguage, OwnerSourcePage } from "@/components/owner/owner-source-pages";

export const dynamic = "force-dynamic";

export default function IntelligencePage() {
  return (
    <OwnerSourcePage
      title="Intelligence"
      description="Patterns, risks, opportunities, and business insight pulled from workflows, reports, and preserved intelligence systems."
      reportFilterTypes={["DAILY_ANALYTICS_REPORT", "DAILY_STRATEGY_REPORT", "WEEKLY_GROWTH_REPORT", "MONTHLY_CLIENT_REPORT"]}
      languageCards={intelligenceLanguage}
      workflowMode="intelligence"
      links={[
        { label: "Social intelligence", href: "/admin/intelligence/social", note: "Legacy admin surface for social signals." },
        { label: "GBP intelligence", href: "/admin/intelligence/gbp", note: "Detailed Google Business Profile intelligence." },
        { label: "Trend intelligence", href: "/admin/intelligence/trend", note: "Trend and opportunity detail view." },
        { label: "Forecasting", href: "/admin/intelligence/forecasting", note: "Preserved forecasting surface." },
      ]}
    />
  );
}
