import { RoleHubPage } from "@/workspaces/role-hub-page";
import { WorkspaceShell } from "@/layouts/workspace-shell";

export const dynamic = "force-dynamic";

export default function StaffPage() {
  return (
    <WorkspaceShell
      role="staff"
      section="Tasks"
      title="Staff execution workspace"
      subtitle="Focused tasks, requests, uploads, and handoffs for clinic operations."
    >
      <RoleHubPage role="staff" />
    </WorkspaceShell>
  );
}
