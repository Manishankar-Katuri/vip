import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { adminJsonError, requireIntegrationAdmin } from "@/lib/server/hospital-admin";
import { hospitalConfigService, toPublicIntegration } from "@/lib/server/hospital-config-service";

const integrationInputSchema = z.object({
  provider:z.string().min(1),
  apiName:z.string().min(1),
  baseUrl:z.string().url().optional().or(z.literal("")).nullable(),
  credentials:z.record(z.string(), z.string().optional()).optional(),
  settings:z.record(z.string(), z.unknown()).optional(),
  status:z.enum(["PENDING", "CONNECTED", "NEEDS_ATTENTION", "DISABLED"]).optional()
});

type RouteContext = {
  params:Promise<{ id:string }>;
};

export async function GET(request:Request, context:RouteContext) {
  try {
    requireIntegrationAdmin(request);
    const { id } = await context.params;
    const integrations = await prisma.hospitalIntegrationConfig.findMany({
      where:{ hospitalId:id },
      orderBy:{ updatedAt:"desc" }
    });

    return NextResponse.json(integrations.map(toPublicIntegration));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function POST(request:Request, context:RouteContext) {
  try {
    const user = requireIntegrationAdmin(request);
    const { id } = await context.params;
    const input = integrationInputSchema.parse(await request.json());
    const integration = await hospitalConfigService.createIntegration(id, {
      ...input,
      actorId:user.userId
    });

    return NextResponse.json(integration, { status:201 });
  } catch (error) {
    return adminJsonError(error);
  }
}
