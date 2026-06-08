import {
  Module
}
from "@nestjs/common";

import {
  PrismaService
}
from "../prisma.service";

import {
  WorkspaceKnowledgeController
}
from "./workspace-knowledge.controller";

import {
  WorkspaceKnowledgeService
}
from "./workspace-knowledge.service";

@Module({

controllers:[
WorkspaceKnowledgeController
],

providers:[
WorkspaceKnowledgeService,
PrismaService
]

})

export class WorkspaceKnowledgeModule {}
