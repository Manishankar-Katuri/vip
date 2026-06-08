import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { EmailModule } from "../email/email.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuditLogService } from "./audit-log.service";

@Module({
  imports:[
    PrismaModule,
    EmailModule
  ],
  controllers:[AdminController],
  providers:[
    AdminService,
    AuditLogService,
    CurrentHospitalService
  ],
  exports:[AuditLogService]
})
export class AdminModule {}
