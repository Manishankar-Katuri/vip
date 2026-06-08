import { NextResponse } from "next/server";
import { prisma } from "@vip/database";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; executionId: string }> }) {
  const { id: workspaceId, executionId } = await params;
  const body = await request.json().catch(() => ({}));
  const decision = String(body.decision ?? "").toUpperCase();
  const role = String(body.role ?? "doctor").toLowerCase();
  const note = typeof body.note === "string" ? body.note : undefined;
  const db = prisma as typeof prisma & Record<string, any>;
  const execution = await db.missionExecution.findFirst({ where: { workspaceId, id: executionId } });
  if (!execution) return NextResponse.json({ error: "Mission execution not found." }, { status: 404 });
  const phaseState = execution.phaseState && typeof execution.phaseState === "object" && !Array.isArray(execution.phaseState) ? execution.phaseState as Record<string, any> : {};
  const actionPlanId = phaseState.actionPlanId;
  if (!actionPlanId) return NextResponse.json({ error: "Approval plan not found." }, { status: 404 });
  const approvals = await db.approvalRequest.findMany({ where: { workspaceId, actionPlanId }, orderBy: { requestedAt: "asc" } });
  const index = role === "production" ? 1 : 0;
  const approval = approvals[index] ?? approvals[0];
  if (!approval) return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
  const rejected = decision === "REJECTED" || decision === "REVISION_REQUIRED";
  const status = rejected ? "REJECTED" : "APPROVED";
  await db.approvalRequest.update({
    where: { id: approval.id },
    data: {
      status,
      decidedByType: "USER",
      decidedById: role,
      decisionNote: decision === "REVISION_REQUIRED" ? JSON.stringify({ revisionRequired: true, note }) : note,
      decidedAt: new Date(),
    },
  });
  if (decision === "REVISION_REQUIRED") {
    await db.contentProductionPackage.updateMany({
      where: { workspaceId, missionExecutionId: executionId },
      data: { approvalStatus: "REJECTED", revisionMetadata: { revisionRequired: true, note, decidedBy: role, decidedAt: new Date().toISOString() } },
    });
  }
  return NextResponse.json({ success: true, status, decision });
}
