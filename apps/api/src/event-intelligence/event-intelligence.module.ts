import { Module } from "@nestjs/common";
import {
  EventReplayService,
  InMemoryEventTelemetry,
  OrchestrationEventBus,
  PrismaEventStore,
  type EventStore,
} from "@vip/event-orchestrator";

import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { EventIntelligenceController } from "./event-intelligence.controller";
import { EventIntelligenceService } from "./event-intelligence.service";
import {
  EVENT_INTELLIGENCE_BUS,
  EVENT_INTELLIGENCE_REPLAY,
  EVENT_INTELLIGENCE_STORE,
  EVENT_INTELLIGENCE_TELEMETRY,
} from "./event-intelligence.tokens";

@Module({
  imports: [PrismaModule],
  controllers: [EventIntelligenceController],
  providers: [
    {
      provide: EVENT_INTELLIGENCE_STORE,
      useFactory: (prisma: PrismaService) => new PrismaEventStore(prisma),
      inject: [PrismaService],
    },
    {
      provide: EVENT_INTELLIGENCE_TELEMETRY,
      useFactory: () => new InMemoryEventTelemetry(),
    },
    {
      provide: EVENT_INTELLIGENCE_BUS,
      useFactory: (store: EventStore, telemetry: InMemoryEventTelemetry) =>
        new OrchestrationEventBus(store, undefined, undefined, telemetry),
      inject: [EVENT_INTELLIGENCE_STORE, EVENT_INTELLIGENCE_TELEMETRY],
    },
    {
      provide: EVENT_INTELLIGENCE_REPLAY,
      useFactory: (store: EventStore, bus: OrchestrationEventBus) => new EventReplayService(store, bus),
      inject: [EVENT_INTELLIGENCE_STORE, EVENT_INTELLIGENCE_BUS],
    },
    EventIntelligenceService,
  ],
  exports: [
    EventIntelligenceService,
    EVENT_INTELLIGENCE_BUS,
    EVENT_INTELLIGENCE_REPLAY,
    EVENT_INTELLIGENCE_STORE,
    EVENT_INTELLIGENCE_TELEMETRY,
  ],
})
export class EventIntelligenceModule {}
