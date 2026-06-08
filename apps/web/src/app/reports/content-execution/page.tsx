"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, FileText, Mail, RefreshCw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";

type Decision = "KEEP" | "IMPROVE" | "REPLACE" | "ADD" | "PAUSE";

type PreviewResponse = {
  contentWindow: {
    label: string;
    purpose: string;
    windowStartDate: string;
    windowEndDate: string;
    displayRange?: string;
    sendDay: string;
    sendTime: string;
  };
  plannedCalendarItems: Array<{ id: string; plannedTopic: string; platform: string; date: string }>;
  expectedDocumentTitle: string;
};

type DocumentSummary = {
  id: string;
  title: string;
  emailSubject: string;
  fileUrl: string | null;
  deliveryStatus: string;
  generatedAt: string;
  sentAt: string | null;
  executionWindow: {
    sendDay: string;
    windowStartDate: string;
    windowEndDate: string;
  };
};

type ExecutionDocument = {
  title: string;
  mode: "real" | "preview";
  modeLabel: string;
  clientName: string;
  workspaceName: string;
  contentWindow: {
    startDate: string;
    endDate: string;
    displayStartDate: string;
    displayEndDate: string;
    displayRange: string;
    label: string;
    purpose: string;
    sendDay: string;
    sendTime: string;
  };
  executiveBrief: {
    mainTheme: string;
    primaryGoal: string;
    platformsCovered: string[];
    totalContentPieces: number;
    adjustedItemsCount: number;
    freshAiItemsCount: number;
    priorityPreparationSummary: string;
  };
  intelligenceNote: string;
  intelligenceBasedAdjustments: Array<{
    date: string;
    platform: string;
    originalPlan: string;
    finalPlan: string;
    decision: Decision;
    reason: string;
  }>;
  dayWiseSchedule: Array<{
    date: string;
    day: string;
    platform: string;
    contentType: string;
    topic: string;
    postingTime: string;
    assetNeeded: string;
    approvalStatus: string;
  }>;
  detailedContentInstructions: Array<{
    date: string;
    platform: string;
    decision: Decision;
    postingTime: string;
    contentType: string;
    topic: string;
    objective: string;
    targetAudience: string;
    duration?: string;
    fullScript?: {
      scenes: Array<{
        sceneNumber: number;
        sceneTitle: string;
        timestamp: string;
        doctorLines?: string[];
        voiceoverLines?: string[];
        onScreenText?: string[];
        visualDirection?: string;
        brollSuggestions?: string[];
      }>;
    };
    carouselSlides?: Array<{
      slideNumber: number;
      headline: string;
      body: string;
      visualSuggestion: string;
    }>;
    gbpPostCopy?: string;
    gbpSuggestedImage?: string;
    gbpServiceCategory?: string;
    whatsappMessage?: string;
    whatsappAudienceSegment?: string;
    whatsappFollowUpNote?: string;
    blogArticlePlan?: {
      title: string;
      outline: string[];
      introParagraph: string;
      sectionHeadings: string[];
      cta: string;
    };
    hook: string;
    caption: string;
    hashtags: string[];
    cta: string;
    thumbnailText?: string;
    creativeDirection: string;
    recordingInstructions?: string[];
    editingInstructions?: string[];
    designInstructions?: string[];
    assetsRequired: string[];
    clientPreparationNeeded: string[];
    internalTeamTasks: string[];
    approvalChecklist: string[];
    medicalSafetyNote: string;
    expectedImpact: string;
  }>;
  assetChecklist: {
    neededFromClient: string[];
    neededFromInternalTeam: string[];
  };
  priorityActions: string[];
  emailSummaryPreview?: { subject: string; body: string };
};

type DetailResponse = {
  documentId: string;
  document: ExecutionDocument;
  deliveryStatus: string;
  email: { subject: string; body: string };
  fileUrl: string | null;
};

export default function ContentExecutionReportsPage() {
  const { activeHospital } = useHospital();
  const workspaceId = activeHospital?.id ?? "";
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedId) ?? null,
    [documents, selectedId]
  );

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setIsBusy(true);
    setMessage(null);

    try {
      const [nextResponse, listResponse] = await Promise.all([
        apiFetch<PreviewResponse>(`/content/execution-plans/next?workspaceId=${workspaceId}`),
        apiFetch<{ documents: DocumentSummary[] }>(`/content/execution-plans?workspaceId=${workspaceId}`),
      ]);

      setPreview(nextResponse);
      setDocuments(listResponse.documents);
      setSelectedId((current) => current ?? listResponse.documents[0]?.id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load execution plans.");
    } finally {
      setIsBusy(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    void apiFetch<DetailResponse>(`/content/execution-plans/${selectedId}`)
      .then(setDetail)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load document."));
  }, [selectedId]);

  async function generatePlan(mode: "real" | "preview" = "real", generationMode: "fromToday" | "scheduled" = "fromToday") {
    if (!workspaceId) return;
    setIsBusy(true);
    setMessage(null);

    try {
      const response = await apiFetch<{ documentId: string }>("/content/execution-plans/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId, mode, generationMode }),
      });
      setSelectedId(response.documentId);
      setMessage(generationMode === "fromToday" ? "3-day plan from today generated." : "Scheduled preview plan generated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate plan.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendEmail() {
    if (!selectedId) return;
    setIsBusy(true);
    setMessage(null);

    try {
      const response = await apiFetch<{ deliveryStatus: string }>(`/content/execution-plans/${selectedId}/send`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMessage(`Email delivery logged as ${response.deliveryStatus}.`);
      await load();
      const refreshed = await apiFetch<DetailResponse>(`/content/execution-plans/${selectedId}`);
      setDetail(refreshed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send email.");
    } finally {
      setIsBusy(false);
    }
  }

  if (!activeHospital) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-muted-foreground">Select a hospital workspace to review content execution plans.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6">
      <section className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reports</p>
          <h1 className="text-2xl font-semibold tracking-normal">Content execution plans</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {activeHospital.name} adaptive 3-day workflow, generated from calendar baseline plus recent intelligence.
          </p>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Manual generation starts from today. Automated emails continue to follow Sunday, Wednesday, and Saturday schedules.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Workspace active</Badge>
            <span>{activeHospital.slug}</span>
            {activeHospital.specialty ? <span>{activeHospital.specialty}</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={isBusy}>
            <RefreshCw className="size-4" aria-hidden /> Refresh
          </Button>
          <Button variant="outline" onClick={() => void generatePlan("preview", "scheduled")} disabled={isBusy}>
            <FileText className="size-4" aria-hidden /> Preview Next Scheduled Plan
          </Button>
          <Button onClick={() => void generatePlan("real", "fromToday")} disabled={isBusy}>
            <FileText className="size-4" aria-hidden /> Generate 3-Day Plan From Today
          </Button>
        </div>
      </section>

      {message ? <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-4">
          <div className="rounded-md border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Next scheduled plan</h2>
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            </div>
            {preview ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{preview.contentWindow.label}</p>
                <p className="text-muted-foreground">Plan window: {preview.contentWindow.displayRange ?? `${preview.contentWindow.windowStartDate} to ${preview.contentWindow.windowEndDate}`}</p>
                <p className="text-muted-foreground">{preview.contentWindow.sendDay} at {preview.contentWindow.sendTime}</p>
                {preview.contentWindow.sendDay === "Saturday" ? (
                  <Badge variant="secondary">Weekend + next week prep pack</Badge>
                ) : null}
                <p className="text-muted-foreground">{preview.plannedCalendarItems.length} planned calendar item(s)</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            )}
          </div>

          <div className="rounded-md border bg-card">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold">Generated documents</h2>
            </div>
            <div className="divide-y">
              {documents.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setSelectedId(document.id)}
                  className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-muted ${document.id === selectedId ? "bg-muted" : ""}`}
                >
                  <span className="block font-medium">{document.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {document.executionWindow.windowStartDate} to {document.executionWindow.windowEndDate}
                  </span>
                  <Badge className="mt-2" variant={document.deliveryStatus === "DRAFT" ? "outline" : "secondary"}>
                    {document.deliveryStatus}
                  </Badge>
                  {document.fileUrl ? <span className="ml-2 text-xs text-muted-foreground">File ready</span> : null}
                </button>
              ))}
              {!documents.length ? <p className="p-4 text-sm text-muted-foreground">No generated plans yet.</p> : null}
            </div>
          </div>
        </aside>

        <section className="rounded-md border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-base font-semibold">{detail?.document.title ?? selectedDocument?.title ?? "Document detail"}</h2>
              <p className="text-sm text-muted-foreground">{detail?.email.subject ?? selectedDocument?.emailSubject ?? "Select or generate a document."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail?.fileUrl ? (
                <Button asChild variant="outline">
                  <a href={detail.fileUrl} target="_blank" rel="noreferrer">
                    <FileText className="size-4" aria-hidden /> Open document
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void sendEmail()} disabled={!selectedId || isBusy}>
                <Send className="size-4" aria-hidden /> Send email
              </Button>
            </div>
          </div>

          {detail ? (
            <div className="space-y-5 p-4">
              <section className="rounded-md border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">VIP Intelligence OS</p>
                <h3 className="mt-1 text-xl font-semibold tracking-normal">{detail.document.title}</h3>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium">{detail.document.clientName}</p>
                    <p className="text-muted-foreground">Workspace/business: {detail.document.workspaceName}</p>
                    <Badge className="mt-2" variant={detail.document.mode === "preview" ? "secondary" : "outline"}>
                      {detail.document.modeLabel}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plan window</p>
                    <p className="font-medium">Plan window: {detail.document.contentWindow.displayRange}</p>
                    <p className="text-muted-foreground">{detail.document.contentWindow.sendDay} at {detail.document.contentWindow.sendTime} | {detail.document.contentWindow.purpose}</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Pieces" value={detail.document.executiveBrief.totalContentPieces} />
                <Metric label="Adjusted" value={detail.document.executiveBrief.adjustedItemsCount} />
                <Metric label="Fresh adds" value={detail.document.executiveBrief.freshAiItemsCount} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TextMetric label="Main theme" value={detail.document.executiveBrief.mainTheme} />
                <TextMetric label="Primary goal" value={detail.document.executiveBrief.primaryGoal} />
                <TextMetric label="Platforms" value={detail.document.executiveBrief.platformsCovered.join(", ") || "None"} />
              </div>
              <section className="rounded-md border p-3">
                <h3 className="mb-2 text-sm font-semibold">Priority preparation summary</h3>
                <p className="text-sm leading-6 text-muted-foreground">{detail.document.executiveBrief.priorityPreparationSummary || "No priority preparation listed."}</p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Intelligence Note</h3>
                <p className="text-sm leading-6 text-muted-foreground">{detail.document.intelligenceNote}</p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Intelligence-Based Adjustments</h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 pl-3 pr-3 font-medium">Date</th>
                        <th className="py-2 pr-3 font-medium">Platform</th>
                        <th className="py-2 pr-3 font-medium">Original Plan</th>
                        <th className="py-2 pr-3 font-medium">Final Plan</th>
                        <th className="py-2 pr-3 font-medium">Decision</th>
                        <th className="py-2 pr-3 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.document.intelligenceBasedAdjustments.map((item, index) => (
                        <tr key={`${item.date}-${item.platform}-${index}`}>
                          <td className="py-2 pl-3 pr-3 align-top">{item.date}</td>
                          <td className="py-2 pr-3 align-top">{item.platform}</td>
                          <td className="py-2 pr-3 align-top">{item.originalPlan}</td>
                          <td className="py-2 pr-3 align-top font-medium">{item.finalPlan}</td>
                          <td className="py-2 pr-3 align-top"><DecisionBadge decision={item.decision} /></td>
                          <td className="py-2 pr-3 align-top text-muted-foreground">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Day-Wise Execution Schedule</h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2 pl-3 pr-3 font-medium">Date</th>
                        <th className="py-2 pr-3 font-medium">Day</th>
                        <th className="py-2 pr-3 font-medium">Platform</th>
                        <th className="py-2 pr-3 font-medium">Content Type</th>
                        <th className="py-2 pr-3 font-medium">Topic</th>
                        <th className="py-2 pr-3 font-medium">Posting Time</th>
                        <th className="py-2 pr-3 font-medium">Asset Needed</th>
                        <th className="py-2 pr-3 font-medium">Approval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detail.document.dayWiseSchedule.map((item, index) => (
                        <tr key={`${item.date}-${item.topic}-${index}`}>
                          <td className="py-2 pl-3 pr-3 align-top">{item.date}</td>
                          <td className="py-2 pr-3 align-top">{item.day}</td>
                          <td className="py-2 pr-3">{item.platform}</td>
                          <td className="py-2 pr-3">{item.contentType}</td>
                          <td className="py-2 pr-3">{item.topic}</td>
                          <td className="py-2 pr-3">{item.postingTime}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{item.assetNeeded}</td>
                          <td className="py-2 pr-3">{item.approvalStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold">Detailed Content Instructions</h3>
                <div className="space-y-3">
                  {detail.document.detailedContentInstructions.map((item, index) => (
                    <article key={`${item.date}-${item.platform}-${item.topic}-${index}`} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <DecisionBadge decision={item.decision} />
                        <span className="font-semibold">{item.date} | {item.platform} | {item.contentType}</span>
                        <span className="text-muted-foreground">{item.postingTime}</span>
                      </div>
                      <h4 className="mt-2 font-medium">{item.topic}</h4>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <InstructionField label="Hook" value={item.hook} />
                        <InstructionField label="Objective" value={item.objective} />
                        <InstructionField label="Target audience" value={item.targetAudience} />
                        {item.duration ? <InstructionField label="Duration" value={item.duration} /> : null}
                        <InstructionField label="CTA" value={item.cta} />
                        {item.thumbnailText ? <InstructionField label="Thumbnail text" value={item.thumbnailText} /> : null}
                        <InstructionField label="Creative direction" value={item.creativeDirection} />
                        <InstructionField label="Expected impact" value={item.expectedImpact} />
                      </div>
                      <RichInstructionBlocks item={item} />
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <InstructionField label="Caption" value={item.caption} />
                        <InstructionField label="Hashtags" value={item.hashtags.join(", ")} />
                        <InstructionField label="Assets required" value={item.assetsRequired.join(", ")} />
                        <InstructionField label="Client preparation needed" value={item.clientPreparationNeeded.join(", ")} />
                        <InstructionField label="Internal team tasks" value={item.internalTeamTasks.join(", ")} />
                        <InstructionField label="Approval checklist" value={item.approvalChecklist.join(", ")} />
                        <InstructionField label="Medical safety note" value={item.medicalSafetyNote} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <Checklist title="Needed from client" items={detail.document.assetChecklist.neededFromClient} />
                <Checklist title="Internal team" items={detail.document.assetChecklist.neededFromInternalTeam} />
              </section>

              <Checklist title="Priority actions" items={detail.document.priorityActions} />

              <section className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Mail className="size-4" aria-hidden /> Email status: {detail.deliveryStatus}
                </div>
                <p className="text-sm font-medium">{detail.document.emailSummaryPreview?.subject ?? detail.email.subject}</p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{detail.document.emailSummaryPreview?.body ?? detail.email.body}</pre>
              </section>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No document selected.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function TextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function InstructionField({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {value}
    </p>
  );
}

function RichInstructionBlocks({ item }: { item: ExecutionDocument["detailedContentInstructions"][number] }) {
  return (
    <div className="mt-3 space-y-3">
      {item.fullScript ? (
        <div className="rounded-md border p-3">
          <h5 className="mb-2 text-sm font-semibold">Full video script</h5>
          <div className="space-y-2">
            {item.fullScript.scenes.map((scene) => (
              <div key={scene.sceneNumber} className="rounded border bg-muted/30 p-2">
                <p className="font-medium">Scene {scene.sceneNumber}: {scene.sceneTitle} ({scene.timestamp})</p>
                <InstructionField label="Doctor/voiceover lines" value={[...(scene.doctorLines ?? []), ...(scene.voiceoverLines ?? [])].join(" ")} />
                <InstructionField label="On-screen text" value={(scene.onScreenText ?? []).join(" | ")} />
                {scene.visualDirection ? <InstructionField label="Visual direction" value={scene.visualDirection} /> : null}
                {scene.brollSuggestions?.length ? <InstructionField label="B-roll" value={scene.brollSuggestions.join(", ")} /> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {item.carouselSlides ? (
        <div className="rounded-md border p-3">
          <h5 className="mb-2 text-sm font-semibold">Slide-by-slide carousel copy</h5>
          <div className="space-y-2">
            {item.carouselSlides.map((slide) => (
              <div key={slide.slideNumber} className="rounded border bg-muted/30 p-2">
                <p className="font-medium">Slide {slide.slideNumber}: {slide.headline}</p>
                <p className="text-sm text-muted-foreground">{slide.body}</p>
                <p className="text-xs text-muted-foreground">Visual: {slide.visualSuggestion}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {item.gbpPostCopy ? <CopyBlock title="GBP post copy" value={item.gbpPostCopy} /> : null}
      {item.gbpSuggestedImage ? <InstructionField label="Suggested image" value={item.gbpSuggestedImage} /> : null}
      {item.gbpServiceCategory ? <InstructionField label="Service/category" value={item.gbpServiceCategory} /> : null}
      {item.whatsappMessage ? <CopyBlock title="Exact WhatsApp message" value={item.whatsappMessage} /> : null}
      {item.whatsappAudienceSegment ? <InstructionField label="Audience segment" value={item.whatsappAudienceSegment} /> : null}
      {item.whatsappFollowUpNote ? <InstructionField label="Follow-up note" value={item.whatsappFollowUpNote} /> : null}
      {item.blogArticlePlan ? (
        <div className="rounded-md border p-3">
          <h5 className="mb-2 text-sm font-semibold">Blog / article plan</h5>
          <InstructionField label="Title" value={item.blogArticlePlan.title} />
          <InstructionField label="Intro" value={item.blogArticlePlan.introParagraph} />
          <InstructionField label="Outline" value={item.blogArticlePlan.outline.join(", ")} />
          <InstructionField label="Section headings" value={item.blogArticlePlan.sectionHeadings.join(", ")} />
        </div>
      ) : null}
      {item.recordingInstructions?.length ? <Checklist title="Recording instructions" items={item.recordingInstructions} /> : null}
      {item.editingInstructions?.length ? <Checklist title="Editing instructions" items={item.editingInstructions} /> : null}
      {item.designInstructions?.length ? <Checklist title="Design instructions" items={item.designInstructions} /> : null}
    </div>
  );
}

function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <h5 className="mb-2 text-sm font-semibold">{title}</h5>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border p-3">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
        {!items.length ? <li>No items listed.</li> : null}
      </ul>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const variant = decision === "PAUSE" ? "destructive" : decision === "KEEP" ? "outline" : "secondary";

  return <Badge className="font-semibold" variant={variant}>{decision}</Badge>;
}
