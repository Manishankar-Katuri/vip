import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminWorkflowsPage() {
  return <OperationalWorkspacePage role="admin" section="workflows" />;
}
