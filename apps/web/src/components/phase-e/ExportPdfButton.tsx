"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PdfExportRequest } from "@/lib/phase-e";

const PdfDownloadButton = dynamic(
  () => import("./PdfDownloadButton").then((mod) => mod.PdfDownloadButton),
  {
    ssr: false,
    loading: () => (
      <Button type="button" variant="outline" disabled>
        <Download className="size-4" aria-hidden />
        Preparing
      </Button>
    ),
  }
);

export function ExportPdfButton({ request }: { request: PdfExportRequest }) {
  return <PdfDownloadButton request={request} />;
}

