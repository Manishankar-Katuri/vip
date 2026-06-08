import { ContentStrategyRoute } from "@/content-strategy/content-strategy-route";

export const dynamic = "force-dynamic";

export default async function AdminContentStrategyPage() {
  return <ContentStrategyRoute />;
}
