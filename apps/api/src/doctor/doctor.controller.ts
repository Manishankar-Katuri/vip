import {
  Controller,
  Get,
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
import { MorningBriefingService } from "./morning-briefing.service";

type DoctorRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("doctor")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DoctorController {
  constructor(
    private readonly currentHospital:CurrentHospitalService,
    private readonly morningBriefing:MorningBriefingService
  ) {}

  @Get("morning-briefing")
  @Permissions(Permission.VIEW_MORNING_BRIEFING)
  async getMorningBriefing(
    @Req()
    request:DoctorRequest
  ) {
    const selectedHospitalId =
      this.currentHospital.getSelectedHospitalIdFromRequest(
        request
      ) ?? request.user.hospitalId;
    const context =
      await this.currentHospital.resolveActiveHospital(
        request.user,
        selectedHospitalId
      );

    return this.morningBriefing.getMorningBriefing(
      context.selectedHospitalId
    );
  }
}
