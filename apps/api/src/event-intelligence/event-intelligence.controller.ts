import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { OrchestratedEvent, ReplayQuery } from "@vip/event-orchestrator";

import { EventIntelligenceService } from "./event-intelligence.service";

@Controller("event-intelligence")
export class EventIntelligenceController {
  constructor(private readonly events: EventIntelligenceService) {}

  @Get("health")
  health() {
    return this.events.health();
  }

  @Post("publish")
  publish(@Body() body: { event: OrchestratedEvent }) {
    return this.events.publish(body.event, {
      producer: "event-intelligence-api",
      source: { module: "dashboard", component: "manual-publish" },
    });
  }

  @Post("replay")
  replay(@Body() query: ReplayQuery) {
    return this.events.replay(query);
  }

  @Get("replay")
  replayByQuery(@Query() query: ReplayQuery) {
    return this.events.replay(query);
  }
}
