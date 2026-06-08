"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type BrandVoice = {
  tone:string;
  style:string;
  audience:string;
  messaging:string;
};

export default function AdminBrandVoicePage() {
  const { activeHospital } = useHospital();
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    tone:"",
    style:"",
    audience:"",
    messaging:""
  });

  useEffect(() => {
    if (!activeHospital) return;

    void apiFetch<BrandVoice>("/admin/brand-voice").then(setBrandVoice);
  }, [activeHospital]);

  async function save() {
    setBrandVoice(
      await apiFetch<BrandVoice>("/admin/brand-voice", {
        method:"PATCH",
        body:JSON.stringify(brandVoice)
      })
    );
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_BRAND_VOICE}>
      <section className="max-w-4xl space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Brand Voice</h2>
          <p className="mt-1 text-sm text-slate-600">
            Store tone, style, audience, and messaging defaults for the active hospital.
          </p>
        </div>
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Field label="Tone" value={brandVoice.tone} onChange={(tone) => setBrandVoice({ ...brandVoice, tone })} />
          <Field label="Style" value={brandVoice.style} onChange={(style) => setBrandVoice({ ...brandVoice, style })} />
          <Field label="Audience" value={brandVoice.audience} onChange={(audience) => setBrandVoice({ ...brandVoice, audience })} />
          <label className="grid gap-2 text-sm font-medium">
            Messaging
            <textarea
              className="min-h-32 rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal"
              value={brandVoice.messaging}
              onChange={(event) => setBrandVoice({ ...brandVoice, messaging:event.target.value })}
            />
          </label>
          <div>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              Save brand voice
            </Button>
          </div>
        </div>
      </section>
    </PermissionGate>
  );
}

function Field({
  label,
  value,
  onChange
}:{
  label:string;
  value:string;
  onChange:(value:string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
