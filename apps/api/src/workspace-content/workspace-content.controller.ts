import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post
}
from "@nestjs/common";

import {
  ContentPlatform,
  ContentStatus
}
from "@prisma/client";

import {
  WorkspaceContentService
}
from "./workspace-content.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller("workspace")

export class WorkspaceContentController{

constructor(

private service:
WorkspaceContentService

){}

@Get(":workspaceId/content")

findAll(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.findAll(workspaceId)

}

@Post(":workspaceId/content/generate")

generate(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string,

@Body()
body:{
type:string;
platform:ContentPlatform;
}

){

return this
.service
.generate(
workspaceId,
body
)

}

@Patch("content/:draftId/status")

updateStatus(

@Param("draftId")
draftId:string,

@Body()
body:{
status:ContentStatus;
}

){

return this
.service
.updateStatus(
draftId,
body.status
)

}

}
