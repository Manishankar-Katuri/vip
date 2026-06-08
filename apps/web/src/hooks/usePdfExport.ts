"use client";

import { useMemo } from "react";

import { normalizePdfExportRequest, type PdfExportRequest } from "@/lib/phase-e";

export function usePdfExport(request: PdfExportRequest) {
  return useMemo(() => normalizePdfExportRequest(request), [request]);
}

