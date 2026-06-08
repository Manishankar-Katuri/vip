import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function ProductionCalendarPage() {
  return <OperationalWorkspacePage role="production" section="calendar" />;
}
