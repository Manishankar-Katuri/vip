import {
 Injectable
}
from "@nestjs/common";

import {
 PrismaService
}
from "../prisma.service";

import {
 HospitalWorkspace,
 RequestStatus
}
from "@prisma/client";

import {
 slugify
}
from "../utils/slugify";

@Injectable()

export class HospitalRequestService{

constructor(

private prisma:
PrismaService

){}

async create(data:any){

return await this
.prisma
.hospitalRequest
.create({

data

})

}

async findAll(){

return await this
.prisma
.hospitalRequest
.findMany({

orderBy:{
createdAt:"desc"
}

})

}

async updateStatus(
id:string,
status:RequestStatus
){

const request =
await this
.prisma
.hospitalRequest
.update({

where:{
id
},

data:{
status
}

})

let workspace: HospitalWorkspace | null = null;

if(status==="APPROVED"){

workspace =
await this
.prisma
.hospitalWorkspace
.findUnique({

where:{
hospitalRequestId:
id
}

})

if(!workspace){

workspace =
await this
.prisma
.hospitalWorkspace
.create({

data:{
hospitalRequestId:
request.id,

name:
request.hospitalName,

hospitalName:
request.hospitalName,

slug:
slugify(
request.hospitalName
),

status:
"ACTIVE"
}

})

}

}

return {
request,
workspace
}

}

}
