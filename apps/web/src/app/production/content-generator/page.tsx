"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type GeneratorWorkspace = {
  brandVoice:{
    tone:string;
    style:string;
    audience:string;
    messaging:string;
  } | null;
  activeStrategyThemes:Array<{
    key:string;
    title:string;
    rationale:string;
  }>;
  templates:Array<{
    id:string;
    title:string;
    goal:string;
    tone:string;
    format:string;
  }>;
  recentCalendarItems:Array<{
    id:string;
    title:string;
    scheduledDate:string;
    status:string;
    category:string;
    contentType:string;
  }>;
  sourceReferences:Array<{
    publisher:string;
    title:string;
    url:string;
    use:string;
  }>;
  recentRuns:GeneratorRun[];
};

type GeneratorRun = {
  id:string;
  idea:string;
  platform:string;
  format:string;
  audience:string;
  objective:string;
  doctorName:string | null;
  serviceLine:string | null;
  languagePlan:string;
  urgency:string;
  requestType:string;
  desiredPublishDate:string | null;
  strategyFit:string;
  contentPillar:string;
  generatedContext:GeneratorContext;
  evidence:EvidenceItem[];
  safetyNotes:string[];
  output:GeneratedOutput;
  status:string;
  rejectionReason:string | null;
  calendarItemId:string | null;
  scriptId:string | null;
  createdAt:string;
};

type GeneratorContext = {
  strategyFit?:string;
  contentPillar?:string;
  whyThisCanWork?:string;
  calendarContext?:string;
  requiresClinicalReview?:boolean;
};

type EvidenceItem = {
  label:string;
  detail:string;
};

type GeneratedOutput = {
  title:string;
  hook:string;
  hookOptions:string[];
  script:string;
  caption:string;
  cta:string;
  ctaVariants:string[];
  hashtags:string[];
  productionNotes:string[];
  measurementTargets:string[];
  approvalChecklist:string[];
};

type FormState = {
  idea:string;
  platform:string;
  format:string;
  audience:string;
  objective:string;
  doctorName:string;
  serviceLine:string;
  languagePlan:string;
  urgency:string;
  requestType:string;
  desiredPublishDate:string;
  tone:string;
};

const DEFAULT_FORM:FormState = {
  idea:"",
  platform:"Instagram",
  format:"Reel",
  audience:"",
  objective:"Create useful patient-facing content.",
  doctorName:"",
  serviceLine:"",
  languagePlan:"English master copy; Telugu adaptation after clinical approval.",
  urgency:"normal",
  requestType:"outside_strategy",
  desiredPublishDate:toDateInput(new Date()),
  tone:"Clear, warm, clinically responsible"
};

const platforms = ["Instagram", "Facebook", "Google Business Profile", "YouTube", "WhatsApp"];
const formats = ["Reel", "Carousel", "Post", "Story", "YouTube Short", "GBP update", "WhatsApp card"];
const requestTypes = [
  { value:"outside_strategy", label:"Outside strategy" },
  { value:"trend", label:"Trend" },
  { value:"hospital_request", label:"Hospital request" },
  { value:"special_day", label:"Special day" },
  { value:"urgent_update", label:"Urgent update" }
];

export default function ContentGeneratorPage() {
  const { activeHospital } = useHospital();
  const [workspace, setWorkspace] = useState<GeneratorWorkspace | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [run, setRun] = useState<GeneratorRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!activeHospital) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<GeneratorWorkspace>("/production/content-generator");
      setWorkspace(response);
      setForm((current) => ({
        ...current,
        audience:current.audience || response.brandVoice?.audience || ""
      }));
    } catch {
      setError("Content Generator could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [activeHospital]);

  useEffect(() => {
    void Promise.resolve().then(loadWorkspace);
  }, [loadWorkspace]);

  async function generateContent() {
    setIsGenerating(true);
    setError(null);

    try {
      const generated = await apiFetch<GeneratorRun>(
        "/production/content-generator/generate",
        {
          method:"POST",
          body:JSON.stringify(form)
        }
      );
      setRun(generated);
      setRejectReason("");
      await loadWorkspace();
    } catch {
      setError("Content generation failed. Add an idea and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function promote(options:{ createCalendarItem?:boolean; createScript?:boolean; reject?:boolean }) {
    if (!run) return;

    setIsPromoting(true);
    setError(null);

    try {
      const updated = await apiFetch<GeneratorRun>(
        `/production/content-generator/${run.id}/promote`,
        {
          method:"POST",
          body:JSON.stringify({
            ...options,
            rejectionReason:rejectReason
          })
        }
      );
      setRun(updated);
      await loadWorkspace();
    } catch {
      setError("Handoff failed. Please review the generated draft and try again.");
    } finally {
      setIsPromoting(false);
    }
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.CREATE_CONTENT}
      fallback={<AccessDenied />}
    >
      <div className="space-y-6">
        <Header
          activeHospitalName={activeHospital?.name ?? "Production workspace"}
          brandVoice={workspace?.brandVoice}
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <StatePanel message="Loading Content Generator..." />
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <IdeaIntake
              form={form}
              setForm={setForm}
              templates={workspace?.templates ?? []}
              onGenerate={generateContent}
              isGenerating={isGenerating}
            />
            <div className="space-y-5">
              <ContextBuilder
                run={run}
                workspace={workspace}
              />
              <GeneratedPackage run={run} />
              <HandoffPanel
                run={run}
                isPromoting={isPromoting}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                onPromote={promote}
              />
            </div>
          </div>
        )}

        <RecentWork
          workspace={workspace}
          onSelectRun={setRun}
        />
      </div>
    </PermissionGate>
  );
}

function Header({
  activeHospitalName,
  brandVoice
}: Readonly<{
  activeHospitalName:string;
  brandVoice:GeneratorWorkspace["brandVoice"] | undefined;
}>) {
  return (
    <section className="rounded-lg bg-stone-950 p-6 text-white shadow-sm lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            Content Generator
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
            Off-strategy idea to governed AI draft
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-200">
            Turn a mid-month production idea for {activeHospitalName} into an evidence-labelled brief, draft, safety checklist, and calendar or Script Studio handoff.
          </p>
        </div>
        <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-stone-100">
          {brandVoice
            ? `Brand voice: ${brandVoice.tone || "Configured"}`
            : "Brand voice defaults active"}
        </div>
      </div>
    </section>
  );
}

function IdeaIntake({
  form,
  setForm,
  templates,
  onGenerate,
  isGenerating
}: Readonly<{
  form:FormState;
  setForm:React.Dispatch<React.SetStateAction<FormState>>;
  templates:GeneratorWorkspace["templates"];
  onGenerate:() => Promise<void>;
  isGenerating:boolean;
}>) {
  const update = <K extends keyof FormState>(
    key:K,
    value:FormState[K]
  ) => setForm((current) => ({ ...current, [key]:value }));

  return (
    <aside className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm xl:sticky xl:top-24">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-900" />
        <h2 className="text-lg font-semibold">Idea intake</h2>
      </div>

      <Field label="What is the idea?">
        <textarea
          className="min-h-32 w-full rounded-lg border border-stone-200 p-3 text-sm leading-6"
          value={form.idea}
          onChange={(event) => update("idea", event.target.value)}
          placeholder="Example: A doctor-led Reel about why ear pain should not be treated with leftover antibiotics."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <SelectField label="Platform" value={form.platform} options={platforms} onChange={(value) => update("platform", value)} />
        <SelectField label="Format" value={form.format} options={formats} onChange={(value) => update("format", value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <SelectField
          label="Request type"
          value={form.requestType}
          options={requestTypes.map((type) => type.value)}
          labels={Object.fromEntries(requestTypes.map((type) => [type.value, type.label]))}
          onChange={(value) => update("requestType", value)}
        />
        <SelectField
          label="Urgency"
          value={form.urgency}
          options={["normal", "urgent"]}
          labels={{ normal:"Normal", urgent:"Urgent" }}
          onChange={(value) => update("urgency", value)}
        />
      </div>

      <Field label="Audience">
        <input
          className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
          value={form.audience}
          onChange={(event) => update("audience", event.target.value)}
          placeholder="Parents, working adults, caregivers..."
        />
      </Field>

      <Field label="Objective">
        <textarea
          className="min-h-20 w-full rounded-lg border border-stone-200 p-3 text-sm"
          value={form.objective}
          onChange={(event) => update("objective", event.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Doctor">
          <input
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
            value={form.doctorName}
            onChange={(event) => update("doctorName", event.target.value)}
          />
        </Field>
        <Field label="Service line">
          <input
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
            value={form.serviceLine}
            onChange={(event) => update("serviceLine", event.target.value)}
            placeholder="ENT, hearing, sinus..."
          />
        </Field>
      </div>

      <Field label="Language plan">
        <input
          className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
          value={form.languagePlan}
          onChange={(event) => update("languagePlan", event.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Desired date">
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
            value={form.desiredPublishDate}
            onChange={(event) => update("desiredPublishDate", event.target.value)}
          />
        </Field>
        <Field label="Tone">
          <input
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
            value={form.tone}
            onChange={(event) => update("tone", event.target.value)}
          />
        </Field>
      </div>

      {templates.length ? (
        <section>
          <p className="mb-2 text-sm font-medium text-stone-600">Prompt presets</p>
          <div className="grid gap-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                type="button"
                className="rounded-lg border border-stone-200 p-3 text-left text-sm transition hover:bg-stone-50"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    objective:template.goal,
                    tone:template.tone,
                    format:labelize(template.format)
                  }))
                }
              >
                <span className="font-semibold">{template.title}</span>
                <span className="mt-1 block text-xs leading-5 text-stone-500">{template.goal}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isGenerating || !form.idea.trim()}
        onClick={() => void onGenerate()}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        Generate Context And Draft
      </button>
    </aside>
  );
}

function ContextBuilder({
  run,
  workspace
}: Readonly<{
  run:GeneratorRun | null;
  workspace:GeneratorWorkspace | null;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            <Bot className="h-4 w-4 text-emerald-900" />
            AI context builder
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Shows how the off-strategy idea is being interpreted before production uses the draft.
          </p>
        </div>
        <FitBadge fit={run?.strategyFit ?? "Waiting for idea"} />
      </div>

      {run ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <ContextCard label="Inferred pillar" value={labelize(run.contentPillar)} />
            <ContextCard label="Why AI thinks this can work" value={run.generatedContext.whyThisCanWork ?? "Generated with review safeguards."} />
            <ContextCard label="Calendar context" value={run.generatedContext.calendarContext ?? "Calendar context unavailable."} />
          </div>
          <div className="space-y-3">
            {(run.evidence ?? []).map((item) => (
              <div key={item.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {(workspace?.activeStrategyThemes ?? []).map((theme) => (
            <div key={theme.key} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-900">{theme.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">{theme.rationale}</p>
            </div>
          ))}
          {!workspace?.activeStrategyThemes.length ? (
            <p className="text-sm text-stone-500">Generate an idea to see fit score, evidence and safety notes.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function GeneratedPackage({
  run
}: Readonly<{
  run:GeneratorRun | null;
}>) {
  const output = run?.output;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            <FileText className="h-4 w-4 text-emerald-900" />
            Generated content package
          </p>
          <p className="mt-1 text-sm text-stone-500">
            A complete first draft, still blocked from publishing until clinical review.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          Clinical review required
        </span>
      </div>

      {output ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Title</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">{output.title}</h2>
            </section>

            <section className="rounded-lg border border-stone-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Hook options</p>
              <div className="mt-3 grid gap-2">
                {(output.hookOptions?.length ? output.hookOptions : [output.hook]).map((hook) => (
                  <p key={hook} className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">{hook}</p>
                ))}
              </div>
            </section>

            <TextBlock title="Script or slide sequence" value={output.script} tall />
            <TextBlock title="Caption" value={output.caption} />
          </div>

          <aside className="space-y-4">
            <ListBlock icon={<Send />} title="CTA variants" items={output.ctaVariants?.length ? output.ctaVariants : [output.cta]} />
            <ListBlock icon={<Sparkles />} title="Hashtags" items={output.hashtags ?? []} inline />
            <ListBlock icon={<ClipboardCheck />} title="Production notes" items={output.productionNotes ?? []} />
            <ListBlock icon={<ShieldCheck />} title="Approval checklist" items={output.approvalChecklist ?? []} />
            <ListBlock icon={<BadgeCheck />} title="Measurement target" items={output.measurementTargets ?? []} />
          </aside>
        </div>
      ) : (
        <StatePanel message="Generated hooks, script, caption, CTA, hashtags and review checks will appear here." />
      )}

      {run?.safetyNotes?.length ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertTriangle className="h-4 w-4" />
            Safety warnings
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {run.safetyNotes.map((note) => (
              <p key={note} className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-amber-950">
                {note}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HandoffPanel({
  run,
  isPromoting,
  rejectReason,
  setRejectReason,
  onPromote
}: Readonly<{
  run:GeneratorRun | null;
  isPromoting:boolean;
  rejectReason:string;
  setRejectReason:(value:string) => void;
  onPromote:(options:{ createCalendarItem?:boolean; createScript?:boolean; reject?:boolean }) => Promise<void>;
}>) {
  const promoted = Boolean(run?.calendarItemId || run?.scriptId || run?.status === "REJECTED");

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            <CalendarPlus className="h-4 w-4 text-emerald-900" />
            Handoff panel
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Promote the governed draft into production systems or keep a decision trail.
          </p>
        </div>
        {run ? <StatusBadge status={run.status} /> : null}
      </div>

      {run ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="grid gap-3 md:grid-cols-3">
            <ActionButton
              icon={<CalendarPlus />}
              title="Create calendar item"
              detail="Adds this idea as an IDEA with clinical-review tags."
              disabled={isPromoting || promoted}
              onClick={() => onPromote({ createCalendarItem:true })}
            />
            <ActionButton
              icon={<ArrowRight />}
              title="Send to Script Studio"
              detail="Creates calendar item and Script Studio version 1."
              disabled={isPromoting || promoted}
              onClick={() => onPromote({ createCalendarItem:true, createScript:true })}
            />
            <ActionButton
              icon={<RefreshCcw />}
              title="Keep as draft idea"
              detail="Keeps the generator run traceable without handoff."
              disabled={isPromoting || promoted}
              onClick={() => onPromote({ createCalendarItem:false, createScript:false })}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-stone-950">
              <XCircle className="h-4 w-4 text-red-700" />
              Reject with reason
            </p>
            <textarea
              className="min-h-20 w-full rounded-lg border border-stone-200 bg-white p-3 text-sm"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Example: Too promotional for current clinical review window."
            />
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-white px-3 text-sm font-semibold text-red-700 disabled:opacity-60"
              disabled={isPromoting || promoted}
              onClick={() => void onPromote({ reject:true })}
            >
              {isPromoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Draft
            </button>
          </div>

          {run.calendarItemId || run.scriptId ? (
            <div className="xl:col-span-2 flex flex-wrap gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
              {run.calendarItemId ? (
                <Link className="font-semibold underline" href="/production/content-calendar">
                  Open calendar item
                </Link>
              ) : null}
              {run.scriptId ? (
                <Link className="font-semibold underline" href={`/production/script-studio?calendarItemId=${run.calendarItemId}`}>
                  Open Script Studio version
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <StatePanel message="Generate an idea first, then create a calendar item, send it to Script Studio, keep it as draft, or reject it." />
      )}
    </section>
  );
}

function RecentWork({
  workspace,
  onSelectRun
}: Readonly<{
  workspace:GeneratorWorkspace | null;
  onSelectRun:(run:GeneratorRun) => void;
}>) {
  if (!workspace) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-900" />
          <h2 className="text-sm font-semibold">Credible references</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {workspace.sourceReferences.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-stone-200 bg-stone-50 p-3 transition hover:border-emerald-200"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{source.publisher}</p>
              <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-stone-950">
                {source.title}
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{source.use}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-emerald-900" />
            <h2 className="text-sm font-semibold">Recent generator runs</h2>
          </div>
          <span className="text-xs text-stone-500">{workspace.recentRuns.length} saved</span>
        </div>
        <div className="space-y-2">
          {workspace.recentRuns.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 p-3 text-left text-sm transition hover:bg-white"
              onClick={() => onSelectRun(item)}
            >
              <span className="font-semibold text-stone-950">{item.output?.title || item.idea}</span>
              <span className="mt-1 block text-xs text-stone-500">
                {item.platform} / {item.format} / {item.strategyFit} / {labelize(item.status)}
              </span>
            </button>
          ))}
          {!workspace.recentRuns.length ? (
            <p className="text-sm text-stone-500">No off-strategy drafts generated yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ContextCard({
  label,
  value
}: Readonly<{
  label:string;
  value:string;
}>) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{label}</p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}

function TextBlock({
  title,
  value,
  tall = false
}: Readonly<{
  title:string;
  value:string;
  tall?:boolean;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{title}</p>
      <p className={["mt-3 whitespace-pre-line text-sm leading-7 text-stone-800", tall ? "min-h-40" : ""].join(" ")}>
        {value || "No draft generated yet."}
      </p>
    </section>
  );
}

function ListBlock({
  icon,
  title,
  items,
  inline = false
}: Readonly<{
  icon:React.ReactNode;
  title:string;
  items:string[];
  inline?:boolean;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-900 [&_svg]:h-4 [&_svg]:w-4">{icon}{title}</p>
      <div className={["mt-3", inline ? "flex flex-wrap gap-2" : "space-y-2"].join(" ")}>
        {items.map((item) => (
          <p
            key={item}
            className={inline
              ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-950"
              : "rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700"}
          >
            {inline && !item.startsWith("#") ? `#${item.replace(/^#/, "")}` : item}
          </p>
        ))}
        {!items.length ? <p className="text-sm text-stone-500">None generated yet.</p> : null}
      </div>
    </section>
  );
}

function ActionButton({
  icon,
  title,
  detail,
  disabled,
  onClick
}: Readonly<{
  icon:React.ReactNode;
  title:string;
  detail:string;
  disabled:boolean;
  onClick:() => Promise<void>;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-lg border border-stone-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
      onClick={() => void onClick()}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-950 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-emerald-900">
        {icon}
        {title}
      </span>
      <span className="mt-2 block text-xs leading-5 text-stone-500">{detail}</span>
    </button>
  );
}

function Field({
  label,
  children
}: Readonly<{
  label:string;
  children:React.ReactNode;
}>) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange
}: Readonly<{
  label:string;
  value:string;
  options:string[];
  labels?:Record<string, string>;
  onChange:(value:string) => void;
}>) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-stone-600">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FitBadge({
  fit
}: Readonly<{
  fit:string;
}>) {
  const tone = fit === "Aligned"
    ? "bg-emerald-50 text-emerald-900"
    : fit === "Outside current strategy"
      ? "bg-amber-50 text-amber-900"
      : "bg-stone-100 text-stone-700";

  return (
    <span className={["rounded-full px-3 py-1 text-xs font-semibold", tone].join(" ")}>
      {fit}
    </span>
  );
}

function StatusBadge({
  status
}: Readonly<{
  status:string;
}>) {
  const complete = status.includes("PROMOTED");
  const rejected = status === "REJECTED";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        complete ? "bg-emerald-50 text-emerald-900" : rejected ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"
      ].join(" ")}
    >
      {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      {labelize(status)}
    </span>
  );
}

function StatePanel({
  message
}: Readonly<{
  message:string;
}>) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
      {message}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-red-900">
      You do not have access to Content Generator.
    </div>
  );
}

function toDateInput(
  date:Date
) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function labelize(
  value:string
) {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
