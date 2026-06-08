import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { HospitalsController } from "./hospitals.controller";
import { CurrentHospitalService } from "../common/context/current-hospital.service";

@Module({
  imports:[PrismaModule],
  controllers:[HospitalsController],
  providers:[CurrentHospitalService],
  exports:[CurrentHospitalService]
})
export class HospitalsModule {}
