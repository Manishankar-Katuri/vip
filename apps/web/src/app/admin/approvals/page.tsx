import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminApprovalsPage() {
  return <OperationalWorkspacePage role="admin" section="approvals" />;
}
