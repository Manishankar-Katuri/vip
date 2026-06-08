"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { Button } from "@/design-system/primitives";

type Field = { name: string; label: string };

const reportFields: Field[] = [
  { name: "accuracy", label: "Accuracy" },
  { name: "relevance", label: "Relevance" },
  { name: "actionability", label: "Actionability" },
];

const contentFields: Field[] = [
  { name: "hookQuality", label: "Hook" },
  { name: "scriptQuality", label: "Script" },
  { name: "ctaQuality", label: "CTA" },
  { name: "brandAlignment", label: "Brand" },
];

export function QualityReviewForm({
  workspaceId,
  executionId,
  targetType,
  targetId,
}: {
  workspaceId: string;
  executionId: string;
  targetType: "REPORT" | "CONTENT_PACKAGE";
  targetId: string;
}) {
  const router = useRouter();
  const fields = targetType === "REPORT" ? reportFields : contentFields;
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    const payload: Record<string, unknown> = { targetType, targetId, reviewerRole: "pilot_reviewer" };
    for (const field of fields) payload[field.name] = Number(formData.get(field.name) ?? 3);
    payload.comments = String(formData.get("comments") ?? "");
    try {
      await fetch(`/api/admin/workspaces/${workspaceId}/daily-growth-mission/${executionId}/quality-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={submit} className="mt-3 space-y-3 rounded-lg border bg-background p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="text-xs font-medium text-muted-foreground">
            {field.label}
            <input name={field.name} type="number" min={1} max={5} defaultValue={4} className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm text-foreground" />
          </label>
        ))}
      </div>
      <label className="block text-xs font-medium text-muted-foreground">
        Comments
        <textarea name="comments" rows={2} className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm text-foreground" />
      </label>
      <Button size="sm" disabled={saving}>
        <Save className="mr-2 size-4" aria-hidden />
        {saving ? "Saving" : "Save review"}
      </Button>
    </form>
  );
}
