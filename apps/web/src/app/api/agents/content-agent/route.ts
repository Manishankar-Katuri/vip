import OpenAI from "openai";
import { NextResponse } from "next/server";
import { executeTrackedAI } from "@/lib/ai-audit";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { hospitalName, topic } = body;

    const model = "gpt-4.1-mini";
    const response = await executeTrackedAI({
      hospitalId:body.hospitalId ?? null,
      userId:body.userId ?? null,
      roleId:body.roleId ?? null,
      feature:"content-agent",
      provider:"openai",
      model,
      operation:()=>client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are VIP Content Intelligence for hospital marketing. Return only valid JSON."
        },
        {
          role: "user",
          content: `
Hospital: ${hospitalName}
Topic: ${topic}

Return ONLY valid JSON:

{
  "headline":"",
  "caption":"",
  "hashtags":[]
}
`
        }
      ]
      })
    });

    const raw = response.choices[0].message.content || "{}";

    const content = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error:any) {

    console.error(error);

    return NextResponse.json({
      success:false,
      error:error.message
    });
  }
}
