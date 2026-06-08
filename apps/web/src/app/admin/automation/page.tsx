import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminAutomationPage() {
  return <OperationalWorkspacePage role="admin" section="automation" />;
}
