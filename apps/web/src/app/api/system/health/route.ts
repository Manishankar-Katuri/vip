import { NextResponse } from "next/server";

import { buildProductionReadiness } from "@/lib/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await buildProductionReadiness();
  return NextResponse.json({
    status: readiness.status,
    checkedAt: readiness.checkedAt,
    database: readiness.database.status,
    email: readiness.email.status,
    reports: readiness.reports.status,
    workflows: readiness.workflows.status,
  }, { status: readiness.status === "blocked" ? 503 : 200 });
}
