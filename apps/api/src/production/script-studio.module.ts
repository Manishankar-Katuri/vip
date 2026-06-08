import { Module } from "@nestjs/common";

import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ContentGenerationService } from "./generation/content-generation.service";
import { MockContentProvider } from "./generation/mock-content-provider";
import { ScriptStudioController } from "./script-studio.controller";
import { ScriptStudioService } from "./script-studio.service";

@Module({
  imports:[PrismaModule],
  controllers:[ScriptStudioController],
  providers:[
    CurrentHospitalService,
    MockContentProvider,
    ContentGenerationService,
    ScriptStudioService
  ]
})
export class ScriptStudioModule {}
