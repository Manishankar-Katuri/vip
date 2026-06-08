export type WorkspaceType = "SOCIAL_INTELLIGENCE" | "HOSPITAL";

export type WorkspaceResolutionErrorCode =
  | "WORKSPACE_NOT_FOUND"
  | "WRONG_WORKSPACE_TYPE"
  | "DATABASE_MISMATCH"
  | "INVALID_OWNERSHIP_CONTEXT";

export interface WorkspaceRecord {
  id: string;
  slug: string;
}

export interface WorkspaceLookupDelegate {
  findUnique(options: {
    where: { id: string };
    select: { id: true; slug: true };
  }): Promise<WorkspaceRecord | null>;
}

export interface WorkspaceDataSource {
  socialWorkspace?: WorkspaceLookupDelegate;
  hospitalWorkspace?: WorkspaceLookupDelegate;
  sourceName?: string;
}

export interface ResolveWorkspaceOptions {
  workspaceId: string;
  expectedType: WorkspaceType;
  ownerWorkspaceId?: string;
}

export interface ResolvedWorkspace extends WorkspaceRecord {
  type: WorkspaceType;
}

export class WorkspaceResolutionError extends Error {
  constructor(
    public readonly code: WorkspaceResolutionErrorCode,
    message: string,
    public readonly workspaceId: string,
    public readonly expectedType: WorkspaceType
  ) {
    super(message);
    this.name = "WorkspaceResolutionError";
  }
}

export async function resolveWorkspace(
  dataSource: WorkspaceDataSource,
  options: ResolveWorkspaceOptions
): Promise<ResolvedWorkspace> {
  const expected = delegateFor(dataSource, options.expectedType);
  if (!expected) {
    throw resolutionError(
      "DATABASE_MISMATCH",
      "The configured database client cannot resolve the requested workspace type.",
      options
    );
  }

  const resolved = await lookup(expected, options);
  if (resolved) {
    if (options.ownerWorkspaceId && options.ownerWorkspaceId !== resolved.id) {
      throw resolutionError(
        "INVALID_OWNERSHIP_CONTEXT",
        "The workspace does not match the requested ownership context.",
        options
      );
    }

    return { ...resolved, type: options.expectedType };
  }

  const alternateType: WorkspaceType =
    options.expectedType === "SOCIAL_INTELLIGENCE" ? "HOSPITAL" : "SOCIAL_INTELLIGENCE";
  const alternate = delegateFor(dataSource, alternateType);
  const wrongType = alternate ? await lookup(alternate, options) : null;

  if (wrongType) {
    throw resolutionError(
      "WRONG_WORKSPACE_TYPE",
      `Workspace exists as ${alternateType.toLowerCase().replace("_", " ")} but ${options.expectedType.toLowerCase().replace("_", " ")} is required.`,
      options
    );
  }

  throw resolutionError("WORKSPACE_NOT_FOUND", "Workspace not found.", options);
}

function delegateFor(dataSource: WorkspaceDataSource, type: WorkspaceType) {
  return type === "SOCIAL_INTELLIGENCE"
    ? dataSource.socialWorkspace
    : dataSource.hospitalWorkspace;
}

async function lookup(delegate: WorkspaceLookupDelegate, options: ResolveWorkspaceOptions) {
  try {
    return await delegate.findUnique({
      where: { id: options.workspaceId },
      select: { id: true, slug: true },
    });
  } catch {
    throw resolutionError(
      "DATABASE_MISMATCH",
      "Workspace lookup could not be completed against the configured database.",
      options
    );
  }
}

function resolutionError(
  code: WorkspaceResolutionErrorCode,
  message: string,
  options: ResolveWorkspaceOptions
) {
  return new WorkspaceResolutionError(code, message, options.workspaceId, options.expectedType);
}
