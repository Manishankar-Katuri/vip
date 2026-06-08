"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  HeartPulse,
  Lightbulb,
  LineChart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users
} from "lucide-react";

import { PermissionGate } from "@/components/PermissionGate";
import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { PERMISSIONS } from "@/permissions-core";

type MorningBriefing = {
  hospital:{
    id:string;
    name:string;
    specialty:string | null;
    city:string | null;
  };
  generatedAt:string;
  welcome:{
    greeting:string;
    currentVipScore:number;
    scoreTrend:"UP" | "DOWN" | "STABLE";
    lastUpdated:string;
  };
  vipHealthScore:{
    overallScore:number;
    previousScore:number;
    changePercent:number;
    status:"Excellent" | "Good" | "Needs Attention" | "Critical";
  };
  revenue:{
    influencedRevenue:number;
    trend:"UP" | "DOWN" | "STABLE";
    topContributingChannels:Array<{ channel:string; value:number }>;
    summary:string;
  };
  reputation:{
    averageRating:number;
    reviewVolume:number;
    positiveTrend:number;
    negativeTrend:number;
    sentimentSummary:string;
  };
  social:{
    instagramGrowth:number;
    facebookGrowth:number;
    engagement:number;
    bestPerformingContent:string;
    summary:string;
  };
  competitor:{
    currentRanking:string;
    topCompetitor:string;
    movement:string;
    keyOpportunity:string;
  };
  insightOfTheDay:{
    title:string;
    summary:string;
    confidence:number;
  };
  goals:Array<{
    title:string;
    progress:number;
    targetDate:string;
    status:string;
  }>;
  recommendations:Array<{
    title:string;
    action:string;
    priority:string;
    confidence:number;
  }>;
};

export default function DoctorMorningBriefingPage() {
  const { activeHospital } = useHospital();
  const [briefing, setBriefing] =
    useState<MorningBriefing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeHospital) return;

    void apiFetch<MorningBriefing>("/doctor/morning-briefing")
      .then((payload) => {
        setBriefing(payload);
        setError("");
      })
      .catch(() => {
        setError("Morning briefing is unavailable right now.");
      });
  }, [activeHospital]);

  return (
    <PermissionGate
      permission={PERMISSIONS.VIEW_MORNING_BRIEFING}
      fallback={<AccessDenied />}
    >
      {!briefing ? (
        <LoadingState message={error || "Preparing your morning briefing..."} />
      ) : (
        <BriefingView briefing={briefing} />
      )}
    </PermissionGate>
  );
}

function BriefingView({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px] lg:p-7">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {briefing.welcome.greeting}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              {briefing.hospital.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Everything important about performance, growth, reputation,
              revenue, and risk in one executive read.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {briefing.hospital.specialty ?? "Multi-specialty"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {briefing.hospital.city ?? "City not set"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Updated {formatDateTime(briefing.welcome.lastUpdated)}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Current VIP Score</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <strong className="text-5xl tracking-tight">
                {briefing.welcome.currentVipScore}
              </strong>
              <TrendBadge trend={briefing.welcome.scoreTrend} />
            </div>
            <p className="mt-4 text-sm text-slate-300">
              {briefing.vipHealthScore.status}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ExecutiveScoreCard briefing={briefing} />
        <InsightCard briefing={briefing} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel
          icon={<LineChart />}
          title="Revenue Attribution"
          value={currency(briefing.revenue.influencedRevenue)}
          detail={briefing.revenue.summary}
          trend={briefing.revenue.trend}
        />
        <MetricPanel
          icon={<Star />}
          title="Reputation"
          value={briefing.reputation.averageRating ? `${briefing.reputation.averageRating}/5` : "No rating"}
          detail={briefing.reputation.sentimentSummary}
          meta={`${briefing.reputation.reviewVolume} reviews`}
        />
        <MetricPanel
          icon={<Users />}
          title="Social Presence"
          value={`${briefing.social.engagement}%`}
          detail={briefing.social.bestPerformingContent}
          meta={briefing.social.summary}
        />
        <MetricPanel
          icon={<BarChart3 />}
          title="Competitor Pulse"
          value={briefing.competitor.currentRanking}
          detail={briefing.competitor.keyOpportunity}
          meta={briefing.competitor.topCompetitor}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RevenueChannels briefing={briefing} />
        <GoalTracker briefing={briefing} />
      </section>

      <ActionRecommendations briefing={briefing} />
    </div>
  );
}

function ExecutiveScoreCard({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  const score = briefing.vipHealthScore.overallScore;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">VIP Health Score</p>
          <h3 className="mt-2 text-2xl font-semibold">{briefing.vipHealthScore.status}</h3>
        </div>
        <HeartPulse className="h-6 w-6 text-slate-500" />
      </div>
      <div className="mt-6 flex items-end gap-4">
        <strong className="text-6xl tracking-tight">{score}</strong>
        <div className="pb-2 text-sm text-slate-600">
          <p>Previous {briefing.vipHealthScore.previousScore}</p>
          <p>{briefing.vipHealthScore.changePercent}% change</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width:`${score}%` }}
        />
      </div>
    </section>
  );
}

function InsightCard({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <Sparkles className="h-5 w-5" />
        <p className="text-sm font-semibold">AI Insight of the Day</p>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">
        {briefing.insightOfTheDay.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        {briefing.insightOfTheDay.summary}
      </p>
      <p className="mt-4 text-xs font-medium text-amber-900">
        Confidence {briefing.insightOfTheDay.confidence}%
      </p>
    </section>
  );
}

function MetricPanel({
  icon,
  title,
  value,
  detail,
  trend,
  meta
}:{
  icon:React.ReactNode;
  title:string;
  value:string;
  detail:string;
  trend?:"UP" | "DOWN" | "STABLE";
  meta?:string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
        {trend ? <TrendBadge trend={trend} compact /> : null}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <strong className="mt-2 block text-2xl">{value}</strong>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {detail}
      </p>
      {meta ? (
        <p className="mt-3 text-xs font-medium text-slate-500">{meta}</p>
      ) : null}
    </section>
  );
}

function RevenueChannels({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-slate-600" />
        <h3 className="font-semibold">Top contributing channels</h3>
      </div>
      <div className="space-y-3">
        {briefing.revenue.topContributingChannels.map((channel) => (
          <div key={channel.channel}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{channel.channel}</span>
              <span className="font-medium">{channel.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{ width:`${Math.min(100, channel.value * 20)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoalTracker({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Target className="h-5 w-5 text-slate-600" />
        <h3 className="font-semibold">Goal tracker</h3>
      </div>
      <div className="space-y-4">
        {briefing.goals.map((goal) => (
          <div key={goal.title}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{goal.title}</p>
                <p className="text-xs text-slate-500">
                  Target {formatDate(goal.targetDate)} · {goal.status}
                </p>
              </div>
              <span className="text-sm font-semibold">{goal.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width:`${goal.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionRecommendations({
  briefing
}:{
  briefing:MorningBriefing;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-slate-600" />
        <h3 className="font-semibold">Top recommended actions</h3>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {(briefing.recommendations.length
          ? briefing.recommendations
          : [{
              title:"Awaiting recommendations",
              action:"Recommendation engine has no stored action for this hospital yet.",
              priority:"MEDIUM",
              confidence:0
            }]
        ).map((recommendation) => (
          <article
            key={recommendation.title}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                {recommendation.priority}
              </span>
              <span className="text-xs text-slate-500">
                {recommendation.confidence}% confidence
              </span>
            </div>
            <h4 className="font-semibold">{recommendation.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {recommendation.action}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendBadge({
  trend,
  compact = false
}:{
  trend:"UP" | "DOWN" | "STABLE";
  compact?:boolean;
}) {
  const Icon = trend === "DOWN" ? ArrowDown : trend === "UP" ? ArrowUp : Activity;
  const label = trend === "STABLE" ? "Stable" : trend === "UP" ? "Up" : "Down";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
      trend === "DOWN"
        ? "bg-rose-100 text-rose-700"
        : trend === "UP"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-700"
    }`}>
      <Icon className="h-3 w-3" />
      {compact ? null : label}
    </span>
  );
}

function AccessDenied() {
  return (
    <section className="rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold">Access denied</h2>
      <p className="mt-2 text-sm text-slate-600">
        Morning Briefing requires the view_morning_briefing permission.
      </p>
    </section>
  );
}

function LoadingState({
  message
}:{
  message:string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <BadgeCheck className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold">Morning Briefing</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </section>
  );
}

function currency(value:number) {
  return new Intl.NumberFormat("en-IN", {
    style:"currency",
    currency:"INR",
    maximumFractionDigits:0
  }).format(value);
}

function formatDate(value:string) {
  return new Intl.DateTimeFormat("en-IN", {
    day:"numeric",
    month:"short",
    year:"numeric"
  }).format(new Date(value));
}

function formatDateTime(value:string) {
  return new Intl.DateTimeFormat("en-IN", {
    day:"numeric",
    month:"short",
    hour:"numeric",
    minute:"2-digit"
  }).format(new Date(value));
}
