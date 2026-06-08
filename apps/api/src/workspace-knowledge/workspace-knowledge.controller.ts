import {
  Body,
  Controller,
  Get,
  Param,
  Post
}
from "@nestjs/common";

import {
  KnowledgeSourceType,
  WorkspaceKnowledgeService
}
from "./workspace-knowledge.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller("workspace")

export class WorkspaceKnowledgeController{

constructor(

private service:
WorkspaceKnowledgeService

){}

@Get(":workspaceId")

getWorkspace(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.getWorkspace(workspaceId)

}

@Get(":workspaceId/knowledge")

findAll(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.findAll(workspaceId)

}

@Post(":workspaceId/knowledge")

create(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string,

@Body()
body:{
sourceType:KnowledgeSourceType;
sourceName:string;
sourceUrl?:string;
}

){

return this
.service
.create(
workspaceId,
body
)

}

}
