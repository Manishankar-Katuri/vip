import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveWorkspace, WorkspaceResolutionError } from "./resolve-workspace";

const validWorkspace = { id: "4d70a15e-9600-4020-a7aa-3dd84218b363", slug: "instagram-existing" };
const missing = { findUnique: async () => null };

describe("resolveWorkspace", () => {
  it("resolves an existing social intelligence workspace", async () => {
    const result = await resolveWorkspace(
      { socialWorkspace: { findUnique: async () => validWorkspace }, hospitalWorkspace: missing },
      { workspaceId: validWorkspace.id, expectedType: "SOCIAL_INTELLIGENCE" }
    );

    assert.deepEqual(result, { ...validWorkspace, type: "SOCIAL_INTELLIGENCE" });
  });

  it("returns a structured not-found error for missing workspace IDs", async () => {
    await assert.rejects(
      () => resolveWorkspace(
        { socialWorkspace: missing, hospitalWorkspace: missing },
        { workspaceId: "missing-safe-id", expectedType: "SOCIAL_INTELLIGENCE" }
      ),
      (error: unknown) => error instanceof WorkspaceResolutionError && error.code === "WORKSPACE_NOT_FOUND"
    );
  });

  it("classifies IDs from the hospital workspace domain as the wrong type", async () => {
    await assert.rejects(
      () => resolveWorkspace(
        { socialWorkspace: missing, hospitalWorkspace: { findUnique: async () => validWorkspace } },
        { workspaceId: validWorkspace.id, expectedType: "SOCIAL_INTELLIGENCE" }
      ),
      (error: unknown) => error instanceof WorkspaceResolutionError && error.code === "WRONG_WORKSPACE_TYPE"
    );
  });

  it("reports database mismatch when the required delegate is unavailable", async () => {
    await assert.rejects(
      () => resolveWorkspace(
        { hospitalWorkspace: missing },
        { workspaceId: validWorkspace.id, expectedType: "SOCIAL_INTELLIGENCE" }
      ),
      (error: unknown) => error instanceof WorkspaceResolutionError && error.code === "DATABASE_MISMATCH"
    );
  });

  it("rejects an invalid ownership context", async () => {
    await assert.rejects(
      () => resolveWorkspace(
        { socialWorkspace: { findUnique: async () => validWorkspace } },
        {
          workspaceId: validWorkspace.id,
          expectedType: "SOCIAL_INTELLIGENCE",
          ownerWorkspaceId: "another-workspace",
        }
      ),
      (error: unknown) => error instanceof WorkspaceResolutionError && error.code === "INVALID_OWNERSHIP_CONTEXT"
    );
  });
});
