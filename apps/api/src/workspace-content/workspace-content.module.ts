import {
  Module
}
from "@nestjs/common";

import {
  PrismaService
}
from "../prisma.service";

import { AiAuditModule }
from "../ai-audit/ai-audit.module";

import {
  WorkspaceContentController
}
from "./workspace-content.controller";

import {
  WorkspaceContentService
}
from "./workspace-content.service";

@Module({

imports:[
AiAuditModule
],

controllers:[
WorkspaceContentController
],

providers:[
WorkspaceContentService,
PrismaService
]

})

export class WorkspaceContentModule {}
