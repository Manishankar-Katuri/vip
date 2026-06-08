import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminAiPage() {
  return <OperationalWorkspacePage role="admin" section="ai" />;
}
