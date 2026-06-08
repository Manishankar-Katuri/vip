"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Save,
  Search,
  Send,
  User
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  approveContentDraft,
  chatWithWorkspace,
  createKnowledgeSource,
  generateContentDraft,
  generateWorkspaceMemory,
  getContentDrafts,
  getKnowledgeSources,
  getWebsiteContentCount,
  getWorkspace,
  getVectorMemoryCount,
  ingestWebsite,
  searchWorkspaceMemory,
  type ContentDraft,
  type ContentPlatform,
  type CreateKnowledgeSourcePayload,
  type KnowledgeSource,
  type KnowledgeSearchResult,
  type KnowledgeSourceType
} from "@/services/request.service";

const sourceTypes: {
  label: string;
  value: KnowledgeSourceType;
}[] = [
  {
    label: "Website",
    value: "WEBSITE"
  },
  {
    label: "Instagram",
    value: "INSTAGRAM"
  },
  {
    label: "Facebook",
    value: "FACEBOOK"
  },
  {
    label: "YouTube",
    value: "YOUTUBE"
  },
  {
    label: "Reviews",
    value: "REVIEWS"
  },
  {
    label: "Blogs",
    value: "BLOG"
  }
];

const contentPlatforms: {
  label: string;
  value: ContentPlatform;
}[] = [
  {
    label: "Instagram",
    value: "INSTAGRAM"
  },
  {
    label: "Facebook",
    value: "FACEBOOK"
  },
  {
    label: "Blog",
    value: "BLOG"
  },
  {
    label: "LinkedIn",
    value: "LINKEDIN"
  }
];

const initialForm: CreateKnowledgeSourcePayload = {
  sourceName: "",
  sourceUrl: "",
  sourceType: "WEBSITE"
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: KnowledgeSearchResult[];
};

export default function AdminWorkspacePage() {
  const params = useParams<{
    id: string;
  }>();

  const workspaceId = params.id;
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ingestedSourceId, setIngestedSourceId] =
    useState<string | null>(null);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [chatInput, setChatInput] =
    useState("");
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);
  const [form, setForm] = useState<CreateKnowledgeSourcePayload>(
    initialForm
  );

  const workspaceQueryKey = ["workspace", workspaceId];
  const knowledgeQueryKey = ["workspace-knowledge", workspaceId];
  const websiteContentCountQueryKey = [
    "website-content-count",
    workspaceId
  ];
  const vectorMemoryCountQueryKey = [
    "vector-memory-count",
    workspaceId
  ];
  const contentDraftsQueryKey = [
    "content-drafts",
    workspaceId
  ];

  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    isError: isWorkspaceError
  } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: () => getWorkspace(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const {
    data: sources = [],
    isLoading: isSourcesLoading
  } = useQuery({
    queryKey: knowledgeQueryKey,
    queryFn: () => getKnowledgeSources(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const {
    data: websiteContentCount
  } = useQuery({
    queryKey: websiteContentCountQueryKey,
    queryFn: () => getWebsiteContentCount(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const {
    data: vectorMemoryCount
  } = useQuery({
    queryKey: vectorMemoryCountQueryKey,
    queryFn: () => getVectorMemoryCount(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const {
    data: contentDrafts = [],
    isLoading: isContentDraftsLoading
  } = useQuery({
    queryKey: contentDraftsQueryKey,
    queryFn: () => getContentDrafts(workspaceId),
    enabled: Boolean(workspaceId)
  });

  const createMutation = useMutation({
    mutationFn: createKnowledgeSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: knowledgeQueryKey
      });
      setForm(initialForm);
      setIsDialogOpen(false);
    }
  });

  const ingestMutation = useMutation({
    mutationFn: ingestWebsite,
    onSuccess: (_content, variables) => {
      queryClient.invalidateQueries({
        queryKey: websiteContentCountQueryKey
      });
      setIngestedSourceId(variables.url);
    }
  });

  const searchMutation = useMutation({
    mutationFn: searchWorkspaceMemory
  });

  const generateMemoryMutation = useMutation({
    mutationFn: generateWorkspaceMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: vectorMemoryCountQueryKey
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: chatWithWorkspace,
    onSuccess: (response) => {
      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources
        }
      ]);
    },
    onError: () => {
      setChatMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Failed to get an answer from VIP AI."
        }
      ]);
    }
  });

  const generateContentMutation = useMutation({
    mutationFn: generateContentDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contentDraftsQueryKey
      });
    }
  });

  const approveContentMutation = useMutation({
    mutationFn: approveContentDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: contentDraftsQueryKey
      });
    }
  });

  const sourcesByType = useMemo(() => {
    return sources.reduce<Record<KnowledgeSourceType, KnowledgeSource[]>>(
      (groups, source) => {
        groups[source.sourceType].push(source);
        return groups;
      },
      {
        WEBSITE: [],
        INSTAGRAM: [],
        FACEBOOK: [],
        YOUTUBE: [],
        REVIEWS: [],
        BLOG: []
      }
    );
  }, [sources]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createMutation.mutate({
      workspaceId,
      payload: {
        ...form,
        sourceUrl: form.sourceUrl?.trim() || undefined,
        sourceName: form.sourceName.trim()
      }
    });
  };

  const handleIngestWebsite = (source: KnowledgeSource) => {
    if (!source.sourceUrl) {
      return;
    }

    setIngestedSourceId(null);

    ingestMutation.mutate({
      workspaceId,
      url: source.sourceUrl
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query =
      searchQuery.trim();

    if (!query) {
      return;
    }

    searchMutation.mutate({
      workspaceId,
      query
    });
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message =
      chatInput.trim();

    if (!message) {
      return;
    }

    setChatMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message
      }
    ]);

    setChatInput("");

    chatMutation.mutate({
      workspaceId,
      message
    });
  };

  const draftsByPlatform = contentDrafts.reduce<
    Record<ContentPlatform, ContentDraft[]>
  >(
    (groups, draft) => {
      groups[draft.platform].push(draft);
      return groups;
    },
    {
      INSTAGRAM: [],
      FACEBOOK: [],
      BLOG: [],
      LINKEDIN: []
    }
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-10 border-b border-slate-800 pb-8">
          <div className="mb-4 inline-flex rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-blue-400">
            VIP Workspace
          </div>

          {isWorkspaceLoading && (
            <div className="space-y-4">
              <div className="h-10 w-80 animate-pulse rounded bg-slate-800" />
              <div className="h-5 w-56 animate-pulse rounded bg-slate-800" />
            </div>
          )}

          {isWorkspaceError && (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-6 py-5 text-red-200">
              Failed to load workspace.
            </div>
          )}

          {workspace && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  {workspace.hospitalName}
                </h1>
                <p className="mt-3 text-slate-400">
                  {workspace.slug}
                </p>
              </div>
              <StatusBadge status={workspace.status} />
            </div>
          )}
        </div>

        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Knowledge Sources
              </h2>
              <p className="mt-2 text-slate-400">
                Manage the channels VIP should learn from.
              </p>
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-500">
                  <Plus className="size-4" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent className="border border-slate-800 bg-slate-950 text-white sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">
                    Add Knowledge Source
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Add a source VIP can use for workspace intelligence.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">
                      Source Name
                    </label>
                    <Input
                      required
                      value={form.sourceName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceName: event.target.value
                        }))
                      }
                      className="h-11 border-slate-700 bg-slate-900 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">
                      Source URL
                    </label>
                    <Input
                      value={form.sourceUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceUrl: event.target.value
                        }))
                      }
                      className="h-11 border-slate-700 bg-slate-900 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400">
                      Source Type
                    </label>
                    <select
                      value={form.sourceType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceType: event.target.value as KnowledgeSourceType
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    >
                      {sourceTypes.map((type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      form.sourceName.trim().length === 0
                    }
                    className="w-full bg-green-600 text-white hover:bg-green-500"
                  >
                    <Save className="size-4" />
                    {createMutation.isPending ? "Saving" : "Save"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isSourcesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sourceTypes.map((type) => (
                <div
                  key={type.value}
                  className="h-40 animate-pulse rounded-2xl bg-slate-900"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sourceTypes.map((type) => (
                <Card
                  key={type.value}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white"
                >
                  <CardHeader className="border-b border-slate-800 pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{type.label}</span>
                      <span className="flex items-center gap-2">
                        {type.value === "WEBSITE" && (
                          <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs text-blue-300">
                            {websiteContentCount?.count ?? 0} ingested
                          </span>
                        )}
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                          {sourcesByType[type.value].length}
                        </span>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sourcesByType[type.value].length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
                        No sources added.
                      </div>
                    )}

                    {sourcesByType[type.value].map((source) => (
                      <div
                        key={source.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="font-medium text-slate-100">
                          {source.sourceName}
                        </div>
                        {source.sourceUrl && (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block truncate text-sm text-blue-300 hover:text-blue-200"
                          >
                            {source.sourceUrl}
                          </a>
                        )}
                        {type.value === "WEBSITE" && (
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                !source.sourceUrl ||
                                (
                                  ingestMutation.isPending &&
                                  ingestMutation.variables?.url ===
                                    source.sourceUrl
                                )
                              }
                              onClick={() => handleIngestWebsite(source)}
                              className="bg-blue-600 text-white hover:bg-blue-500"
                            >
                              <Download className="size-3.5" />
                              {ingestMutation.isPending &&
                              ingestMutation.variables?.url ===
                                source.sourceUrl
                                ? "Ingesting"
                                : "Ingest Website"}
                            </Button>

                            {ingestedSourceId === source.sourceUrl && (
                              <div className="flex items-center gap-1.5 text-sm text-green-300">
                                <CheckCircle2 className="size-4" />
                                Ingested
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-slate-800 pt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Content Studio
            </h2>
            <p className="mt-2 text-slate-400">
              Generate and approve hospital content from workspace memory.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {contentPlatforms.map((platform) => {
              const isGenerating =
                generateContentMutation.isPending &&
                generateContentMutation.variables?.platform ===
                  platform.value;

              return (
                <Card
                  key={platform.value}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white"
                >
                  <CardHeader className="border-b border-slate-800 pb-4">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        <FileText className="size-4 text-blue-300" />
                        {platform.label}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {draftsByPlatform[platform.value].length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      disabled={isGenerating}
                      onClick={() =>
                        generateContentMutation.mutate({
                          workspaceId,
                          platform: platform.value,
                          type: "educational"
                        })
                      }
                      className="w-full bg-blue-600 text-white hover:bg-blue-500"
                    >
                      <FileText className="size-4" />
                      {isGenerating ? "Generating..." : "Generate Content"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold">
              Generated Drafts
            </h3>

            {isContentDraftsLoading && (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-2xl bg-slate-900"
                  />
                ))}
              </div>
            )}

            {!isContentDraftsLoading && contentDrafts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-8 text-sm text-slate-500">
                No content drafts generated yet.
              </div>
            )}

            {contentDrafts.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {contentDrafts.map((draft) => {
                  const isApproving =
                    approveContentMutation.isPending &&
                    approveContentMutation.variables === draft.id;

                  return (
                    <Card
                      key={draft.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white"
                    >
                      <CardHeader className="border-b border-slate-800 pb-4">
                        <CardTitle className="flex items-start justify-between gap-3 text-lg">
                          <span>{draft.title}</span>
                          <StatusBadge status={draft.status} />
                        </CardTitle>
                        <div className="text-xs uppercase tracking-wide text-blue-300">
                          {draft.platform}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {draft.content}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={
                            draft.status !== "DRAFT" ||
                            isApproving
                          }
                          onClick={() => approveContentMutation.mutate(draft.id)}
                          className="bg-green-600 text-white hover:bg-green-500"
                        >
                          <CheckCircle2 className="size-3.5" />
                          {isApproving ? "Approving" : "Approve"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 border-t border-slate-800 pt-10">
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="size-5 text-blue-300" />
                AI Memory
              </CardTitle>
              <p className="text-sm text-slate-400">
                Convert website content into searchable vector memory.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="text-xs text-slate-500">
                      Website content
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {websiteContentCount?.count ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="text-xs text-slate-500">
                      Vector memory
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {vectorMemoryCount?.count ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="text-xs text-slate-500">
                      Last saved
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {generateMemoryMutation.data?.savedCount ?? 0}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={generateMemoryMutation.isPending}
                  onClick={() => generateMemoryMutation.mutate(workspaceId)}
                  className="h-11 bg-green-600 text-white hover:bg-green-500 sm:w-52"
                >
                  <Brain className="size-4" />
                  {generateMemoryMutation.isPending
                    ? "Generating memory..."
                    : "Generate Memory"}
                </Button>
              </div>

              {generateMemoryMutation.isSuccess && (
                <div className="rounded-2xl border border-green-700/60 bg-green-950/40 px-5 py-4 text-green-200">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="size-4" />
                    Memory generated successfully
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-green-100 sm:grid-cols-2">
                    <div>
                      Chunks generated:{" "}
                      {generateMemoryMutation.data.chunkCount ??
                        generateMemoryMutation.data.savedCount}
                    </div>
                    <div>
                      Vectors saved: {generateMemoryMutation.data.savedCount}
                    </div>
                  </div>
                </div>
              )}

              {generateMemoryMutation.isError && (
                <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-5 py-4 text-red-200">
                  Failed to generate memory.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 border-t border-slate-800 pt-10">
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="size-5 text-blue-300" />
                VIP AI Assistant
              </CardTitle>
              <p className="text-sm text-slate-400">
                Ask questions using this workspace&apos;s hospital knowledge.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-64 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                {chatMessages.length === 0 && (
                  <div className="flex h-52 items-center justify-center text-sm text-slate-500">
                    Start a conversation with VIP AI.
                  </div>
                )}

                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-3xl rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white"
                          : "max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100"
                      }
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                        {message.role === "user" ? (
                          <User className="size-3.5" />
                        ) : (
                          <Bot className="size-3.5" />
                        )}
                        {message.role === "user" ? "You" : "VIP AI"}
                      </div>
                      <p className="whitespace-pre-wrap leading-6">
                        {message.content}
                      </p>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-slate-700 pt-3">
                          <div className="text-xs font-medium text-slate-400">
                            Sources used
                          </div>
                          {message.sources.map((source, index) => (
                            <div
                              key={`${source.score}-${index}`}
                              className="rounded-xl bg-slate-950/80 p-3"
                            >
                              <div className="mb-1 text-xs text-green-300">
                                Score {source.score.toFixed(4)}
                              </div>
                              <div className="line-clamp-3 text-xs leading-5 text-slate-400">
                                {source.chunkText}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                      VIP AI is thinking...
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask VIP AI about this hospital..."
                  className="h-11 border-slate-700 bg-slate-950 text-white"
                />
                <Button
                  type="submit"
                  disabled={
                    chatMutation.isPending ||
                    chatInput.trim().length === 0
                  }
                  className="h-11 bg-blue-600 text-white hover:bg-blue-500 sm:w-32"
                >
                  <Send className="size-4" />
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 border-t border-slate-800 pt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Test Knowledge Search
            </h2>
            <p className="mt-2 text-slate-400">
              Ask against the embedded workspace memory.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row"
          >
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ask about this hospital..."
              className="h-11 border-slate-700 bg-slate-950 text-white"
            />
            <Button
              type="submit"
              disabled={
                searchMutation.isPending ||
                searchQuery.trim().length === 0
              }
              className="h-11 bg-blue-600 text-white hover:bg-blue-500 sm:w-40"
            >
              <Search className="size-4" />
              {searchMutation.isPending ? "Searching..." : "Search Memory"}
            </Button>
          </form>

          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold">
              Top Matches
            </h3>

            {!searchMutation.data &&
              !searchMutation.isPending &&
              !searchMutation.isError && (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-8 text-sm text-slate-500">
                  Search results will appear here.
                </div>
              )}

            {searchMutation.isPending && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl bg-slate-900"
                  />
                ))}
              </div>
            )}

            {searchMutation.isError && (
              <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-6 py-5 text-red-200">
                Failed to search workspace memory.
              </div>
            )}

            {searchMutation.data?.results.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-8 text-sm text-slate-500">
                No matching chunks found.
              </div>
            )}

            {searchMutation.data &&
              searchMutation.data.results.length > 0 && (
                <div className="grid gap-4">
                  {searchMutation.data.results.map((result, index) => (
                    <Card
                      key={`${result.score}-${index}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 text-white"
                    >
                      <CardHeader className="border-b border-slate-800 pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>Match {index + 1}</span>
                          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs text-green-300">
                            {result.score.toFixed(4)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                          {result.chunkText}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}
