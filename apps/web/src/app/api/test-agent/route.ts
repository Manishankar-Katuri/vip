import OpenAI from "openai";
import { NextResponse } from "next/server";
import { executeTrackedAI } from "@/lib/ai-audit";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const model = "gpt-4.1-mini";
    const response = await executeTrackedAI({
      feature:"test-agent",
      provider:"openai",
      model,
      operation:()=>client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: "Say exactly: VIP agent online"
        }
      ],
      max_tokens: 20
      })
    });

    return NextResponse.json({
      success: true,
      output: response.choices[0].message.content
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
