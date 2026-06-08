import { Module } from "@nestjs/common";

import { GbpController }
from "./gbp.controller";

import { GbpService }
from "./gbp.service";

@Module({

controllers:[
GbpController
],

providers:[
GbpService
]

})

export class GbpModule {}