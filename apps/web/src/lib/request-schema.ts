import { z } from "zod";

export const hospitalRequestSchema = z.object({
  hospitalName: z
    .string()
    .min(3, "Hospital name required"),

  contactName: z
    .string()
    .min(2, "Contact name required"),

  email: z
    .email("Invalid email"),

  website: z.string().optional()
})

export type HospitalRequestForm =
  z.infer<typeof hospitalRequestSchema>;