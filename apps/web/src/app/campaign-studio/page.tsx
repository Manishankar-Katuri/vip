import Link from "next/link";
import { Languages, Megaphone, ShieldAlert } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { EvidenceLinks, StageRow } from "@/components/playbook/playbook-surfaces";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { campaignDrafts, hospitalProfile } from "@/lib/playbook/harika-playbook";

export default function CampaignStudioPage() {
  return (
    <PlaybookShell
      eyebrow="Create / Clinically governed content"
      title="Campaign ideas that already know their source, purpose and safety boundary."
      description="Content is prepared inside the current Dr. Harika tenant workspace, translated only after clinical meaning is approved, and routed into the existing execution workflow."
    >
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="Channel and language readiness" description="One approved message, adapted responsibly for each channel" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Readiness icon={<Megaphone />} title="Channels" value={hospitalProfile.channels.join(", ")} />
            <Readiness icon={<Languages />} title="Languages" value={hospitalProfile.languages.join(", ")} />
            <Readiness icon={<ShieldAlert />} title="Safety" value="Clinical claims cannot auto-publish" />
          </div>
        </Panel>
        <div className="grid gap-5">
          {campaignDrafts.map((draft, index) => (
            <Panel key={draft.name} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Campaign draft {index + 1}</p>
                  <h2 className="mt-2 text-lg font-semibold">{draft.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Trigger: {draft.trigger}</p>
                </div>
                <StatusIndicator label={draft.stage} tone={draft.stage === "Awaiting clinical review" ? "warning" : "info"} />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">English master copy</p>
                  <p className="mt-3 text-sm leading-7">{draft.copy}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {draft.platforms.map((platform) => <StatusIndicator key={platform} label={platform} tone="neutral" />)}
                  </div>
                </div>
                <div className="rounded-xl border border-warning/25 bg-warning/8 p-4">
                  <p className="text-xs font-semibold text-warning-foreground">Clinical safety note</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{draft.safety}</p>
                  <EvidenceLinks sourceIds={index === 0 ? ["who-tobacco-day-2026"] : ["dghs-nppcd"]} />
                  <Button asChild size="lg" className="mt-4 min-h-11">
                    <Link href="/governance">Open clinical review flow</Link>
                  </Button>
                  {index === 0 && (
                    <Button asChild size="lg" variant="outline" className="mt-2 min-h-11">
                      <Link href="/opportunities/world-no-tobacco-day-2026">View complete action plan</Link>
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <StageRow />
      </div>
    </PlaybookShell>
  );
}

function Readiness({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}
