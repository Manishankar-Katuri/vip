import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ID;

    if (!accessToken) {
      throw new Error("FACEBOOK_ACCESS_TOKEN missing");
    }

    if (!igBusinessId) {
      throw new Error("INSTAGRAM_BUSINESS_ID missing");
    }

    const url = `https://graph.facebook.com/v22.0/${igBusinessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`;

    const response = await fetch(url);

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
