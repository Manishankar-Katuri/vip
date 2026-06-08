import { analyticsLanguage, OwnerSourcePage } from "@/components/owner/owner-source-pages";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <OwnerSourcePage
      title="Analytics"
      description="A production owner entry page for what changed, why it matters, and what to do next."
      reportType="DAILY_ANALYTICS_REPORT"
      generateTitle="Generate daily analytics report"
      generateDescription="Create a client-ready analytics draft from saved workflow performance, social, review, and website data."
      reportFilterTypes={["DAILY_ANALYTICS_REPORT"]}
      languageCards={analyticsLanguage}
      links={[
        { label: "Admin analytics", href: "/admin/analytics", note: "Legacy admin surface preserved for deeper analytics." },
        { label: "Instagram analytics", href: "/admin/analytics/instagram", note: "Role-specific detail page for social metrics." },
        { label: "Review analytics", href: "/admin/analytics/reviews", note: "Detailed review movement and reputation signals." },
      ]}
    />
  );
}
