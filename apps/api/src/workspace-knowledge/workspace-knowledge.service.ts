import {
  BadRequestException,
  Injectable
}
from "@nestjs/common";

import {
  PrismaService
}
from "../prisma.service";

const allowedSourceTypes = [
  "WEBSITE",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
  "REVIEWS",
  "BLOG"
] as const;

export type KnowledgeSourceType =
  typeof allowedSourceTypes[number];

type CreateKnowledgeSourceInput = {
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl?: string;
};

@Injectable()

export class WorkspaceKnowledgeService{

constructor(

private prisma:
PrismaService

){}

async getWorkspace(
workspaceId:string
){

const workspace =
await this
.prisma
.hospitalWorkspace
.findUnique({

where:{
id:workspaceId
},

include:{
knowledgeSources:true,
hospitalRequest:true
}

})

if(!workspace){

return null

}

return {
id:
workspace.id,

hospitalName:
workspace.hospitalName,

slug:
workspace.slug,

status:
workspace.status,

knowledgeSources:
workspace.knowledgeSources,

hospitalRequest:
workspace.hospitalRequest
}

}

async findAll(
workspaceId:string
){

return await this
.prisma
.knowledgeSource
.findMany({

where:{
workspaceId
},

orderBy:{
createdAt:"desc"
}

})

}

async create(
workspaceId:string,
data:CreateKnowledgeSourceInput
){

if(
!allowedSourceTypes.includes(
data.sourceType
)
){

throw new BadRequestException(
"Invalid sourceType"
)

}

return await this
.prisma
.knowledgeSource
.create({

data:{
workspaceId,

sourceType:
data.sourceType,

sourceName:
data.sourceName,

sourceUrl:
data.sourceUrl
}

})

}

}
