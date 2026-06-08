import {
  Injectable,
  Logger
} from "@nestjs/common";
import OpenAI from "openai";

import { AIUsageTracker }
from "../ai-audit/ai-usage-tracker.service";

@Injectable()
export class BrandMemoryAIService{

private readonly logger =
new Logger(
BrandMemoryAIService.name
);

private openai=
new OpenAI({

apiKey:
process.env.OPENAI_API_KEY

});

constructor(
private readonly aiUsageTracker:AIUsageTracker
){}


async extract(
content:string
){

try{

const response=

await this.aiUsageTracker.execute({
feature:"brand-memory.extract",
provider:"openai",
model:"gpt-4.1-mini",
operation:()=>this.openai.chat.completions.create({

model:"gpt-4.1-mini",

messages:[

{
role:"system",

content:`

Extract:

hospitalName
specialty
tone
audience
topics
hashtags
contentPatterns
doctorNames

Return JSON only

`

},

{

role:"user",

content

}

],

response_format:{

type:"json_object"

}

})
});

return JSON.parse(

response.choices[0]
.message
.content||

"{}"

);

}

catch{

this
.logger
.warn(
"Using fallback extraction"
);

return{

specialty:"ENT",

tone:
"Professional + caring",

audience:
"Parents, adults",

topics:[

"Sinus care",

"Hearing",

"ENT awareness"

],

hashtags:[

"#ENTCare"

],

contentPatterns:[

"Doctor videos",

"Educational reels"

]

};

}

}

}
