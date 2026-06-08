import {
Controller,
Get,
Param
}
from "@nestjs/common";

import {
CompetitorService
}
from "./competitor.service";

@Controller(
"competitors"
)

export class CompetitorController{

constructor(

private readonly service:
CompetitorService

){}

@Get(
":hospital"
)

nearby(

@Param(
"hospital"
)

hospital:string

){

return this.service
.findNearbyCompetitors(
hospital
)

}


@Get(
"reviews/:hospital"
)

reviews(

@Param(
"hospital"
)

hospital:string

){

return this.service
.getReviews(
hospital
)

}

}