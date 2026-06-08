import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  ContentCalendarCategory,
  ContentCalendarPriority,
  ContentCalendarStatus,
  ContentCalendarType,
  Prisma
} from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type {
  ContentCalendarQuery,
  ContentCalendarResponseDto
} from "./content-calendar.dto";

const itemInclude = {
  creator:{
    select:{
      id:true,
      email:true,
      name:true
    }
  },
  assignee:{
    select:{
      id:true,
      email:true,
      name:true
    }
  },
  scripts:{
    orderBy:{ version:"desc" },
    take:1,
    select:{
      id:true,
      title:true,
      status:true
    }
  }
} satisfies Prisma.ContentCalendarItemInclude;

@Injectable()
export class ContentCalendarService {
  constructor(
    private readonly prisma:PrismaService
  ) {}

  async list(
    hospitalId:string,
    query:ContentCalendarQuery
  ):Promise<ContentCalendarResponseDto> {
    const where = this.buildWhere(
      hospitalId,
      query
    );
    const [
      items,
      allActiveItems,
      assignedUsers
    ] = await Promise.all([
      this.prisma.contentCalendarItem.findMany({
        where,
        include:itemInclude,
        orderBy:[
          { scheduledDate:"asc" },
          { position:"asc" },
          { createdAt:"asc" }
        ]
      }),
      this.prisma.contentCalendarItem.findMany({
        where:{
          hospitalId,
          deletedAt:null
        },
        select:{
          status:true,
          scheduledDate:true,
          campaignId:true
        }
      }),
      this.prisma.user.findMany({
        where:{
          OR:[
            { hospitalId },
            { isGlobal:true }
          ],
          isActive:true
        },
        orderBy:{ email:"asc" },
        select:{
          id:true,
          email:true,
          name:true
        }
      })
    ]);

    return {
      items:items.map(serializeItem),
      filters:{
        statuses:Object.values(ContentCalendarStatus),
        contentTypes:Object.values(ContentCalendarType),
        categories:Object.values(ContentCalendarCategory),
        priorities:Object.values(ContentCalendarPriority),
        assignedUsers,
        campaigns:getCampaignOptions(allActiveItems)
      },
      summary:this.buildSummary(allActiveItems)
    };
  }

  async create(
    hospitalId:string,
    actorId:string,
    input:any
  ) {
    const data = this.normalizeInput(
      input,
      actorId
    );
    const item = await this.prisma.contentCalendarItem.create({
      data:{
        ...data,
        hospitalId
      },
      include:itemInclude
    });

    return serializeItem(item);
  }

  async update(
    hospitalId:string,
    id:string,
    input:any
  ) {
    await this.ensureItem(
      hospitalId,
      id
    );

    const item = await this.prisma.contentCalendarItem.update({
      where:{ id },
      data:this.normalizePartialInput(input),
      include:itemInclude
    });

    return serializeItem(item);
  }

  async remove(
    hospitalId:string,
    id:string
  ) {
    await this.ensureItem(
      hospitalId,
      id
    );

    const item = await this.prisma.contentCalendarItem.update({
      where:{ id },
      data:{
        deletedAt:new Date(),
        status:ContentCalendarStatus.CANCELLED
      },
      include:itemInclude
    });

    return serializeItem(item);
  }

  private async ensureItem(
    hospitalId:string,
    id:string
  ) {
    const item = await this.prisma.contentCalendarItem.findFirst({
      where:{
        id,
        hospitalId,
        deletedAt:null
      },
      select:{ id:true }
    });

    if (!item) {
      throw new NotFoundException("Content calendar item not found");
    }
  }

  private buildWhere(
    hospitalId:string,
    query:ContentCalendarQuery
  ):Prisma.ContentCalendarItemWhereInput {
    const where:Prisma.ContentCalendarItemWhereInput = {
      hospitalId,
      deletedAt:null
    };

    if (query.status) {
      where.status = parseEnum(
        ContentCalendarStatus,
        query.status,
        "status"
      );
    }

    if (query.contentType) {
      where.contentType = parseEnum(
        ContentCalendarType,
        query.contentType,
        "contentType"
      );
    }

    if (query.category) {
      where.category = parseEnum(
        ContentCalendarCategory,
        query.category,
        "category"
      );
    }

    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    const scheduledDate:Prisma.DateTimeFilter = {};

    if (query.dateFrom) {
      scheduledDate.gte = parseDate(
        query.dateFrom,
        "dateFrom"
      );
    }

    if (query.dateTo) {
      scheduledDate.lte = endOfDay(
        parseDate(
          query.dateTo,
          "dateTo"
        )
      );
    }

    if (scheduledDate.gte || scheduledDate.lte) {
      where.scheduledDate = scheduledDate;
    }

    return where;
  }

  private normalizeInput(
    input:any,
    actorId:string
  ):Omit<Prisma.ContentCalendarItemUncheckedCreateInput, "hospitalId"> {
    if (!input?.title) {
      throw new BadRequestException("title is required");
    }

    if (!input?.scheduledDate) {
      throw new BadRequestException("scheduledDate is required");
    }

    return {
      title:String(input.title),
      description:input.description ? String(input.description) : "",
      contentType:parseEnum(
        ContentCalendarType,
        input.contentType ?? ContentCalendarType.POST,
        "contentType"
      ),
      category:parseEnum(
        ContentCalendarCategory,
        input.category ?? ContentCalendarCategory.EDUCATIONAL,
        "category"
      ),
      status:parseEnum(
        ContentCalendarStatus,
        input.status ?? ContentCalendarStatus.IDEA,
        "status"
      ),
      priority:parseEnum(
        ContentCalendarPriority,
        input.priority ?? ContentCalendarPriority.MEDIUM,
        "priority"
      ),
      scheduledDate:parseDate(
        input.scheduledDate,
        "scheduledDate"
      ),
      publishedDate:input.publishedDate
        ? parseDate(
            input.publishedDate,
            "publishedDate"
          )
        : null,
      campaignId:nullableString(input.campaignId),
      createdBy:actorId,
      assignedTo:nullableString(input.assignedTo),
      tags:normalizeTags(input.tags),
      isSpecialDay:Boolean(input.isSpecialDay),
      specialDayName:nullableString(input.specialDayName),
      position:Number.isFinite(Number(input.position))
        ? Number(input.position)
        : 0
    };
  }

  private normalizePartialInput(
    input:any
  ):Prisma.ContentCalendarItemUncheckedUpdateInput {
    const data:Prisma.ContentCalendarItemUncheckedUpdateInput = {};

    if (input.title !== undefined) data.title = String(input.title);
    if (input.description !== undefined) {
      data.description = String(input.description ?? "");
    }
    if (input.contentType !== undefined) {
      data.contentType = parseEnum(
        ContentCalendarType,
        input.contentType,
        "contentType"
      );
    }
    if (input.category !== undefined) {
      data.category = parseEnum(
        ContentCalendarCategory,
        input.category,
        "category"
      );
    }
    if (input.status !== undefined) {
      data.status = parseEnum(
        ContentCalendarStatus,
        input.status,
        "status"
      );
    }
    if (input.priority !== undefined) {
      data.priority = parseEnum(
        ContentCalendarPriority,
        input.priority,
        "priority"
      );
    }
    if (input.scheduledDate !== undefined) {
      data.scheduledDate = parseDate(
        input.scheduledDate,
        "scheduledDate"
      );
    }
    if (input.publishedDate !== undefined) {
      data.publishedDate = input.publishedDate
        ? parseDate(
            input.publishedDate,
            "publishedDate"
          )
        : null;
    }
    if (input.campaignId !== undefined) {
      data.campaignId = nullableString(input.campaignId);
    }
    if (input.assignedTo !== undefined) {
      data.assignedTo = nullableString(input.assignedTo);
    }
    if (input.tags !== undefined) {
      data.tags = normalizeTags(input.tags);
    }
    if (input.isSpecialDay !== undefined) {
      data.isSpecialDay = Boolean(input.isSpecialDay);
    }
    if (input.specialDayName !== undefined) {
      data.specialDayName = nullableString(input.specialDayName);
    }
    if (input.position !== undefined) {
      data.position = Number(input.position);
    }

    return data;
  }

  private buildSummary(
    items:Array<{
      status:ContentCalendarStatus;
      scheduledDate:Date;
    }>
  ) {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return {
      contentPlanned:items.filter((item) =>
        item.status !== ContentCalendarStatus.CANCELLED
      ).length,
      readyToPost:items.filter((item) =>
        item.status === ContentCalendarStatus.READY_TO_POST
      ).length,
      published:items.filter((item) =>
        item.status === ContentCalendarStatus.PUBLISHED
      ).length,
      overdue:items.filter((item) =>
        item.scheduledDate < now &&
        item.status !== ContentCalendarStatus.PUBLISHED &&
        item.status !== ContentCalendarStatus.CANCELLED
      ).length,
      upcomingThisWeek:items.filter((item) =>
        item.scheduledDate >= now &&
        item.scheduledDate <= weekEnd &&
        item.status !== ContentCalendarStatus.CANCELLED
      ).length
    };
  }
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

function parseDate(
  value:unknown,
  field:string
) {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} is invalid`);
  }

  return date;
}

function endOfDay(
  date:Date
) {
  const next = new Date(date);
  next.setHours(
    23,
    59,
    59,
    999
  );

  return next;
}

function normalizeTags(
  value:unknown
) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function nullableString(
  value:unknown
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function serializeItem(
  item:Prisma.ContentCalendarItemGetPayload<{
    include:typeof itemInclude;
  }>
) {
  const [latestScript] = item.scripts;

  return {
    ...item,
    scripts:undefined,
    script:latestScript ?? null,
    scheduledDate:item.scheduledDate.toISOString(),
    publishedDate:item.publishedDate?.toISOString() ?? null,
    createdAt:item.createdAt.toISOString(),
    updatedAt:item.updatedAt.toISOString()
  };
}

function getCampaignOptions(
  items:Array<{ campaignId:string | null }>
) {
  return Array.from(
    new Set(
      items
        .map((item) => item.campaignId)
        .filter((id): id is string => Boolean(id))
    )
  ).map((id) => ({
    id,
    title:id
  }));
}
