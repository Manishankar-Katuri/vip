"use client";

import { useEffect, useState } from "react";
import { Plug } from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type Integration = {
  name:string;
  status:string;
};

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    void apiFetch<Integration[]>("/admin/integrations").then(setIntegrations);
  }, []);

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_INTEGRATIONS}>
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold">Integrations</h2>
          <p className="mt-1 text-sm text-slate-600">
            Read-only foundation for platform integration readiness.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => (
            <article
              key={integration.name}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Plug className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{integration.name}</h3>
                <Badge variant="outline">{integration.status}</Badge>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PermissionGate>
  );
}
