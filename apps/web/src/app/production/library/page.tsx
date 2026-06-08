import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionLibraryPage() {
  return <OperationalWorkspacePage role="production" section="library" />;
}
