"use client";

import { ExternalLink, MapPin, Phone, Star } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  StatusIndicator,
} from "@/design-system/primitives";

export type MarketMapCentre = {
  name: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviews?: number;
  status: string;
};

export type MarketMapCompetitor = {
  placeId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  rating: number;
  reviews: number;
  distanceKm?: number;
  marketStrength: number;
  opportunity: string;
  suggestedAction: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  weekdayText?: string[];
  reviewSnippets: Array<{ authorName: string; rating: number; relativeTimeDescription: string; text: string }>;
};

type PositionedPoint<T> = T & { x: number; y: number };

export function CompetitorMarketMap({
  centres,
  competitors,
}: {
  centres: MarketMapCentre[];
  competitors: MarketMapCompetitor[];
}) {
  const points = [
    ...centres.filter(hasCoordinates),
    ...competitors.filter(hasCoordinates),
  ];
  const bounds = calculateBounds(points);
  const positionedCentres = centres.filter(hasCoordinates).map((centre) => ({
    ...centre,
    ...projectPoint(centre, bounds),
  }));
  const positionedCompetitors = competitors.filter(hasCoordinates).map((competitor) => ({
    ...competitor,
    ...projectPoint(competitor, bounds),
  }));
  const scale = calculateKmScale(bounds);
  const hiddenCompetitors = competitors.length - positionedCompetitors.length;

  return (
    <div className="space-y-4">
      <div className="relative min-h-[460px] overflow-hidden rounded-lg border bg-[linear-gradient(135deg,hsl(var(--muted))_0_25%,transparent_25%_50%,hsl(var(--muted))_50%_75%,transparent_75%)] bg-[length:28px_28px] p-4">
        <div className="absolute inset-0 bg-background/78" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 70" role="img" aria-label="Competitor catchment pressure map">
          {positionedCentres.map((centre) => (
            <g key={`${centre.name}-rings`}>
              {[2, 5, 7].map((km) => (
                <circle
                  key={`${centre.name}-${km}`}
                  cx={centre.x}
                  cy={centre.y}
                  r={Math.max(3, km * scale)}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeDasharray={km === 7 ? "2 2" : undefined}
                  strokeOpacity={km === 2 ? 0.32 : km === 5 ? 0.22 : 0.16}
                  strokeWidth={0.45}
                />
              ))}
            </g>
          ))}
        </svg>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <StatusIndicator label="VIP centres" tone="success" />
          <StatusIndicator label="Competitors" tone="warning" />
          <StatusIndicator label="2 / 5 / 7 km pressure rings" tone="info" />
          {hiddenCompetitors > 0 && <StatusIndicator label={`${hiddenCompetitors} list only`} tone="neutral" />}
        </div>

        {positionedCentres.map((centre) => (
          <div
            key={centre.name}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${centre.x}%`, top: `${centre.y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-success bg-success/15 text-success-foreground shadow-sm">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="max-w-28 rounded-full border bg-background/95 px-2 py-1 text-center text-[11px] font-semibold shadow-sm">
                {centre.name}
              </span>
            </div>
          </div>
        ))}

        {positionedCompetitors.map((competitor) => (
          <Drawer key={competitor.placeId}>
            <DrawerTrigger asChild>
              <button
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-warning/80 bg-warning/20 p-1.5 text-warning-foreground shadow-sm transition hover:scale-110 hover:bg-warning/30 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ left: `${competitor.x}%`, top: `${competitor.y}%` }}
                type="button"
                aria-label={`Open ${competitor.name} competitor profile`}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold">
                  {Math.round(competitor.marketStrength)}
                </span>
              </button>
            </DrawerTrigger>
            <CompetitorDrawer competitor={competitor} />
          </Drawer>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {competitors.slice(0, 6).map((competitor) => (
          <Drawer key={`${competitor.placeId}-list`}>
            <DrawerTrigger asChild>
              <button type="button" className="rounded-lg border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-info/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{competitor.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {competitor.distanceKm !== undefined ? `${competitor.distanceKm.toFixed(1)} km away` : "Distance unavailable"}
                    </p>
                  </div>
                  <StatusIndicator label={`${Math.round(competitor.marketStrength)} score`} tone="warning" />
                </div>
              </button>
            </DrawerTrigger>
            <CompetitorDrawer competitor={competitor} />
          </Drawer>
        ))}
      </div>
    </div>
  );
}

function CompetitorDrawer({ competitor }: { competitor: MarketMapCompetitor }) {
  return (
    <DrawerContent className="overflow-y-auto">
      <DrawerHeader>
        <DrawerTitle>{competitor.name}</DrawerTitle>
        <DrawerDescription>{competitor.address}</DrawerDescription>
      </DrawerHeader>
      <div className="space-y-4 px-4 pb-5">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Market score" value={`${Math.round(competitor.marketStrength)}/100`} />
          <MiniStat label="Rating" value={competitor.rating ? `${competitor.rating.toFixed(1)}/5` : "N/A"} />
          <MiniStat label="Reviews" value={integer(competitor.reviews)} />
          <MiniStat label="Distance" value={competitor.distanceKm !== undefined ? `${competitor.distanceKm.toFixed(1)} km` : "N/A"} />
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm font-semibold">Recommended action</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{competitor.suggestedAction}</p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm font-semibold">Opportunity gap</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{competitor.opportunity}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {competitor.openNow !== undefined && (
            <StatusIndicator label={competitor.openNow ? "Open now" : "Closed now"} tone={competitor.openNow ? "success" : "neutral"} />
          )}
          {competitor.phone && (
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium">
              <Phone className="size-3" aria-hidden />
              {competitor.phone}
            </span>
          )}
          {competitor.website && (
            <a className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-primary" href={competitor.website} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3" aria-hidden />
              Website
            </a>
          )}
          {competitor.mapsUrl && (
            <a className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-primary" href={competitor.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin className="size-3" aria-hidden />
              Maps
            </a>
          )}
        </div>

        {competitor.weekdayText?.length ? (
          <details className="rounded-lg border bg-background p-3">
            <summary className="cursor-pointer text-sm font-semibold">Opening hours</summary>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
              {competitor.weekdayText.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <div className="rounded-lg border bg-background p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Star className="size-4 text-primary" aria-hidden />
            Public review snippets
          </p>
          {competitor.reviewSnippets.length ? (
            <div className="mt-3 space-y-2">
              {competitor.reviewSnippets.slice(0, 3).map((snippet, index) => (
                <div key={`${snippet.authorName}-${index}`} className="rounded-lg bg-muted/45 p-3 text-xs leading-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusIndicator label={`${snippet.rating}/5`} tone={snippet.rating >= 4 ? "success" : snippet.rating <= 2 ? "warning" : "neutral"} />
                    <span className="font-medium">{snippet.authorName}</span>
                    <span className="text-muted-foreground">{snippet.relativeTimeDescription}</span>
                  </div>
                  {snippet.text && <p className="mt-2 text-muted-foreground">{truncateWords(snippet.text, 24)}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No public review snippets were returned in this Places response.</p>
          )}
        </div>
      </div>
    </DrawerContent>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function hasCoordinates<T extends { lat?: number; lng?: number }>(point: T): point is T & { lat: number; lng: number } {
  return point.lat !== undefined && point.lng !== undefined;
}

function calculateBounds(points: Array<{ lat: number; lng: number }>) {
  if (!points.length) {
    return { minLat: 17.28, maxLat: 17.55, minLng: 78.32, maxLng: 78.62 };
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPadding = Math.max((maxLat - minLat) * 0.18, 0.018);
  const lngPadding = Math.max((maxLng - minLng) * 0.18, 0.018);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

function projectPoint<T extends { lat: number; lng: number }>(
  point: T,
  bounds: ReturnType<typeof calculateBounds>,
): PositionedPoint<T> {
  const x = 8 + ((point.lng - bounds.minLng) / Math.max(bounds.maxLng - bounds.minLng, 0.001)) * 84;
  const y = 8 + ((bounds.maxLat - point.lat) / Math.max(bounds.maxLat - bounds.minLat, 0.001)) * 54;

  return { ...point, x, y };
}

function calculateKmScale(bounds: ReturnType<typeof calculateBounds>) {
  const midpointLat = (bounds.minLat + bounds.maxLat) / 2;
  const latKm = Math.max((bounds.maxLat - bounds.minLat) * 111, 1);
  const lngKm = Math.max((bounds.maxLng - bounds.minLng) * 111 * Math.cos((midpointLat * Math.PI) / 180), 1);

  return Math.min(54 / latKm, 84 / lngKm);
}

function integer(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function truncateWords(value: string, limit: number) {
  const words = value.trim().split(/\s+/);
  if (words.length <= limit) return value;

  return `${words.slice(0, limit).join(" ")}...`;
}
