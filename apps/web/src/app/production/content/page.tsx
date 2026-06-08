import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionContentPage() {
  return <OperationalWorkspacePage role="production" section="content" />;
}
