import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import type { ContentCalendarQuery } from "./content-calendar.dto";
import { ContentCalendarService } from "./content-calendar.service";

type ContentCalendarRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("production/content-calendar")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ContentCalendarController {
  constructor(
    private readonly currentHospital:CurrentHospitalService,
    private readonly calendar:ContentCalendarService
  ) {}

  @Get()
  @Permissions(Permission.MANAGE_CALENDAR)
  async list(
    @Req() request:ContentCalendarRequest,
    @Query() query:ContentCalendarQuery
  ) {
    const context = await this.resolveHospital(request);

    return this.calendar.list(
      context.selectedHospitalId,
      query
    );
  }

  @Post()
  @Permissions(Permission.MANAGE_CALENDAR)
  async create(
    @Req() request:ContentCalendarRequest,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.calendar.create(
      context.selectedHospitalId,
      request.user.userId,
      body
    );
  }

  @Patch(":id")
  @Permissions(Permission.MANAGE_CALENDAR)
  async update(
    @Req() request:ContentCalendarRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.calendar.update(
      context.selectedHospitalId,
      id,
      body
    );
  }

  @Delete(":id")
  @Permissions(Permission.MANAGE_CALENDAR)
  async remove(
    @Req() request:ContentCalendarRequest,
    @Param("id") id:string
  ) {
    const context = await this.resolveHospital(request);

    return this.calendar.remove(
      context.selectedHospitalId,
      id
    );
  }

  private resolveHospital(
    request:ContentCalendarRequest
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
