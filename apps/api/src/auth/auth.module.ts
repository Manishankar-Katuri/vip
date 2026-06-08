import { Module } from "@nestjs/common";
import { GoogleController } from "./google.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminModule } from "../admin/admin.module";
import { EmailModule } from "../email/email.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports:[
    PrismaModule,
    AdminModule,
    EmailModule,
    PermissionsModule
  ],
  controllers:[
    AuthController,
    GoogleController
  ],
  providers:[AuthService],
  exports:[AuthService]
})
export class AuthModule{}
