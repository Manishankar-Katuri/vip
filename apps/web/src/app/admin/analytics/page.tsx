import { OperationalWorkspacePage } from "@/workspaces/operational-pages";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return <OperationalWorkspacePage role="admin" section="analytics" />;
}
