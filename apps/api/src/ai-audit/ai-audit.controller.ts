import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Permission } from "../auth/permissions/permissions.enum";
import {
  AiAuditService,
  csvForLogs,
  excelXmlForLogs,
  type AiAuditQuery,
  type AiPricingInput
} from "./ai-audit.service";
import {
  AIUsageTracker,
  type AiUsageRecordInput
} from "./ai-usage-tracker.service";

@Controller("admin/ai-audit")
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AiAuditController {
  constructor(
    private readonly audit:AiAuditService
  ) {}

  @Get("summary")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  summary(
    @Query() query:AiAuditQuery
  ) {
    return this.audit.summary(query);
  }

  @Get("logs")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  logs(
    @Query() query:AiAuditQuery
  ) {
    return this.audit.logs(query);
  }

  @Get("logs/:id")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  detail(
    @Param("id") id:string
  ) {
    return this.audit.detail(id);
  }

  @Get("export.csv")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  async exportCsv(
    @Query() query:AiAuditQuery,
    @Res({ passthrough:true }) response:any
  ) {
    const rows = await this.audit.exportRows(query);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"ai-audit-logs.csv\"");

    return csvForLogs(rows);
  }

  @Get("export.xlsx")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  async exportExcel(
    @Query() query:AiAuditQuery,
    @Res({ passthrough:true }) response:any
  ) {
    const rows = await this.audit.exportRows(query);

    response.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"ai-audit-logs.xls\"");

    return excelXmlForLogs(rows);
  }

  @Get("pricing")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  pricing() {
    return this.audit.listPricing();
  }

  @Post("pricing")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  createPricing(
    @Body() body:AiPricingInput
  ) {
    return this.audit.createPricing(body);
  }

  @Patch("pricing/:id")
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  updatePricing(
    @Param("id") id:string,
    @Body() body:Partial<AiPricingInput>
  ) {
    return this.audit.updatePricing(id, body);
  }
}

@Controller("ai-audit")
export class AiAuditIngestController {
  constructor(
    private readonly tracker:AIUsageTracker
  ) {}

  @Post("ingest")
  ingest(
    @Headers("x-ai-audit-key") key:string | undefined,
    @Body() body:AiUsageRecordInput
  ) {
    const expectedKey = process.env.AI_AUDIT_INGEST_KEY;

    if (expectedKey && key !== expectedKey) {
      throw new UnauthorizedException("Invalid AI audit ingest key");
    }

    return this.tracker.record(body);
  }
}
