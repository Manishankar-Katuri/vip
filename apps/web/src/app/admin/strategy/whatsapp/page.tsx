import { StrategySubsectionPage } from "@/strategies/online-presence-strategy";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppStrategyPage() {
  const data = await getProductExperience();

  return <StrategySubsectionPage data={data} slug="whatsapp-community-strategy" basePath="/admin/strategy" />;
}
