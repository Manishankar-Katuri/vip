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
import { ProductionCommandCentreService } from "./production-command-centre.service";

type ProductionRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("production")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ProductionController {
  constructor(
    private readonly currentHospital:CurrentHospitalService,
    private readonly commandCentre:ProductionCommandCentreService
  ) {}

  @Get("command-centre")
  @Permissions(Permission.VIEW_CONTENT)
  async getCommandCentre(
    @Req()
    request:ProductionRequest
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

    return this.commandCentre.getCommandCentre(
      context.selectedHospitalId
    );
  }
}
