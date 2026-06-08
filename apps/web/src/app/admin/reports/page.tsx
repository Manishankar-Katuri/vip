import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return <OperationalWorkspacePage role="admin" section="reports" />;
}
