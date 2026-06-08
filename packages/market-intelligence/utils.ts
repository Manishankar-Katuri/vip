import { IndiaRegion, TrendDirection } from "./types";

export function buildRegionKey(region: IndiaRegion) {
  return [region.country, region.state, region.city, region.district, region.locality]
    .filter(Boolean)
    .map((part) => String(part).trim().toLowerCase().replace(/\s+/g, "-"))
    .join(":");
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function rounded(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

export function directionFromMomentum(momentum: number): TrendDirection {
  if (momentum >= 25) return "EMERGING";
  if (momentum >= 8) return "RISING";
  if (momentum <= -8) return "DECLINING";
  return "STABLE";
}

export function toJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value));
}
