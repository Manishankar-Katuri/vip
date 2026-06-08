"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Eye,
  Pencil,
  Plug,
  Plus,
  Power,
  Save,
  Trash2
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type Hospital = {
  id:string;
  name:string;
  hospitalName:string;
  slug:string;
  hospitalCode:string | null;
  domain:string | null;
  industryType:string | null;
  contactEmail:string | null;
  specialty:string | null;
  city:string | null;
  status:"CREATING" | "ACTIVE" | "PAUSED";
  connectedApisCount:number;
  lastSyncAt:string | null;
  disabledAt:string | null;
  createdAt:string;
  updatedAt:string;
};

type Integration = {
  id:string;
  hospitalId:string;
  provider:string;
  apiName:string;
  baseUrl:string | null;
  credentials:Record<string, string>;
  settings:Record<string, unknown>;
  status:"PENDING" | "CONNECTED" | "NEEDS_ATTENTION" | "DISABLED";
  lastValidatedAt:string | null;
  lastTestedAt:string | null;
  lastSyncAt:string | null;
  lastError:string | null;
  createdAt:string;
  updatedAt:string;
};

type HospitalForm = {
  name:string;
  hospitalCode:string;
  domain:string;
  industryType:string;
  contactEmail:string;
  specialty:string;
  city:string;
  status:"CREATING" | "ACTIVE" | "PAUSED";
};

type IntegrationForm = {
  provider:string;
  apiName:string;
  baseUrl:string;
  apiKey:string;
  apiSecret:string;
  accessToken:string;
  refreshToken:string;
  settings:string;
};

const emptyHospitalForm:HospitalForm = {
  name:"",
  hospitalCode:"",
  domain:"",
  industryType:"Healthcare",
  contactEmail:"",
  specialty:"",
  city:"",
  status:"ACTIVE"
};

const emptyIntegrationForm:IntegrationForm = {
  provider:"google-business",
  apiName:"Google Business Profile",
  baseUrl:"",
  apiKey:"",
  apiSecret:"",
  accessToken:"",
  refreshToken:"",
  settings:"{}"
};

const providerOptions = [
  ["google-business", "Google Business Profile"],
  ["google-analytics", "Google Analytics"],
  ["meta", "Meta"],
  ["linkedin", "LinkedIn"],
  ["youtube", "YouTube"],
  ["crm", "CRM API"],
  ["website", "Website API"],
  ["custom", "Custom API"]
] as const;

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [viewHospital, setViewHospital] = useState<Hospital | null>(null);
  const [configHospital, setConfigHospital] = useState<Hospital | null>(null);
  const [hospitalForm, setHospitalForm] = useState<HospitalForm>(emptyHospitalForm);
  const [hospitalDialogOpen, setHospitalDialogOpen] = useState(false);

  const loadHospitals = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!getAccessToken()) {
        setHospitals([]);
        setIsPreview(false);
        return;
      }

      setHospitals(await apiFetch<Hospital[]>("/admin/hospitals"));
      setIsPreview(false);
    } catch {
      setHospitals([]);
      setIsPreview(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadHospitals();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadHospitals]);

  function openCreateHospital() {
    setEditingHospital(null);
    setHospitalForm(emptyHospitalForm);
    setHospitalDialogOpen(true);
  }

  function openEditHospital(hospital:Hospital) {
    setEditingHospital(hospital);
    setHospitalForm({
      name:hospital.name,
      hospitalCode:hospital.hospitalCode ?? "",
      domain:hospital.domain ?? "",
      industryType:hospital.industryType ?? "",
      contactEmail:hospital.contactEmail ?? "",
      specialty:hospital.specialty ?? "",
      city:hospital.city ?? "",
      status:hospital.status
    });
    setHospitalDialogOpen(true);
  }

  async function saveHospital() {
    if (isPreview || !getAccessToken()) {
      setMessage("Preview mode is read-only. Connect admin authentication to save hospital changes.");
      setHospitalDialogOpen(false);
      return;
    }

    setMessage(null);
    const payload = {
      name:hospitalForm.name,
      hospitalCode:hospitalForm.hospitalCode || undefined,
      domain:hospitalForm.domain || undefined,
      industryType:hospitalForm.industryType || undefined,
      contactEmail:hospitalForm.contactEmail || undefined,
      specialty:hospitalForm.specialty || undefined,
      city:hospitalForm.city || undefined,
      status:hospitalForm.status
    };

    if (editingHospital) {
      await apiFetch(`/admin/hospitals/${editingHospital.id}`, {
        method:"PATCH",
        body:JSON.stringify(payload)
      });
      setMessage("Hospital updated.");
    } else {
      await apiFetch("/admin/hospitals", {
        method:"POST",
        body:JSON.stringify(payload)
      });
      setMessage("Hospital workspace created.");
    }

    setHospitalDialogOpen(false);
    await loadHospitals();
  }

  async function toggleHospital(hospital:Hospital) {
    if (isPreview || !getAccessToken()) {
      setMessage("Preview mode is read-only. Connect admin authentication to change hospital status.");
      return;
    }

    await apiFetch(`/admin/hospitals/${hospital.id}`, {
      method:"PATCH",
      body:JSON.stringify({
        disabled:!hospital.disabledAt,
        status:hospital.disabledAt ? "ACTIVE" : "PAUSED"
      })
    });
    await loadHospitals();
  }

  async function deleteHospital(hospital:Hospital) {
    if (isPreview || !getAccessToken()) {
      setMessage("Preview mode is read-only. Connect admin authentication to delete hospitals.");
      return;
    }

    await apiFetch(`/admin/hospitals/${hospital.id}`, {
      method:"DELETE"
    });
    setMessage("Hospital deleted or disabled because dependent records exist.");
    await loadHospitals();
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_HOSPITALS}>
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Hospital Management</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage hospital workspaces and live API configuration without runtime env edits.
          </p>
        </div>
          <Button onClick={openCreateHospital} disabled={isPreview}>
            <Plus className="h-4 w-4" />
            Add Hospital
          </Button>
        </div>

        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No live hospital workspaces are available for the current session.
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital Name</TableHead>
                <TableHead>Hospital ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Connected APIs</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    Loading hospitals...
                  </TableCell>
                </TableRow>
              ) : hospitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    No hospitals have been created yet.
                  </TableCell>
                </TableRow>
              ) : hospitals.map((hospital) => (
                <TableRow key={hospital.id}>
                  <TableCell>
                    <div className="font-medium">{hospital.name}</div>
                    <div className="text-xs text-slate-500">{hospital.contactEmail || hospital.domain || "No contact configured"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{hospital.hospitalCode || hospital.slug}</div>
                    <div className="font-mono text-[11px] text-slate-400">{hospital.id}</div>
                  </TableCell>
                  <TableCell>
                    <HospitalStatusBadge hospital={hospital} />
                  </TableCell>
                  <TableCell>{hospital.connectedApisCount}</TableCell>
                  <TableCell>{formatDateTime(hospital.lastSyncAt)}</TableCell>
                  <TableCell>{formatDate(hospital.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewHospital(hospital)}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditHospital(hospital)} disabled={isPreview}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfigHospital(hospital)}>
                        <Plug className="h-4 w-4" />
                        Configure APIs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleHospital(hospital)} disabled={isPreview}>
                        <Power className="h-4 w-4" />
                        {hospital.disabledAt ? "Enable" : "Disable"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteHospital(hospital)} disabled={isPreview}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <HospitalFormDialog
          open={hospitalDialogOpen}
          editingHospital={editingHospital}
          form={hospitalForm}
          setForm={setHospitalForm}
          onOpenChange={setHospitalDialogOpen}
          onSave={saveHospital}
        />

        <HospitalViewDialog
          hospital={viewHospital}
          onOpenChange={(open) => {
            if (!open) setViewHospital(null);
          }}
        />

        <IntegrationDialog
          hospital={configHospital}
          onOpenChange={(open) => {
            if (!open) setConfigHospital(null);
          }}
          onChanged={loadHospitals}
          isPreview={isPreview}
        />
      </section>
    </PermissionGate>
  );
}

function HospitalFormDialog({
  open,
  editingHospital,
  form,
  setForm,
  onOpenChange,
  onSave
}:{
  open:boolean;
  editingHospital:Hospital | null;
  form:HospitalForm;
  setForm:React.Dispatch<React.SetStateAction<HospitalForm>>;
  onOpenChange:(open:boolean) => void;
  onSave:() => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingHospital ? "Edit Hospital" : "Add Hospital"}</DialogTitle>
          <DialogDescription>
            Create the hospital workspace and default admin foundation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Hospital Name" value={form.name} onChange={(value) => setForm({ ...form, name:value })} />
          <Field label="Hospital Code" value={form.hospitalCode} onChange={(value) => setForm({ ...form, hospitalCode:value })} />
          <Field label="Domain" value={form.domain} onChange={(value) => setForm({ ...form, domain:value })} placeholder="https://hospital.example" />
          <Field label="Industry Type" value={form.industryType} onChange={(value) => setForm({ ...form, industryType:value })} />
          <Field label="Contact Email" value={form.contactEmail} onChange={(value) => setForm({ ...form, contactEmail:value })} />
          <Field label="Specialty" value={form.specialty} onChange={(value) => setForm({ ...form, specialty:value })} />
          <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city:value })} />
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Status</span>
            <select
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              value={form.status}
              onChange={(event) => setForm({ ...form, status:event.target.value as HospitalForm["status"] })}
            >
              <option value="CREATING">Creating</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HospitalViewDialog({
  hospital,
  onOpenChange
}:{
  hospital:Hospital | null;
  onOpenChange:(open:boolean) => void;
}) {
  return (
    <Dialog open={Boolean(hospital)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hospital?.name ?? "Hospital"}</DialogTitle>
          <DialogDescription>Workspace configuration summary.</DialogDescription>
        </DialogHeader>
        {hospital && (
          <dl className="grid gap-3 text-sm">
            {[
              ["Hospital ID", hospital.id],
              ["Hospital Code", hospital.hospitalCode ?? "Not set"],
              ["Domain", hospital.domain ?? "Not set"],
              ["Industry Type", hospital.industryType ?? "Not set"],
              ["Contact Email", hospital.contactEmail ?? "Not set"],
              ["Status", hospital.disabledAt ? "Disabled" : hospital.status],
              ["Connected APIs", String(hospital.connectedApisCount)],
              ["Last Sync", formatDateTime(hospital.lastSyncAt)]
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

function IntegrationDialog({
  hospital,
  onOpenChange,
  onChanged,
  isPreview
}:{
  hospital:Hospital | null;
  onOpenChange:(open:boolean) => void;
  onChanged:() => Promise<void>;
  isPreview:boolean;
}) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [form, setForm] = useState<IntegrationForm>(emptyIntegrationForm);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedMaskedCredentials = useMemo(
    () => selected?.credentials ?? {},
    [selected]
  );

  const loadIntegrations = useCallback(async () => {
    if (!hospital) return;
    if (isPreview || !getAccessToken()) {
      setIntegrations(createPreviewIntegrations(hospital.id));
      return;
    }

    try {
      const data = await apiFetch<Integration[]>(`/admin/hospitals/${hospital.id}/integrations`);
      setIntegrations(data);
    } catch {
      setIntegrations(createPreviewIntegrations(hospital.id));
    }
  }, [hospital, isPreview]);

  useEffect(() => {
    if (!hospital) return;

    const timeout = window.setTimeout(() => {
      void loadIntegrations();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [hospital, loadIntegrations]);

  function resetForm() {
    setSelected(null);
    setForm(emptyIntegrationForm);
    setStatusMessage(null);
  }

  function editIntegration(integration:Integration) {
    setSelected(integration);
    setForm({
      provider:integration.provider,
      apiName:integration.apiName,
      baseUrl:integration.baseUrl ?? "",
      apiKey:"",
      apiSecret:"",
      accessToken:"",
      refreshToken:"",
      settings:JSON.stringify(integration.settings ?? {}, null, 2)
    });
    setStatusMessage(null);
  }

  async function saveIntegration() {
    if (!hospital) return;
    if (isPreview || !getAccessToken()) {
      setStatusMessage("Preview mode is read-only. Connect admin authentication to save integrations.");
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const settings = parseSettings(form.settings);
      const body = {
        provider:form.provider,
        apiName:form.apiName,
        baseUrl:form.baseUrl || undefined,
        credentials:{
          apiKey:form.apiKey || undefined,
          apiSecret:form.apiSecret || undefined,
          accessToken:form.accessToken || undefined,
          refreshToken:form.refreshToken || undefined
        },
        settings
      };

      if (selected) {
        await apiFetch(`/admin/hospitals/${hospital.id}/integrations/${selected.id}`, {
          method:"PATCH",
          body:JSON.stringify(body)
        });
      } else {
        await apiFetch(`/admin/hospitals/${hospital.id}/integrations`, {
          method:"POST",
          body:JSON.stringify(body)
        });
      }

      setStatusMessage("Integration saved and tested.");
      resetForm();
      await loadIntegrations();
      await onChanged();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Integration save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function testIntegration(integration:Integration) {
    if (!hospital) return;
    if (isPreview || !getAccessToken()) {
      setStatusMessage("Preview mode: integration tests require real admin authentication.");
      return;
    }

    setStatusMessage("Testing connection...");
    const result = await apiFetch<{ ok:boolean; message:string }>(
      `/admin/hospitals/${hospital.id}/integrations/${integration.id}/test`,
      {
        method:"POST",
        body:JSON.stringify({})
      }
    );
    setStatusMessage(result.message);
    await loadIntegrations();
  }

  async function deleteIntegration(integration:Integration) {
    if (!hospital) return;
    if (isPreview || !getAccessToken()) {
      setStatusMessage("Preview mode is read-only. Connect admin authentication to delete integrations.");
      return;
    }

    await apiFetch(`/admin/hospitals/${hospital.id}/integrations/${integration.id}`, {
      method:"DELETE"
    });
    setStatusMessage("Integration removed.");
    resetForm();
    await loadIntegrations();
    await onChanged();
  }

  return (
    <Dialog open={Boolean(hospital)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Configure APIs</DialogTitle>
          <DialogDescription>
            {hospital?.name} integrations are stored in encrypted database config and resolved at runtime.
          </DialogDescription>
        </DialogHeader>
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No live integrations are available for the current session.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Connected APIs</h3>
              <Button variant="outline" size="sm" onClick={resetForm} disabled={isPreview}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
            <div className="space-y-2">
              {integrations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  No integrations configured.
                </div>
              ) : integrations.map((integration) => (
                <article key={integration.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{integration.apiName}</div>
                      <div className="text-xs text-slate-500">{integration.provider}</div>
                    </div>
                    <IntegrationStatusBadge status={integration.status} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Last tested: {formatDateTime(integration.lastTestedAt)}
                  </div>
                  {integration.lastError && (
                    <div className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {integration.lastError}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="xs" onClick={() => editIntegration(integration)}>Edit</Button>
                    <Button variant="outline" size="xs" onClick={() => testIntegration(integration)} disabled={isPreview}>
                      <Activity className="h-3 w-3" />
                      Test
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => deleteIntegration(integration)} disabled={isPreview}>Delete</Button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold">{selected ? "Edit Integration" : "Add Integration"}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700">Provider</span>
                <select
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                  value={form.provider}
                  onChange={(event) => setForm({
                    ...form,
                    provider:event.target.value,
                    apiName:providerOptions.find(([value]) => value === event.target.value)?.[1] ?? form.apiName
                  })}
                >
                  {providerOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <Field label="API Name" value={form.apiName} onChange={(value) => setForm({ ...form, apiName:value })} />
              <Field label="Base URL" value={form.baseUrl} onChange={(value) => setForm({ ...form, baseUrl:value })} placeholder="https://api.example.com/health" />
              <SecretField label="API Key" value={form.apiKey} masked={selectedMaskedCredentials.apiKey} onChange={(value) => setForm({ ...form, apiKey:value })} />
              <SecretField label="API Secret" value={form.apiSecret} masked={selectedMaskedCredentials.apiSecret} onChange={(value) => setForm({ ...form, apiSecret:value })} />
              <SecretField label="Access Token" value={form.accessToken} masked={selectedMaskedCredentials.accessToken} onChange={(value) => setForm({ ...form, accessToken:value })} />
              <SecretField label="Refresh Token" value={form.refreshToken} masked={selectedMaskedCredentials.refreshToken} onChange={(value) => setForm({ ...form, refreshToken:value })} />
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Additional Configuration JSON</span>
              <textarea
                className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
                value={form.settings}
                onChange={(event) => setForm({ ...form, settings:event.target.value })}
              />
            </label>
            {statusMessage && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {statusMessage}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Reset</Button>
              <Button onClick={saveIntegration} disabled={isPreview || saving || !form.apiName.trim()}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Validate, Test, Save"}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}:{
  label:string;
  value:string;
  onChange:(value:string) => void;
  placeholder?:string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SecretField({
  label,
  value,
  masked,
  onChange
}:{
  label:string;
  value:string;
  masked?:string;
  onChange:(value:string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <Input
        type="password"
        value={value}
        placeholder={masked ? `${masked} (enter to replace)` : label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function HospitalStatusBadge({ hospital }:{ hospital:Hospital }) {
  if (hospital.disabledAt) {
    return <Badge variant="destructive">Disabled</Badge>;
  }

  if (hospital.status === "ACTIVE") {
    return <Badge>Active</Badge>;
  }

  return <Badge variant="outline">{hospital.status}</Badge>;
}

function IntegrationStatusBadge({ status }:{ status:Integration["status"] }) {
  if (status === "CONNECTED") return <Badge>Connected</Badge>;
  if (status === "NEEDS_ATTENTION") return <Badge variant="destructive">Needs attention</Badge>;
  if (status === "DISABLED") return <Badge variant="outline">Disabled</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function createPreviewIntegrations(
  hospitalId:string
):Integration[] {
  const now = new Date("2026-06-01T12:00:00+05:30").toISOString();

  return [
    {
      id:`${hospitalId}-gbp-preview`,
      hospitalId,
      provider:"google-business",
      apiName:"Google Business Profile",
      baseUrl:"https://mybusinessbusinessinformation.googleapis.com",
      credentials:{ accessToken:"sk_live_masked" },
      settings:{ locationGroup:"preview" },
      status:"CONNECTED",
      lastValidatedAt:now,
      lastTestedAt:now,
      lastSyncAt:now,
      lastError:null,
      createdAt:now,
      updatedAt:now
    },
    {
      id:`${hospitalId}-meta-preview`,
      hospitalId,
      provider:"meta",
      apiName:"Meta Insights",
      baseUrl:"https://graph.facebook.com",
      credentials:{ accessToken:"masked" },
      settings:{ page:"preview" },
      status:"PENDING",
      lastValidatedAt:null,
      lastTestedAt:null,
      lastSyncAt:null,
      lastError:null,
      createdAt:now,
      updatedAt:now
    }
  ];
}

function parseSettings(value:string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error("Additional configuration must be valid JSON.");
  }
}

function formatDate(value:string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", { dateStyle:"medium" }).format(new Date(value));
}

function formatDateTime(value:string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle:"medium",
    timeStyle:"short"
  }).format(new Date(value));
}
