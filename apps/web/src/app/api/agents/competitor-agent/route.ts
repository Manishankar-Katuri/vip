import OpenAI from "openai";
import { NextResponse } from "next/server";
import { executeTrackedAI } from "@/lib/ai-audit";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      hospitalName,
      competitorName
    } = body;

    const model = "gpt-4.1-mini";
    const response =
      await executeTrackedAI({
      hospitalId:body.hospitalId ?? null,
      userId:body.userId ?? null,
      roleId:body.roleId ?? null,
      feature:"competitor-agent",
      provider:"openai",
      model,
      operation:()=>client.chat.completions.create({

      model,

      messages:[
        {
          role:"system",
          content:
          "You are VIP Competitor Intelligence. Return only valid JSON."
        },

        {
          role:"user",
          content:`
Hospital: ${hospitalName}
Competitor: ${competitorName}

Return:

{
 "strengths":[],
 "gaps":[],
 "campaignIdeas":[],
 "opportunities":[]
}
`
        }
      ]
      })
    });

    const raw =
      response.choices[0].message.content || "{}";

    const analysis =
      JSON.parse(raw);

    return NextResponse.json({
      success:true,
      analysis
    });

  } catch(error:any){

    return NextResponse.json({
      success:false,
      error:error.message
    });

  }

}
