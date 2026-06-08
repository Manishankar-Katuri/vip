"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  BadgeCheck,
  Bot,
  Hash,
  Lightbulb,
  Loader2,
  Megaphone,
  RefreshCcw,
  Save,
  Sparkles
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type ScriptType =
  | "REEL"
  | "CAROUSEL"
  | "POST"
  | "SHORT_VIDEO"
  | "ADVERTISEMENT";

type ScriptStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

type CalendarItem = {
  id:string;
  title:string;
  description:string;
  contentType:string;
  category:string;
  scheduledDate:string;
  specialDayName:string | null;
};

type Script = {
  id:string;
  calendarItemId:string;
  hospitalId:string;
  title:string;
  scriptType:ScriptType;
  status:ScriptStatus;
  hook:string;
  script:string;
  caption:string;
  cta:string;
  hashtags:string[];
  metadata:unknown;
  version:number;
  approvedAt:string | null;
  createdAt:string;
  updatedAt:string;
  calendarItem:{
    id:string;
    title:string;
    category:string;
    contentType:string;
  };
};

type Template = {
  id:string;
  title:string;
  type:string;
  goal:string;
  tone:string;
  category:string;
  scriptType:ScriptType;
};

type StudioResponse = {
  scripts:Script[];
  calendarItems:CalendarItem[];
  templates:Template[];
  brandVoice:{
    tone:string;
    style:string;
    audience:string;
    messaging:string;
  } | null;
};

type GenerationForm = {
  calendarItemId:string;
  templateId:string;
  scriptType:ScriptType;
  doctorName:string;
  targetAudience:string;
  goal:string;
  tone:string;
};

type EditorState = {
  id?:string;
  title:string;
  scriptType:ScriptType;
  status:ScriptStatus;
  hook:string;
  script:string;
  caption:string;
  cta:string;
  hashtags:string;
  version?:number;
};

const DEFAULT_FORM:GenerationForm = {
  calendarItemId:"",
  templateId:"educational",
  scriptType:"REEL",
  doctorName:"",
  targetAudience:"",
  goal:"Create useful patient-facing content.",
  tone:"Clear, warm, credible"
};

const EMPTY_EDITOR:EditorState = {
  title:"",
  scriptType:"REEL",
  status:"DRAFT",
  hook:"",
  script:"",
  caption:"",
  cta:"",
  hashtags:""
};

export default function ScriptStudioPage() {
  const searchParams = useSearchParams();
  const { activeHospital } = useHospital();
  const [data, setData] = useState<StudioResponse | null>(null);
  const [form, setForm] = useState<GenerationForm>(DEFAULT_FORM);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const loadStudio = async () => {
    if (!activeHospital) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<StudioResponse>(
        "/production/script-studio"
      );
      const calendarItemId =
        searchParams.get("calendarItemId") ??
        form.calendarItemId ??
        response.calendarItems[0]?.id ??
        "";
      const firstScript = response.scripts.find(
        (script) => script.calendarItemId === calendarItemId
      ) ?? response.scripts[0];

      setData(response);
      setForm((current) => ({
        ...current,
        calendarItemId,
        targetAudience:
          current.targetAudience ||
          response.brandVoice?.audience ||
          "",
        tone:
          current.tone ||
          response.brandVoice?.tone ||
          ""
      }));

      if (firstScript) {
        selectScript(firstScript);
      }
    } catch {
      setError("Script Studio could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStudio();
    // loadStudio closes over editor state; this effect intentionally reloads only when the selected workspace changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHospital?.id]);

  useEffect(() => {
    if (!editor.id || saveState !== "idle") return;

    const timeout = window.setTimeout(() => {
      void saveCurrentScript(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
    // Autosave is intentionally keyed to draft field changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editor.title,
    editor.scriptType,
    editor.status,
    editor.hook,
    editor.script,
    editor.caption,
    editor.cta,
    editor.hashtags
  ]);

  const selectedCalendarItem = useMemo(
    () => data?.calendarItems.find(
      (item) => item.id === form.calendarItemId
    ) ?? null,
    [data?.calendarItems, form.calendarItemId]
  );

  const selectedTemplate = useMemo(
    () => data?.templates.find(
      (template) => template.id === form.templateId
    ) ?? null,
    [data?.templates, form.templateId]
  );

  function selectScript(
    script:Script
  ) {
    setSelectedScriptId(script.id);
    setEditor({
      id:script.id,
      title:script.title,
      scriptType:script.scriptType,
      status:script.status,
      hook:script.hook,
      script:script.script,
      caption:script.caption,
      cta:script.cta,
      hashtags:script.hashtags.join(", "),
      version:script.version
    });
    setForm((current) => ({
      ...current,
      calendarItemId:script.calendarItemId,
      scriptType:script.scriptType
    }));
    setSaveState("saved");
  }

  async function generateScript() {
    if (!selectedCalendarItem || !selectedTemplate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const script = await apiFetch<Script>(
        "/production/script-studio/generate",
        {
          method:"POST",
          body:JSON.stringify({
            calendarItemId:selectedCalendarItem.id,
            scriptType:form.scriptType,
            doctorName:form.doctorName,
            targetAudience:form.targetAudience,
            goal:form.goal || selectedTemplate.goal,
            tone:form.tone || selectedTemplate.tone,
            title:selectedCalendarItem.title,
            description:selectedCalendarItem.description,
            contentCategory:selectedCalendarItem.category,
            contentType:selectedCalendarItem.contentType
          })
        }
      );

      selectScript(script);
      await loadStudio();
    } catch {
      setError("Script generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveCurrentScript(
    visible = true
  ) {
    if (!editor.id) return;

    setSaveState("saving");

    try {
      const script = await apiFetch<Script>(
        `/production/script-studio/${editor.id}`,
        {
          method:"PATCH",
          body:JSON.stringify({
            title:editor.title,
            scriptType:editor.scriptType,
            status:editor.status,
            hook:editor.hook,
            script:editor.script,
            caption:editor.caption,
            cta:editor.cta,
            hashtags:editor.hashtags
          })
        }
      );

      if (visible) {
        selectScript(script);
        await loadStudio();
      }
      setSaveState("saved");
    } catch {
      setError("Script could not be saved.");
      setSaveState("idle");
    }
  }

  async function archiveScript() {
    if (!editor.id) return;

    await apiFetch(`/production/script-studio/${editor.id}`, {
      method:"DELETE"
    });
    setEditor(EMPTY_EDITOR);
    setSelectedScriptId("");
    await loadStudio();
  }

  return (
    <PermissionGate
      permission={PERMISSIONS.CREATE_CONTENT}
      fallback={<AccessDenied />}
    >
      <div className="space-y-6">
        <section className="rounded-lg bg-emerald-950 p-6 text-white shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
                AI Script Studio
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
                {activeHospital?.name ?? "Production scripts"}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-50">
                Generate and refine hooks, scripts, captions, CTAs, and
                hashtag sets from calendar items and brand voice.
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-sm text-emerald-50">
              {data?.brandVoice
                ? `Brand voice: ${data.brandVoice.tone || "Configured"}`
                : "Brand voice not configured"}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-stone-600">
            Loading Script Studio...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[320px_1fr_320px]">
            <GenerationPanel
              data={data}
              form={form}
              setForm={setForm}
              onTemplateApply={(template) => {
                setForm((current) => ({
                  ...current,
                  templateId:template.id,
                  goal:template.goal,
                  tone:template.tone,
                  scriptType:template.scriptType
                }));
              }}
              onGenerate={generateScript}
              isGenerating={isGenerating}
            />
            <EditorPanel
              editor={editor}
              selectedCalendarItem={selectedCalendarItem}
              saveState={saveState}
              setEditor={setEditor}
              onSave={() => saveCurrentScript(true)}
              onArchive={archiveScript}
            />
            <CompanionPanel
              data={data}
              scripts={data?.scripts ?? []}
              selectedScriptId={selectedScriptId}
              editor={editor}
              selectScript={selectScript}
            />
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

function GenerationPanel({
  data,
  form,
  setForm,
  onTemplateApply,
  onGenerate,
  isGenerating
}: Readonly<{
  data:StudioResponse | null;
  form:GenerationForm;
  setForm:React.Dispatch<React.SetStateAction<GenerationForm>>;
  onTemplateApply:(template:Template) => void;
  onGenerate:() => Promise<void>;
  isGenerating:boolean;
}>) {
  const update = <K extends keyof GenerationForm>(
    key:K,
    value:GenerationForm[K]
  ) => setForm((current) => ({ ...current, [key]:value }));

  return (
    <aside className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-900" />
        <h2 className="text-lg font-semibold">Generation Inputs</h2>
      </div>
      <Field label="Calendar Item">
        <select
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
          value={form.calendarItemId}
          onChange={(event) => update("calendarItemId", event.target.value)}
        >
          {(data?.calendarItems ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Template">
        <div className="grid gap-2">
          {(data?.templates ?? []).map((template) => (
            <button
              key={template.id}
              className={[
                "rounded-lg border p-3 text-left text-sm transition",
                form.templateId === template.id
                  ? "border-emerald-700 bg-emerald-50"
                  : "border-stone-200 hover:bg-stone-50"
              ].join(" ")}
              onClick={() => onTemplateApply(template)}
            >
              <span className="font-semibold">{template.title}</span>
              <span className="mt-1 block text-xs text-stone-500">
                {template.goal}
              </span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Script Type">
        <select
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
          value={form.scriptType}
          onChange={(event) => update("scriptType", event.target.value as ScriptType)}
        >
          {["REEL", "CAROUSEL", "POST", "SHORT_VIDEO", "ADVERTISEMENT"].map((type) => (
            <option key={type} value={type}>{labelize(type)}</option>
          ))}
        </select>
      </Field>
      <Field label="Doctor Name">
        <input
          className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
          value={form.doctorName}
          onChange={(event) => update("doctorName", event.target.value)}
        />
      </Field>
      <Field label="Target Audience">
        <input
          className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
          value={form.targetAudience}
          onChange={(event) => update("targetAudience", event.target.value)}
        />
      </Field>
      <Field label="Goal">
        <textarea
          className="min-h-20 w-full rounded-lg border border-stone-200 p-3 text-sm"
          value={form.goal}
          onChange={(event) => update("goal", event.target.value)}
        />
      </Field>
      <Field label="Tone">
        <input
          className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
          value={form.tone}
          onChange={(event) => update("tone", event.target.value)}
        />
      </Field>
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isGenerating || !form.calendarItemId}
        onClick={() => void onGenerate()}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        Generate Script
      </button>
    </aside>
  );
}

function EditorPanel({
  editor,
  selectedCalendarItem,
  saveState,
  setEditor,
  onSave,
  onArchive
}: Readonly<{
  editor:EditorState;
  selectedCalendarItem:CalendarItem | null;
  saveState:"idle" | "saving" | "saved";
  setEditor:React.Dispatch<React.SetStateAction<EditorState>>;
  onSave:() => Promise<void>;
  onArchive:() => Promise<void>;
}>) {
  const update = <K extends keyof EditorState>(
    key:K,
    value:EditorState[K]
  ) => {
    setEditor((current) => ({ ...current, [key]:value }));
  };

  return (
    <main className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-200 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">
            {selectedCalendarItem?.title ?? "No calendar item selected"}
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Script Editor {editor.version ? `v${editor.version}` : ""}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-medium"
            disabled={!editor.id}
            onClick={() => void onSave()}
          >
            <Save className="h-4 w-4" />
            {saveState === "saving" ? "Saving" : "Save"}
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-medium"
            disabled={!editor.id}
            onClick={() => update("status", "APPROVED")}
          >
            <BadgeCheck className="h-4 w-4" />
            Mark Approved
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-sm font-medium text-red-700"
            disabled={!editor.id}
            onClick={() => void onArchive()}
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <Field label="Title">
          <input
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
            value={editor.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </Field>
        <Field label="Hook">
          <textarea
            className="min-h-20 w-full rounded-lg border border-stone-200 p-3 text-sm"
            value={editor.hook}
            onChange={(event) => update("hook", event.target.value)}
          />
        </Field>
        <Field label="Script">
          <textarea
            className="min-h-72 w-full rounded-lg border border-stone-200 p-4 text-sm leading-7"
            value={editor.script}
            onChange={(event) => update("script", event.target.value)}
          />
        </Field>
        <Field label="Caption">
          <textarea
            className="min-h-28 w-full rounded-lg border border-stone-200 p-3 text-sm"
            value={editor.caption}
            onChange={(event) => update("caption", event.target.value)}
          />
        </Field>
      </div>
    </main>
  );
}

function CompanionPanel({
  data,
  scripts,
  selectedScriptId,
  editor,
  selectScript
}: Readonly<{
  data:StudioResponse | null;
  scripts:Script[];
  selectedScriptId:string;
  editor:EditorState;
  selectScript:(script:Script) => void;
}>) {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-emerald-900" />
          <h2 className="text-lg font-semibold">Hooks</h2>
        </div>
        <p className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
          {editor.hook || "Generate a script to see hook options."}
        </p>
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-emerald-900" />
          <h2 className="text-lg font-semibold">CTA</h2>
        </div>
        <p className="text-sm leading-6 text-stone-700">
          {editor.cta || "CTA variations will appear here."}
        </p>
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-emerald-900" />
          <h2 className="text-lg font-semibold">Hashtags</h2>
        </div>
        <textarea
          className="min-h-20 w-full rounded-lg border border-stone-200 p-3 text-sm"
          value={editor.hashtags}
          readOnly
        />
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-emerald-900" />
          <h2 className="text-lg font-semibold">Versions</h2>
        </div>
        <div className="space-y-2">
          {scripts.map((script) => (
            <button
              key={script.id}
              className={[
                "w-full rounded-lg border p-3 text-left text-sm",
                selectedScriptId === script.id
                  ? "border-emerald-700 bg-emerald-50"
                  : "border-stone-200 hover:bg-stone-50"
              ].join(" ")}
              onClick={() => selectScript(script)}
            >
              <span className="font-semibold">
                {script.title} v{script.version}
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                {labelize(script.status)} · {script.calendarItem.title}
              </span>
            </button>
          ))}
          {scripts.length === 0 ? (
            <p className="text-sm text-stone-500">
              No scripts generated for {data?.calendarItems.length ?? 0} calendar items yet.
            </p>
          ) : null}
        </div>
      </section>
    </aside>
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

function AccessDenied() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-red-900">
      You do not have access to AI Script Studio.
    </div>
  );
}

function labelize(
  value:string
) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
