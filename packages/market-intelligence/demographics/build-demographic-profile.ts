import { DemographicProfile, IndiaRegion, IntelligenceSource } from "../types";
import { buildRegionKey } from "../utils";

type CityBaseline = {
  languages: Array<[string, number]>;
  urban: number;
  awareness: DemographicProfile["healthcareAwarenessLevel"];
  characteristics: string[];
};

const cityBaselines: Record<string, CityBaseline> = {
  bengaluru: {
    languages: [["Kannada", 0.42], ["English", 0.3], ["Hindi", 0.15], ["Tamil/Telugu", 0.13]],
    urban: 0.92,
    awareness: "HIGH",
    characteristics: ["Digitally active families", "Working professionals", "Preventive-care receptive audiences"],
  },
  delhi: {
    languages: [["Hindi", 0.61], ["English", 0.24], ["Punjabi", 0.15]],
    urban: 0.95,
    awareness: "HIGH",
    characteristics: ["High healthcare choice density", "Pollution-health concern", "Bilingual discovery behavior"],
  },
  hyderabad: {
    languages: [["Telugu", 0.46], ["Urdu", 0.2], ["English", 0.18], ["Hindi", 0.16]],
    urban: 0.9,
    awareness: "HIGH",
    characteristics: ["Multilingual urban families", "Specialty-care researchers", "Video-first education audiences"],
  },
  mumbai: {
    languages: [["Marathi", 0.38], ["Hindi", 0.32], ["English", 0.22], ["Gujarati", 0.08]],
    urban: 0.97,
    awareness: "HIGH",
    characteristics: ["High mobile usage", "Convenience-sensitive patients", "Trust and access focused audiences"],
  },
  chennai: {
    languages: [["Tamil", 0.68], ["English", 0.24], ["Telugu", 0.08]],
    urban: 0.93,
    awareness: "HIGH",
    characteristics: ["Regional-language trust preference", "Family health decision makers", "Education-forward audiences"],
  },
  pune: {
    languages: [["Marathi", 0.52], ["Hindi", 0.22], ["English", 0.21], ["Other", 0.05]],
    urban: 0.91,
    awareness: "HIGH",
    characteristics: ["Young professionals", "Family wellness audiences", "Preventive-care receptive audiences"],
  },
  kolkata: {
    languages: [["Bengali", 0.67], ["Hindi", 0.18], ["English", 0.15]],
    urban: 0.9,
    awareness: "MODERATE",
    characteristics: ["Regional-language engagement", "Family decision makers", "Doctor-credibility focused audiences"],
  },
  kochi: {
    languages: [["Malayalam", 0.72], ["English", 0.2], ["Tamil", 0.08]],
    urban: 0.87,
    awareness: "HIGH",
    characteristics: ["Health-literate households", "Family wellness audiences", "Regional-language trust preference"],
  },
};

const stateLanguages: Record<string, string[]> = {
  karnataka: ["Kannada", "English", "Hindi"],
  maharashtra: ["Marathi", "Hindi", "English"],
  telangana: ["Telugu", "Urdu", "English"],
  "tamil nadu": ["Tamil", "English"],
  kerala: ["Malayalam", "English"],
  "west bengal": ["Bengali", "Hindi", "English"],
  gujarat: ["Gujarati", "Hindi", "English"],
  rajasthan: ["Hindi", "Rajasthani", "English"],
  punjab: ["Punjabi", "Hindi", "English"],
  "uttar pradesh": ["Hindi", "Urdu", "English"],
};

export interface BuildDemographicProfileOptions {
  region: IndiaRegion;
  asOf?: Date;
  specialtyFocus?: string[];
}

export function buildDemographicProfile(options: BuildDemographicProfileOptions): DemographicProfile {
  const collectedAt = (options.asOf ?? new Date()).toISOString();
  const city = options.region.city.trim().toLowerCase();
  const state = options.region.state.trim().toLowerCase();
  const baseline = cityBaselines[city] ?? createStateBaseline(state);
  const urban = baseline.urban;
  const source: IntelligenceSource = {
    provider: "india-regional-demographic-baseline",
    collectedAt,
    sourceType: "ESTIMATE",
    confidence: cityBaselines[city] ? 0.64 : 0.42,
    note: "Planning estimate; replace or calibrate with licensed census/audience provider data.",
  };

  return {
    region: options.region,
    regionKey: buildRegionKey(options.region),
    dominantAgeGroups: ageDistribution(urban),
    primaryLanguages: baseline.languages.map(([language, share], index) => ({
      language,
      share,
      contentPriority: Number((1 - index * 0.18).toFixed(2)),
    })),
    audienceSegments: [
      { label: "Family health decision makers", relevance: 0.88, healthcareNeed: "Trusted preventive guidance" },
      { label: "Working adults", relevance: urban > 0.75 ? 0.84 : 0.63, healthcareNeed: "Accessible appointments and symptom education" },
      { label: "Older adults and caregivers", relevance: 0.72, healthcareNeed: "Chronic and specialty-care clarity" },
    ],
    audienceCharacteristics: baseline.characteristics,
    recommendedTone: ["Clinically trustworthy", "Warm and locally understandable", "Plain-language educational"],
    recommendedContentStyles: [
      "Doctor-led short videos",
      "Local-language symptom explainers",
      "Saveable preventive-care carousels",
    ],
    recommendedPlatforms: urban >= 0.8 ? ["Instagram", "YouTube Shorts", "Facebook"] : ["Facebook", "YouTube", "Instagram"],
    healthcareAwarenessLevel: baseline.awareness,
    urbanRuralWeighting: { urban, rural: Number((1 - urban).toFixed(2)) },
    sources: [source],
  };
}

function createStateBaseline(state: string): CityBaseline {
  const languages = stateLanguages[state] ?? ["Hindi", "English", "Regional language"];
  return {
    languages: languages.map((language, index) => [language, [0.62, 0.25, 0.13][index] ?? 0.05]),
    urban: 0.62,
    awareness: "MODERATE",
    characteristics: [
      "Mixed urban and peri-urban audiences",
      "Regional-language trust preference",
      "Value-conscious healthcare decisions",
    ],
  };
}

function ageDistribution(urban: number): DemographicProfile["dominantAgeGroups"] {
  const youngAdultAdjustment = urban > 0.8 ? 0.03 : 0;
  return [
    { label: "25-34", share: 0.23 + youngAdultAdjustment },
    { label: "35-44", share: 0.2 },
    { label: "18-24", share: 0.16 + youngAdultAdjustment },
    { label: "45-54", share: 0.15 },
    { label: "55+", share: 0.15 },
    { label: "0-17", share: Number((0.11 - youngAdultAdjustment * 2).toFixed(2)) },
  ];
}
