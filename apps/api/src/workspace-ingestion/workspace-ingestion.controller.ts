import {
  Body,
  Controller,
  Get,
  Param,
  Post
}
from "@nestjs/common";

import {
  WorkspaceIngestionService
}
from "./workspace-ingestion.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller("workspace")

export class WorkspaceIngestionController{

constructor(

private service:
WorkspaceIngestionService

){}

@Post(":workspaceId/ingest/website")

ingestWebsite(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string,

@Body()
body:{
url:string;
}

){

return this
.service
.ingestWebsite(
workspaceId,
body.url
)

}

@Get(":workspaceId/website-content/count")

getWebsiteContentCount(

@Param("workspaceId", WorkspaceIdPipe)
workspaceId:string

){

return this
.service
.getWebsiteContentCount(
workspaceId
)

}

}
