import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";

import { getJwtSecret } from "../auth.service";
import { verifyJwt } from "../jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context:ExecutionContext
  ) {
    const request = context.switchToHttp().getRequest();
    const token = getBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    request.user = verifyJwt(
      token,
      getJwtSecret()
    );

    return true;
  }
}

function getBearerToken(
  authorization:string | undefined
) {
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");

  return scheme === "Bearer" && token
    ? token
    : null;
}
