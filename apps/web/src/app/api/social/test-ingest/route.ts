import { NextResponse } from "next/server";

import { ingestInstagramPosts } from "@vip/social-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    console.log("Starting Instagram ingestion...");

    const result = await ingestInstagramPosts({ limit: 5 });

    console.log("Instagram ingestion success:", result);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("TEST INGEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Instagram ingestion failed.",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: false,
      error: "Use POST /api/social/test-ingest to run Instagram ingestion.",
    },
    { status: 405 }
  );
}
