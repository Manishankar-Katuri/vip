import { StrategySubsectionPage } from "@/strategies/online-presence-strategy";
import { GBPStrategyPlanPage } from "@/strategies/gbp-strategy-plan";
import { getProductExperience } from "@/lib/product-experience";

export const dynamic = "force-dynamic";

const legacyRoutes: Record<string, string> = {
  "google-business-profile": "gbp-strategy",
  seo: "seo-strategy",
  "reviews-reputation": "review-strategy",
  "social-presence": "social-presence-strategy",
  "whatsapp-community": "whatsapp-community-strategy",
  "competitor-gap": "competitor-gap-strategy",
  "conversion-path": "conversion-path-strategy",
  "positioning-trust": "positioning-trust-strategy",
};

export default async function OnlinePresencePriorityRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProductExperience();
  const strategySlug = legacyRoutes[slug] ?? slug;

  if (strategySlug === "gbp-strategy") {
    return <GBPStrategyPlanPage data={data} basePath="/strategy" />;
  }

  return <StrategySubsectionPage data={data} slug={strategySlug} />;
}
