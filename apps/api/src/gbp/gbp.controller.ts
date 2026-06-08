import {
Controller,
Get,
Param
}
from "@nestjs/common";

import { GbpService }
from "./gbp.service";

@Controller("gbp")
export class GbpController{

constructor(
private service:GbpService
){}

@Get("accounts")
accounts(){

return this.service.getAccounts()

}

@Get(
"locations/:accountId"
)

locations(

@Param("accountId")
accountId:string

){

return this.service.getLocations(
accountId
)

}

}