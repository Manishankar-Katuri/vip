import { getBusinessLocations } from "@/lib/acquisition/business-info";

export async function fetchGBPData() {
  const locations = await getBusinessLocations();
  return {
    source: "Google Business Profile API",
    measuredAt: new Date().toISOString(),
    locations,
    note: "Review and performance metrics are returned only when authorized GBP review access is available.",
  };
}
