import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminTeamsPage() {
  return <OperationalWorkspacePage role="admin" section="teams" />;
}
