import {
Controller,
Post,
Get,
Body,
Param
}
from "@nestjs/common";

import { BrandMemoryService }
from "./brand-memory.service";

import { BrandMemoryAIService }
from "./brand-memory-ai.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller(
"workspace/:workspaceId/memory"
)

export class BrandMemoryController{

constructor(

private service:
BrandMemoryService,

private ai:
BrandMemoryAIService

){}


/*
MANUAL MEMORY SAVE
*/

@Post()

create(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string,

@Body()
body:any

){

return this.service.create(

workspaceId,

body

)

}


/*
GET MEMORY
*/

@Get()

get(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string

){

return this.service.get(
workspaceId
)

}


/*
AI EXTRACTION
*/

@Post(
"extract"
)

extract(

@Body()
body:any

){

return this.ai.extract(

body.content

)

}

}
