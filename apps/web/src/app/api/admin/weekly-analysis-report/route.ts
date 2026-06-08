import { NextRequest, NextResponse } from "next/server";

import prisma from "@vip/database";
import { WeeklyAnalysisReportGenerator, type WeeklyAnalysisReportInput } from "@vip/strategy-engine/weekly";

import {
  normalizeHospitalKey,
  resolveHarikaSocialWorkspaceId
} from "@/lib/harika-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOCIAL_WORKSPACE_BY_HOSPITAL: Record<string, string> = {
  "harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "harika-ent-care-hospitals-name": "4d70a15e-9600-4020-a7aa-3dd84218b363",
  "dr-harika-ent-care-hospitals": "4d70a15e-9600-4020-a7aa-3dd84218b363",
};

const generator = new WeeklyAnalysisReportGenerator();

export async function GET(req: NextRequest) {
  const hospitalId = req.nextUrl.searchParams.get("hospitalId") ?? "";
  const asOf = parseAsOf(req.nextUrl.searchParams.get("asOf"));
  const hospital = await resolveHospital(hospitalId);
  const socialWorkspaceId = resolveSocialWorkspaceId(hospitalId || hospital.slug || hospital.id);
  const workspaceCandidates = Array.from(new Set([hospital.id, hospital.slug, socialWorkspaceId].filter(Boolean) as string[]));
  const windowStart = new Date(asOf);
  windowStart.setUTCDate(windowStart.getUTCDate() - 13);
  windowStart.setUTCHours(0, 0, 0, 0);

  const [posts, reviews, competitors] = await Promise.all([
    socialWorkspaceId
      ? prisma.socialPost.findMany({
          where: { workspaceId: socialWorkspaceId, postedAt: { gte: windowStart, lte: asOf } },
          orderBy: { postedAt: "desc" },
          take: 500,
          select: {
            id: true,
            platform: true,
            caption: true,
            contentType: true,
            postedAt: true,
            contentCategory: { select: { name: true } },
            metrics: {
              select: {
                likes: true,
                comments: true,
                shares: true,
                saves: true,
                clicks: true,
                reach: true,
                impressions: true,
                engagementRate: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    workspaceCandidates.length
      ? prisma.review.findMany({
          where: { workspaceId: { in: workspaceCandidates }, createdAt: { gte: windowStart, lte: asOf } },
          orderBy: { createdAt: "desc" },
          take: 500,
          select: {
            id: true,
            rating: true,
            sentiment: true,
            category: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    socialWorkspaceId
      ? prisma.competitorAccount.findMany({
          where: { workspaceId: socialWorkspaceId },
          orderBy: { updatedAt: "desc" },
          take: 20,
          select: {
            displayName: true,
            handle: true,
            metrics: true,
            lastAnalyzedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const report = generator.generate({
    workspaceId: socialWorkspaceId ?? hospital.id,
    hospitalName: hospital.name,
    asOf,
    socialPosts: posts.map((post) => ({
      id: post.id,
      platform: post.platform,
      caption: post.caption,
      contentType: post.contentType,
      contentCategory: post.contentCategory?.name ?? null,
      postedAt: post.postedAt,
      metrics: post.metrics,
    })),
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      sentiment: review.sentiment,
      category: review.category,
      createdAt: review.createdAt,
    })),
    competitors: competitors.map((competitor) => ({
      label: competitor.displayName || competitor.handle,
      metrics: plainMetrics(competitor.metrics),
      lastAnalyzedAt: competitor.lastAnalyzedAt,
    })),
  } satisfies WeeklyAnalysisReportInput);

  return NextResponse.json({ success: true, report });
}

function parseAsOf(value: string | null) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function resolveHospital(hospitalId: string) {
  const normalized = normalizeHospitalKey(hospitalId);
  const hospital = normalized
    ? await prisma.hospitalWorkspace.findFirst({
        where: {
          OR: [
            { id: hospitalId },
            { slug: normalized },
            { hospitalName: { equals: hospitalId, mode: "insensitive" } },
          ],
        },
        select: { id: true, hospitalName: true, slug: true },
      }).catch(() => null)
    : null;

  if (hospital) {
    return {
      id: hospital.id,
      name: hospital.hospitalName,
      slug: hospital.slug,
    };
  }

  return {
    id: hospitalId || "unknown-hospital",
    name: hospitalId ? titleize(hospitalId) : "Hospital workspace",
    slug: normalized || "unknown-hospital",
  };
}

function resolveSocialWorkspaceId(value: string) {
  const harikaWorkspaceId = resolveHarikaSocialWorkspaceId(value);

  if (harikaWorkspaceId) return harikaWorkspaceId;

  return SOCIAL_WORKSPACE_BY_HOSPITAL[normalizeHospitalKey(value)] ?? null;
}

function titleize(value: string) {
  return normalizeHospitalKey(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function plainMetrics(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
