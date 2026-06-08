"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, CalendarClock, LoaderCircle, Megaphone, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { EvidenceLinks } from "@/components/playbook/playbook-surfaces";
import { Button, DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import type { PlaybookEvent } from "@/lib/playbook/harika-playbook";
import type { GeneratedOpportunityBrief } from "@/lib/playbook/opportunity-brief";

export function OpportunityPlanBody({ event, initial }: { event: PlaybookEvent; initial: GeneratedOpportunityBrief }) {
  const [generated, setGenerated] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const brief = generated.brief;

  async function generateWithAI() {
    setLoading(true);
    setRequestError(undefined);
    try {
      const response = await fetch(`/api/playbook/opportunities/${event.slug}/generate`, { method: "POST" });
      const payload = await response.json() as { success: boolean; generated?: GeneratedOpportunityBrief; error?: string };
      if (!response.ok || !payload.generated) throw new Error(payload.error ?? "AI generation failed.");
      setGenerated(payload.generated);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Panel className="border-primary/15 bg-info/25 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles className="size-4" /> {generated.generatedBy === "OpenAI" ? `Generated with ${generated.model}` : generated.generatedBy}</p>
            <h2 className="mt-2 text-lg font-semibold">{brief.recommendation.decision}</h2>
            <DetailDisclosure label="Executive summary" className="mt-2">{brief.executiveSummary}</DetailDisclosure>
            <DetailDisclosure label="Generation note" className="mt-2">{generated.note}</DetailDisclosure>
          </div>
          <StatusIndicator label="Clinical approval required" tone="warning" />
        </div>
        <EvidenceLinks sourceIds={event.sourceIds} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="lg" onClick={generateWithAI} disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Generating detailed brief..." : generated.generatedBy === "OpenAI" ? "Regenerate with GPT-5.5" : "Generate with GPT-5.5"}
          </Button>
          <Button asChild size="lg" variant="outline"><Link href="/governance">Open approval workflow <ArrowRight className="size-4" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/campaign-studio">Open campaign studio</Link></Button>
        </div>
        <DetailDisclosure label="Generation timing" className="mt-3">Frontier-model generation runs on demand and may take up to two minutes for a fully structured strategic brief. The baseline plan remains usable immediately.</DetailDisclosure>
        {requestError && <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">{requestError} The evidence-backed plan remains available below.</p>}
      </Panel>
      <div className="grid gap-3 lg:grid-cols-3">
        <BriefPoint icon={<Target />} title="Business objective" text={brief.recommendation.businessObjective} />
        <BriefPoint icon={<BookOpen />} title="Strategic fit" text={brief.recommendation.strategicFit} />
        <BriefPoint icon={<ShieldCheck />} title="Official basis" text={event.officialBasis} />
      </div>
      <Panel className="p-4">
        <SectionHeader title="Audience and demographic reasoning" description="Why this plan fits the tenant audience, with assumptions kept visible" />
        <div className="grid gap-3 lg:grid-cols-3">
          {brief.audienceAnalysis.map((audience) => (
            <article key={audience.segment} className="rounded-lg border bg-background p-3">
              <Users className="size-5 text-primary" />
              <h3 className="mt-2 text-sm font-semibold">{audience.segment}</h3>
              <p className="mt-1 text-sm leading-5"><span className="font-medium">Action:</span> {audience.adaptation}</p>
              <DetailDisclosure label="Reason" className="mt-2">{audience.reason}</DetailDisclosure>
            </article>
          ))}
        </div>
        <DetailDisclosure label="Demographic boundary" className="mt-3">Government demographic values shown elsewhere in the playbook are a Census 2011 Hyderabad district baseline, not real-time individual targeting data.</DetailDisclosure>
      </Panel>
      <Panel className="p-4">
        <SectionHeader title="What to create and publish" description="Content deliverables chosen for purpose, channel and clinical control" action={<StatusIndicator label={`${brief.assetPlan.length} core assets`} tone="info" />} />
        <div className="space-y-2">
          {brief.assetPlan.map((asset) => (
            <article key={`${asset.format}-${asset.channel}`} className="rounded-lg border bg-background p-3">
              <div className="flex gap-3">
                <Megaphone className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">{asset.format}</h3>
                  <p className="mt-1 text-sm text-primary">{asset.channel} / {asset.purpose}</p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-5">{asset.concept}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Detail label="Call to action" text={asset.callToAction} />
                <DetailDisclosure label="Production notes">{asset.productionNotes}</DetailDisclosure>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Panel className="p-4">
          <SectionHeader title="Execution timeline" description="Who does what before and after the special day" />
          <div className="space-y-2">
            {brief.executionTimeline.map((step) => (
              <article key={`${step.timing}-${step.task}`} className="flex gap-3 rounded-lg border bg-background p-3">
                <CalendarClock className="mt-1 size-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{step.timing} / {step.owner}</p>
                  <p className="mt-1 text-sm font-medium">{step.task}</p>
                  <DetailDisclosure label="Dependency" className="mt-2">{step.dependency}</DetailDisclosure>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionHeader title="Distribution plan" description="Approved release sequence by channel" />
          <div className="space-y-3">
            {brief.distributionPlan.map((distribution) => (
              <Detail key={distribution.channel} label={`${distribution.channel} / ${distribution.timing}`} text={distribution.distributionAction} />
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="p-4">
        <SectionHeader title="How this could improve reach and business outcomes" description="Testable logic rather than guaranteed claims" />
        <div className="grid gap-3 lg:grid-cols-3">
          {brief.reachRationale.map((factor) => (
            <article key={factor.factor} className="rounded-lg border bg-background p-3">
              <BarChart3 className="size-5 text-primary" />
              <h3 className="mt-2 text-sm font-semibold">{factor.factor}</h3>
              <p className="mt-1 text-sm leading-5"><span className="font-medium">Action:</span> {factor.action}</p>
              <DetailDisclosure label="Evidence and signal" className="mt-2">
                <p>{factor.evidence}</p>
                <p className="mt-1 text-primary">{factor.expectedSignal}</p>
              </DetailDisclosure>
            </article>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="p-4">
          <SectionHeader title="Measurement scorecard" description="What determines whether this strategy earns repetition" />
          <div className="space-y-2">
            {brief.measurementPlan.map((measurement) => (
              <article key={measurement.metric} className="rounded-lg border bg-background p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="text-sm font-semibold">{measurement.metric}</h3>
                  <StatusIndicator label={measurement.successDirection} tone="info" />
                </div>
                <p className="mt-1 text-sm leading-5">Decision rule: {measurement.decisionRule}</p>
                <DetailDisclosure label="Baseline" className="mt-2">{measurement.baseline}</DetailDisclosure>
              </article>
            ))}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel className="p-4">
            <SectionHeader title="Clinical safety checklist" description="Must pass before any public content release" />
            <Checklist values={brief.clinicalSafetyChecklist} tone="warning" />
          </Panel>
          <Panel className="p-4">
            <SectionHeader title="Business next moves" description="Improvements beyond this one special day" />
            <Checklist values={brief.businessNextMoves} tone="success" />
          </Panel>
        </div>
      </div>
      <Panel className="p-4">
        <SectionHeader title="Limits and risks" description="Boundaries that keep the growth recommendation trustworthy" />
        <Checklist values={brief.risksAndLimits} tone="warning" />
      </Panel>
    </>
  );
}

function BriefPoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Panel className="p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <h2 className="mt-2 text-sm font-semibold">{title}</h2>
      <DetailDisclosure label="Detail" className="mt-2">{text}</DetailDisclosure>
    </Panel>
  );
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-1 text-sm leading-5">{text}</p>
    </div>
  );
}

function Checklist({ values, tone }: { values: string[]; tone: "warning" | "success" }) {
  return (
    <div className="space-y-1.5">
      {values.map((value) => (
        <div key={value} className="flex gap-2 rounded-lg border bg-background p-2.5">
          <StatusIndicator label={tone === "success" ? "Action" : "Guardrail"} tone={tone} />
          <p className="text-sm leading-5">{value}</p>
        </div>
      ))}
    </div>
  );
}
