import {
Controller,
Post,
Get,
Body,
Patch,
Param
}
from "@nestjs/common";

import {
HospitalRequestService
}
from "./hospital-request.service";

@Controller(
"hospital-request"
)

export class HospitalRequestController{

constructor(

private service:
HospitalRequestService

){}

@Post()

create(

@Body()
body:any

){

return this
.service
.create(body)

}

@Get()

findAll(){

return this
.service
.findAll()

}

@Patch(":id")

updateStatus(

@Param("id")
id:string,

@Body()
body:{
status:"NEW"|"REVIEWING"|"APPROVED"|"SETUP"|"LIVE"
}

){

return this
.service
.updateStatus(
id,
body.status
)

}

}
