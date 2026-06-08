import "server-only";

import { unstable_cache } from "next/cache";
import { hospitalProfile } from "@/lib/playbook/harika-playbook";
import { fetchPlaceDetails, type PlaceReviewSnippet } from "@/lib/acquisition/places";

type PlaceTextResult = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
};

type PlaceTextResponse = {
  status: string;
  error_message?: string;
  results?: PlaceTextResult[];
};

export type LivePlaceLocation = {
  centre: string;
  officialAddress: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  mapsName?: string;
  mapsAddress?: string;
  rating?: number;
  reviews?: number;
  status: "Matched" | "No match" | "Unavailable";
  detail?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  weekdayText?: string[];
  photoCount?: number;
  reviewSnippets: PlaceReviewSnippet[];
};

export type IntegrationHealth = {
  id: string;
  label: string;
  status: "Connected" | "Configured" | "Needs attention" | "Unavailable";
  detail: string;
};

let locationMemory: { expiresAt: number; value: Promise<LivePlaceLocation[]> } | undefined;
let integrationMemory: { expiresAt: number; value: Promise<IntegrationHealth[]> } | undefined;

const loadCachedPlaceLocations = unstable_cache(async (): Promise<LivePlaceLocation[]> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return hospitalProfile.locations.map((location) => ({
      centre: location.name,
      officialAddress: location.address,
      status: "Unavailable",
      detail: "Google Maps API key is not configured.",
      reviewSnippets: [],
    }));
  }

  return Promise.all(hospitalProfile.locations.map(async (location) => {
    const query = encodeURIComponent(`${hospitalProfile.name} ${location.name} Hyderabad`);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`,
        { signal: AbortSignal.timeout(4000) },
      );
      const data = await response.json() as PlaceTextResponse;
      const match = data.results?.[0];
      if (!response.ok || data.status === "REQUEST_DENIED") {
        return { centre: location.name, officialAddress: location.address, status: "Unavailable" as const, detail: data.error_message ?? `Maps response: ${data.status}`, reviewSnippets: [] };
      }
      if (!match) return { centre: location.name, officialAddress: location.address, status: "No match" as const, detail: `Maps response: ${data.status}`, reviewSnippets: [] };
      const details = await fetchPlaceDetails(match.place_id);
      return {
        centre: location.name,
        officialAddress: location.address,
        placeId: match.place_id,
        lat: match.geometry?.location?.lat,
        lng: match.geometry?.location?.lng,
        mapsName: details?.name ?? match.name,
        mapsAddress: details?.address ?? match.formatted_address,
        rating: details?.rating ?? match.rating,
        reviews: details?.reviews ?? match.user_ratings_total,
        status: "Matched" as const,
        phone: details?.phone,
        website: details?.website,
        mapsUrl: details?.mapsUrl,
        openNow: details?.openNow,
        weekdayText: details?.weekdayText,
        photoCount: details?.photoCount,
        reviewSnippets: details?.reviewSnippets ?? [],
      };
    } catch (error) {
      return {
        centre: location.name,
        officialAddress: location.address,
        status: "Unavailable" as const,
        detail: error instanceof Error ? error.message : "Google Maps lookup failed.",
        reviewSnippets: [],
      };
    }
  }));
}, ["google-places-centres-v2"], { revalidate: 3600, tags: ["places-evidence"] });

export async function loadPlaceLocations() {
  if (locationMemory && locationMemory.expiresAt > Date.now()) return locationMemory.value;
  const value = loadCachedPlaceLocations().catch((error) => {
    locationMemory = undefined;
    throw error;
  });
  locationMemory = { expiresAt: Date.now() + 60 * 60 * 1000, value };
  return value;
}

const loadCachedIntegrationHealth = unstable_cache(async (): Promise<IntegrationHealth[]> => {
  const health: IntegrationHealth[] = [{
    id: "maps",
    label: "Google Places",
    status: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_KEY ? "Configured" : "Unavailable",
    detail: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_KEY ? "API key configured; centre matches are queried live." : "GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_KEY is missing.",
  }];

  const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramBusinessId = process.env.INSTAGRAM_BUSINESS_ID;
  if (!instagramToken || !instagramBusinessId) {
    health.push({
      id: "meta",
      label: "Meta / Instagram",
      status: "Unavailable",
      detail: "Instagram credentials are missing.",
    });
  } else {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${instagramBusinessId}?fields=username,name&access_token=${encodeURIComponent(instagramToken)}`,
        { signal: AbortSignal.timeout(4000) },
      );
      const profile = await response.json() as { username?: string; name?: string };
      health.push({
        id: "meta",
        label: "Meta / Instagram",
        status: response.ok ? "Connected" : "Needs attention",
        detail: response.ok
          ? `API access verified${profile.username ? ` for @${profile.username}` : ""}; tenant mapping still requires confirmation.`
          : `Configured credentials returned HTTP ${response.status}; refresh or re-authorize access.`,
      });
    } catch (error) {
      health.push({
        id: "meta",
        label: "Meta / Instagram",
        status: "Needs attention",
        detail: error instanceof Error ? error.message : "Unable to verify Instagram access.",
      });
    }
  }

  try {
    const token = process.env.GOOGLE_ACCESS_TOKEN;
    if (!token) throw new Error("Google access token is missing.");
    const response = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    health.push({
      id: "gbp",
      label: "Google Business Profile",
      status: response.ok ? "Connected" : "Needs attention",
      detail: response.ok ? "Account access verified." : `Configured access token returned HTTP ${response.status}; refresh OAuth authorization.`,
    });
  } catch (error) {
    health.push({
      id: "gbp",
      label: "Google Business Profile",
      status: "Needs attention",
      detail: error instanceof Error && error.name === "TimeoutError"
        ? "Live verification timed out; refresh OAuth authorization and retry the account connection."
        : error instanceof Error ? error.message : "Unable to verify Google Business Profile access.",
    });
  }
  return health;
}, ["connector-health"], { revalidate: 300, tags: ["connector-health"] });

export async function loadIntegrationHealth() {
  if (integrationMemory && integrationMemory.expiresAt > Date.now()) return integrationMemory.value;
  const value = loadCachedIntegrationHealth().catch((error) => {
    integrationMemory = undefined;
    throw error;
  });
  integrationMemory = { expiresAt: Date.now() + 5 * 60 * 1000, value };
  return value;
}
