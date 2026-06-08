import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionAnalyticsPage() {
  return <OperationalWorkspacePage role="production" section="analytics" />;
}
