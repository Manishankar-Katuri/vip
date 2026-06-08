import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Permission } from "../auth/permissions/permissions.enum";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import type { JwtUserPayload } from "../auth/jwt";
import type { HospitalAwareRequest } from "../common/context/current-hospital.service";

@Controller("hospitals")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HospitalsController {
  constructor(
    private readonly currentHospital:CurrentHospitalService
  ) {}

  @Get()
  async listHospitals(
    @Req()
    request:{
      user:JwtUserPayload;
      headers:Record<string, string | string[] | undefined>;
    } & HospitalAwareRequest
  ) {
    const hospitals =
      await this.currentHospital.getAvailableHospitals(
        request.user
      );
    const selectedHospitalId =
      this.currentHospital.getSelectedHospitalIdFromRequest(
        request
      );
    const availableHospitalIds = new Set(
      hospitals.map((hospital) => hospital.id)
    );
    const hospitalIdForContext =
      selectedHospitalId && availableHospitalIds.has(selectedHospitalId)
        ? selectedHospitalId
        : request.user.hospitalId &&
            availableHospitalIds.has(request.user.hospitalId)
          ? request.user.hospitalId
          : null;
    const activeHospital =
      hospitalIdForContext
        ? await this.currentHospital.resolveActiveHospital(
            request.user,
            hospitalIdForContext
          )
        : null;

    if (activeHospital) {
      this.currentHospital.storeRequestContext(
        request,
        activeHospital
      );
    }

    return {
      hospitals,
      activeHospital:activeHospital?.hospital ?? null
    };
  }

  @Post("select")
  @Permissions(Permission.MANAGE_HOSPITALS)
  async selectHospital(
    @Req()
    request:{ user:JwtUserPayload } & HospitalAwareRequest,

    @Body("hospitalId")
    hospitalId:string
  ) {
    const context =
      await this.currentHospital.selectHospital(
        request.user,
        hospitalId
      );

    this.currentHospital.storeRequestContext(
      request,
      context
    );

    return {
      selectedHospitalId:context.selectedHospitalId,
      activeHospital:context.hospital
    };
  }
}
