import { generateAI } from "@/services/ai";
import { getContentPrompt } from "./prompt";

export const ContentAgent = {

    name:"content-agent",

    async execute(input:any){

        const prompt = getContentPrompt(input);

        const response = await generateAI(prompt);

        return {

            success:true,
            data:response

        };

    }

}