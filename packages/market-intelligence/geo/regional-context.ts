import { IndiaRegion, LocalContextItem } from "../types";
import { buildRegionKey } from "../utils";

export function getRegionalContext(region: IndiaRegion, asOf: Date): LocalContextItem[] {
  const state = region.state.toLowerCase();
  const year = asOf.getUTCFullYear();
  const planningYears = [year, year + 1];
  const collectedAt = asOf.toISOString();
  const source = {
    provider: "india-regional-calendar",
    collectedAt,
    sourceType: "CALENDAR" as const,
    confidence: 0.72,
    note: "Validate movable festival and local event dates before campaign publication.",
  };
  const common: LocalContextItem[] = planningYears.flatMap((calendarYear) => [
    event("independence-day", "Independence Day", "HOLIDAY", `${calendarYear}-08-15`, 70, "Community health and preventive-care access", source),
    event("hearing-day", "World Hearing Day", "AWARENESS_DAY", `${calendarYear}-03-03`, 86, "Hearing screening and safe-listening awareness", source),
    event("world-health-day", "World Health Day", "AWARENESS_DAY", `${calendarYear}-04-07`, 78, "Accessible preventive-care education", source),
    event("childrens-day", "Children's Day", "HOLIDAY", `${calendarYear}-11-14`, 60, "Child health and hearing/speech screening education", source),
    event("diabetes-day", "World Diabetes Day", "AWARENESS_DAY", `${calendarYear}-11-14`, 76, "Screening and long-term care awareness", source),
  ]);

  const cityKey = buildRegionKey(region);
  return [...common, ...planningYears.flatMap((calendarYear) => stateEvents(state, calendarYear, source))]
    .filter((item) => isWithinPlanningWindow(item.startsAt, asOf))
    .map((item) => ({
      ...item,
      key: `${cityKey}:${item.key}`,
    }));
}

function stateEvents(state: string, year: number, source: LocalContextItem["source"]) {
  const events: Record<string, LocalContextItem[]> = {
    kerala: [event("onam", "Onam", "FESTIVAL", `${year}-08-26`, 82, "Celebration-safe food and family wellness messaging", source, ["Malayalam"])],
    karnataka: [event("karnataka-rajyotsava", "Karnataka Rajyotsava", "HOLIDAY", `${year}-11-01`, 72, "Local-language community care message", source, ["Kannada"])],
    maharashtra: [event("ganesh-chaturthi", "Ganesh Chaturthi season", "FESTIVAL", `${year}-09-14`, 80, "Festive hearing, crowd and hygiene awareness", source, ["Marathi"])],
    "west bengal": [event("durga-puja", "Durga Puja season", "FESTIVAL", `${year}-10-15`, 86, "Festival wellness and accessible emergency-care information", source, ["Bengali"])],
    "tamil nadu": [event("pongal", "Pongal", "FESTIVAL", `${year}-01-14`, 78, "Family preventive health and wellbeing", source, ["Tamil"])],
    telangana: [event("bathukamma", "Bathukamma season", "FESTIVAL", `${year}-10-10`, 75, "Community wellbeing and local-language care education", source, ["Telugu"])],
  };
  return events[state] ?? [];
}

function event(
  key: string,
  title: string,
  type: LocalContextItem["type"],
  startsAt: string,
  relevance: number,
  suggestedAngle: string,
  source: LocalContextItem["source"],
  languages?: string[]
): LocalContextItem {
  return { key, title, type, startsAt, relevance, suggestedAngle, source, languages };
}

function isWithinPlanningWindow(startsAt: string, asOf: Date) {
  const eventDate = new Date(`${startsAt}T00:00:00.000Z`).getTime();
  const from = asOf.getTime() - 14 * 24 * 60 * 60 * 1000;
  const to = asOf.getTime() + 180 * 24 * 60 * 60 * 1000;
  return eventDate >= from && eventDate <= to;
}
