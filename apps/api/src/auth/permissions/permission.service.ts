import {
  BadRequestException,
  Injectable
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { UserRole as AuthUserRole } from "../types/user-role.enum";
import { MODULES } from "./module-registry";
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS
} from "./permission-map";
import { Permission } from "./permissions.enum";
import type {
  FeatureDescriptor,
  PermissionEntryDto,
  PermissionMatrix,
  PermissionMatrixResponse,
  RoleDescriptor
} from "./permission-service.types";

const ROLE_DESCRIPTORS:RoleDescriptor[] = [
  {
    id:UserRole.ADMIN,
    label:"Owner",
    description:"Hospital owner and super admin access"
  },
  {
    id:UserRole.PRODUCTION,
    label:"Marketing",
    description:"Marketing and content production access"
  },
  {
    id:UserRole.DOCTOR,
    label:"Doctor",
    description:"Clinical review and executive insight access"
  },
  {
    id:UserRole.STAFF,
    label:"Operations",
    description:"Operations team and patient workflow access"
  }
];

const ROLE_ORDER = ROLE_DESCRIPTORS.map((role) => role.id);

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async getPermissions(
    input:{ hospitalId?:string | null } = {}
  ):Promise<PermissionMatrixResponse> {
    const hospitalId = normalizeHospitalScope(input.hospitalId);

    await this.seedGlobalDefaults();

    const where = hospitalId
      ? {
          OR:[
            { hospitalId:null },
            { hospitalId }
          ]
        }
      : { hospitalId:null };
    const entries = await this.prisma.rolePermission.findMany({
      where,
      orderBy:[
        { hospitalId:"asc" },
        { roleId:"asc" },
        { featureKey:"asc" }
      ]
    });
    const global = createEmptyMatrix(false);
    const overrides = hospitalId
      ? createEmptyMatrix(false)
      : null;

    for (const entry of entries) {
      if (!isPermission(entry.featureKey)) continue;

      const target =
        entry.hospitalId === null
          ? global
          : overrides;

      if (!target) continue;

      target[entry.roleId][entry.featureKey] = entry.enabled;
    }

    return {
      roles:ROLE_DESCRIPTORS,
      features:getFeatureCatalog(),
      global,
      overrides,
      effective:hospitalId && overrides
        ? mergeMatrices(global, overrides, entries)
        : global,
      entries:entries
        .filter((entry) => isPermission(entry.featureKey))
        .map((entry) => ({
          id:entry.id,
          hospitalId:entry.hospitalId,
          roleId:entry.roleId,
          featureKey:entry.featureKey as Permission,
          enabled:entry.enabled,
          createdAt:entry.createdAt,
          updatedAt:entry.updatedAt
        }))
    };
  }

  async updatePermission(
    input:{
      hospitalId?:string | null;
      roleId:UserRole;
      featureKey:Permission;
      enabled:boolean;
    }
  ) {
    const hospitalId = normalizeHospitalScope(input.hospitalId);

    this.assertKnownRole(input.roleId);
    this.assertKnownPermission(input.featureKey);
    this.assertProtectedAdminAccess(input);

    await this.seedGlobalDefaults();

    return this.upsertPermission({
      hospitalId,
      roleId:input.roleId,
      featureKey:input.featureKey,
      enabled:input.enabled
    });
  }

  async bulkUpdatePermissions(
    input:{
      hospitalId?:string | null;
      roleIds:UserRole[];
      featureKeys:Permission[];
      enabled:boolean;
    }
  ) {
    const hospitalId = normalizeHospitalScope(input.hospitalId);
    const roleIds = unique(input.roleIds);
    const featureKeys = unique(input.featureKeys);

    if (roleIds.length === 0 || featureKeys.length === 0) {
      throw new BadRequestException(
        "At least one role and feature are required"
      );
    }

    roleIds.forEach((roleId) => this.assertKnownRole(roleId));
    featureKeys.forEach((featureKey) =>
      this.assertKnownPermission(featureKey)
    );

    for (const roleId of roleIds) {
      for (const featureKey of featureKeys) {
        this.assertProtectedAdminAccess({
          hospitalId,
          roleId,
          featureKey,
          enabled:input.enabled
        });
      }
    }

    await this.seedGlobalDefaults();

    const updates:Promise<unknown>[] = [];

    for (const roleId of roleIds) {
      for (const featureKey of featureKeys) {
        updates.push(
          this.upsertPermission({
            hospitalId,
            roleId,
            featureKey,
            enabled:input.enabled
          })
        );
      }
    }

    return Promise.all(updates);
  }

  async getRoleAccess(
    input:{
      roleId:UserRole;
      hospitalId?:string | null;
    }
  ) {
    this.assertKnownRole(input.roleId);

    const permissions = await this.getPermissions({
      hospitalId:input.hospitalId
    });

    return Object.entries(permissions.effective[input.roleId])
      .filter(([, enabled]) => enabled)
      .map(([featureKey]) => featureKey as Permission);
  }

  async getHospitalAccess(
    input:{ hospitalId:string }
  ) {
    if (!input.hospitalId) {
      throw new BadRequestException("hospitalId is required");
    }

    return this.getPermissions({
      hospitalId:input.hospitalId
    });
  }

  async hasAccess(
    input:{
      roleId:UserRole;
      hospitalId?:string | null;
      featureKey:Permission;
    }
  ) {
    const permissions = await this.getRoleAccess({
      roleId:input.roleId,
      hospitalId:input.hospitalId
    });

    return permissions.includes(input.featureKey);
  }

  private async seedGlobalDefaults() {
    const entries = ROLE_ORDER.flatMap((roleId) =>
      ALL_PERMISSIONS.map((featureKey) => ({
        hospitalId:null,
        roleId,
        featureKey,
        enabled:
          ROLE_PERMISSIONS[roleId as unknown as AuthUserRole]?.includes(
            featureKey
          ) ?? false
      }))
    );

    await this.prisma.rolePermission.createMany({
      data:entries,
      skipDuplicates:true
    });
  }

  private async upsertPermission(
    input:{
      hospitalId:string | null;
      roleId:UserRole;
      featureKey:Permission;
      enabled:boolean;
    }
  ) {
    const existing = await this.prisma.rolePermission.findFirst({
      where:{
        hospitalId:input.hospitalId,
        roleId:input.roleId,
        featureKey:input.featureKey
      }
    });

    if (existing) {
      return this.prisma.rolePermission.update({
        where:{ id:existing.id },
        data:{ enabled:input.enabled }
      });
    }

    return this.prisma.rolePermission.create({
      data:input
    });
  }

  private assertKnownRole(
    roleId:UserRole
  ) {
    if (!ROLE_ORDER.includes(roleId)) {
      throw new BadRequestException("Unknown roleId");
    }
  }

  private assertKnownPermission(
    featureKey:Permission
  ) {
    if (!ALL_PERMISSIONS.includes(featureKey)) {
      throw new BadRequestException("Unknown featureKey");
    }
  }

  private assertProtectedAdminAccess(
    input:{
      hospitalId?:string | null;
      roleId:UserRole;
      featureKey:Permission;
      enabled:boolean;
    }
  ) {
    if (
      normalizeHospitalScope(input.hospitalId) === null &&
      input.roleId === UserRole.ADMIN &&
      input.featureKey === Permission.MANAGE_ROLES &&
      !input.enabled
    ) {
      throw new BadRequestException(
        "Global owner access to permission management cannot be disabled"
      );
    }
  }
}

function getFeatureCatalog():FeatureDescriptor[] {
  return ALL_PERMISSIONS.map((permission) => ({
    key:permission,
    label:humanizePermission(permission),
    module:getPermissionModule(permission),
    description:`Controls access to ${humanizePermission(permission).toLowerCase()}.`
  }));
}

function getPermissionModule(
  permission:Permission
) {
  for (const [moduleName, permissions] of Object.entries(MODULES)) {
    if ((permissions as readonly Permission[]).includes(permission)) {
      return moduleName;
    }
  }

  return "general";
}

function createEmptyMatrix(
  value:boolean
):PermissionMatrix {
  return ROLE_ORDER.reduce(
    (matrix, roleId) => ({
      ...matrix,
      [roleId]:ALL_PERMISSIONS.reduce(
        (permissions, permission) => ({
          ...permissions,
          [permission]:value
        }),
        {} as Record<Permission, boolean>
      )
    }),
    {} as PermissionMatrix
  );
}

function mergeMatrices(
  global:PermissionMatrix,
  overrides:PermissionMatrix,
  entries:ReadonlyArray<PermissionEntryDto | {
    hospitalId:string | null;
    roleId:UserRole;
    featureKey:string;
    enabled:boolean;
  }>
) {
  const effective = cloneMatrix(global);
  const overrideKeys = new Set(
    entries
      .filter((entry) => entry.hospitalId !== null)
      .map((entry) => `${entry.roleId}:${entry.featureKey}`)
  );

  for (const roleId of ROLE_ORDER) {
    for (const permission of ALL_PERMISSIONS) {
      if (overrideKeys.has(`${roleId}:${permission}`)) {
        effective[roleId][permission] = overrides[roleId][permission];
      }
    }
  }

  return effective;
}

function cloneMatrix(
  matrix:PermissionMatrix
) {
  return ROLE_ORDER.reduce(
    (next, roleId) => ({
      ...next,
      [roleId]:{ ...matrix[roleId] }
    }),
    {} as PermissionMatrix
  );
}

function normalizeHospitalScope(
  hospitalId?:string | null
) {
  if (!hospitalId || hospitalId === "global") {
    return null;
  }

  return hospitalId;
}

function humanizePermission(
  permission:Permission
) {
  return permission
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPermission(
  value:string
): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

function unique<T>(
  values:T[]
) {
  return [...new Set(values)];
}
