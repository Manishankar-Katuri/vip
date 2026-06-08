import { NextResponse } from "next/server";

import { getWorkflowDetail } from "@/lib/workflows";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params;
    const workflow = await getWorkflowDetail(runId);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow run not found." }, { status: 404 });
    }
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load workflow run." },
      { status: 500 }
    );
  }
}

