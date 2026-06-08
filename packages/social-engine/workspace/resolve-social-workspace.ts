import prisma from "@vip/database";
import { resolveWorkspace } from "@vip/shared/workspace/resolve-workspace";

export async function resolveSocialWorkspace(workspaceId: string) {
  return resolveWorkspace(
    {
      sourceName: "@vip/database",
      socialWorkspace: {
        findUnique: (options) => prisma.workspace.findUnique(options),
      },
      hospitalWorkspace: {
        findUnique: (options) => prisma.hospitalWorkspace.findUnique(options),
      },
    },
    { workspaceId, expectedType: "SOCIAL_INTELLIGENCE" }
  );
}
