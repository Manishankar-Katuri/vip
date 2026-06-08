import { NextResponse } from "next/server";

import {
  getCompetitors,
  saveCompetitors,
} from "@/lib/knowledge/competitor-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hospital = url.searchParams.get("hospital") ?? "";

  return NextResponse.json({
    success: true,
    competitors: getCompetitors(hospital),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const competitors = saveCompetitors(body.hospital ?? "", body.competitors ?? []);

    return NextResponse.json({
      success: true,
      competitors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save competitors.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
