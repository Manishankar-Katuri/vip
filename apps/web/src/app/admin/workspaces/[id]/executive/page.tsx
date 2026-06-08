"use client";

import { useParams } from "next/navigation";

import { WeeklyAnalysisReportPage } from "@/reporting/weekly-analysis-report-page";

export default function ExecutivePage() {
  const params = useParams<{ id: string }>();
  return <WeeklyAnalysisReportPage hospitalId={params?.id ?? ""} />;
}
