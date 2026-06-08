import {
  Module
}
from "@nestjs/common";

import {
  PrismaService
}
from "../prisma.service";

import {
  WorkspaceIngestionController
}
from "./workspace-ingestion.controller";

import {
  WorkspaceIngestionService
}
from "./workspace-ingestion.service";

@Module({

controllers:[
WorkspaceIngestionController
],

providers:[
WorkspaceIngestionService,
PrismaService
]

})

export class WorkspaceIngestionModule {}
