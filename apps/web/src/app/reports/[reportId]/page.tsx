import { ReportDetail } from "@/components/reports/report-system";

export const dynamic = "force-dynamic";

type ReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { reportId } = await params;

  return <ReportDetail reportId={reportId} />;
}
