import {
  Injectable,
  Logger
} from "@nestjs/common";

import {
  ContentPlatform,
  ContentStatus
} from "@prisma/client";

import OpenAI from "openai";

import {
  PrismaService
} from "../prisma.service";

import { AIUsageTracker }
from "../ai-audit/ai-usage-tracker.service";

const localOnlyContent =
process.env.OPENAI_QUOTA_APPROVED === "false" ||
process.env.DISABLE_OPENAI === "true" ||
process.env.AI_CONTENT_PROVIDER === "local";

@Injectable()
export class WorkspaceContentService {
  private readonly logger =
    new Logger(WorkspaceContentService.name);

  private readonly openai =
    new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY
    });

  constructor(
    private prisma:
      PrismaService,
    private readonly aiUsageTracker:
      AIUsageTracker
  ) {}

  async findAll(
    workspaceId:string
  ) {
    return await this
      .prisma
      .contentDraft
      .findMany({
        where:{
          workspaceId
        },
        orderBy:{
          createdAt:"desc"
        }
      });
  }

  async generate(
    workspaceId:string,
    body:any
  ) {
    const {
      type,
      platform
    } = body;

    const chunks = [
      {
        chunkText:
          "Aayu Geriatrics provides elderly healthcare, preventive care, consultations and wellness services."
      }
    ];

    this.logger.log(
      `Generating ${type} content for ${platform} using ${chunks.length} memory chunks`
    );

    const memoryText =
      chunks
        .map((chunk)=>chunk.chunkText)
        .join("\n");

    const {
      generatedTitle,
      generatedContent
    } = await this.generateDraftText(
      workspaceId,
      platform,
      type,
      memoryText
    );

    const draft =
      await this.prisma.contentDraft.create({
        data:{
          workspaceId,
          title:
            generatedTitle,
          content:
            generatedContent,
          platform,
          status:
            "DRAFT"
        }
      });

    return draft;
  }

  async updateStatus(
    draftId:string,
    status:ContentStatus
  ) {
    return await this
      .prisma
      .contentDraft
      .update({
        where:{
          id:draftId
        },
        data:{
          status
        }
      });
  }

  private async generateDraftText(
    workspaceId:string,
    platform:ContentPlatform,
    type:string,
    memoryText:string
  ) {
    if(
      localOnlyContent ||
      !process.env.OPENAI_API_KEY
    ) {
      return this.localDraft(
        platform,
        type,
        memoryText
      );
    }

    try {
      const model = "gpt-4.1-mini";
      const response =
        await this.aiUsageTracker.execute({
          hospitalId:workspaceId,
          feature:"workspace-content.generate",
          provider:"openai",
          model,
          operation:()=>this.openai.chat.completions.create({
            model,
            messages:[
              {
                role:
                  "system",
                content:
                  "You are a healthcare content strategist"
              },
              {
                role:
                  "user",
                content:
                  `
Use this knowledge:

${memoryText}

Generate educational ${platform} content.

Include:

Title
Caption
CTA
Hashtags
`
              }
            ]
          })
        });

      const generatedContent =
        response.choices[0]
          .message.content || "";

      return {
        generatedTitle:
          this.extractTitle(
            generatedContent,
            platform
          ) || `${platform} ${type}`,
        generatedContent
      };
    } catch(error:any) {
      if(
        this.shouldUseLocalFallback(error)
      ) {
        this.logger.warn(
          "Using local content fallback"
        );

        return this.localDraft(
          platform,
          type,
          memoryText
        );
      }

      throw error;
    }
  }

  private shouldUseLocalFallback(
    error:any
  ) {
    return error?.code === "insufficient_quota" ||
      error?.status === 429 ||
      String(error?.message || "").includes("insufficient_quota");
  }

  private localDraft(
    platform:ContentPlatform,
    type:string,
    memoryText:string
  ) {
    return {
      generatedTitle:
        `${platform} ${type || "Content"} Draft`,
      generatedContent:
        `
Healthy ENT Care Tips

Small daily habits can create long-term health benefits.

- Notice recurring ear, nose, throat, sinus, hearing, or voice symptoms early.
- Keep follow-up visits and preventive checkups on schedule.
- Ask a qualified ENT specialist before trying treatment advice found online.

${memoryText}

Book a consultation today.

#ENTCare
#PatientEducation
#Healthcare
`
    };
  }

  private extractTitle(
    content:string,
    platform:ContentPlatform
  ) {
    const titleLine =
      content
        .split("\n")
        .find((line)=>
          line
            .toLowerCase()
            .startsWith("title")
        );

    if(!titleLine) {
      return `${platform} Draft`;
    }

    return titleLine
      .replace(/^title\s*:\s*/i, "")
      .trim() ||
      `${platform} Draft`;
  }
}
