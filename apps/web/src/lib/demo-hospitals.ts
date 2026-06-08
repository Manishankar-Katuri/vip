import type { Hospital } from "@/providers/HospitalContextProvider";

export const DEMO_HOSPITALS: Hospital[] = [
  {
    id: "harika-ent-care-hospitals",
    name: "Harika ENT care hospitals",
    slug: "harika-ent-care-hospitals",
    specialty: "ENT care",
    city: "Hyderabad",
    status: "ACTIVE",
  },
  {
    id: "aayu-geriatrics",
    name: "Aayu Geriatrics",
    slug: "aayu-geriatrics",
    specialty: "Geriatrics",
    city: "Hyderabad",
    status: "ACTIVE",
  },
  {
    id: "sri-srinivasa-hospitals",
    name: "Sri Srinivasa hospitals",
    slug: "sri-srinivasa-hospitals",
    specialty: "Multispecialty",
    city: "Vijayawada",
    status: "ACTIVE",
  },
];

export function getDemoHospitalById(hospitalId: string | null) {
  return DEMO_HOSPITALS.find((hospital) => hospital.id === hospitalId) ?? DEMO_HOSPITALS[0];
}
