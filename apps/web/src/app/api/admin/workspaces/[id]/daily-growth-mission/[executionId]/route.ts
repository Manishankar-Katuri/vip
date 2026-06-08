import { NextResponse } from "next/server";

import { getDailyGrowthMissionDetail } from "@/lib/daily-growth-mission";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; executionId: string }> }) {
  const { id, executionId } = await params;
  const mission = await getDailyGrowthMissionDetail(id, executionId);
  if (!mission) return NextResponse.json({ error: "Mission execution not found." }, { status: 404 });
  return NextResponse.json({ mission });
}
