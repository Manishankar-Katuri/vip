import { MarketSignalProvider, ProviderRequest, ProviderRunner } from "../providers";
import { HealthcareSignal, IntelligenceSource, TrendSignal } from "../types";
import { clamp, directionFromMomentum } from "../utils";

export interface BuildHealthcareSignalsOptions extends ProviderRequest {
  providers?: MarketSignalProvider[];
  forceRefresh?: boolean;
  environmentalContext?: {
    airQualityIndex?: number;
    temperatureC?: number;
    rainfallMm?: number;
  };
}

export async function buildHealthcareSignals(options: BuildHealthcareSignalsOptions): Promise<HealthcareSignal[]> {
  const baseline = seasonalHealthcareSignals(options);
  if (!options.providers?.length) return baseline;

  const runner = new ProviderRunner();
  const collections = await Promise.all(
    options.providers.map((provider) => runner.collect(provider, options, options.forceRefresh))
  );
  const external = collections.flatMap((collection) =>
    collection.signals.map((signal) => externalHealthcareSignal(signal, collection.cached))
  );

  return [...external, ...baseline].sort((a, b) => b.score - a.score);
}

function seasonalHealthcareSignals(options: BuildHealthcareSignalsOptions): HealthcareSignal[] {
  const month = options.asOf.getUTCMonth() + 1;
  const source: IntelligenceSource = {
    provider: "india-seasonal-health-baseline",
    collectedAt: options.asOf.toISOString(),
    sourceType: "ESTIMATE",
    confidence: 0.55,
    note: "Seasonal planning heuristic, not a diagnosis or live disease surveillance feed.",
  };
  const signals: HealthcareSignal[] = [];

  if (month >= 6 && month <= 10) {
    signals.push(signal("dengue-prevention", "Mosquito-borne illness prevention", "SEASONAL_DISEASE", 78, "RISING", "Monsoon conditions commonly increase preventive-information relevance.", ["Dengue prevention checklist", "When fever requires medical attention"], source));
  }
  if (month >= 3 && month <= 5) {
    signals.push(signal("heat-allergy", "Heat and allergy symptom awareness", "ALLERGY", 68, "RISING", "Dry heat and transition weather increase demand for symptom guidance.", ["Hydration and warning signs", "Allergy versus infection explainer"], source));
  }
  if (month >= 10 || month <= 2) {
    signals.push(signal("respiratory-ent", "Respiratory and ENT seasonal symptoms", "ENT", 72, "RISING", "Cooler weather and air-quality concerns raise ENT and respiratory relevance.", ["Sinus care myth-busting", "Hearing and ear infection warning signs"], source));
  }

  const aqi = options.environmentalContext?.airQualityIndex;
  if (typeof aqi === "number" && aqi >= 101) {
    const score = clamp(55 + (aqi - 100) * 0.18);
    signals.push(signal("pollution-health", "Air-quality related respiratory health", "POLLUTION_IMPACT", score, "RISING", `Provided air-quality index (${aqi}) indicates added relevance for respiratory guidance.`, ["Pollution exposure reduction", "Asthma and ENT symptom red flags"], {
      ...source,
      provider: "environmental-context-input",
      sourceType: "WEATHER",
      confidence: 0.7,
    }));
  }

  signals.push(signal("hearing-awareness", "Hearing and communication health awareness", "AWARENESS", 48, "STABLE", "Awareness-led education is relevant year-round for ENT and multispecialty providers.", ["Hearing screening prompts", "Safe listening habits"], source));
  return signals.sort((a, b) => b.score - a.score);
}

function externalHealthcareSignal(signalInput: TrendSignal, cached: boolean): HealthcareSignal {
  const type = signalInput.category === "DISEASE"
    ? "SEASONAL_DISEASE"
    : signalInput.category === "POLLUTION"
      ? "POLLUTION_IMPACT"
      : signalInput.category === "ALLERGY"
        ? "ALLERGY"
        : "AWARENESS";
  return {
    key: signalInput.key,
    title: signalInput.label,
    type,
    direction: directionFromMomentum(signalInput.momentum),
    score: signalInput.score,
    confidence: signalInput.confidence,
    rationale: "External provider signal collected for the selected region.",
    contentAngles: [`Create evidence-reviewed patient education about ${signalInput.label}.`],
    evidence: [{
      provider: signalInput.provider,
      collectedAt: signalInput.observedAt,
      sourceType: "PUBLIC_DATA",
      confidence: signalInput.confidence,
      cached,
    }],
  };
}

function signal(
  key: string,
  title: string,
  type: HealthcareSignal["type"],
  score: number,
  direction: HealthcareSignal["direction"],
  rationale: string,
  contentAngles: string[],
  evidence: IntelligenceSource
): HealthcareSignal {
  return { key, title, type, score, direction, rationale, contentAngles, confidence: evidence.confidence, evidence: [evidence] };
}
