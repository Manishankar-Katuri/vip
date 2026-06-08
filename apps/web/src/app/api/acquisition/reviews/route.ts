import { NextResponse } from "next/server";
import { fetchGBPReviews } from "@/lib/acquisition/gbp-reviews";
import { saveReviews } from "@/lib/knowledge/review-store";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { hospitalName?: string; locationName?: string };
    const data = await fetchGBPReviews(body.locationName ?? "");
    saveReviews(body.hospitalName ?? body.locationName ?? "GBP location", data.reviews);
    return NextResponse.json({
      success: true,
      count: data.reviews.length,
      reviews: data.reviews,
      averageRating: data.averageRating,
      totalReviewCount: data.totalReviewCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: message(error) }, { status: 502 });
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Google Business Profile review request failed.";
}
