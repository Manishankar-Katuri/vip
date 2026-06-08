import { StrategySubsectionPage } from "@/strategies/online-presence-strategy";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function AdminSEOStrategyPage() {
  const data = await getProductExperience();

  return <StrategySubsectionPage data={data} slug="seo-strategy" basePath="/admin/strategy" />;
}
