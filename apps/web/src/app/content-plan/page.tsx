import { contentLanguage, OwnerSourcePage } from "@/components/owner/owner-source-pages";

export const dynamic = "force-dynamic";

export default function ContentPlanPage() {
  return (
    <OwnerSourcePage
      title="Content Plan"
      description="Execution-ready content plans using simple client-friendly language for owners, doctors, staff, and production teams."
      reportType="THREE_DAY_CONTENT_PLAN"
      generateTitle="Generate three-day content plan"
      generateDescription="Create a client-ready content plan with topic, format, main message, opening line, video shots needed, patient action, and doctor/staff instruction."
      reportFilterTypes={["THREE_DAY_CONTENT_PLAN"]}
      languageCards={contentLanguage}
      links={[
        { label: "Content execution reports", href: "/reports/content-execution", note: "Preserved 3-day content execution report route." },
        { label: "Production calendar", href: "/production/content-calendar", note: "Role-specific production schedule surface." },
        { label: "Content generator", href: "/production/content-generator", note: "Preserved production generation surface." },
      ]}
    />
  );
}
