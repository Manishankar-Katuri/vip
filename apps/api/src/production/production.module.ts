import { Module } from "@nestjs/common";

import { CurrentHospitalService } from "../common/context/current-hospital.service";
import { PrismaModule } from "../prisma/prisma.module";
import { ProductionCommandCentreService } from "./production-command-centre.service";
import { ProductionController } from "./production.controller";

@Module({
  imports:[PrismaModule],
  controllers:[ProductionController],
  providers:[
    CurrentHospitalService,
    ProductionCommandCentreService
  ]
})
export class ProductionModule {}
