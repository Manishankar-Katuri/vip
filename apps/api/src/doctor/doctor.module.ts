import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { DoctorController } from "./doctor.controller";
import { MorningBriefingService } from "./morning-briefing.service";

@Module({
  imports:[PrismaModule],
  controllers:[DoctorController],
  providers:[
    CurrentHospitalService,
    MorningBriefingService
  ]
})
export class DoctorModule {}
