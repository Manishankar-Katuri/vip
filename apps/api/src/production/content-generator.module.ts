import { Module } from '@nestjs/common';

import { CurrentHospitalService } from '../common/context/current-hospital.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentGeneratorController } from './content-generator.controller';
import { ContentGeneratorService } from './content-generator.service';
import { ContentGenerationService } from './generation/content-generation.service';
import { MockContentProvider } from './generation/mock-content-provider';

@Module({
  imports: [PrismaModule],
  controllers: [ContentGeneratorController],
  providers: [
    CurrentHospitalService,
    MockContentProvider,
    ContentGenerationService,
    ContentGeneratorService,
  ],
})
export class ContentGeneratorModule {}
