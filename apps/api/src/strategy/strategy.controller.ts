import {
Controller,
Post,
Body
}
from "@nestjs/common";

import { StrategyService }
from "./strategy.service";

@Controller(
"strategy"
)

export class StrategyController{

constructor(
private service:
StrategyService
){}

@Post()

generate(

@Body()
body:any

){

return this.service
.generateStrategy(

body.dashboard,

body.competitor

)

}

}