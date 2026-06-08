import OpenAI from "openai";
import { executeTrackedAI } from "@/lib/ai-audit";

const client = new OpenAI({

 apiKey:process.env.OPENAI_API_KEY

});

export async function generateAI(prompt:string){

const model = "gpt-4.1-mini";

const completion=await executeTrackedAI({
feature:"web.generate-ai",
provider:"openai",
model,
operation:()=>client.chat.completions.create({

model,

messages:[

{
role:"user",
content:prompt
}

],

temperature:.7

})
});

return completion.choices[0].message.content;

}
