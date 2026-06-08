import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateCompetitorAnalysisReport, type CompetitorAnalysisReportInput } from "@vip/market-intelligence/competitors";
import { workspaceIdSchema } from "@vip/shared/validators/workspace-id";

import { jsonError, requireSocialWorkspaceId } from "../../social/_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sourceLabelSchema = z.enum(["VIP", "Google Places", "GBP", "Similarweb", "SEMrush", "Ahrefs", "Sprout Social"]);
const metricRecordSchema = z.record(z.string(), z.unknown());

const reputationSchema = z.object({
  rating: z.number().finite().optional(),
  reviewVolume: z.number().finite().optional(),
  sentiment: z.number().finite().optional(),
}).strict();

const socialSchema = z.object({
  followers: z.number().finite().optional(),
  reach: z.number().finite().optional(),
  engagementRate: z.number().finite().optional(),
  postsPerWeek: z.number().finite().optional(),
}).strict();

const seoSchema = z.object({
  keywordVisibility: z.number().finite().optional(),
  servicePageVisibility: z.number().finite().optional(),
  localSeoStrength: z.number().finite().optional(),
}).strict();

const contentSchema = z.object({
  themes: z.array(z.string()).optional(),
  frequencyPerWeek: z.number().finite().optional(),
  topContentTypes: z.array(z.string()).optional(),
}).strict();

const hospitalSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  location: z.string().optional(),
  marketVisibility: z.number().finite().optional(),
  socialPresence: z.number().finite().optional(),
  reputation: reputationSchema.optional(),
  localSearchPresence: z.number().finite().optional(),
  seoVisibility: z.number().finite().optional(),
  contentStrength: z.number().finite().optional(),
  social: socialSchema.optional(),
  seo: seoSchema.optional(),
  content: contentSchema.optional(),
}).strict();

const movementSchema = z.object({
  metric: z.string().min(1),
  changePercent: z.number().finite(),
  trend: z.enum(["growth", "decline", "emerging"]),
  observedAt: z.string().optional(),
}).strict();

const competitorSchema = hospitalSchema.extend({
  id: z.string().min(1),
  sourceLabels: z.array(sourceLabelSchema).optional(),
  movement: z.array(movementSchema).optional(),
}).strict();

const sourceImportSchema = z.object({
  competitorId: z.string().optional(),
  name: z.string().optional(),
  domain: z.string().optional(),
  confidence: z.number().finite().optional(),
  metrics: metricRecordSchema.optional(),
  movement: z.array(movementSchema).optional(),
}).strict();

const reportInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  generatedAt: z.string().optional(),
  hospital: hospitalSchema,
  competitors: z.array(competitorSchema).default([]),
  imports: z.object({
    similarweb: z.array(sourceImportSchema).optional(),
    semrush: z.array(sourceImportSchema).optional(),
    ahrefs: z.array(sourceImportSchema).optional(),
    sproutSocial: z.array(sourceImportSchema).optional(),
  }).strict().optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const input = reportInputSchema.parse(await req.json()) as CompetitorAnalysisReportInput;
    await requireSocialWorkspaceId(input.workspaceId);
    const report = generateCompetitorAnalysisReport(input);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return jsonError(error, 400);
  }
}
