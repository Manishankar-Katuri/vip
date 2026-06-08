import { StrategySubsectionPage } from "@/strategies/online-presence-strategy";
import { GBPStrategyPlanPage } from "@/strategies/gbp-strategy-plan";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function StrategySubsectionRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProductExperience();

  if (slug === "gbp-strategy") {
    return <GBPStrategyPlanPage data={data} basePath="/strategy" />;
  }

  return <StrategySubsectionPage data={data} slug={slug} />;
}
