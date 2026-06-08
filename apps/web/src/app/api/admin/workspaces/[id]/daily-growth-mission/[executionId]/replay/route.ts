import { NextResponse } from "next/server";

import { getDailyGrowthMissionReplay } from "@/lib/daily-growth-mission";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; executionId: string }> }) {
  const { id, executionId } = await params;
  const replay = await getDailyGrowthMissionReplay(id, executionId);
  return NextResponse.json({ replay });
}
