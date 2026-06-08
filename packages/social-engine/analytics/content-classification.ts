import type { ContentPillar } from "./types";

export interface ContentClassification {
  name: string;
  type: ContentPillar;
  rationale: string;
}

const classificationRules: Array<{
  type: ContentPillar;
  name: string;
  terms: string[];
}> = [
  {
    type: "TESTIMONIAL",
    name: "Testimonial",
    terms: ["testimonial", "patient story", "patient experience", "thank you doctor", "recovery story"],
  },
  {
    type: "DOCTOR_BRANDING",
    name: "Doctor Branding",
    terms: ["doctor", "dr.", "surgeon", "consultant", "specialist", "meet our"],
  },
  {
    type: "SEASONAL",
    name: "Seasonal",
    terms: ["world health day", "awareness month", "diwali", "christmas", "new year", "monsoon", "summer"],
  },
  {
    type: "PROMOTIONAL",
    name: "Promotional",
    terms: ["book now", "appointment", "offer", "discount", "package", "call now", "consult today"],
  },
  {
    type: "ENGAGEMENT_COMMUNITY",
    name: "Engagement / Community",
    terms: ["community", "camp", "tell us", "comment", "share", "poll", "quiz", "join us"],
  },
  {
    type: "AWARENESS",
    name: "Awareness",
    terms: ["awareness", "symptom", "warning sign", "early detection", "screening", "prevent"],
  },
  {
    type: "EDUCATIONAL",
    name: "Educational",
    terms: ["tips", "learn", "understand", "health", "care", "treatment", "wellness"],
  },
];

export function classifyContent(caption: string | null | undefined): ContentClassification {
  const normalized = (caption ?? "").toLowerCase();

  for (const rule of classificationRules) {
    const term = rule.terms.find((candidate) => normalized.includes(candidate));

    if (term) {
      return {
        name: rule.name,
        type: rule.type,
        rationale: `Caption matched "${term}".`,
      };
    }
  }

  return {
    name: "Educational",
    type: "EDUCATIONAL",
    rationale: "Default content intelligence pillar.",
  };
}

export function normalizeStoredPillar(type: string | null | undefined): ContentPillar {
  switch (type) {
    case "PROMOTIONAL":
    case "TESTIMONIAL":
    case "AWARENESS":
    case "SEASONAL":
    case "DOCTOR_BRANDING":
    case "ENGAGEMENT_COMMUNITY":
    case "EDUCATIONAL":
      return type;
    case "DOCTOR_SPOTLIGHT":
      return "DOCTOR_BRANDING";
    case "COMMUNITY":
      return "ENGAGEMENT_COMMUNITY";
    default:
      return "EDUCATIONAL";
  }
}

export function resolveContentPillar(
  caption: string | null | undefined,
  storedType: string | null | undefined
) {
  return caption?.trim() ? classifyContent(caption).type : normalizeStoredPillar(storedType);
}
