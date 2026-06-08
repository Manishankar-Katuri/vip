import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@vip/database";
import { adminJsonError, requireIntegrationAdmin } from "@/lib/server/hospital-admin";
import { hospitalConfigService, toPublicIntegration } from "@/lib/server/hospital-config-service";

const integrationPatchSchema = z.object({
  provider:z.string().min(1).optional(),
  apiName:z.string().min(1).optional(),
  baseUrl:z.string().url().optional().or(z.literal("")).nullable(),
  credentials:z.record(z.string(), z.string().optional()).optional(),
  settings:z.record(z.string(), z.unknown()).optional(),
  status:z.enum(["PENDING", "CONNECTED", "NEEDS_ATTENTION", "DISABLED"]).optional()
});

type RouteContext = {
  params:Promise<{ id:string; integrationId:string }>;
};

export async function GET(request:Request, context:RouteContext) {
  try {
    requireIntegrationAdmin(request);
    const { id, integrationId } = await context.params;
    const integration = await prisma.hospitalIntegrationConfig.findFirst({
      where:{ id:integrationId, hospitalId:id }
    });

    if (!integration) {
      return NextResponse.json({ success:false, error:"Integration config not found." }, { status:404 });
    }

    return NextResponse.json(toPublicIntegration(integration));
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function PATCH(request:Request, context:RouteContext) {
  try {
    const user = requireIntegrationAdmin(request);
    const { id, integrationId } = await context.params;
    const input = integrationPatchSchema.parse(await request.json());
    const existing = await prisma.hospitalIntegrationConfig.findFirst({
      where:{ id:integrationId, hospitalId:id },
      select:{ provider:true, apiName:true, baseUrl:true, status:true }
    });

    if (!existing) {
      return NextResponse.json({ success:false, error:"Integration config not found." }, { status:404 });
    }

    const integration = await hospitalConfigService.updateIntegration(id, integrationId, {
      provider:input.provider ?? existing.provider,
      apiName:input.apiName ?? existing.apiName,
      baseUrl:input.baseUrl ?? existing.baseUrl,
      credentials:input.credentials,
      settings:input.settings,
      status:input.status ?? existing.status,
      actorId:user.userId
    });

    return NextResponse.json(integration);
  } catch (error) {
    return adminJsonError(error);
  }
}

export async function DELETE(request:Request, context:RouteContext) {
  try {
    const user = requireIntegrationAdmin(request);
    const { id, integrationId } = await context.params;
    await hospitalConfigService.deleteIntegration(id, integrationId, user.userId);

    return NextResponse.json({ deleted:true });
  } catch (error) {
    return adminJsonError(error);
  }
}
