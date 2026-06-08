import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { JwtUserPayload } from "../auth/jwt";
import { Permission } from "../auth/permissions/permissions.enum";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { ScriptStudioService } from "./script-studio.service";

type ScriptStudioRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("production/script-studio")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ScriptStudioController {
  constructor(
    private readonly currentHospital:CurrentHospitalService,
    private readonly scripts:ScriptStudioService
  ) {}

  @Get()
  @Permissions(Permission.CREATE_CONTENT)
  async list(
    @Req() request:ScriptStudioRequest
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.list(context.selectedHospitalId);
  }

  @Get(":id")
  @Permissions(Permission.CREATE_CONTENT)
  async get(
    @Req() request:ScriptStudioRequest,
    @Param("id") id:string
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.get(
      context.selectedHospitalId,
      id
    );
  }

  @Post("generate")
  @Permissions(Permission.CREATE_CONTENT)
  async generate(
    @Req() request:ScriptStudioRequest,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.generate(
      context.selectedHospitalId,
      request.user.userId,
      body
    );
  }

  @Post()
  @Permissions(Permission.CREATE_CONTENT)
  async create(
    @Req() request:ScriptStudioRequest,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.create(
      context.selectedHospitalId,
      request.user.userId,
      body
    );
  }

  @Patch(":id")
  @Permissions(Permission.CREATE_CONTENT)
  async update(
    @Req() request:ScriptStudioRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.update(
      context.selectedHospitalId,
      request.user.userId,
      id,
      body
    );
  }

  @Delete(":id")
  @Permissions(Permission.CREATE_CONTENT)
  async remove(
    @Req() request:ScriptStudioRequest,
    @Param("id") id:string
  ) {
    const context = await this.resolveHospital(request);

    return this.scripts.remove(
      context.selectedHospitalId,
      id
    );
  }

  private resolveHospital(
    request:ScriptStudioRequest
  ) {
    const selectedHospitalId =
      this.currentHospital.getSelectedHospitalIdFromRequest(
        request
      ) ?? request.user.hospitalId;

    return this.currentHospital.resolveActiveHospital(
      request.user,
      selectedHospitalId
    );
  }
}
