import { Globe, SearchCheck, ShieldAlert } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { websiteChecks } from "@/lib/playbook/harika-playbook";

export default function WebsiteListingsPage() {
  return (
    <PlaybookShell
      eyebrow="Discoverability / Website and listings"
      title="Turn the hospital website into a verified patient-access surface."
      description="This view expands our existing website-ingestion foundation into an audit queue for facts, safe medical language, search clarity and conversion measurement."
    >
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="Audit workspace" description="Connect sources before the system recommends page or listing changes" action={<Button size="lg" variant="outline" disabled>Audit connection pending</Button>} />
          <div className="rounded-xl border border-dashed bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <Globe className="mt-1 size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Website source connection</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Website ingestion is supported by the internal foundation. This surface exposes approved audit findings and recommended fixes inside the current tenant workspace, without mixing another hospital&apos;s records.</p>
              </div>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionHeader title="Verification checklist" description="High-value work before any automated rewriting" />
          <div className="space-y-3">
            {websiteChecks.map((check) => (
              <article key={check.area} className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{check.area}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{check.action}</p>
                </div>
                <StatusIndicator label={check.status} tone={check.status === "Approval required" ? "warning" : "info"} />
              </article>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <SearchCheck className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Measure patient access</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Connect calls, map directions, WhatsApp inquiries and appointment-form actions to improvements, rather than reporting SEO suggestions alone.</p>
          </Panel>
          <Panel className="p-5">
            <ShieldAlert className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Claim safety</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Proposed website copy must flag treatment promises, unsupported superlatives and clinical guidance before it can be released.</p>
          </Panel>
        </div>
      </div>
    </PlaybookShell>
  );
}
