"use client";

import {
  ApprovalActionBar,
  FieldChip,
  IntelligenceShell,
  SectionHeader,
  StatusPill,
} from "@/components/intelligence-os/system";
import { ClipboardCheck, ShieldAlert } from "lucide-react";

const approvals = [
  {
    item: "ENT awareness script",
    reason: "Scheduled campaign cannot proceed until clinical wording is confirmed.",
    risk: "Medium",
    compliance: "Privacy-safe, no patient identifier",
    recommendation: "Approve after checking the symptom disclaimer.",
  },
  {
    item: "Daily analytics report",
    reason: "Client-facing report is ready but needs owner confirmation.",
    risk: "Low",
    compliance: "Aggregated metrics only",
    recommendation: "Approve for internal distribution.",
  },
  {
    item: "WhatsApp outreach template",
    reason: "Lead follow-up is blocked until consent-safe language is confirmed.",
    risk: "High",
    compliance: "Requires consent check",
    recommendation: "Request changes before sending.",
  },
];

export default function ApprovalsPage() {
  return (
    <IntelligenceShell
      activePath="/approvals"
      title="Approvals"
      subtitle="A compliance-first queue with large approve/reject actions and clear risk context."
    >
      <div className="grid gap-5">
        <section className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader icon={ClipboardCheck} title="High-Velocity Compliance" summary="Each item explains why it matters, what the risk is, and the AI-recommended decision." />
        </section>

        <div className="grid gap-4">
          {approvals.map((approval) => (
            <article key={approval.item} className="rounded-lg border border-[#d7e5e4] bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={approval.risk === "High" ? "danger" : approval.risk === "Medium" ? "warning" : "success"}>
                      {approval.risk} risk
                    </StatusPill>
                    <StatusPill tone="info">{approval.compliance}</StatusPill>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-[#000080]">{approval.item}</h2>
                  <p className="mt-2 text-base leading-7 text-slate-700">{approval.reason}</p>
                  <div className="mt-4 rounded-lg border border-[#d7e5e4] bg-[#f8fbfb] p-3">
                    <div className="flex gap-3">
                      <ShieldAlert className="mt-1 size-5 shrink-0 text-[#008080]" aria-hidden />
                      <p className="text-base leading-7 text-slate-700">
                        <span className="font-semibold text-[#17212f]">AI recommendation:</span> {approval.recommendation}
                      </p>
                    </div>
                  </div>
                  <details className="mt-4 rounded-lg border border-[#d7e5e4] bg-white p-3">
                    <summary className="cursor-pointer text-base font-semibold text-[#000080]">Advanced audit trail</summary>
                    <p className="mt-2 text-base leading-7 text-slate-600">Full reviewer history, raw payloads, and immutable audit records remain hidden until expanded by an authorized user.</p>
                  </details>
                </div>

                <div className="grid content-start gap-3">
                  <FieldChip label="Item needing approval" value={approval.item} />
                  <FieldChip label="Privacy status" value={approval.compliance} />
                  <ApprovalActionBar label={approval.item} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </IntelligenceShell>
  );
}
