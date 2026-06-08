import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  ContentCalendarCategory,
  ContentScriptStatus,
  ContentScriptType,
  Prisma
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { ContentGenerationService } from "./generation/content-generation.service";
import type {
  ScriptGenerationInput,
  ScriptGenerationOutput
} from "./generation/ai-content-provider";

const scriptInclude = {
  calendarItem:{
    select:{
      id:true,
      title:true,
      category:true,
      contentType:true
    }
  }
} satisfies Prisma.ContentCalendarScriptInclude;

export const SCRIPT_TEMPLATES = [
  {
    id:"educational",
    title:"Educational",
    type:"Educational",
    goal:"Explain one useful patient education point clearly.",
    tone:"Helpful, credible, simple",
    category:ContentCalendarCategory.EDUCATIONAL,
    scriptType:ContentScriptType.REEL
  },
  {
    id:"awareness",
    title:"Awareness",
    type:"Awareness",
    goal:"Create awareness around a symptom, condition, or prevention habit.",
    tone:"Reassuring and direct",
    category:ContentCalendarCategory.AWARENESS,
    scriptType:ContentScriptType.CAROUSEL
  },
  {
    id:"doctor-branding",
    title:"Doctor Branding",
    type:"Doctor Branding",
    goal:"Position the doctor as a trusted expert.",
    tone:"Warm, authoritative, human",
    category:ContentCalendarCategory.DOCTOR_BRANDING,
    scriptType:ContentScriptType.REEL
  },
  {
    id:"patient-story",
    title:"Patient Story",
    type:"Patient Story",
    goal:"Tell an anonymized patient transformation story.",
    tone:"Empathetic and ethical",
    category:ContentCalendarCategory.PATIENT_STORY,
    scriptType:ContentScriptType.SHORT_VIDEO
  },
  {
    id:"treatment-explainer",
    title:"Treatment Explainer",
    type:"Treatment Explainer",
    goal:"Explain a treatment journey and reduce patient uncertainty.",
    tone:"Practical and calm",
    category:ContentCalendarCategory.EDUCATIONAL,
    scriptType:ContentScriptType.CAROUSEL
  },
  {
    id:"seasonal",
    title:"Seasonal",
    type:"Seasonal",
    goal:"Connect care advice to a seasonal health moment.",
    tone:"Timely and approachable",
    category:ContentCalendarCategory.SEASONAL,
    scriptType:ContentScriptType.POST
  },
  {
    id:"special-day",
    title:"Special Day",
    type:"Special Day",
    goal:"Use a healthcare special day to educate and build trust.",
    tone:"Respectful and memorable",
    category:ContentCalendarCategory.SPECIAL_DAY,
    scriptType:ContentScriptType.REEL
  },
  {
    id:"trending-topic",
    title:"Trending Topic",
    type:"Trending Topic",
    goal:"Respond to a trend with medically responsible context.",
    tone:"Current but clinically grounded",
    category:ContentCalendarCategory.TRENDING,
    scriptType:ContentScriptType.SHORT_VIDEO
  }
] as const;

@Injectable()
export class ScriptStudioService {
  constructor(
    private readonly prisma:PrismaService,
    private readonly generation:ContentGenerationService
  ) {}

  async list(
    hospitalId:string
  ) {
    const [
      scripts,
      calendarItems,
      brandVoice
    ] = await Promise.all([
      this.prisma.contentCalendarScript.findMany({
        where:{
          hospitalId,
          status:{ not:ContentScriptStatus.ARCHIVED }
        },
        include:scriptInclude,
        orderBy:[
          { updatedAt:"desc" },
          { version:"desc" }
        ]
      }),
      this.prisma.contentCalendarItem.findMany({
        where:{
          hospitalId,
          deletedAt:null
        },
        orderBy:{ scheduledDate:"asc" },
        select:{
          id:true,
          title:true,
          description:true,
          contentType:true,
          category:true,
          scheduledDate:true,
          specialDayName:true
        }
      }),
      this.prisma.brandVoice.findUnique({
        where:{ hospitalId },
        select:{
          tone:true,
          style:true,
          audience:true,
          messaging:true
        }
      })
    ]);

    return {
      scripts:scripts.map(serializeScript),
      calendarItems:calendarItems.map((item) => ({
        ...item,
        scheduledDate:item.scheduledDate.toISOString()
      })),
      templates:SCRIPT_TEMPLATES,
      brandVoice
    };
  }

  async get(
    hospitalId:string,
    id:string
  ) {
    const script = await this.prisma.contentCalendarScript.findFirst({
      where:{
        id,
        hospitalId
      },
      include:scriptInclude
    });

    if (!script) {
      throw new NotFoundException("Script not found");
    }

    return serializeScript(script);
  }

  async generate(
    hospitalId:string,
    actorId:string,
    input:any
  ) {
    const calendarItemId = requiredString(
      input.calendarItemId,
      "calendarItemId"
    );
    const context = await this.getGenerationContext(
      hospitalId,
      calendarItemId,
      input
    );
    const output = await this.generation.generateScript(context);

    return this.createVersion(
      hospitalId,
      actorId,
      calendarItemId,
      {
        title:input.title ?? context.title,
        scriptType:input.scriptType ?? inferScriptType(context.contentType),
        ...output
      }
    );
  }

  async create(
    hospitalId:string,
    actorId:string,
    input:any
  ) {
    const calendarItemId = requiredString(
      input.calendarItemId,
      "calendarItemId"
    );
    await this.ensureCalendarItem(
      hospitalId,
      calendarItemId
    );

    return this.createVersion(
      hospitalId,
      actorId,
      calendarItemId,
      {
        title:input.title,
        scriptType:input.scriptType,
        hook:input.hook,
        script:input.script,
        caption:input.caption,
        cta:input.cta,
        hashtags:input.hashtags,
        metadata:input.metadata
      }
    );
  }

  async update(
    hospitalId:string,
    actorId:string,
    id:string,
    input:any
  ) {
    await this.get(
      hospitalId,
      id
    );

    const status = input.status === undefined
      ? undefined
      : parseEnum(
          ContentScriptStatus,
          input.status,
          "status"
        );
    const data:Prisma.ContentCalendarScriptUncheckedUpdateInput = {};

    if (input.title !== undefined) data.title = String(input.title);
    if (input.scriptType !== undefined) {
      data.scriptType = parseEnum(
        ContentScriptType,
        input.scriptType,
        "scriptType"
      );
    }
    if (status !== undefined) {
      data.status = status;
      if (status === ContentScriptStatus.APPROVED) {
        data.approvedBy = actorId;
        data.approvedAt = new Date();
      }
    }
    if (input.hook !== undefined) data.hook = String(input.hook ?? "");
    if (input.script !== undefined) data.script = String(input.script ?? "");
    if (input.caption !== undefined) data.caption = String(input.caption ?? "");
    if (input.cta !== undefined) data.cta = String(input.cta ?? "");
    if (input.hashtags !== undefined) data.hashtags = normalizeTags(input.hashtags);
    if (input.metadata !== undefined) data.metadata = input.metadata ?? {};

    const script = await this.prisma.contentCalendarScript.update({
      where:{ id },
      data,
      include:scriptInclude
    });

    return serializeScript(script);
  }

  async remove(
    hospitalId:string,
    id:string
  ) {
    await this.get(
      hospitalId,
      id
    );

    const script = await this.prisma.contentCalendarScript.update({
      where:{ id },
      data:{ status:ContentScriptStatus.ARCHIVED },
      include:scriptInclude
    });

    return serializeScript(script);
  }

  private async getGenerationContext(
    hospitalId:string,
    calendarItemId:string,
    input:any
  ):Promise<ScriptGenerationInput> {
    const [
      hospital,
      calendarItem,
      brandVoice
    ] = await Promise.all([
      this.prisma.hospitalWorkspace.findUniqueOrThrow({
        where:{ id:hospitalId },
        select:{
          name:true,
          specialty:true,
          city:true
        }
      }),
      this.ensureCalendarItem(
        hospitalId,
        calendarItemId
      ),
      this.prisma.brandVoice.findUnique({
        where:{ hospitalId },
        select:{
          tone:true,
          style:true,
          audience:true,
          messaging:true
        }
      })
    ]);

    return {
      hospital,
      brandVoice,
      doctorName:input.doctorName ?? null,
      targetAudience:input.targetAudience ?? brandVoice?.audience ?? "patients",
      contentCategory:String(input.contentCategory ?? calendarItem.category),
      contentType:String(input.contentType ?? calendarItem.contentType),
      goal:input.goal ?? "Create useful patient-facing content.",
      tone:input.tone ?? brandVoice?.tone ?? "clear and trustworthy",
      title:input.title ?? calendarItem.title,
      description:input.description ?? calendarItem.description
    };
  }

  private async ensureCalendarItem(
    hospitalId:string,
    calendarItemId:string
  ) {
    const item = await this.prisma.contentCalendarItem.findFirst({
      where:{
        id:calendarItemId,
        hospitalId,
        deletedAt:null
      },
      select:{
        id:true,
        title:true,
        description:true,
        contentType:true,
        category:true
      }
    });

    if (!item) {
      throw new NotFoundException("Calendar item not found");
    }

    return item;
  }

  private async createVersion(
    hospitalId:string,
    actorId:string,
    calendarItemId:string,
    input:any
  ) {
    const latest = await this.prisma.contentCalendarScript.findFirst({
      where:{ calendarItemId },
      orderBy:{ version:"desc" },
      select:{ version:true }
    });
    const script = await this.prisma.contentCalendarScript.create({
      data:{
        hospitalId,
        calendarItemId,
        createdBy:actorId,
        title:requiredString(
          input.title,
          "title"
        ),
        scriptType:parseEnum(
          ContentScriptType,
          input.scriptType ?? ContentScriptType.POST,
          "scriptType"
        ),
        hook:String(input.hook ?? ""),
        script:String(input.script ?? ""),
        caption:String(input.caption ?? ""),
        cta:String(input.cta ?? ""),
        hashtags:normalizeTags(input.hashtags),
        metadata:input.metadata ?? {},
        version:(latest?.version ?? 0) + 1
      },
      include:scriptInclude
    });

    await this.prisma.contentCalendarItem.update({
      where:{ id:calendarItemId },
      data:{ status:"SCRIPT_READY" }
    });

    return serializeScript(script);
  }
}

function inferScriptType(
  contentType:string
) {
  if (contentType === "REEL") return ContentScriptType.REEL;
  if (contentType === "CAROUSEL") return ContentScriptType.CAROUSEL;
  if (contentType === "YOUTUBE_SHORT") return ContentScriptType.SHORT_VIDEO;

  return ContentScriptType.POST;
}

function requiredString(
  value:unknown,
  field:string
) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BadRequestException(`${field} is required`);
  }

  return value.trim();
}

function parseEnum<T extends Record<string, string>>(
  source:T,
  value:unknown,
  field:string
) {
  if (
    typeof value === "string" &&
    Object.values(source).includes(value)
  ) {
    return value as T[keyof T];
  }

  throw new BadRequestException(`${field} is invalid`);
}

function normalizeTags(
  value:unknown
) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function serializeScript(
  script:Prisma.ContentCalendarScriptGetPayload<{
    include:typeof scriptInclude;
  }>
) {
  return {
    ...script,
    approvedAt:script.approvedAt?.toISOString() ?? null,
    createdAt:script.createdAt.toISOString(),
    updatedAt:script.updatedAt.toISOString()
  };
}
