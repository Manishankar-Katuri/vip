import { NextResponse } from "next/server";

import { savePilotQualityReview } from "@/lib/daily-growth-pilot-operations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; executionId: string }> }) {
  try {
    const { id: workspaceId, executionId } = await params;
    const body = await request.json();
    const review = await savePilotQualityReview({
      workspaceId,
      missionExecutionId: executionId,
      targetType: body.targetType,
      targetId: body.targetId,
      reviewerRole: body.reviewerRole,
      reviewerId: body.reviewerId,
      accuracy: body.accuracy,
      relevance: body.relevance,
      actionability: body.actionability,
      hookQuality: body.hookQuality,
      scriptQuality: body.scriptQuality,
      ctaQuality: body.ctaQuality,
      brandAlignment: body.brandAlignment,
      comments: body.comments,
    });
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to store pilot quality review." }, { status: 500 });
  }
}
