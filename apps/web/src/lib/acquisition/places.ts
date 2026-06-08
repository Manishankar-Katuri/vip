import "server-only";

import { unstable_cache } from "next/cache";

export type PlaceCompetitor = {
  placeId: string;
  name: string;
  rating: number;
  reviews: number;
  address: string;
  types: string[];
  lat?: number;
  lng?: number;
  businessStatus?: string;
  distanceKm?: number;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  weekdayText?: string[];
  photoCount?: number;
  reviewSnippets: PlaceReviewSnippet[];
};

export type PlaceCompetitorLocationInput = {
  centre: string;
  officialAddress: string;
  placeId?: string;
  mapsName?: string;
  lat?: number;
  lng?: number;
};

export type PlaceCompetitorLocationGroup = {
  centre: string;
  anchorName?: string;
  anchorPlaceId?: string;
  competitors: PlaceCompetitor[];
};

export type PlaceReviewSnippet = {
  authorName: string;
  rating: number;
  relativeTimeDescription: string;
  text: string;
};

export type PlaceDetails = {
  placeId: string;
  name?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  businessStatus?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  weekdayText?: string[];
  photoCount?: number;
  reviewSnippets: PlaceReviewSnippet[];
};

type PlaceSearchResult = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

type PlaceSearchResponse = {
  results?: PlaceSearchResult[];
  status?: string;
  error_message?: string;
};

type PlaceDetailsReview = {
  author_name?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
};

type PlaceDetailsResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  website?: string;
  url?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: unknown[];
  reviews?: PlaceDetailsReview[];
};

type PlaceDetailsResponse = {
  result?: PlaceDetailsResult;
  status?: string;
  error_message?: string;
};

const competitorMemory = new Map<string, { expiresAt: number; value: Promise<PlaceCompetitor[]> }>();
const locationCompetitorMemory = new Map<string, { expiresAt: number; value: Promise<PlaceCompetitorLocationGroup[]> }>();

const cachedCompetitorSearch = unstable_cache(
  async (hospitalName: string, city: string, specialization: string): Promise<PlaceCompetitor[]> => {
    const apiKey = placesApiKey();
    if (!apiKey) return [];

    try {
      const search = encodeURIComponent(`${hospitalName} ${city}`);
      const hospitalSearch = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${search}&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const hospitalData = await hospitalSearch.json() as PlaceSearchResponse;
      const hospital = hospitalData.results?.[0];
      const lat = hospital?.geometry?.location?.lat;
      const lng = hospital?.geometry?.location?.lng;

      if (!hospitalSearch.ok || lat === undefined || lng === undefined) return [];

      const specializationQuery = encodeURIComponent(`${specialization} hospital`);
      const nearby = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${specializationQuery}&location=${lat},${lng}&radius=15000&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const nearbyData = await nearby.json() as PlaceSearchResponse;
      if (!nearby.ok || !nearbyData.results) return [];

      const tenantName = normalize(hospitalName);
      const candidates = nearbyData.results
        .filter((result) => !normalize(result.name).includes(tenantName) && !normalize(result.name).includes("harika ent"))
        .filter((result) => (result.user_ratings_total ?? 0) > 20)
        .sort((a, b) => (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0))
        .slice(0, 10);

      return Promise.all(candidates.map((result) => enrichCompetitor(result, { lat, lng })));
    } catch {
      return [];
    }
  },
  ["google-places-competitors-v2"],
  { revalidate: 3600, tags: ["places-competitors"] },
);

export async function findCompetitors(hospitalName: string, city: string, specialization: string) {
  const key = `${normalize(hospitalName)}:${normalize(city)}:${normalize(specialization)}`;
  const remembered = competitorMemory.get(key);
  if (remembered && remembered.expiresAt > Date.now()) return remembered.value;
  const value = cachedCompetitorSearch(hospitalName, city, specialization).catch((error) => {
    competitorMemory.delete(key);
    throw error;
  });
  competitorMemory.set(key, { expiresAt: Date.now() + 60 * 60 * 1000, value });
  return value;
}

const cachedLocationCompetitorSearch = unstable_cache(
  async (
    locations: PlaceCompetitorLocationInput[],
    city: string,
    specialization: string,
  ): Promise<PlaceCompetitorLocationGroup[]> => {
    const apiKey = placesApiKey();
    if (!apiKey) {
      return locations.map((location) => ({
        centre: location.centre,
        anchorName: location.mapsName,
        anchorPlaceId: location.placeId,
        competitors: [],
      }));
    }

    const anchors = await Promise.all(locations.map(async (location) => {
      const anchor = await resolveAnchor(location, city, apiKey);
      const lat = location.lat ?? anchor?.geometry?.location?.lat;
      const lng = location.lng ?? anchor?.geometry?.location?.lng;

      return {
        centre: location.centre,
        anchorName: location.mapsName ?? anchor?.name,
        anchorPlaceId: location.placeId ?? anchor?.place_id,
        lat,
        lng,
      };
    }));

    const rawGroups = await Promise.all(anchors.map(async (anchor) => {
      const { lat, lng } = anchor;

      if (lat === undefined || lng === undefined) {
        return {
          ...anchor,
          results: [] as PlaceSearchResult[],
        };
      }

      try {
        const keyword = encodeURIComponent(`${specialization} hospital`);
        const nearby = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=7000&type=hospital&keyword=${keyword}&key=${apiKey}`,
          { signal: AbortSignal.timeout(5000) },
        );
        const nearbyData = await nearby.json() as PlaceSearchResponse;
        if (!nearby.ok || !nearbyData.results) {
          return {
            ...anchor,
            results: [] as PlaceSearchResult[],
          };
        }

        return {
          ...anchor,
          results: nearbyData.results
          .filter((result) => !isHarikaListing(result.name))
          .filter((result) => (result.user_ratings_total ?? 0) > 20)
          .sort((a, b) => (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0))
          .slice(0, 12),
        };
      } catch {
        return {
          ...anchor,
          results: [] as PlaceSearchResult[],
        };
      }
    }));

    const assignments = new Map<string, { groupIndex: number; result: PlaceSearchResult; distance: number; reviews: number }>();

    rawGroups.forEach((group, groupIndex) => {
      for (const result of group.results) {
        const resultLat = result.geometry?.location?.lat;
        const resultLng = result.geometry?.location?.lng;
        const distance = group.lat !== undefined && group.lng !== undefined && resultLat !== undefined && resultLng !== undefined
          ? distanceKm(group.lat, group.lng, resultLat, resultLng)
          : Number.POSITIVE_INFINITY;
        const previous = assignments.get(result.place_id);
        if (!previous || distance < previous.distance || (distance === previous.distance && (result.user_ratings_total ?? 0) > previous.reviews)) {
          assignments.set(result.place_id, {
            groupIndex,
            result,
            distance,
            reviews: result.user_ratings_total ?? 0,
          });
        }
      }
    });

    const assignedResults = rawGroups.map(() => [] as PlaceSearchResult[]);
    for (const assignment of assignments.values()) {
      assignedResults[assignment.groupIndex].push(assignment.result);
    }

    return Promise.all(rawGroups.map(async (group, groupIndex) => {
      const anchor = group.lat !== undefined && group.lng !== undefined
        ? { lat: group.lat, lng: group.lng }
        : undefined;
      const competitors = await Promise.all(
        assignedResults[groupIndex]
          .sort((a, b) => (b.user_ratings_total ?? 0) - (a.user_ratings_total ?? 0))
          .slice(0, 8)
          .map((result) => enrichCompetitor(result, anchor)),
      );

      return {
        centre: group.centre,
        anchorName: group.anchorName,
        anchorPlaceId: group.anchorPlaceId,
        competitors,
      };
    }));
  },
  ["google-places-location-competitors-v2"],
  { revalidate: 3600, tags: ["places-competitors"] },
);

export async function findCompetitorsForLocations(
  locations: PlaceCompetitorLocationInput[],
  city: string,
  specialization: string,
) {
  const key = `${locations.map((location) => `${normalize(location.centre)}:${location.placeId ?? ""}:${location.lat ?? ""}:${location.lng ?? ""}`).join("|")}:${normalize(city)}:${normalize(specialization)}`;
  const remembered = locationCompetitorMemory.get(key);
  if (remembered && remembered.expiresAt > Date.now()) return remembered.value;
  const value = cachedLocationCompetitorSearch(locations, city, specialization).catch((error) => {
    locationCompetitorMemory.delete(key);
    throw error;
  });
  locationCompetitorMemory.set(key, { expiresAt: Date.now() + 60 * 60 * 1000, value });
  return value;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = placesApiKey();
  if (!apiKey || !placeId) return null;

  try {
    const fields = [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "rating",
      "user_ratings_total",
      "business_status",
      "website",
      "url",
      "opening_hours",
      "photos",
      "reviews",
    ].join(",");
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data = await response.json() as PlaceDetailsResponse;
    const result = data.result;
    if (!response.ok || !result) return null;

    return {
      placeId: result.place_id ?? placeId,
      name: result.name,
      rating: result.rating,
      reviews: result.user_ratings_total,
      address: result.formatted_address,
      businessStatus: result.business_status,
      phone: result.formatted_phone_number ?? result.international_phone_number,
      website: result.website,
      mapsUrl: result.url,
      openNow: result.opening_hours?.open_now,
      weekdayText: result.opening_hours?.weekday_text,
      photoCount: result.photos?.length ?? 0,
      reviewSnippets: (result.reviews ?? []).map((review) => ({
        authorName: review.author_name ?? "Google reviewer",
        rating: review.rating ?? 0,
        relativeTimeDescription: review.relative_time_description ?? "Date unavailable",
        text: review.text ?? "",
      })),
    };
  } catch {
    return null;
  }
}

async function resolveAnchor(location: PlaceCompetitorLocationInput, city: string, apiKey: string) {
  if (location.lat !== undefined && location.lng !== undefined) return null;

  try {
    const query = encodeURIComponent(`${location.mapsName ?? location.centre} ${location.officialAddress} ${city}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data = await response.json() as PlaceSearchResponse;
    if (!response.ok) return null;
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

async function enrichCompetitor(
  result: PlaceSearchResult,
  anchor?: { lat?: number; lng?: number },
): Promise<PlaceCompetitor> {
  const details = await fetchPlaceDetails(result.place_id);
  const lat = result.geometry?.location?.lat;
  const lng = result.geometry?.location?.lng;

  return {
    placeId: result.place_id,
    name: details?.name ?? result.name,
    rating: details?.rating ?? result.rating ?? 0,
    reviews: details?.reviews ?? result.user_ratings_total ?? 0,
    address: details?.address ?? result.formatted_address ?? "Address unavailable",
    types: result.types ?? [],
    lat,
    lng,
    businessStatus: details?.businessStatus ?? result.business_status,
    distanceKm: anchor?.lat !== undefined && anchor.lng !== undefined && lat !== undefined && lng !== undefined
      ? distanceKm(anchor.lat, anchor.lng, lat, lng)
      : undefined,
    phone: details?.phone,
    website: details?.website,
    mapsUrl: details?.mapsUrl,
    openNow: details?.openNow,
    weekdayText: details?.weekdayText,
    photoCount: details?.photoCount,
    reviewSnippets: details?.reviewSnippets ?? [],
  };
}

function isHarikaListing(name: string) {
  const key = normalize(name);

  return key.includes("harika ent") || key.includes("dr harika");
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat2 - lat1);
  const lngDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

function normalize(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
}

function placesApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_PLACES_KEY;
}
