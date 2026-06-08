export const HARIKA_HOSPITAL_WORKSPACE_ID =
  "ba94ea17-4b72-445c-8cb7-26c391768e7d";

export const HARIKA_HOSPITAL_SLUG =
  "harika-ent-care-hospitals";

export const HARIKA_SOCIAL_WORKSPACE_ID =
  "4d70a15e-9600-4020-a7aa-3dd84218b363";

const HARIKA_KEYS = new Set([
  HARIKA_HOSPITAL_WORKSPACE_ID,
  HARIKA_HOSPITAL_SLUG,
  "harika-ent-care-hospitals-name",
  "dr-harika-ent-care-hospitals",
  "dr-harika-ent-care",
  "dr-harika-ent-care-hospitals",
  "dr-harika-ent-care-hospitals-hyderabad",
  "dr-harika-ent-care-hospitals-network",
  "harika-ent-care-network"
]);

export function resolveHarikaSocialWorkspaceId(
  value:string | null | undefined
) {
  return isHarikaHospitalKey(value)
    ? HARIKA_SOCIAL_WORKSPACE_ID
    : null;
}

export function isHarikaHospitalKey(
  value:string | null | undefined
) {
  if (!value) return false;

  return HARIKA_KEYS.has(normalizeHospitalKey(value));
}

export function isHarikaHospital(
  hospital:{ id:string; name:string; slug?:string | null } | null | undefined
) {
  if (!hospital) return false;

  return [
    hospital.id,
    hospital.slug,
    hospital.name
  ].some(isHarikaHospitalKey);
}

export function normalizeHospitalKey(
  value:string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
