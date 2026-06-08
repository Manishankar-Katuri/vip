import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BrandMemoryService {

constructor(
private prisma:
PrismaService
){}

async create(
workspaceId:string,
body:any
){

return this.prisma.brandMemory.create({

data:{

workspaceId,

hospitalName:
body.hospitalName,

specialty:
body.specialty,

tone:
body.tone,

audience:
body.audience,

doctors:
body.doctors,

platforms:
body.platforms,

topics:
body.topics,

hashtags:
body.hashtags,

contentPatterns:
body.contentPatterns

}

})

}

async get(
workspaceId:string
){

return this.prisma.brandMemory.findFirst({

where:{
workspaceId
}

})

}

}