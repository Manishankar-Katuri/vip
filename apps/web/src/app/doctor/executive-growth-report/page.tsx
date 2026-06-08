import { SourceNotice } from "@/components/operations/operational-surfaces";
import { getProductExperience } from "@/lib/product-experience";
import { ExecutiveGrowthReporting } from "@/reporting/executive-growth-reporting";

export const dynamic = "force-dynamic";

export default async function DoctorExecutiveGrowthReportPage() {
  const data = await getProductExperience();

  return (
    <div className="space-y-5">
      <SourceNotice data={data} />
      <ExecutiveGrowthReporting role="doctor" data={data} />
    </div>
  );
}
