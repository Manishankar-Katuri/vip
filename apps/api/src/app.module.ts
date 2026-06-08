import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { HospitalRequestModule } from './hospital-request/hospital-request.module';

import { WorkspaceKnowledgeModule } from './workspace-knowledge/workspace-knowledge.module';

import { WorkspaceIngestionModule } from './workspace-ingestion/workspace-ingestion.module';

import { WorkspaceEmbeddingModule } from './workspace-embedding/workspace-embedding.module';

import { WorkspaceContentModule } from './workspace-content/workspace-content.module';

import { ReviewModule } from './review/review.module';

import { CompetitorModule } from './competitor/competitor.module';

import { GbpModule } from './gbp/gbp.module';

import { AuthModule } from './auth/auth.module';

import { StrategyModule } from './strategy/strategy.module';

import { BrandMemoryModule } from './brand-memory/brand-memory.module';

import { HospitalsModule } from './hospitals/hospitals.module';

import { AdminModule } from './admin/admin.module';

import { DoctorModule } from './doctor/doctor.module';

import { ProductionModule } from './production/production.module';

import { ContentCalendarModule } from './production/content-calendar.module';

import { ContentGeneratorModule } from './production/content-generator.module';

import { ScriptStudioModule } from './production/script-studio.module';
import { AiAuditModule } from './ai-audit/ai-audit.module';
import { PermissionsModule } from './auth/permissions/permissions.module';
import { OverviewModule } from './overview/overview.module';

@Module({
  imports: [
    PrismaModule,
    PermissionsModule,

    HospitalRequestModule,

    WorkspaceKnowledgeModule,

    WorkspaceIngestionModule,

    WorkspaceEmbeddingModule,

    WorkspaceContentModule,

    ReviewModule,

    CompetitorModule,

    GbpModule,

    AuthModule,

    StrategyModule,

    BrandMemoryModule,

    HospitalsModule,

    AdminModule,

    DoctorModule,

    ProductionModule,

    ContentCalendarModule,

    ContentGeneratorModule,

    ScriptStudioModule,

    AiAuditModule,

    OverviewModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
