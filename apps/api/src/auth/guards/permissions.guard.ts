import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";

import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { JwtUserPayload } from "../jwt";
import { Permission } from "../permissions/permissions.enum";
import { PermissionService } from "../permissions/permission.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector:Reflector,
    private readonly permissions:PermissionService
  ) {}

  async canActivate(
    context:ExecutionContext
  ) {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(
        PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass()
        ]
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUserPayload | undefined;

    if (!user) {
      throw new ForbiddenException("User context is required");
    }

    if (!user.isGlobal && !user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users require a hospital assignment"
      );
    }

    const hospitalId =
      getSelectedHospitalId(request.headers) ??
      user.hospitalId ??
      null;
    const userPermissions = await this.permissions.getRoleAccess({
      roleId:user.role as unknown as UserRole,
      hospitalId
    });
    const hasRequiredPermissions = requiredPermissions.every(
      (permission) => userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      throw new ForbiddenException(
        "Permission is not authorized"
      );
    }

    return true;
  }
}

function getSelectedHospitalId(
  headers:Record<string, string | string[] | undefined>
) {
  const value = headers["x-hospital-id"];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
