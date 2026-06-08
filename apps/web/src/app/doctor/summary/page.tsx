import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function DoctorSummaryPage() {
  return <OperationalWorkspacePage role="doctor" section="summary" />;
}
