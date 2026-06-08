import {
  Body,
  Controller,
  Get,
  Param,
  Post
}
from "@nestjs/common";

import {
  WorkspaceEmbeddingService
}
from "./workspace-embedding.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller("workspace")

export class WorkspaceEmbeddingController{

constructor(

private service:
WorkspaceEmbeddingService

){}

@Post(":workspaceId/embed")

embedWorkspace(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.embedWorkspace(
workspaceId
)

}

@Post(":workspaceId/search")

searchWorkspace(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string,

@Body()
body:{
query:string;
}

){

return this
.service
.searchWorkspace(
workspaceId,
body.query
)

}

@Post(":workspaceId/chat")

chatWorkspace(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string,

@Body()
body:{
message:string;
}

){

return this
.service
.chatWorkspace(
workspaceId,
body.message
)

}

@Get(":workspaceId/vector-memory/count")

getVectorMemoryCount(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.getVectorMemoryCount(
workspaceId
)

}

}
