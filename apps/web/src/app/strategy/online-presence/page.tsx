import { StrategyOverviewPage } from "@/strategies/online-presence-strategy";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function SharedOnlinePresenceStrategyPage() {
  const data = await getProductExperience();

  return <StrategyOverviewPage data={data} />;
}
