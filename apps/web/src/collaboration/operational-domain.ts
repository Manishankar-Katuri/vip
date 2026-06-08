import type { Role, Tone } from "@/design-system/theme";

export type CampaignStage = "draft" | "review" | "doctor-approval" | "scheduled" | "published";
export type ApprovalStatus = "not-submitted" | "pending" | "approved" | "revision-requested" | "rejected";
export type RecommendationStatus = "ready" | "applied" | "dismissed" | "converted" | "attached";
export type MediaStatus = "draft" | "under-review" | "approved" | "archived";
export type MediaKind = "image" | "video" | "document";

export type OperationalCampaign = {
  id: string;
  title: string;
  channel: "Instagram" | "Google Business Profile";
  stage: CampaignStage;
  approval: ApprovalStatus;
  clinicalRisk: "Routine" | "Review required";
  caption: string;
  strategyNote: string;
  objective: string;
  audienceNotes: string;
  engagementExpectation: string;
  hashtags: string[];
  format: "carousel" | "reel" | "announcement";
  recommendation?: string;
  scheduledFor?: string;
  performance?: string;
  owner: string;
  reviewer?: string;
  participants: Role[];
  updated: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  kind: MediaKind;
  status: MediaStatus;
  sourceRole: "production" | "staff";
  campaignId?: string;
  uploadedBy: string;
  uploadedAt: string;
  altText: string;
  rightsNote: string;
  visibleTo: Role[];
};

export type ContentVersion = {
  id: string;
  campaignId: string;
  version: number;
  caption: string;
  strategyNote: string;
  changedSummary: string;
  modifiedBy: string;
  approval: ApprovalStatus;
  createdAt: string;
  rollbackAvailable: boolean;
};

export type ActivityEvent = {
  id: string;
  campaignId?: string;
  category: "approval" | "campaign" | "schedule" | "recommendation" | "submission" | "automation" | "media";
  title: string;
  description: string;
  actor: string;
  actorRole: Role | "system";
  time: string;
  occurredAt: string;
  tone: Tone;
  visibleTo: Role[];
  transitionFrom?: CampaignStage;
  transitionTo?: CampaignStage;
};

export type OperationalNotification = {
  id: string;
  campaignId?: string;
  role: Role;
  category: string;
  groupKey: string;
  title: string;
  detail: string;
  unread: boolean;
  tone: Tone;
  createdAt: string;
};

export type StaffTask = {
  id: string;
  title: string;
  due: string;
  completed: boolean;
  status: "Assigned" | "Submitted" | "Complete";
};

export type OperationalSnapshot = {
  campaigns: OperationalCampaign[];
  recommendationStatus: Record<string, RecommendationStatus>;
  activity: ActivityEvent[];
  notifications: OperationalNotification[];
  staffTasks: StaffTask[];
  mediaAssets: MediaAsset[];
  contentVersions: ContentVersion[];
  syncedAt: string;
};

export type OperationalAction =
  | { type: "move-campaign"; id: string; stage: CampaignStage }
  | { type: "edit-campaign"; id: string; caption: string; note: string }
  | { type: "submit-campaign"; id: string }
  | { type: "decide-campaign"; id: string; decision: "approve" | "reject" | "revision" }
  | { type: "decide-strategy"; title: string; decision: "approve" | "reject" }
  | { type: "recommendation-action"; title: string; action: "apply" | "dismiss" | "convert" | "attach" }
  | { type: "read-notification"; id: string }
  | { type: "read-role-notifications"; role: Role }
  | { type: "submit-task"; id: string }
  | { type: "complete-task"; id: string }
  | { type: "submit-upload"; name: string; fileType?: string; campaignId?: string }
  | { type: "upload-media"; name: string; fileType: string; sourceRole: "production" | "staff"; campaignId?: string }
  | { type: "attach-media"; id: string; campaignId: string }
  | { type: "update-media-status"; id: string; status: MediaStatus }
  | { type: "schedule-campaign"; id: string; scheduledFor: string };

const roles: Role[] = ["admin", "production", "doctor", "staff"];
const now = minutesAgo(30);

export const seedCampaigns: OperationalCampaign[] = [
  {
    id: "campaign-sinus",
    title: "Sinus care education carousel",
    channel: "Instagram",
    stage: "doctor-approval",
    approval: "pending",
    clinicalRisk: "Review required",
    caption: "Persistent sinus discomfort? Learn when a specialist review may help.",
    strategyNote: "Educational language only; confirm symptom guidance before publishing.",
    objective: "Build symptom literacy and prompt clinically appropriate consultations.",
    audienceNotes: "Adults managing recurring sinus discomfort; avoid diagnostic claims.",
    engagementExpectation: "Save rate target 3.2%; measured education benchmark 4.8% engagement.",
    hashtags: ["ENTCare", "SinusHealth", "PatientEducation"],
    format: "carousel",
    recommendation: "Extend the highest-response clinical story format",
    owner: "Production - Asha",
    reviewer: "Dr. Harika",
    participants: ["production", "doctor", "admin"],
    updated: "Submitted today, 09:30",
    updatedAt: now,
  },
  {
    id: "campaign-screening",
    title: "Hearing screening awareness reel",
    channel: "Instagram",
    stage: "review",
    approval: "revision-requested",
    clinicalRisk: "Routine",
    caption: "A hearing check can be a helpful step for changes in listening comfort.",
    strategyNote: "Revise call to action after clinical feedback.",
    objective: "Increase awareness of routine hearing screening pathways.",
    audienceNotes: "Adults 45+ and caregivers seeking preventative information.",
    engagementExpectation: "Video completion target 28%; inquiries monitored after release.",
    hashtags: ["HearingCare", "PreventiveHealth", "ENTCare"],
    format: "reel",
    owner: "Production - Nisha",
    reviewer: "Dr. Harika",
    participants: ["production", "doctor", "admin"],
    updated: "Revision requested today",
    updatedAt: minutesAgo(42),
  },
  {
    id: "campaign-faq",
    title: "Consultation FAQ update",
    channel: "Google Business Profile",
    stage: "scheduled",
    approval: "approved",
    clinicalRisk: "Routine",
    caption: "Planning a consultation? See appointment preparation details and clinic hours.",
    strategyNote: "Approved by clinical leadership.",
    objective: "Reduce appointment preparation questions before arrival.",
    audienceNotes: "New patients and caregivers preparing for a consultation.",
    engagementExpectation: "Track website actions and local listing taps.",
    hashtags: ["PatientGuide", "ClinicHours"],
    format: "announcement",
    scheduledFor: "2026-05-27T18:00",
    owner: "Production - Asha",
    reviewer: "Dr. Harika",
    participants: ["production", "doctor", "admin", "staff"],
    updated: "Approved today, 08:42",
    updatedAt: minutesAgo(55),
  },
  {
    id: "campaign-patient-guide",
    title: "Post-visit care guide",
    channel: "Instagram",
    stage: "published",
    approval: "approved",
    clinicalRisk: "Review required",
    caption: "Your care team has prepared simple post-visit reminders for recovery support.",
    strategyNote: "Measured reference asset.",
    objective: "Reinforce approved after-visit guidance.",
    audienceNotes: "Recently discharged patients and family caregivers.",
    engagementExpectation: "Reference benchmark: 5.21% engagement and 4,280 reach.",
    hashtags: ["AfterCare", "ENTCare", "PatientSupport"],
    format: "carousel",
    performance: "5.21% engagement - 4,280 reach",
    scheduledFor: "2026-05-24T18:00",
    owner: "Production - Nisha",
    reviewer: "Dr. Harika",
    participants: ["production", "doctor", "admin"],
    updated: "Published 24 May",
    updatedAt: minutesAgo(60 * 48),
  },
  {
    id: "campaign-wait-times",
    title: "Arrival and waiting-time reassurance",
    channel: "Instagram",
    stage: "draft",
    approval: "not-submitted",
    clinicalRisk: "Routine",
    caption: "We are improving arrival guidance to make every visit easier to plan.",
    strategyNote: "Draft from recent feedback theme.",
    objective: "Address patient uncertainty around arrival and waiting time.",
    audienceNotes: "Appointment holders planning arrival logistics.",
    engagementExpectation: "Reputation signal: reduce repeat waiting-time mentions.",
    hashtags: ["ClinicVisit", "PatientSupport"],
    format: "announcement",
    owner: "Production - Asha",
    participants: ["production", "admin", "staff"],
    updated: "Created today",
    updatedAt: minutesAgo(70),
  },
];

export const seedMediaAssets: MediaAsset[] = [
  {
    id: "asset-sinus-illustration",
    title: "Sinus education illustration set",
    fileName: "sinus-care-carousel-approved.png",
    fileType: "image/png",
    kind: "image",
    status: "under-review",
    sourceRole: "production",
    campaignId: "campaign-sinus",
    uploadedBy: "Production - Asha",
    uploadedAt: minutesAgo(35),
    altText: "Illustrated patient education sequence about discussing persistent sinus discomfort.",
    rightsNote: "Hospital-owned illustration; cleared for digital patient education.",
    visibleTo: ["admin", "production", "doctor"],
  },
  {
    id: "asset-faq-frontdesk",
    title: "Consultation desk signage",
    fileName: "consultation-hours-signage.jpg",
    fileType: "image/jpeg",
    kind: "image",
    status: "approved",
    sourceRole: "staff",
    campaignId: "campaign-faq",
    uploadedBy: "Hospital staff - Front office",
    uploadedAt: minutesAgo(180),
    altText: "Clinic reception signage showing consultation preparation guidance.",
    rightsNote: "No patients visible; staff verified display permissions.",
    visibleTo: roles,
  },
  {
    id: "asset-guide-reference",
    title: "Post-visit care approved reference",
    fileName: "post-visit-guide-v3.pdf",
    fileType: "application/pdf",
    kind: "document",
    status: "approved",
    sourceRole: "production",
    campaignId: "campaign-patient-guide",
    uploadedBy: "Production - Nisha",
    uploadedAt: minutesAgo(60 * 50),
    altText: "Accessible PDF patient guide reference.",
    rightsNote: "Clinically approved reference copy.",
    visibleTo: ["admin", "production", "doctor", "staff"],
  },
  {
    id: "asset-event-draft",
    title: "Community screening event photo",
    fileName: "screening-day-photo.jpg",
    fileType: "image/jpeg",
    kind: "image",
    status: "draft",
    sourceRole: "staff",
    uploadedBy: "Hospital staff - Coordinator",
    uploadedAt: minutesAgo(18),
    altText: "Empty screening desk prepared for a community event.",
    rightsNote: "Release confirmation pending before campaign use.",
    visibleTo: ["admin", "production", "staff"],
  },
];

export const seedContentVersions: ContentVersion[] = [
  { id: "version-sinus-2", campaignId: "campaign-sinus", version: 2, caption: seedCampaigns[0].caption, strategyNote: seedCampaigns[0].strategyNote, changedSummary: "Replaced symptom wording with clinically neutral guidance.", modifiedBy: "Production - Asha", approval: "pending", createdAt: minutesAgo(30), rollbackAvailable: true },
  { id: "version-sinus-1", campaignId: "campaign-sinus", version: 1, caption: "Sinus symptoms should not be ignored. Book a review today.", strategyNote: "Initial education brief.", changedSummary: "Initial draft submitted.", modifiedBy: "Production - Asha", approval: "revision-requested", createdAt: minutesAgo(160), rollbackAvailable: true },
  { id: "version-screening-2", campaignId: "campaign-screening", version: 2, caption: seedCampaigns[1].caption, strategyNote: seedCampaigns[1].strategyNote, changedSummary: "Updated screening call to action after clinical review.", modifiedBy: "Production - Nisha", approval: "revision-requested", createdAt: minutesAgo(42), rollbackAvailable: true },
  { id: "version-faq-1", campaignId: "campaign-faq", version: 1, caption: seedCampaigns[2].caption, strategyNote: seedCampaigns[2].strategyNote, changedSummary: "Approved patient preparation and hours copy.", modifiedBy: "Dr. Harika", approval: "approved", createdAt: minutesAgo(55), rollbackAvailable: false },
  { id: "version-guide-3", campaignId: "campaign-patient-guide", version: 3, caption: seedCampaigns[3].caption, strategyNote: seedCampaigns[3].strategyNote, changedSummary: "Published approved recovery-support wording.", modifiedBy: "Production - Nisha", approval: "approved", createdAt: minutesAgo(60 * 48), rollbackAvailable: true },
];

export const seedActivity: ActivityEvent[] = [
  {
    id: "activity-1",
    campaignId: "campaign-sinus",
    category: "approval",
    title: "Clinical approval requested",
    description: "Sinus care education carousel is ready for doctor sign-off.",
    actor: "Production - Asha",
    actorRole: "production",
    time: "Today, 09:30",
    occurredAt: now,
    tone: "warning",
    visibleTo: ["admin", "production", "doctor"],
    transitionFrom: "review",
    transitionTo: "doctor-approval",
  },
  {
    id: "activity-2",
    campaignId: "campaign-faq",
    category: "schedule",
    title: "Campaign scheduled",
    description: "Consultation FAQ update assigned to the observed evening publishing window.",
    actor: "Workflow automation",
    actorRole: "system",
    time: "Today, 08:44",
    occurredAt: minutesAgo(54),
    tone: "success",
    visibleTo: roles,
    transitionFrom: "doctor-approval",
    transitionTo: "scheduled",
  },
  {
    id: "activity-3",
    category: "recommendation",
    title: "Recommendation generated",
    description: "Content pattern opportunity detected from measured Instagram response.",
    actor: "AI assistant",
    actorRole: "system",
    time: "Today, 08:15",
    occurredAt: minutesAgo(80),
    tone: "info",
    visibleTo: ["admin", "production", "doctor"],
  },
];

export const seedNotifications: OperationalNotification[] = [
  { id: "notice-d-1", campaignId: "campaign-sinus", role: "doctor", category: "Approval", groupKey: "clinical-approval", title: "Sinus care carousel awaiting review", detail: "Clinical sign-off required before scheduling.", unread: true, tone: "warning", createdAt: now },
  { id: "notice-d-2", role: "doctor", category: "Urgent alert", groupKey: "clinical-alert", title: "Waiting-time communication trend", detail: "One concise reputation note is ready to review.", unread: true, tone: "info", createdAt: minutesAgo(75) },
  { id: "notice-p-1", campaignId: "campaign-screening", role: "production", category: "Revision", groupKey: "clinical-decision", title: "Hearing screening reel needs changes", detail: "Update the call to action and resubmit.", unread: true, tone: "warning", createdAt: minutesAgo(42) },
  { id: "notice-p-2", role: "production", category: "AI update", groupKey: "recommendations", title: "Education format is performing strongly", detail: "AI opportunity is ready for a campaign brief.", unread: true, tone: "info", createdAt: minutesAgo(80) },
  { id: "notice-a-1", campaignId: "campaign-sinus", role: "admin", category: "Approval SLA", groupKey: "bottleneck", title: "One review approaching SLA", detail: "Clinical queue has an item due today.", unread: true, tone: "warning", createdAt: now },
  { id: "notice-s-1", role: "staff", category: "Upload", groupKey: "clinic-input", title: "Clinic hours confirmation required", detail: "Submit approved weekend hours for content review.", unread: true, tone: "warning", createdAt: now },
];

export const seedTasks: StaffTask[] = [
  { id: "task-hours", title: "Confirm weekend consultation hours", due: "Due today - 2:00 PM", completed: false, status: "Assigned" },
  { id: "task-photo", title: "Upload approved reception signage photo", due: "Due tomorrow", completed: false, status: "Assigned" },
  { id: "task-faq", title: "Review FAQ contact information", due: "Completed today", completed: true, status: "Complete" },
];

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}
