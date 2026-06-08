export type Role = "admin" | "production" | "staff" | "doctor";
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const designPrinciples = [
  "Actionable information before decoration",
  "Readable contrast and comfortable touch targets",
  "Quiet surfaces that preserve attention",
  "Role-appropriate information density",
] as const;

export const workspaceMeta: Record<Role, {
  label: string;
  description: string;
  hospital: string;
}> = {
  admin: {
    label: "Super Admin",
    description: "Portfolio growth intelligence",
    hospital: "All partner hospitals",
  },
  production: {
    label: "Production Team",
    description: "AI-assisted campaign execution",
    hospital: "Harika ENT Care Network",
  },
  staff: {
    label: "Hospital Staff",
    description: "Care coordination",
    hospital: "Dr. Harika ENT Care Hospitals",
  },
  doctor: {
    label: "Doctor / Leadership",
    description: "Executive AI intelligence",
    hospital: "Harika ENT Care Network",
  },
};
