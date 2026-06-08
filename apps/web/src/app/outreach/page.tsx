import { Handshake, Route, Users } from "lucide-react";
import { PlaybookShell } from "@/layouts/playbook-shell";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { outreachTracks } from "@/lib/playbook/harika-playbook";

export default function OutreachPage() {
  return (
    <PlaybookShell
      eyebrow="Outreach / Community access"
      title="A relationship plan that is measurable and clinically appropriate."
      description="Outreach is treated as education and patient access work, not a promise of medical outcomes. Each pathway starts small, records consent and measures qualified referrals."
    >
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionHeader title="90-day outreach plan" description="Structured relationships scoped to the current Hyderabad tenant" action={<StatusIndicator label="3 pathways" tone="info" />} />
          <div className="space-y-4">
            {outreachTracks.map((track) => (
              <article key={track.audience} className="rounded-xl border bg-background p-4">
                <div className="mb-4 flex items-center gap-3">
                  <Users className="size-5 text-primary" />
                  <h2 className="font-semibold">{track.audience}</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Period label="First 30 days" content={track.first30} />
                  <Period label="Days 31-60" content={track.next60} />
                  <Period label="Days 61-90" content={track.next90} />
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <Handshake className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Partner record required</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Track contact, purpose, consent, follow-up date, materials shared and attributable referral outcomes before scaling any outreach partnership.</p>
          </Panel>
          <Panel className="p-5">
            <Route className="size-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Success measure</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Measure appropriate appointments and educational participation, not just attendance or message reach.</p>
          </Panel>
        </div>
      </div>
    </PlaybookShell>
  );
}

function Period({ label, content }: { label: string; content: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6">{content}</p>
    </div>
  );
}
