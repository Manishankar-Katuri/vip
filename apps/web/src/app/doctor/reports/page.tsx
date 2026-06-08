import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function DoctorReportsPage() {
  return <OperationalWorkspacePage role="doctor" section="reports" />;
}
