import {
  BadRequestException,
  Injectable
}
from "@nestjs/common";

import axios from "axios";
import * as cheerio from "cheerio";

import {
  PrismaService
}
from "../prisma.service";

@Injectable()

export class WorkspaceIngestionService{

constructor(

private prisma:
PrismaService

){}

async ingestWebsite(
workspaceId:string,
url:string
){

if(!url){

throw new BadRequestException(
"url is required"
)

}

const response =
await axios.get<string>(
url
)

const $ =
cheerio.load(
response.data
)

const title =
$("title")
.first()
.text()
.trim()

const description =
$('meta[name="description"]')
.attr("content")
?.trim()
||
$('meta[property="og:description"]')
.attr("content")
?.trim()
||
""

const content =
$("p")
.map((_,element)=>
$(element)
.text()
.trim()
)
.get()
.filter(Boolean)
.join("\n\n")

return await this
.prisma
.websiteContent
.create({

data:{
workspaceId,
url,
title,
description,
content
}

})

}

async getWebsiteContentCount(
workspaceId:string
){

const count =
await this
.prisma
.websiteContent
.count({

where:{
workspaceId
}

})

return {
count
}

}

}
