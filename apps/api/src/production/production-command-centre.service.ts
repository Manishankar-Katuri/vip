import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import type { ProductionCommandCentreDto } from "./dto/production-command-centre.dto";

@Injectable()
export class ProductionCommandCentreService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async getCommandCentre(
    hospitalId:string
  ):Promise<ProductionCommandCentreDto> {
    const [
      hospital,
      contentDrafts,
      socialSignals,
      priorities
    ] = await Promise.all([
      this.prisma.hospitalWorkspace.findUniqueOrThrow({
        where:{ id:hospitalId },
        select:{
          id:true,
          name:true,
          specialty:true,
          city:true,
          status:true
        }
      }),
      this.prisma.contentDraft.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:{ createdAt:"desc" },
        take:25
      }),
      this.prisma.intelligenceSignal.findMany({
        where:{
          workspaceId:hospitalId,
          signalType:{ contains:"SOCIAL" }
        },
        orderBy:{ detectedAt:"desc" },
        take:10
      }),
      this.prisma.intelligencePriority.findMany({
        where:{ workspaceId:hospitalId },
        orderBy:[
          { urgency:"desc" },
          { strategicImportance:"desc" }
        ],
        take:10
      })
    ]);

    const draft = contentDrafts.filter(
      (item) => item.status === "DRAFT"
    ).length;
    const approved = contentDrafts.filter(
      (item) => item.status === "APPROVED"
    ).length;
    const published = contentDrafts.filter(
      (item) => item.status === "PUBLISHED"
    ).length;
    const highUrgencyPriorities = priorities.filter(
      (priority) => priority.urgency >= 0.7
    ).length;

    return {
      activeHospital:hospital,
      generatedAt:new Date().toISOString(),
      pipelineSummary:{
        totalContent:contentDrafts.length,
        draft,
        approved,
        published,
        status:this.pipelineStatus(
          draft,
          approved,
          contentDrafts.length
        )
      },
      upcomingContent:contentDrafts
        .filter((item) => item.status !== "PUBLISHED")
        .slice(0, 5)
        .map((item, index) => ({
          id:item.id,
          title:item.title,
          platform:item.platform,
          status:item.status,
          scheduledFor:this.futureDate(index + 1)
        })),
      campaignSummary:{
        activeCampaigns:Math.max(
          0,
          approved
        ),
        plannedCampaigns:draft,
        socialSignals:socialSignals.length,
        summary:socialSignals[0]?.summary ??
          "No current social intelligence signals for this hospital."
      },
      approvalSummary:{
        pendingApprovals:draft,
        readyToPublish:approved,
        blockedItems:highUrgencyPriorities,
        summary:highUrgencyPriorities > 0
          ? `${highUrgencyPriorities} priority items need production review before delivery.`
          : "No urgent production blockers detected."
      }
    };
  }

  private pipelineStatus(
    draft:number,
    approved:number,
    total:number
  ) {
    if (total === 0) return "No active content";
    if (approved >= draft) return "Ready for delivery";
    if (draft > approved * 2) return "Needs review";

    return "In progress";
  }

  private futureDate(
    offsetDays:number
  ) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    return date.toISOString();
  }
}
