"use client";

import {
  FieldChip,
  InsightCard,
  IntelligenceShell,
  PrivacyStatusBadge,
  SectionHeader,
  StatusPill,
} from "@/components/intelligence-os/system";
import { MessageSquareText, PhoneCall, ShieldCheck, UserRoundCheck } from "lucide-react";

const leads = [
  {
    name: "Patient H***",
    score: "94",
    source: "Instagram",
    action: "Send ENT consultation education message",
    message: "Share the sinus-care explainer and offer a privacy-safe callback window.",
    history: ["SMS opened", "Instagram saved post", "Call not attempted"],
    snippet: "Doctor-authored sinus warning signs guide",
  },
  {
    name: "Family contact A***",
    score: "87",
    source: "Google reviews",
    action: "Call with appointment availability",
    message: "Reference clinic hours and keep medical details out of the opening message.",
    history: ["Email clicked", "WhatsApp eligible", "Review page visited"],
    snippet: "Trust-building profile: ENT specialist credentials",
  },
  {
    name: "Lead R***",
    score: "79",
    source: "Website",
    action: "Send follow-up email",
    message: "Use the throat infection education template and invite a callback request.",
    history: ["Website form", "Email pending", "In-app note created"],
    snippet: "Educational FAQ: when to see an ENT doctor",
  },
];

export default function LeadsPage() {
  return (
    <IntelligenceShell
      activePath="/leads"
      title="Leads"
      subtitle="AI-prioritized outreach that keeps identity, channel history, and suggested messages privacy-safe by default."
    >
      <div className="grid gap-5">
        <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHeader icon={UserRoundCheck} title="AI-Prioritized Outreach" summary="Leads are ordered by urgency, source strength, and next safe action." />
            <PrivacyStatusBadge />
          </div>
        </section>

        <div className="grid gap-4">
          {leads.map((lead) => (
            <article key={lead.name} className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[160px_1fr_280px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#008080]">Priority score</p>
                  <p className="mt-2 text-5xl font-semibold text-[#000080]">{lead.score}</p>
                  <p className="mt-2 text-base font-semibold text-slate-700">{lead.name}</p>
                  <StatusPill tone="success">privacy-safe</StatusPill>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="info">{lead.source}</StatusPill>
                    <StatusPill tone="success">HIPAA-safe preview</StatusPill>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-[#17212f]">{lead.action}</h2>
                  <p className="mt-2 text-base leading-7 text-slate-600">{lead.message}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {lead.history.map((item) => (
                      <FieldChip key={item} label="Channel" value={item} />
                    ))}
                  </div>
                </div>

                <InsightCard eyebrow="Content to send" title={lead.snippet} summary="Use approved, authoritative education content instead of personal medical detail.">
                  <p>Audit logs and full contact records are hidden from this preview and available only in governed detail workflows.</p>
                </InsightCard>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#008080] px-5 text-base font-semibold text-white">
                  <MessageSquareText className="size-5" aria-hidden />
                  Send safe message
                </button>
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#c9dbda] bg-white px-5 text-base font-semibold text-[#000080]">
                  <PhoneCall className="size-5" aria-hidden />
                  Schedule call
                </button>
                <span className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#f3fbfa] px-4 text-base font-semibold text-[#006767]">
                  <ShieldCheck className="size-5" aria-hidden />
                  Masked identifier
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </IntelligenceShell>
  );
}
