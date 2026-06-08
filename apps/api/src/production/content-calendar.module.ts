import { Module } from "@nestjs/common";

import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ContentCalendarController } from "./content-calendar.controller";
import { ContentCalendarService } from "./content-calendar.service";

@Module({
  imports:[PrismaModule],
  controllers:[ContentCalendarController],
  providers:[
    CurrentHospitalService,
    ContentCalendarService
  ]
})
export class ContentCalendarModule {}
