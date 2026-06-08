import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtUserPayload } from '../auth/jwt';
import { Permission } from '../auth/permissions/permissions.enum';
import { CurrentHospitalService } from '../common/context/current-hospital.service';
import {
  ContentGeneratorService,
  type GeneratorInput,
  type PromoteInput,
} from './content-generator.service';

type ContentGeneratorRequest = {
  user: JwtUserPayload;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('production/content-generator')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ContentGeneratorController {
  constructor(
    private readonly currentHospital: CurrentHospitalService,
    private readonly generator: ContentGeneratorService,
  ) {}

  @Get()
  @Permissions(Permission.CREATE_CONTENT)
  async workspace(@Req() request: ContentGeneratorRequest) {
    const context = await this.resolveHospital(request);

    return this.generator.getWorkspace(context.selectedHospitalId);
  }

  @Post('generate')
  @Permissions(Permission.CREATE_CONTENT)
  async generate(
    @Req() request: ContentGeneratorRequest,
    @Body() body: GeneratorInput,
  ) {
    const context = await this.resolveHospital(request);

    return this.generator.generate(
      context.selectedHospitalId,
      request.user.userId,
      body,
    );
  }

  @Post(':id/promote')
  @Permissions(Permission.CREATE_CONTENT)
  async promote(
    @Req() request: ContentGeneratorRequest,
    @Param('id') id: string,
    @Body() body: PromoteInput,
  ) {
    const context = await this.resolveHospital(request);

    return this.generator.promote(
      context.selectedHospitalId,
      request.user.userId,
      id,
      body,
    );
  }

  private resolveHospital(request: ContentGeneratorRequest) {
    const selectedHospitalId =
      this.currentHospital.getSelectedHospitalIdFromRequest(request) ??
      request.user.hospitalId;

    return this.currentHospital.resolveActiveHospital(
      request.user,
      selectedHospitalId,
    );
  }
}
