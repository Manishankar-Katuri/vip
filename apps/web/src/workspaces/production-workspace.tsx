import { KpiGrid, TrendCard } from "@/components/analytics/analytics-surfaces";
import { AnomalyCard, RecommendationCards } from "@/components/intelligence/intelligence-surfaces";
import { ApprovalQueue, AutomationStatus, ExecutionTimeline } from "@/components/workflow/workflow-surfaces";
import { productionData } from "@/demo-data/workspaces";
import { SurfaceReveal } from "@/design-system/motion";

export function ProductionWorkspace() {
  return (
    <SurfaceReveal>
      <div className="space-y-5">
        <KpiGrid metrics={productionData.kpis} />
        <AnomalyCard />
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5">
            <ApprovalQueue approvals={productionData.approvals} />
            <ExecutionTimeline items={productionData.activity} />
          </div>
          <div className="space-y-5">
            <RecommendationCards recommendations={productionData.recommendations} />
            <AutomationStatus />
          </div>
        </div>
        <TrendCard compact />
      </div>
    </SurfaceReveal>
  );
}
