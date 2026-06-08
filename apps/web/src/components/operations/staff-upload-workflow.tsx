"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Upload } from "lucide-react";
import { Button, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { useOperationalStore } from "@/state/operational-store";

export function StaffUploadWorkflow() {
  const [files, setFiles] = useState<Array<{ name: string; type: string }>>([]);
  const [submitted, setSubmitted] = useState(false);
  const submitUpload = useOperationalStore((state) => state.submitUpload);

  return (
    <Panel className="max-w-xl p-5">
      <SectionHeader title="Provide approved assets" description="Files enter production review only after submission is connected." />
      <label className="block cursor-pointer rounded-xl border border-dashed border-primary/25 bg-info/30 p-8 text-center focus-within:ring-2 focus-within:ring-ring">
        <Upload className="mx-auto size-6 text-primary" />
        <span className="mt-3 block text-sm font-medium">Select clinic materials</span>
        <span className="mt-1 block text-sm text-muted-foreground">PDF, JPG or PNG up to 20 MB</span>
        <span className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Choose files
        </span>
        <input
          className="sr-only"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => ({ name: file.name, type: file.type || "application/octet-stream" })))}
        />
      </label>
      <div className="mt-4 rounded-xl border bg-background p-4">
        {files.length ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <p className="text-sm font-medium">{files.length} file{files.length === 1 ? "" : "s"} staged for review</p>
            </div>
            <div className="mt-3 space-y-2">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between gap-3 rounded-lg bg-muted/55 px-3 py-2 text-sm">
                  <span className="truncate">{file.name}</span>
                  <StatusIndicator label="Local draft" tone="neutral" />
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-4"
              disabled={submitted}
              onClick={() => {
                files.forEach((file) => submitUpload(file.name, file.type));
                setSubmitted(true);
              }}
            >
              {submitted ? "Submitted for production review" : "Submit uploads for review"}
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileUp className="size-4" /> No files selected.
          </p>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Media metadata, review status, and campaign relationships are retained. File binary storage is prepared for a configured object-store provider.
      </p>
    </Panel>
  );
}
