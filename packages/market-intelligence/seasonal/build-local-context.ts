import { getRegionalContext } from "../geo";
import { IndiaRegion, LocalContext, LocalContextItem } from "../types";

export interface BuildLocalContextOptions {
  region: IndiaRegion;
  asOf?: Date;
  weatherSummary?: string;
}

export function buildLocalContext(options: BuildLocalContextOptions): LocalContext {
  const asOf = options.asOf ?? new Date();
  const month = asOf.getUTCMonth() + 1;
  const phase = seasonalPhase(month);
  const source = {
    provider: "india-seasonal-calendar",
    collectedAt: asOf.toISOString(),
    sourceType: "CALENDAR" as const,
    confidence: 0.7,
  };
  const contextual: LocalContextItem[] = [
    ...(month >= 3 && month <= 5
      ? [item("exam-season", "School and entrance exam season", "EXAM", asOf, 62, "Stress, sleep, hydration and hearing focus tips", source)]
      : []),
    ...(month === 5 || month === 6
      ? [item("school-reopening", "School reopening period", "SCHOOL", asOf, 76, "Child screening, ENT and vaccination reminders", source)]
      : []),
    ...(month >= 6 && month <= 9
      ? [item("monsoon-shift", "Monsoon weather shift", "WEATHER_SHIFT", asOf, 86, "Mosquito prevention and infection symptom education", source)]
      : []),
    ...(month >= 10 && month <= 12
      ? [item("air-quality-season", "Air-quality sensitive season", "WEATHER_SHIFT", asOf, 78, "Respiratory and ENT symptom guidance", source)]
      : []),
  ];

  return {
    region: options.region,
    items: [...contextual, ...getRegionalContext(options.region, asOf)].sort((a, b) => b.relevance - a.relevance),
    seasonalPhase: phase,
    weatherSummary: options.weatherSummary,
  };
}

function seasonalPhase(month: number) {
  if (month >= 6 && month <= 9) return "Monsoon and mosquito-borne illness awareness";
  if (month >= 10 && month <= 12) return "Festival, pollution and respiratory awareness";
  if (month >= 3 && month <= 5) return "Heat, allergy and school-transition awareness";
  return "Winter respiratory and preventive-health awareness";
}

function item(
  key: string,
  title: string,
  type: LocalContextItem["type"],
  date: Date,
  relevance: number,
  suggestedAngle: string,
  source: LocalContextItem["source"]
): LocalContextItem {
  return { key, title, type, startsAt: date.toISOString(), relevance, suggestedAngle, source };
}
