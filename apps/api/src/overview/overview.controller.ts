import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";

import type { JwtUserPayload } from "../auth/jwt";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { OverviewAggregationService } from "./overview-aggregation.service";

type OverviewRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("overview")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class OverviewController {
  constructor(
    private readonly currentHospital:CurrentHospitalService,
    private readonly overview:OverviewAggregationService
  ) {}

  @Get()
  async getOverview(
    @Req()
    request:OverviewRequest,
    @Query("refresh")
    refresh?:string
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

    return this.overview.generate({
      hospitalId:context.selectedHospitalId,
      userId:request.user.userId,
      roleId:request.user.role,
      refresh:refresh === "1" || refresh === "true"
    });
  }
}
