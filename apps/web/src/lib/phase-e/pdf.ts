import type { PdfExportRequest } from "./contracts";

export function normalizePdfExportRequest(input: PdfExportRequest): PdfExportRequest {
  return {
    ...input,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    summary: input.summary ?? "",
    kpis: input.kpis ?? [],
    insights: input.insights ?? [],
    recommendations: input.recommendations ?? [],
    actionPlan: input.actionPlan ?? [],
    evidenceSources: input.evidenceSources ?? [],
    sections: input.sections ?? [],
  };
}

export function defaultPdfFileName(input: Pick<PdfExportRequest, "pageType" | "title">) {
  const safeTitle = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${input.pageType}-${safeTitle || "report"}.pdf`;
}

