import { GBPStrategyPlanPage } from "@/strategies/gbp-strategy-plan";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function AdminGBPStrategyPage() {
  const data = await getProductExperience();

  return <GBPStrategyPlanPage data={data} basePath="/admin/strategy" />;
}
