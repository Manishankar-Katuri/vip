import { Upload, CheckCircle2 } from "lucide-react";
import { KpiGrid } from "@/components/analytics/analytics-surfaces";
import { ApprovalQueue, ExecutionTimeline } from "@/components/workflow/workflow-surfaces";
import { AlertBanner, Button, Panel, SectionHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/design-system/primitives";
import { SurfaceReveal } from "@/design-system/motion";
import { staffData } from "@/demo-data/workspaces";

export function StaffWorkspace() {
  return (
    <SurfaceReveal>
      <div className="space-y-5">
        <KpiGrid metrics={staffData.kpis} spacious />
        <AlertBanner
          title="One quick confirmation needed"
          message="Please confirm weekend consultation hours before the patient FAQ is published."
          tone="warning"
        />
        <Tabs defaultValue="tasks" className="flex-col gap-4">
          <TabsList className="min-h-11">
            <TabsTrigger value="tasks" className="min-h-9 px-4">Today</TabsTrigger>
            <TabsTrigger value="uploads" className="min-h-9 px-4">Uploads</TabsTrigger>
          </TabsList>
          <TabsContent value="tasks" className="mt-4 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <ApprovalQueue approvals={staffData.approvals} />
            <ExecutionTimeline items={staffData.activity} />
          </TabsContent>
          <TabsContent value="uploads" className="mt-4">
            <Panel className="p-5">
              <SectionHeader title="Document uploads" description="Add approved photos or patient education material" />
              <div className="rounded-xl border border-dashed border-primary/25 bg-info/30 p-8 text-center">
                <Upload className="mx-auto size-6 text-primary" />
                <p className="mt-3 text-sm font-medium">Upload clinic materials</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF, JPG or PNG up to 20 MB</p>
                <Button className="mt-4" size="lg">Choose files</Button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-success-foreground">
                <CheckCircle2 className="size-4" /> Four uploads verified today
              </p>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </SurfaceReveal>
  );
}
