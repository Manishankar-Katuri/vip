import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { workspaceIdSchema } from "./workspace-id";

const existingSocialWorkspaceId = "4d70a15e-9600-4020-a7aa-3dd84218b363";

describe("workspaceIdSchema", () => {
  it("accepts existing persisted social workspace IDs", () => {
    assert.equal(workspaceIdSchema.parse(existingSocialWorkspaceId), existingSocialWorkspaceId);
  });

  it("supports opaque legacy or future database IDs without assuming a UUID dialect", () => {
    assert.equal(workspaceIdSchema.parse("workspace_legacy-2026"), "workspace_legacy-2026");
  });

  it("rejects unsafe and malformed identifiers", () => {
    for (const value of ["", "workspace/id", "../workspace", "id value", "id?drop=true", "x".repeat(129)]) {
      assert.equal(workspaceIdSchema.safeParse(value).success, false);
    }
  });

  it("does not claim syntactically safe IDs exist in the database", () => {
    assert.equal(workspaceIdSchema.safeParse("00000000-0000-4000-a000-000000000000").success, true);
  });
});
