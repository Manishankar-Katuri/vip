import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { workspaceIdSchema } from "@vip/shared/validators/workspace-id";
import {
  resolveWorkspace,
  WorkspaceResolutionError,
} from "@vip/shared/workspace/resolve-workspace";

export const workspaceQuerySchema = z.object({
  workspaceId: workspaceIdSchema,
});

export const analyticsQuerySchema = workspaceQuerySchema
  .extend({
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    days: z.coerce.number().int().min(1).max(365).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((value) => !(value.from && value.days), {
    message: "Provide either from or days, not both.",
  })
  .refine(
    (value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to),
    { message: "from must be before to." }
  );

export function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const code = error instanceof WorkspaceResolutionError ? error.code : undefined;

  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code ? { code } : {}),
    },
    { status }
  );
}

export function readWorkspaceId(req: NextRequest) {
  const parsed = workspaceQuerySchema.safeParse({
    workspaceId: req.nextUrl.searchParams.get("workspaceId"),
  });

  if (!parsed.success) {
    throw new Error("A valid workspaceId query parameter is required.");
  }

  return parsed.data.workspaceId;
}

export async function requireSocialWorkspaceId(workspaceId: string) {
  const workspace = await resolveWorkspace(
    {
      sourceName: "@vip/database",
      socialWorkspace: {
        findUnique: (options) => prisma.workspace.findUnique(options),
      },
      hospitalWorkspace: {
        findUnique: (options) => prisma.hospitalWorkspace.findUnique(options),
      },
    },
    { workspaceId, expectedType: "SOCIAL_INTELLIGENCE" }
  );

  return workspace.id;
}

export function readAnalyticsQuery(req: NextRequest) {
  const parsed = analyticsQuerySchema.safeParse({
    workspaceId: req.nextUrl.searchParams.get("workspaceId"),
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
    days: req.nextUrl.searchParams.get("days") ?? undefined,
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    pageSize: req.nextUrl.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  }

  const to = parsed.data.to ? new Date(parsed.data.to) : undefined;
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : parsed.data.days
      ? subtractDays(to ?? new Date(), parsed.data.days)
      : undefined;

  return {
    workspaceId: parsed.data.workspaceId,
    from,
    to,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

function subtractDays(end: Date, days: number) {
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}
