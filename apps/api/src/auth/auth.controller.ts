import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { JwtUserPayload } from "./jwt";
import { PermissionService } from "./permissions/permission.service";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService:AuthService,
    private readonly permissions:PermissionService
  ) {}

  @Post("login")
  async login(
    @Body()
    body:{
      userId?:string;
      email?:string;
      password?:string;
    }
  ) {
    return this.authService.login(body);
  }

  @Post("accept-invite")
  async acceptInvite(
    @Body("token")
    token:string
  ) {
    return this.authService.acceptInvite(token);
  }

  @Post("set-password")
  async setPassword(
    @Body()
    body:{
      token:string;
      password:string;
      name?:string;
    }
  ) {
    return this.authService.setPassword(body);
  }

  @Get("permissions/me")
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(
    @Req()
    request:{
      user:JwtUserPayload;
      headers:Record<string, string | string[] | undefined>;
    }
  ) {
    const hospitalId =
      getSelectedHospitalId(request.headers) ??
      request.user.hospitalId ??
      null;
    const permissions = await this.permissions.getRoleAccess({
      roleId:request.user.role as unknown as UserRole,
      hospitalId
    });

    return { permissions };
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
