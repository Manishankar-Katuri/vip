import { NextResponse } from "next/server";

import { buildProductionReadiness } from "@/lib/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await buildProductionReadiness();
  return NextResponse.json(readiness, { status: readiness.status === "blocked" ? 503 : 200 });
}
