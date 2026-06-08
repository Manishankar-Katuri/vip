import { z } from "zod";

const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * Workspace IDs are persisted database keys, not API-issued UUID claims.
 * This accepts current UUID records and future opaque Prisma-safe keys while
 * blocking path/control characters and unbounded input.
 */
export const workspaceIdSchema = z
  .string()
  .trim()
  .min(1, "workspaceId is required.")
  .max(128, "workspaceId must be at most 128 characters.")
  .regex(WORKSPACE_ID_PATTERN, "workspaceId contains invalid characters.");

export type WorkspaceId = z.infer<typeof workspaceIdSchema>;

export function parseWorkspaceId(value: unknown): WorkspaceId {
  return workspaceIdSchema.parse(value);
}
