import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import {
  AiAuditController,
  AiAuditIngestController
} from "./ai-audit.controller";
import { AiAuditService } from "./ai-audit.service";
import { AIUsageTracker } from "./ai-usage-tracker.service";

@Module({
  imports:[
    PrismaModule
  ],
  controllers:[
    AiAuditController,
    AiAuditIngestController
  ],
  providers:[
    AiAuditService,
    AIUsageTracker
  ],
  exports:[
    AIUsageTracker
  ]
})
export class AiAuditModule {}
