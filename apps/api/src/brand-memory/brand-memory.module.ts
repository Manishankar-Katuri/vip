import { Module } from "@nestjs/common";

import { BrandMemoryController }
from "./brand-memory.controller";

import { BrandMemoryService }
from "./brand-memory.service";

import { PrismaModule }
from "../prisma/prisma.module";

import { AiAuditModule }
from "../ai-audit/ai-audit.module";

import { BrandMemoryAIService }
from "./brand-memory-ai.service";

@Module({

imports:[
PrismaModule,
AiAuditModule
],

controllers:[
BrandMemoryController
],

providers:[
BrandMemoryService,
BrandMemoryAIService
]

})

export class BrandMemoryModule{}
