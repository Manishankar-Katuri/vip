import { NextResponse } from "next/server";
import { z } from "zod";

import { adminJsonError, requireIntegrationAdmin } from "@/lib/server/hospital-admin";
import { hospitalConfigService } from "@/lib/server/hospital-config-service";

const testSchema = z.object({
  credentials:z.record(z.string(), z.string().optional()).optional()
});

type RouteContext = {
  params:Promise<{ id:string; integrationId:string }>;
};

export async function POST(request:Request, context:RouteContext) {
  try {
    requireIntegrationAdmin(request);
    const { id, integrationId } = await context.params;
    const body = testSchema.parse(await request.json().catch(() => ({})));
    const result = await hospitalConfigService.testConnection(id, integrationId, body.credentials);

    return NextResponse.json(result);
  } catch (error) {
    return adminJsonError(error);
  }
}
