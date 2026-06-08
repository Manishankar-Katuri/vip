import { WorkflowRunDetail } from "@/components/workflows/workflow-visualizer";

export const dynamic = "force-dynamic";

type WorkflowRunPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function WorkflowRunPage({ params }: WorkflowRunPageProps) {
  const { runId } = await params;

  return <WorkflowRunDetail runId={runId} />;
}
