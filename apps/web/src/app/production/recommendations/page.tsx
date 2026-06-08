import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionRecommendationsPage() {
  return <OperationalWorkspacePage role="production" section="recommendations" />;
}
