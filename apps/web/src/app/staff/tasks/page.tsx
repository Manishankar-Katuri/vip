import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function StaffTasksPage() {
  return <OperationalWorkspacePage role="staff" section="tasks" />;
}
