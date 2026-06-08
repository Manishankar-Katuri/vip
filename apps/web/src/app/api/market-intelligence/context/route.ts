import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { buildMarketContext } from "@vip/market-intelligence";
import { workspaceIdSchema } from "@vip/shared/validators/workspace-id";

import { jsonError } from "../../social/_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const marketContextSchema = z.object({
  workspaceId: workspaceIdSchema,
  hospitalName: z.string().min(1).optional(),
  specialtyFocus: z.array(z.string().min(1)).default([]),
  region: z.object({
    country: z.literal("IN").default("IN"),
    state: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1).optional(),
    locality: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  environmentalContext: z.object({
    airQualityIndex: z.number().nonnegative().optional(),
    weatherSummary: z.string().optional(),
    temperatureC: z.number().optional(),
    rainfallMm: z.number().nonnegative().optional(),
  }).optional(),
  persist: z.boolean().default(true),
  forceRefresh: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const input = marketContextSchema.parse(await req.json());
    const context = await buildMarketContext(input);
    revalidateTag("product-experience", "max");

    return NextResponse.json({ success: true, context });
  } catch (error) {
    return jsonError(error, 400);
  }
}
