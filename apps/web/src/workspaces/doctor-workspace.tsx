import { KpiGrid, TrendCard } from "@/components/analytics/analytics-surfaces";
import { InsightSummary } from "@/components/intelligence/intelligence-surfaces";
import { ApprovalQueue } from "@/components/workflow/workflow-surfaces";
import { doctorData } from "@/demo-data/workspaces";
import { SurfaceReveal } from "@/design-system/motion";

export function DoctorWorkspace() {
  return (
    <SurfaceReveal>
      <div className="mx-auto max-w-5xl space-y-5">
        <KpiGrid metrics={doctorData.kpis} spacious />
        <InsightSummary>{doctorData.summary}</InsightSummary>
        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <ApprovalQueue approvals={doctorData.approvals} minimal />
          <TrendCard compact />
        </div>
      </div>
    </SurfaceReveal>
  );
}
