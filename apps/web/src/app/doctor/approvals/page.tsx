import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function DoctorApprovalsPage() {
  return <OperationalWorkspacePage role="doctor" section="approvals" />;
}
