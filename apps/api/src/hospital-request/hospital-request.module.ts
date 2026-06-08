import { Module } from "@nestjs/common";

import { HospitalRequestController }
from "./hospital-request.controller";

import { HospitalRequestService }
from "./hospital-request.service";

import { PrismaService }
from "../prisma.service";

@Module({

  controllers: [
    HospitalRequestController
  ],

  providers: [
    HospitalRequestService,
    PrismaService
  ]

})

export class HospitalRequestModule {}