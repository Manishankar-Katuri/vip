import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { hospitalName, topic, review, competitorName } = body;

    const baseUrl = "http://localhost:3000";

    const [contentRes, reviewRes, competitorRes] =
      await Promise.all([
        fetch(`${baseUrl}/api/agents/content-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hospitalName,
            topic,
          }),
        }),

        fetch(`${baseUrl}/api/agents/review-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            review,
          }),
        }),

        fetch(`${baseUrl}/api/agents/competitor-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hospitalName,
            competitorName,
          }),
        }),
      ]);

    const content = await contentRes.json();
    const reviewData = await reviewRes.json();
    const competitor = await competitorRes.json();

    return NextResponse.json({
      success: true,
      intelligence: {
        content: content.content,
        review: reviewData.analysis,
        competitor: competitor.analysis,
      },
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}