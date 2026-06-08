import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { SourcesPanel } from "@/components/playbook/playbook-surfaces";
import { OpportunityPlanBody } from "@/components/playbook/opportunity-plan-body";
import { SourceNotice } from "@/components/operations/operational-surfaces";
import { evidenceSources, playbookEvents } from "@/lib/playbook/harika-playbook";
import { getBaselineOpportunityBrief } from "@/lib/playbook/opportunity-brief";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = playbookEvents.find((item) => item.slug === slug);
  if (!event) notFound();

  const experience = await getProductExperience();
  const initial = getBaselineOpportunityBrief(event, experience);
  const sources = evidenceSources.filter((source) => event.sourceIds.includes(source.id));
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(`${event.date}T00:00:00`));

  return (
    <PlaybookShell
      eyebrow={`Opportunity plan / ${date}`}
      title={`${event.name}: complete growth action plan`}
      description="An A-to-Z strategic brief combining official campaign evidence, current tenant identity, available channel performance, demographic context, clinical safety and measurable business action."
    >
      <div className="space-y-5">
        <Link href="/calendar" className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="size-4" /> Back to official calendar</Link>
        <SourceNotice data={experience} />
        <OpportunityPlanBody event={event} initial={initial} />
        <SourcesPanel sources={sources} />
      </div>
    </PlaybookShell>
  );
}
