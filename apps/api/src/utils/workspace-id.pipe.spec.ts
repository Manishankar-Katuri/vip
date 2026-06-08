import { BadRequestException } from "@nestjs/common";

import { WorkspaceIdPipe } from "./workspace-id.pipe";

describe("WorkspaceIdPipe", () => {
  const pipe = new WorkspaceIdPipe();

  it("accepts an existing persisted workspace ID", () => {
    expect(pipe.transform("4d70a15e-9600-4020-a7aa-3dd84218b363")).toBe(
      "4d70a15e-9600-4020-a7aa-3dd84218b363"
    );
  });

  it("accepts opaque database identifiers without imposing UUID format", () => {
    expect(pipe.transform("workspace_legacy-2026")).toBe("workspace_legacy-2026");
  });

  it("rejects unsafe workspace IDs", () => {
    expect(() => pipe.transform("../workspace")).toThrow(BadRequestException);
  });
});
