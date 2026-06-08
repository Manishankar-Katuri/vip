import { NextResponse } from "next/server";

import { listDailyGrowthMissions } from "@/lib/daily-growth-mission";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missions = await listDailyGrowthMissions(id);
  return NextResponse.json({ missions });
}
