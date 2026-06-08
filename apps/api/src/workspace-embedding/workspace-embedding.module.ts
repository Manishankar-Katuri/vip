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
  WorkspaceEmbeddingController
}
from "./workspace-embedding.controller";

import {
  WorkspaceEmbeddingService
}
from "./workspace-embedding.service";

@Module({

imports:[
AiAuditModule
],

controllers:[
WorkspaceEmbeddingController
],

providers:[
WorkspaceEmbeddingService,
PrismaService
]

})

export class WorkspaceEmbeddingModule {}
