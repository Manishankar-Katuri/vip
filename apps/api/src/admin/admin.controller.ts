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
import { UserRole } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Permission } from "../auth/permissions/permissions.enum";
import type { JwtUserPayload } from "../auth/jwt";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { PermissionService } from "../auth/permissions/permission.service";
import { AdminService } from "./admin.service";
import { AuditLogService } from "./audit-log.service";

type AdminRequest = {
  user:JwtUserPayload;
  headers:Record<string, string | string[] | undefined>;
};

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly admin:AdminService,
    private readonly audit:AuditLogService,
    private readonly currentHospital:CurrentHospitalService,
    private readonly permissions:PermissionService
  ) {}

  @Get("users")
  @Permissions(Permission.MANAGE_USERS)
  listUsers() {
    return this.admin.listUsers();
  }

  @Post("users")
  @Permissions(Permission.MANAGE_USERS)
  createUser(
    @Req() request:AdminRequest,
    @Body() body:any
  ) {
    return this.admin.createUser(
      request.user.userId,
      body
    );
  }

  @Patch("users/:id")
  @Permissions(Permission.MANAGE_USERS)
  updateUser(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    return this.admin.updateUser(
      request.user.userId,
      id,
      body
    );
  }

  @Delete("users/:id")
  @Permissions(Permission.MANAGE_USERS)
  deleteUser(
    @Req() request:AdminRequest,
    @Param("id") id:string
  ) {
    return this.admin.deleteUser(
      request.user.userId,
      id
    );
  }

  @Get("invitations")
  @Permissions(Permission.MANAGE_USERS)
  listInvitations() {
    return this.admin.listInvitations();
  }

  @Post("invitations")
  @Permissions(Permission.MANAGE_USERS)
  createInvitation(
    @Req() request:AdminRequest,
    @Body() body:any
  ) {
    return this.admin.createInvitation(
      request.user.userId,
      body
    );
  }

  @Post("invitations/:id/revoke")
  @Permissions(Permission.MANAGE_USERS)
  revokeInvitation(
    @Req() request:AdminRequest,
    @Param("id") id:string
  ) {
    return this.admin.revokeInvitation(
      request.user.userId,
      id
    );
  }

  @Post("invitations/:id/resend")
  @Permissions(Permission.MANAGE_USERS)
  resendInvitation(
    @Req() request:AdminRequest,
    @Param("id") id:string
  ) {
    return this.admin.resendInvitation(
      request.user.userId,
      id
    );
  }

  @Get("permissions")
  @Permissions(Permission.MANAGE_ROLES)
  listPermissions(
    @Query("hospitalId") hospitalId?:string
  ) {
    return this.permissions.getPermissions({
      hospitalId
    });
  }

  @Patch("permissions")
  @Permissions(Permission.MANAGE_ROLES)
  updatePermission(
    @Body() body:{
      hospitalId?:string | null;
      roleId:UserRole;
      featureKey:Permission;
      enabled:boolean;
    }
  ) {
    return this.permissions.updatePermission(body);
  }

  @Post("permissions/bulk")
  @Permissions(Permission.MANAGE_ROLES)
  bulkUpdatePermissions(
    @Body() body:{
      hospitalId?:string | null;
      roleIds:UserRole[];
      featureKeys:Permission[];
      enabled:boolean;
    }
  ) {
    return this.permissions.bulkUpdatePermissions(body);
  }

  @Get("permissions/access")
  @Permissions(Permission.MANAGE_ROLES)
  getPermissionAccess(
    @Query("hospitalId") hospitalId?:string,
    @Query("roleId") roleId?:UserRole
  ) {
    if (roleId) {
      return this.permissions.getRoleAccess({
        roleId,
        hospitalId
      });
    }

    return this.permissions.getPermissions({
      hospitalId
    });
  }

  @Get("hospitals")
  @Permissions(Permission.MANAGE_HOSPITALS)
  listHospitals() {
    return this.admin.listHospitals();
  }

  @Post("hospitals")
  @Permissions(Permission.MANAGE_HOSPITALS)
  createHospital(
    @Req() request:AdminRequest,
    @Body() body:any
  ) {
    return this.admin.createHospital(
      request.user.userId,
      body
    );
  }

  @Patch("hospitals/:id")
  @Permissions(Permission.MANAGE_HOSPITALS)
  updateHospital(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    return this.admin.updateHospital(
      request.user.userId,
      id,
      body
    );
  }

  @Delete("hospitals/:id")
  @Permissions(Permission.MANAGE_HOSPITALS)
  deleteHospital(
    @Req() request:AdminRequest,
    @Param("id") id:string
  ) {
    return this.admin.deleteHospital(
      request.user.userId,
      id
    );
  }

  @Get("hospitals/:id/integrations")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  listHospitalIntegrations(
    @Param("id") id:string
  ) {
    return this.admin.listHospitalIntegrations(id);
  }

  @Post("hospitals/:id/integrations")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  createHospitalIntegration(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    return this.admin.createHospitalIntegration(
      request.user.userId,
      id,
      body
    );
  }

  @Patch("hospitals/:id/integrations/:integrationId")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  updateHospitalIntegration(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Param("integrationId") integrationId:string,
    @Body() body:any
  ) {
    return this.admin.updateHospitalIntegration(
      request.user.userId,
      id,
      integrationId,
      body
    );
  }

  @Post("hospitals/:id/integrations/:integrationId/test")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  testHospitalIntegration(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Param("integrationId") integrationId:string
  ) {
    return this.admin.testHospitalIntegration(
      request.user.userId,
      id,
      integrationId
    );
  }

  @Delete("hospitals/:id/integrations/:integrationId")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  deleteHospitalIntegration(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Param("integrationId") integrationId:string
  ) {
    return this.admin.deleteHospitalIntegration(
      request.user.userId,
      id,
      integrationId
    );
  }

  @Get("audit-logs")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  listAuditLogs() {
    return this.audit.list();
  }

  @Get("brand-voice")
  @Permissions(Permission.MANAGE_BRAND_VOICE)
  async getBrandVoice(
    @Req() request:AdminRequest
  ) {
    const context = await this.resolveHospital(request);

    return this.admin.getBrandVoice(
      context.selectedHospitalId
    );
  }

  @Patch("brand-voice")
  @Permissions(Permission.MANAGE_BRAND_VOICE)
  async updateBrandVoice(
    @Req() request:AdminRequest,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.admin.updateBrandVoice(
      request.user.userId,
      context.selectedHospitalId,
      body
    );
  }

  @Get("templates")
  @Permissions(Permission.MANAGE_TEMPLATES)
  async listTemplates(
    @Req() request:AdminRequest
  ) {
    const context = await this.resolveHospital(request);

    return this.admin.listTemplates(
      context.selectedHospitalId
    );
  }

  @Post("templates")
  @Permissions(Permission.MANAGE_TEMPLATES)
  async createTemplate(
    @Req() request:AdminRequest,
    @Body() body:any
  ) {
    const context = await this.resolveHospital(request);

    return this.admin.createTemplate(
      request.user.userId,
      context.selectedHospitalId,
      body
    );
  }

  @Patch("templates/:id")
  @Permissions(Permission.MANAGE_TEMPLATES)
  updateTemplate(
    @Req() request:AdminRequest,
    @Param("id") id:string,
    @Body() body:any
  ) {
    return this.admin.updateTemplate(
      request.user.userId,
      id,
      body
    );
  }

  @Delete("templates/:id")
  @Permissions(Permission.MANAGE_TEMPLATES)
  deleteTemplate(
    @Req() request:AdminRequest,
    @Param("id") id:string
  ) {
    return this.admin.deleteTemplate(
      request.user.userId,
      id
    );
  }

  @Get("integrations")
  @Permissions(Permission.MANAGE_INTEGRATIONS)
  listIntegrations() {
    return this.admin.getIntegrations();
  }

  private async resolveHospital(
    request:AdminRequest
  ) {
    const hospitalId =
      this.currentHospital.getSelectedHospitalIdFromRequest(
        request
      ) ?? request.user.hospitalId;

    return this.currentHospital.resolveActiveHospital(
      request.user,
      hospitalId
    );
  }
}
