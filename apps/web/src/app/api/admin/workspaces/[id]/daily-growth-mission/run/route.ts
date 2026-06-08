import { NextResponse } from "next/server";

import { runDailyGrowthMission } from "@/lib/daily-growth-mission";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mission = await runDailyGrowthMission(id);
    return NextResponse.json({ mission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Daily Growth Mission failed." },
      { status: 500 }
    );
  }
}
