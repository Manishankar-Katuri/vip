import { NextRequest, NextResponse } from "next/server";

import { ClientServiceError, getOwnerClient, patchOwnerClient } from "@/lib/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientRouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: NextRequest, { params }: ClientRouteContext) {
  try {
    const { clientId } = await params;
    const result = await getOwnerClient(clientId);
    if (!result) return NextResponse.json({ error: "Client/workspace not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load client." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: ClientRouteContext) {
  try {
    const { clientId } = await params;
    const body = await request.json();
    const result = await patchOwnerClient(clientId, body);
    if (!result) return NextResponse.json({ error: "Client/workspace not found." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ClientServiceError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update client." },
      { status: 500 }
    );
  }
}
