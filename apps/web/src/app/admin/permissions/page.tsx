"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCw,
  Search,
  ShieldCheck,
  Wand2
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch, getAccessToken } from "@/lib/api-client";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type UserRole
} from "@/permissions-core";

type RoleDescriptor = {
  id:UserRole;
  label:string;
  description:string;
};

type FeatureDescriptor = {
  key:Permission;
  label:string;
  module:string;
  description:string;
};

type PermissionMatrix = Record<UserRole, Record<Permission, boolean>>;

type PermissionMatrixResponse = {
  roles:RoleDescriptor[];
  features:FeatureDescriptor[];
  global:PermissionMatrix;
  overrides:PermissionMatrix | null;
  effective:PermissionMatrix;
};

const ROLE_TEMPLATE_LABELS:Record<UserRole, string> = {
  ADMIN:"Owner Template",
  PRODUCTION:"Marketing Template",
  DOCTOR:"Doctor Template",
  STAFF:"Operations Template"
};

const previewRoles:RoleDescriptor[] = [
  { id:"ADMIN", label:"Admin", description:"Full workspace administration" },
  { id:"DOCTOR", label:"Doctor", description:"Clinical review and executive visibility" },
  { id:"PRODUCTION", label:"Production", description:"Content and campaign operations" },
  { id:"STAFF", label:"Staff", description:"Lead handling and execution support" }
];

const previewFeatures:FeatureDescriptor[] = ALL_PERMISSIONS.map((permission) => ({
  key:permission,
  label:permission
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
  module:permission.split("_")[0] ?? "feature",
  description:`Preview permission for ${permission}.`
}));

const previewMatrix:PermissionMatrixResponse = {
  roles:previewRoles,
  features:previewFeatures,
  global:createMatrixFromRolePermissions(),
  overrides:null,
  effective:createMatrixFromRolePermissions()
};

export default function AdminPermissionsPage() {
  const {
    activeHospital,
    availableHospitals,
    refreshHospitals
  } = useHospital();
  const [scope, setScope] = useState("global");
  const [query, setQuery] = useState("");
  const [matrix, setMatrix] =
    useState<PermissionMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState("");

  const loadPermissions = useCallback(async (nextScope = scope) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiFetch<PermissionMatrixResponse>(
        `/admin/permissions?hospitalId=${encodeURIComponent(nextScope)}`
      );

      setMatrix(response);
      setIsPreview(false);
    } catch {
      setMatrix(previewMatrix);
      setIsPreview(true);
      setError("");
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPermissions(scope);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadPermissions, scope]);

  const filteredFeatures = useMemo(() => {
    if (!matrix) return [];

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return matrix.features;

    return matrix.features.filter((feature) =>
      [
        feature.label,
        feature.key,
        feature.module,
        feature.description
      ].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [matrix, query]);

  async function togglePermission(
    roleId:UserRole,
    featureKey:Permission,
    enabled:boolean
  ) {
    if (!matrix) return;
    if (isPreview || !getAccessToken()) {
      setError("Preview mode is read-only. Connect admin authentication to update permissions.");
      return;
    }

    const previous = matrix;

    setMatrix(applyLocalUpdate(matrix, roleId, featureKey, enabled));
    setError("");

    try {
      await apiFetch("/admin/permissions", {
        method:"PATCH",
        body:JSON.stringify({
          hospitalId:scope,
          roleId,
          featureKey,
          enabled
        })
      });
      await refreshHospitals();
    } catch {
      setMatrix(previous);
      setError("Could not update permission. The previous value was restored.");
    }
  }

  async function bulkUpdate(enabled:boolean) {
    if (!matrix || filteredFeatures.length === 0) return;
    if (isPreview || !getAccessToken()) {
      setError("Preview mode is read-only. Connect admin authentication to update permissions.");
      return;
    }

    const previous = matrix;
    const featureKeys = filteredFeatures.map((feature) => feature.key);
    const roleIds = matrix.roles.map((role) => role.id);

    setMatrix(
      applyLocalBulkUpdate(matrix, scope, roleIds, featureKeys, enabled)
    );
    setError("");

    try {
      await apiFetch("/admin/permissions/bulk", {
        method:"POST",
        body:JSON.stringify({
          hospitalId:scope,
          roleIds,
          featureKeys,
          enabled
        })
      });
      await refreshHospitals();
    } catch {
      setMatrix(previous);
      setError("Bulk update failed. The previous matrix was restored.");
    }
  }

  async function applyTemplate(roleId:UserRole) {
    if (!matrix) return;
    if (isPreview || !getAccessToken()) {
      setError("Preview mode is read-only. Connect admin authentication to apply templates.");
      return;
    }

    const previous = matrix;
    const allowed = new Set(ROLE_PERMISSIONS[roleId] ?? []);
    const featureKeys = matrix.features.map((feature) => feature.key);
    let next = matrix;

    for (const featureKey of featureKeys) {
      next = applyLocalUpdate(
        next,
        roleId,
        featureKey,
        allowed.has(featureKey)
      );
    }

    setMatrix(next);
    setError("");

    try {
      const enabledKeys = featureKeys.filter((featureKey) =>
        allowed.has(featureKey)
      );
      const disabledKeys = featureKeys.filter((featureKey) =>
        !allowed.has(featureKey) &&
        !isProtectedOwnerPermission(scope, roleId, featureKey)
      );
      const requests = [];

      if (enabledKeys.length > 0) {
        requests.push(
          apiFetch("/admin/permissions/bulk", {
            method:"POST",
            body:JSON.stringify({
              hospitalId:scope,
              roleIds:[roleId],
              featureKeys:enabledKeys,
              enabled:true
            })
          })
        );
      }

      if (disabledKeys.length > 0) {
        requests.push(
          apiFetch("/admin/permissions/bulk", {
            method:"POST",
            body:JSON.stringify({
              hospitalId:scope,
              roleIds:[roleId],
              featureKeys:disabledKeys,
              enabled:false
            })
          })
        );
      }

      await Promise.all(requests);
      await refreshHospitals();
      await loadPermissions(scope);
    } catch {
      setMatrix(previous);
      setError("Template update failed. The previous matrix was restored.");
    }
  }

  return (
    <PermissionGate permission={PERMISSIONS.MANAGE_ROLES}>
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold">
              Permission Matrix
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Control page and feature visibility for each role globally or
              for a selected hospital.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadPermissions(scope)}
            disabled={isLoading}
          >
            <RotateCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        {isPreview ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Preview mode: showing the role template matrix. Permission changes are disabled until admin authentication is configured.
          </div>
        ) : null}

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_auto_auto]">
          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="global">Global permissions</option>
            {availableHospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name}
              </option>
            ))}
            {activeHospital &&
            !availableHospitals.some((hospital) => hospital.id === activeHospital.id) ? (
              <option value={activeHospital.id}>{activeHospital.name}</option>
            ) : null}
          </select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search features, modules, or keys"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={() => bulkUpdate(true)}
            disabled={isPreview || !matrix || filteredFeatures.length === 0}
          >
            Enable all
          </Button>
          <Button
            variant="outline"
            onClick={() => bulkUpdate(false)}
            disabled={isPreview || !matrix || filteredFeatures.length === 0}
          >
            Disable all
          </Button>
        </div>

        {matrix ? (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Role templates</h3>
                <p className="text-sm text-slate-600">
                  Apply a preset to the selected permission scope.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {matrix.roles.map((role) => (
                  <Button
                    key={role.id}
                    variant="outline"
                    onClick={() => applyTemplate(role.id)}
                    disabled={isPreview}
                  >
                    <Wand2 className="h-4 w-4" />
                    {ROLE_TEMPLATE_LABELS[role.id]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Page / Feature</TableHead>
                  {matrix?.roles.map((role) => (
                    <TableHead key={role.id} className="min-w-[150px]">
                      <span className="block">{role.label}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {role.id}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!matrix || isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={(matrix?.roles.length ?? 4) + 1}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : filteredFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={matrix.roles.length + 1}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No matching features.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeatures.map((feature) => (
                    <TableRow key={feature.key}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{feature.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            {feature.module} / {feature.key}
                          </p>
                        </div>
                      </TableCell>
                      {matrix.roles.map((role) => {
                        const checked =
                          matrix.effective[role.id]?.[feature.key] ?? false;
                        const disabled = isProtectedOwnerPermission(
                          scope,
                          role.id,
                          feature.key
                        );

                        return (
                          <TableCell key={`${role.id}-${feature.key}`}>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={checked}
                                disabled={isPreview || disabled}
                                aria-label={`${feature.label} for ${role.label}`}
                                onCheckedChange={(enabled) =>
                                  togglePermission(
                                    role.id,
                                    feature.key,
                                    enabled
                                  )
                                }
                              />
                              <span className="text-xs font-medium text-slate-500">
                                {checked ? "ON" : "OFF"}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </PermissionGate>
  );
}

function createMatrixFromRolePermissions():PermissionMatrix {
  return previewRoles.reduce((matrix, role) => {
    const allowed = new Set(ROLE_PERMISSIONS[role.id] ?? []);

    matrix[role.id] = ALL_PERMISSIONS.reduce((permissions, permission) => {
      permissions[permission] = allowed.has(permission);
      return permissions;
    }, {} as Record<Permission, boolean>);

    return matrix;
  }, {} as PermissionMatrix);
}

function applyLocalUpdate(
  matrix:PermissionMatrixResponse,
  roleId:UserRole,
  featureKey:Permission,
  enabled:boolean
):PermissionMatrixResponse {
  return {
    ...matrix,
    effective:{
      ...matrix.effective,
      [roleId]:{
        ...matrix.effective[roleId],
        [featureKey]:enabled
      }
    },
    overrides:matrix.overrides
      ? {
          ...matrix.overrides,
          [roleId]:{
            ...matrix.overrides[roleId],
            [featureKey]:enabled
          }
        }
      : matrix.overrides,
    global:matrix.overrides
      ? matrix.global
      : {
          ...matrix.global,
          [roleId]:{
            ...matrix.global[roleId],
            [featureKey]:enabled
          }
        }
  };
}

function applyLocalBulkUpdate(
  matrix:PermissionMatrixResponse,
  scope:string,
  roleIds:UserRole[],
  featureKeys:Permission[],
  enabled:boolean
) {
  return roleIds.reduce(
    (nextMatrix, roleId) =>
      featureKeys.reduce(
        (innerMatrix, featureKey) =>
          isProtectedOwnerPermission(scope, roleId, featureKey) && !enabled
            ? innerMatrix
            : applyLocalUpdate(innerMatrix, roleId, featureKey, enabled),
        nextMatrix
      ),
    matrix
  );
}

function isProtectedOwnerPermission(
  scope:string,
  roleId:UserRole,
  featureKey:Permission
) {
  return (
    scope === "global" &&
    roleId === "ADMIN" &&
    featureKey === PERMISSIONS.MANAGE_ROLES
  );
}
