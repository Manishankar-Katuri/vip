"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Megaphone,
  RadioTower
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type ProductionCommandCentre = {
  activeHospital:{
    id:string;
    name:string;
    specialty:string | null;
    city:string | null;
    status:string;
  };
  generatedAt:string;
  pipelineSummary:{
    totalContent:number;
    draft:number;
    approved:number;
    published:number;
    status:string;
  };
  upcomingContent:Array<{
    id:string;
    title:string;
    platform:string;
    status:string;
    scheduledFor:string;
  }>;
  campaignSummary:{
    activeCampaigns:number;
    plannedCampaigns:number;
    socialSignals:number;
    summary:string;
  };
  approvalSummary:{
    pendingApprovals:number;
    readyToPublish:number;
    blockedItems:number;
    summary:string;
  };
};

export default function ProductionCommandCentrePage() {
  const { activeHospital } = useHospital();
  const [data, setData] =
    useState<ProductionCommandCentre | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeHospital) {
      return;
    }

    setIsLoading(true);
    setError(null);

    void apiFetch<ProductionCommandCentre>(
      "/production/command-centre"
    )
      .then(setData)
      .catch(() => {
        setError("Production command centre could not be loaded.");
      })
      .finally(() => {
        setIsLoading(false);
      });
    // The effect is keyed by workspace id; activeHospital object identity can change without changing the request target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHospital?.id]);

  return (
    <PermissionGate
      permission={PERMISSIONS.VIEW_CONTENT}
      fallback={<AccessDenied />}
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : data ? (
        <CommandCentre data={data} />
      ) : (
        <EmptyState />
      )}
    </PermissionGate>
  );
}

function CommandCentre({
  data
}: Readonly<{
  data:ProductionCommandCentre;
}>) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg bg-emerald-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              Production Command Centre
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
              {data.activeHospital.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-50">
              Agency workspace for content planning, campaign delivery,
              approvals, and social intelligence.
            </p>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-sm text-emerald-100">Last refreshed</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatDateTime(data.generatedAt)}
            </p>
            <p className="mt-4 text-sm text-emerald-100">
              {data.activeHospital.specialty ?? "Hospital"} ·{" "}
              {data.activeHospital.city ?? "City pending"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Content Status"
          value={data.pipelineSummary.status}
          detail={`${data.pipelineSummary.totalContent} active items`}
        />
        <MetricCard
          icon={CalendarDays}
          label="Upcoming Posts"
          value={String(data.upcomingContent.length)}
          detail="Next scheduled content"
        />
        <MetricCard
          icon={Megaphone}
          label="Campaign Count"
          value={String(data.campaignSummary.activeCampaigns)}
          detail={`${data.campaignSummary.plannedCampaigns} planned`}
        />
        <MetricCard
          icon={Clock}
          label="Pending Approvals"
          value={String(data.approvalSummary.pendingApprovals)}
          detail={`${data.approvalSummary.readyToPublish} ready`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Content Pipeline Summary" icon={ClipboardList}>
          <div className="grid gap-3 sm:grid-cols-3">
            <PipelineStat label="Draft" value={data.pipelineSummary.draft} />
            <PipelineStat label="Approved" value={data.pipelineSummary.approved} />
            <PipelineStat label="Published" value={data.pipelineSummary.published} />
          </div>
          <p className="mt-5 text-sm leading-6 text-stone-600">
            {data.approvalSummary.summary}
          </p>
        </Panel>

        <Panel title="Campaign Snapshot" icon={RadioTower}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-stone-50 p-4">
              <span className="text-sm font-medium text-stone-600">
                Social signals
              </span>
              <span className="text-2xl font-semibold">
                {data.campaignSummary.socialSignals}
              </span>
            </div>
            <p className="text-sm leading-6 text-stone-600">
              {data.campaignSummary.summary}
            </p>
          </div>
        </Panel>
      </section>

      <Panel title="Upcoming Content" icon={CalendarDays}>
        <div className="divide-y divide-stone-100">
          {(data.upcomingContent.length
            ? data.upcomingContent
            : [{
                id:"empty",
                title:"No upcoming content scheduled",
                platform:"Planning",
                status:"DRAFT",
                scheduledFor:data.generatedAt
              }]
          ).map((item) => (
            <div
              key={item.id}
              className="grid gap-3 py-4 md:grid-cols-[1fr_140px_150px]"
            >
              <div>
                <p className="font-medium text-stone-950">{item.title}</p>
                <p className="text-sm text-stone-500">{item.platform}</p>
              </div>
              <span className="self-center rounded-md bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                {item.status}
              </span>
              <span className="self-center text-sm text-stone-500">
                {formatDate(item.scheduledFor)}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MetricCard({
  icon:Icon,
  label,
  value,
  detail
}: Readonly<{
  icon:React.ComponentType<{ className?:string }>;
  label:string;
  value:string;
  detail:string;
}>) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
    </article>
  );
}

function Panel({
  title,
  icon:Icon,
  children
}: Readonly<{
  title:string;
  icon:React.ComponentType<{ className?:string }>;
  children:React.ReactNode;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <ArrowUpRight className="h-4 w-4 text-stone-400" />
      </div>
      {children}
    </section>
  );
}

function PipelineStat({
  label,
  value
}: Readonly<{
  label:string;
  value:number;
}>) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8 text-stone-600">
      Loading production command centre...
    </div>
  );
}

function ErrorState({
  message
}: Readonly<{
  message:string;
}>) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
      <AlertCircle className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-8 text-stone-600">
      Select an active hospital to load the production workspace.
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-8 text-stone-700">
      <CheckCircle2 className="h-5 w-5 text-stone-400" />
      <span>You do not have access to the production command centre.</span>
    </div>
  );
}

function formatDateTime(
  value:string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:"medium",
      timeStyle:"short"
    }
  ).format(new Date(value));
}

function formatDate(
  value:string
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:"numeric",
      month:"short"
    }
  ).format(new Date(value));
}
