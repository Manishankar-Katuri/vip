import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionWorkflowsPage() {
  return <OperationalWorkspacePage role="production" section="workflows" />;
}
