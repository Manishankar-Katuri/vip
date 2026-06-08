import {
Controller,
Post,
Get,
Patch,
Param,
Body
} from "@nestjs/common";

import { ReviewService }
from "./review.service";

import { WorkspaceIdPipe } from "../utils/workspace-id.pipe";

@Controller(
"workspace/:workspaceId/reviews"
)
export class ReviewController {

constructor(
private readonly reviewService:
ReviewService
){}


/*
IMPORT REVIEWS
*/

@Post(
"ingest"
)

async ingest(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string,

@Body()
body:any

){

return this.reviewService
.ingestReviews(

workspaceId,

body.reviews

);

}


/*
CREATE SINGLE REVIEW
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

return this.reviewService
.create(

workspaceId,

body

);

}


/*
ALL REVIEWS
*/

@Get()

findAll(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string

){

return this.reviewService
.findAll(
workspaceId
);

}


/*
ALERTS
*/

@Get(
"alerts"
)

findAlerts(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string

){

return this.reviewService
.findAlerts(
workspaceId
);

}


/*
ALERT DETAILS
*/

@Get(
"alerts/:alertId"
)

findAlertDetails(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string,

@Param(
"alertId"
)
alertId:string

){

return this.reviewService
.findAlertDetails(

workspaceId,
alertId

);

}


/*
RESOLVE
*/

@Patch(
"alerts/:alertId/resolve"
)

resolve(

@Param(
"alertId"
)
alertId:string

){

return this.reviewService
.resolveAlert(
alertId
);

}


/*
DASHBOARD
*/

@Get(
"dashboard"
)

dashboard(

@Param(
"workspaceId",
WorkspaceIdPipe
)
workspaceId:string

){

return this.reviewService
.dashboard(
workspaceId
);

}

}
