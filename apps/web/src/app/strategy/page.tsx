import { OwnerSourcePage, strategyLanguage } from "@/components/owner/owner-source-pages";

export const dynamic = "force-dynamic";

export default function StrategyPage() {
  return (
    <OwnerSourcePage
      title="Strategy Plan"
      description="A production owner entry page for priority, reason, expected impact, and action needed."
      reportType="DAILY_STRATEGY_REPORT"
      generateTitle="Generate daily strategy report"
      generateDescription="Create a client-ready strategy draft from saved recommendations, opportunities, action plans, and approval notes."
      reportFilterTypes={["DAILY_STRATEGY_REPORT"]}
      languageCards={strategyLanguage}
      links={[
        { label: "Content strategy", href: "/strategy/content-strategy", note: "Preserved strategy surface for content decisions." },
        { label: "Admin strategy", href: "/admin/strategy", note: "Legacy admin strategy hub." },
        { label: "Social strategy", href: "/admin/strategy/social", note: "Detailed social recommendation page." },
      ]}
    />
  );
}
