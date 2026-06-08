import { z } from "zod";
import { revalidateTag } from "next/cache";
import { applyOperationalAction, getOperationalSnapshot } from "@/persistence/operational-repository";
import { publishOperationalUpdate } from "@/realtime/operational-events";

export const dynamic = "force-dynamic";

const role = z.enum(["admin", "production", "doctor", "staff"]);
const stage = z.enum(["draft", "review", "doctor-approval", "scheduled", "published"]);
const mediaStatus = z.enum(["draft", "under-review", "approved", "archived"]);
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move-campaign"), id: z.string(), stage }),
  z.object({ type: z.literal("edit-campaign"), id: z.string(), caption: z.string().min(1), note: z.string().min(1) }),
  z.object({ type: z.literal("submit-campaign"), id: z.string() }),
  z.object({ type: z.literal("decide-campaign"), id: z.string(), decision: z.enum(["approve", "reject", "revision"]) }),
  z.object({ type: z.literal("decide-strategy"), title: z.string(), decision: z.enum(["approve", "reject"]) }),
  z.object({ type: z.literal("recommendation-action"), title: z.string(), action: z.enum(["apply", "dismiss", "convert", "attach"]) }),
  z.object({ type: z.literal("read-notification"), id: z.string() }),
  z.object({ type: z.literal("read-role-notifications"), role }),
  z.object({ type: z.literal("submit-task"), id: z.string() }),
  z.object({ type: z.literal("complete-task"), id: z.string() }),
  z.object({ type: z.literal("submit-upload"), name: z.string().min(1), fileType: z.string().optional(), campaignId: z.string().optional() }),
  z.object({ type: z.literal("upload-media"), name: z.string().min(1), fileType: z.string().min(1), sourceRole: z.enum(["production", "staff"]), campaignId: z.string().optional() }),
  z.object({ type: z.literal("attach-media"), id: z.string(), campaignId: z.string() }),
  z.object({ type: z.literal("update-media-status"), id: z.string(), status: mediaStatus }),
  z.object({ type: z.literal("schedule-campaign"), id: z.string(), scheduledFor: z.string().min(1) }),
]);

export async function GET() {
  try {
    return Response.json(await getOperationalSnapshot());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workflow persistence unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid workflow operation", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const snapshot = await applyOperationalAction(parsed.data);
    revalidateTag("product-experience", "max");
    publishOperationalUpdate();
    return Response.json(snapshot);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Workflow operation failed" }, { status: 503 });
  }
}
