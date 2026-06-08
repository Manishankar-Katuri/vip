import { NextResponse } from "next/server";

import prisma from "@vip/database";
import { adminJsonError, requireIntegrationAdmin } from "@/lib/server/hospital-admin";
import { INTEGRATION_PROVIDERS } from "@/lib/server/hospital-config-service";

export async function GET(request:Request) {
  try {
    requireIntegrationAdmin(request);
    const grouped = await prisma.hospitalIntegrationConfig.groupBy({
      by:["provider", "status"],
      _count:{ _all:true }
    });

    return NextResponse.json(
      INTEGRATION_PROVIDERS.map((provider) => {
        const rows = grouped.filter((row) => row.provider === provider);
        const connected = rows
          .filter((row) => row.status === "CONNECTED")
          .reduce((sum, row) => sum + row._count._all, 0);
        const total = rows.reduce((sum, row) => sum + row._count._all, 0);

        return {
          name:provider,
          status:connected > 0 ? "Connected" : total > 0 ? "Needs attention" : "Not configured",
          connected,
          total
        };
      })
    );
  } catch (error) {
    return adminJsonError(error);
  }
}
