import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { UserRole } from "../types/user-role.enum";
import type { JwtUserPayload } from "../jwt";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector:Reflector
  ) {}

  canActivate(
    context:ExecutionContext
  ) {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass()
        ]
      ) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUserPayload | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Role is not authorized");
    }

    if (!user.isGlobal && !user.hospitalId) {
      throw new ForbiddenException(
        "Hospital-scoped users require a hospital assignment"
      );
    }

    return true;
  }
}
