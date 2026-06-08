import { UserRole } from "@prisma/client";

import { PermissionService } from "./permission.service";
import { Permission } from "./permissions.enum";

type StoredPermission = {
  id:string;
  hospitalId:string | null;
  roleId:UserRole;
  featureKey:string;
  enabled:boolean;
  createdAt:Date;
  updatedAt:Date;
};

describe("PermissionService", () => {
  it("seeds global defaults from the static role map", async () => {
    const service = createService();

    const permissions = await service.getRoleAccess({
      roleId:UserRole.DOCTOR
    });

    expect(permissions).toContain(Permission.VIEW_MORNING_BRIEFING);
    expect(permissions).toContain(Permission.VIEW_STRATEGY);
    expect(permissions).not.toContain(Permission.MANAGE_USERS);
  });

  it("applies hospital overrides only for the selected hospital", async () => {
    const service = createService();

    await service.updatePermission({
      hospitalId:"hospital-a",
      roleId:UserRole.DOCTOR,
      featureKey:Permission.VIEW_REVENUE,
      enabled:false
    });

    await expect(
      service.hasAccess({
        hospitalId:"hospital-a",
        roleId:UserRole.DOCTOR,
        featureKey:Permission.VIEW_REVENUE
      })
    ).resolves.toBe(false);
    await expect(
      service.hasAccess({
        hospitalId:"hospital-b",
        roleId:UserRole.DOCTOR,
        featureKey:Permission.VIEW_REVENUE
      })
    ).resolves.toBe(true);
  });

  it("bulk updates requested roles and features", async () => {
    const service = createService();

    await service.bulkUpdatePermissions({
      hospitalId:"hospital-a",
      roleIds:[UserRole.STAFF],
      featureKeys:[
        Permission.VIEW_RECOMMENDATIONS,
        Permission.VIEW_SOCIAL_INTELLIGENCE
      ],
      enabled:true
    });

    await expect(
      service.getRoleAccess({
        hospitalId:"hospital-a",
        roleId:UserRole.STAFF
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        Permission.VIEW_RECOMMENDATIONS,
        Permission.VIEW_SOCIAL_INTELLIGENCE
      ])
    );
  });
});

function createService() {
  const rows:StoredPermission[] = [];
  const prisma = {
    rolePermission:{
      createMany:jest.fn(async ({ data, skipDuplicates }) => {
        for (const row of data) {
          const existing = rows.find((candidate) =>
            candidate.hospitalId === row.hospitalId &&
            candidate.roleId === row.roleId &&
            candidate.featureKey === row.featureKey
          );

          if (existing && skipDuplicates) continue;

          rows.push(toStored(row));
        }

        return { count:data.length };
      }),
      findMany:jest.fn(async ({ where }) => {
        if (!where) return rows;

        if ("OR" in where) {
          return rows.filter((row) =>
            where.OR.some((clause:Partial<StoredPermission>) =>
              row.hospitalId === clause.hospitalId
            )
          );
        }

        return rows.filter((row) =>
          row.hospitalId === where.hospitalId
        );
      }),
      findFirst:jest.fn(async ({ where }) =>
        rows.find((row) =>
          row.hospitalId === where.hospitalId &&
          row.roleId === where.roleId &&
          row.featureKey === where.featureKey
        ) ?? null
      ),
      update:jest.fn(async ({ where, data }) => {
        const index = rows.findIndex((row) => row.id === where.id);
        rows[index] = {
          ...rows[index],
          ...data,
          updatedAt:new Date()
        };

        return rows[index];
      }),
      create:jest.fn(async ({ data }) => {
        const row = toStored(data);

        rows.push(row);

        return row;
      })
    }
  };

  return new PermissionService(prisma as any);
}

function toStored(
  input:{
    hospitalId:string | null;
    roleId:UserRole;
    featureKey:string;
    enabled:boolean;
  }
):StoredPermission {
  return {
    id:`permission-${Math.random().toString(36).slice(2)}`,
    hospitalId:input.hospitalId,
    roleId:input.roleId,
    featureKey:input.featureKey,
    enabled:input.enabled,
    createdAt:new Date(),
    updatedAt:new Date()
  };
}
