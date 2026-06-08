import type { Tone } from "@/design-system/theme";

export type Kpi = { label: string; value: string; change: string; tone: Tone };
export type Activity = { title: string; meta: string; detail?: string; tone: Tone };
export type Recommendation = { title: string; reason: string; confidence: number; action: string };
export type Approval = { title: string; owner: string; due: string; risk: Tone };

export const reputationTrend = [
  { week: "Apr 21", reach: 62, trust: 77, inquiries: 38 },
  { week: "Apr 28", reach: 69, trust: 78, inquiries: 43 },
  { week: "May 05", reach: 72, trust: 81, inquiries: 49 },
  { week: "May 12", reach: 78, trust: 82, inquiries: 56 },
  { week: "May 19", reach: 85, trust: 84, inquiries: 61 },
  { week: "May 26", reach: 89, trust: 86, inquiries: 67 },
];

export const adminData = {
  kpis: [
    { label: "Active hospitals", value: "28", change: "+2 this month", tone: "success" },
    { label: "Campaigns monitored", value: "146", change: "98% healthy", tone: "success" },
    { label: "Approvals pending", value: "19", change: "5 require review", tone: "warning" },
    { label: "Automation uptime", value: "99.94%", change: "Within SLA", tone: "info" },
  ] satisfies Kpi[],
  alerts: [
    { title: "Approval backlog at Eastview Women's Hospital", message: "Five patient education assets have exceeded the 24-hour review window.", tone: "warning" as Tone },
  ],
  activity: [
    { title: "Reputation anomaly triaged", meta: "11 min ago", detail: "North Campus sentiment recovered after service response.", tone: "success" },
    { title: "Content safety review queued", meta: "42 min ago", detail: "Clinical claim language requires medical reviewer sign-off.", tone: "warning" },
    { title: "Hospital workspace provisioned", meta: "Today, 09:05", detail: "Silver Oak Cardiac Centre enabled for campaigns.", tone: "info" },
  ] satisfies Activity[],
  systems: [
    { label: "Recommendation engine", status: "Healthy", tone: "success" as Tone },
    { label: "Review ingestion", status: "Healthy", tone: "success" as Tone },
    { label: "Publishing orchestration", status: "Monitoring", tone: "warning" as Tone },
  ],
};

export const productionData = {
  kpis: [
    { label: "Active campaigns", value: "12", change: "4 due this week", tone: "info" },
    { label: "Content in review", value: "24", change: "7 approved today", tone: "success" },
    { label: "Qualified inquiries", value: "184", change: "+16.2% vs last month", tone: "success" },
    { label: "Execution health", value: "94%", change: "2 items delayed", tone: "warning" },
  ] satisfies Kpi[],
  approvals: [
    { title: "Cochlear implant patient guide", owner: "Medical reviewer", due: "Due today", risk: "warning" },
    { title: "World Hearing Day follow-up reel", owner: "Brand lead", due: "Tomorrow", risk: "info" },
    { title: "ENT appointment landing copy", owner: "Compliance", due: "May 28", risk: "neutral" },
  ] satisfies Approval[],
  recommendations: [
    { title: "Expand hearing-screening education", reason: "Search intent increased 21% across two service areas.", confidence: 92, action: "Draft brief" },
    { title: "Respond to waiting-time feedback", reason: "Three recent reviews mention check-in delays.", confidence: 87, action: "Create response set" },
  ] satisfies Recommendation[],
  activity: [
    { title: "Paid search creative approved", meta: "09:40", detail: "Campaign is ready for scheduled publishing.", tone: "success" },
    { title: "Instagram carousel rendering", meta: "10:15", detail: "Asset variants generated for accessibility review.", tone: "info" },
    { title: "Retry scheduled for GBP sync", meta: "10:28", detail: "Automatic retry in 12 minutes.", tone: "warning" },
  ] satisfies Activity[],
};

export const staffData = {
  kpis: [
    { label: "Tasks today", value: "6", change: "3 complete", tone: "success" },
    { label: "Awaiting approval", value: "2", change: "Ready for you", tone: "warning" },
    { label: "New uploads", value: "4", change: "Verified", tone: "info" },
  ] satisfies Kpi[],
  approvals: [
    { title: "Clinic hours update for Google profile", owner: "Front office", due: "Approve by 2:00 PM", risk: "warning" },
    { title: "Post-operative care leaflet", owner: "Dr. Harika", due: "Tomorrow", risk: "neutral" },
  ] satisfies Approval[],
  activity: [
    { title: "Upload approved", meta: "09:12", detail: "Reception signage photos added to campaign assets.", tone: "success" },
    { title: "Patient FAQ needs confirmation", meta: "Today", detail: "Confirm weekend consultation hours.", tone: "warning" },
  ] satisfies Activity[],
};

export const doctorData = {
  kpis: [
    { label: "Reputation score", value: "86", change: "+3 this month", tone: "success" },
    { label: "Patient rating", value: "4.7", change: "428 reviews", tone: "info" },
    { label: "Approvals needed", value: "2", change: "Under 2 minutes", tone: "warning" },
  ] satisfies Kpi[],
  approvals: [
    { title: "Sinus care education campaign", owner: "Clinical accuracy check", due: "Today", risk: "warning" },
    { title: "Consultation FAQ update", owner: "Confirm appointment guidance", due: "Tomorrow", risk: "neutral" },
  ] satisfies Approval[],
  summary: "Trust indicators improved this month. Patient feedback is positive overall; waiting-time communication remains the only recurring concern.",
};
