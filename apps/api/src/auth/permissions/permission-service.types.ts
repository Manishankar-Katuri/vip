import { UserRole } from "@prisma/client";

import { Permission } from "./permissions.enum";

export type PermissionScope = {
  hospitalId?:string | null;
};

export type RoleDescriptor = {
  id:UserRole;
  label:string;
  description:string;
};

export type FeatureDescriptor = {
  key:Permission;
  label:string;
  module:string;
  description:string;
};

export type PermissionMatrix = Record<UserRole, Record<Permission, boolean>>;

export type PermissionEntryDto = {
  id:string;
  hospitalId:string | null;
  roleId:UserRole;
  featureKey:Permission;
  enabled:boolean;
  createdAt:Date;
  updatedAt:Date;
};

export type PermissionMatrixResponse = {
  roles:RoleDescriptor[];
  features:FeatureDescriptor[];
  global:PermissionMatrix;
  overrides:PermissionMatrix | null;
  effective:PermissionMatrix;
  entries:PermissionEntryDto[];
};
