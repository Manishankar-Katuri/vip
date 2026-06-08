import { googleFetch } from "@/lib/google/client";
import type { Review } from "@/lib/knowledge/review-store";

export type GBPReview = {
  reviewId?: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

type ReviewResponse = {
  reviews?: GBPReview[];
  averageRating?: number;
  totalReviewCount?: number;
};

export async function fetchGBPReviews(locationName: string) {
  if (!locationName?.startsWith("accounts/") || !locationName.includes("/locations/")) {
    throw new Error("A Google Business Profile location name is required before reviews can be queried.");
  }
  const data = await googleFetch<ReviewResponse>(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`,
  );
  return {
    averageRating: data.averageRating,
    totalReviewCount: data.totalReviewCount,
    reviews: (data.reviews ?? []).map((review): Review => ({
      author: review.reviewer?.displayName ?? "Google reviewer",
      rating: starRating(review.starRating),
      text: review.comment ?? "",
      time: review.updateTime ?? review.createTime,
    })),
  };
}

function starRating(value?: string) {
  return ({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as Record<string, number>)[value ?? ""] ?? 0;
}
