import { Module } from "@nestjs/common";

import { AiAuditModule } from "../ai-audit/ai-audit.module";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { PrismaModule } from "../prisma/prisma.module";
import { OverviewAggregationService } from "./overview-aggregation.service";
import { OverviewController } from "./overview.controller";
import { overviewOpenAIProvider } from "./overview-openai.provider";

@Module({
  imports:[
    PrismaModule,
    AiAuditModule
  ],
  controllers:[
    OverviewController
  ],
  providers:[
    CurrentHospitalService,
    OverviewAggregationService,
    overviewOpenAIProvider
  ],
  exports:[
    OverviewAggregationService
  ]
})
export class OverviewModule {}
