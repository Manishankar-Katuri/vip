import { generateAI } from "@/services/ai";

export const ReviewAgent={

name:"review-agent",

async execute(input:any){

const prompt=`

Analyze reviews:

rating:${input.rating}

positive:${input.positiveThemes}

negative:${input.negativeThemes}

Give insights and suggestions.

`;

const response=await generateAI(prompt);

return{

success:true,
data:response

};

}

}