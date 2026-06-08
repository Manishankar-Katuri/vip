import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function StaffRequestsPage() {
  return <OperationalWorkspacePage role="staff" section="requests" />;
}
