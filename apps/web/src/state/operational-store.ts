"use client";

import { create } from "zustand";
import type { Role, Tone } from "@/design-system/theme";
import {
  seedActivity,
  seedCampaigns,
  seedContentVersions,
  seedMediaAssets,
  seedNotifications,
  seedTasks,
  type ActivityEvent,
  type CampaignStage,
  type ContentVersion,
  type MediaAsset,
  type MediaStatus,
  type OperationalAction,
  type OperationalCampaign,
  type OperationalNotification,
  type OperationalSnapshot,
  type RecommendationStatus,
  type StaffTask,
} from "@/collaboration/operational-domain";

export type { ActivityEvent, CampaignStage, ContentVersion, MediaAsset, MediaStatus, OperationalCampaign, OperationalNotification, StaffTask } from "@/collaboration/operational-domain";

type SyncStatus = "connecting" | "live" | "reconnecting" | "offline";

type OperationalState = {
  campaigns: OperationalCampaign[];
  recommendationStatus: Record<string, RecommendationStatus>;
  activity: ActivityEvent[];
  notifications: OperationalNotification[];
  staffTasks: StaffTask[];
  mediaAssets: MediaAsset[];
  contentVersions: ContentVersion[];
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  hydrate: () => Promise<void>;
  acceptSnapshot: (snapshot: OperationalSnapshot) => void;
  setSyncStatus: (status: SyncStatus) => void;
  moveCampaign: (id: string, stage: CampaignStage) => void;
  editCampaign: (id: string, caption: string, note: string) => void;
  submitCampaign: (id: string) => void;
  decideCampaign: (id: string, decision: "approve" | "reject" | "revision") => void;
  decideStrategy: (title: string, decision: "approve" | "reject") => void;
  actOnRecommendation: (title: string, action: "apply" | "dismiss" | "convert" | "attach") => void;
  markNotificationRead: (id: string) => void;
  markRoleNotificationsRead: (role: Role) => void;
  submitTask: (id: string) => void;
  completeTask: (id: string) => void;
  submitUpload: (name: string, fileType?: string, campaignId?: string) => void;
  uploadMedia: (name: string, fileType: string, sourceRole: "production" | "staff", campaignId?: string) => void;
  attachMedia: (id: string, campaignId: string) => void;
  updateMediaStatus: (id: string, status: MediaStatus) => void;
  scheduleCampaign: (id: string, scheduledFor: string) => void;
};

export const useOperationalStore = create<OperationalState>((set) => {
  const reconcile = (action: OperationalAction) => {
    void fetch("/api/operations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Persistence request failed");
        return response.json() as Promise<OperationalSnapshot>;
      })
      .then((snapshot) => set({ ...snapshot, syncStatus: "live", lastSyncedAt: snapshot.syncedAt }))
      .catch(() => set({ syncStatus: "offline" }));
  };

  return {
    campaigns: seedCampaigns,
    recommendationStatus: {},
    activity: seedActivity,
    notifications: seedNotifications,
    staffTasks: seedTasks,
    mediaAssets: seedMediaAssets,
    contentVersions: seedContentVersions,
    syncStatus: "connecting",
    hydrate: async () => {
      try {
        const response = await fetch("/api/operations", { cache: "no-store" });
        if (!response.ok) throw new Error("Operational persistence unavailable");
        const snapshot = await response.json() as OperationalSnapshot;
        set({ ...snapshot, syncStatus: "live", lastSyncedAt: snapshot.syncedAt });
      } catch {
        set({ syncStatus: "offline" });
      }
    },
    acceptSnapshot: (snapshot) => set({ ...snapshot, syncStatus: "live", lastSyncedAt: snapshot.syncedAt }),
    setSyncStatus: (syncStatus) => set({ syncStatus }),
    moveCampaign: (id, stage) => {
      set((state) => {
        const campaign = state.campaigns.find((item) => item.id === id);
        if (!campaign || campaign.stage === stage) return state;
        if (stage === "scheduled" && campaign.approval !== "approved") {
          return { notifications: [notice("production", "Approval", "approval-blocked", "Doctor approval required", `${campaign.title} cannot be scheduled before clinical approval.`, "warning", campaign.id), ...state.notifications] };
        }
        return {
          campaigns: state.campaigns.map((item) => item.id === id ? { ...item, stage, approval: stage === "doctor-approval" ? "pending" : item.approval, updated: timestamp(), updatedAt: new Date().toISOString() } : item),
          activity: [event(campaign.id, "campaign", "Workflow stage updated", `${campaign.title} moved to ${stage.replace("-", " ")}.`, "Production team", "production", "info", campaign.stage, stage), ...state.activity],
          notifications: stage === "doctor-approval" ? [notice("doctor", "Approval", "clinical-approval", "New campaign requires approval", campaign.title, "warning", campaign.id), ...state.notifications] : state.notifications,
        };
      });
      reconcile({ type: "move-campaign", id, stage });
    },
    editCampaign: (id, caption, note) => {
      set((state) => {
        const campaign = state.campaigns.find((item) => item.id === id);
        if (!campaign) return state;
        const currentVersion = Math.max(0, ...state.contentVersions.filter((item) => item.campaignId === id).map((item) => item.version));
        return {
          campaigns: state.campaigns.map((item) => item.id === id ? { ...item, caption, strategyNote: note, stage: "review", approval: "revision-requested", updated: timestamp(), updatedAt: new Date().toISOString() } : item),
          contentVersions: [{
            id: `version-${Date.now()}`,
            campaignId: id,
            version: currentVersion + 1,
            caption,
            strategyNote: note,
            changedSummary: "Caption or approval annotation revised for clinical review.",
            modifiedBy: "Production team",
            approval: "revision-requested",
            createdAt: new Date().toISOString(),
            rollbackAvailable: true,
          }, ...state.contentVersions],
          activity: [event(id, "campaign", "Campaign revision saved", `${campaign.title} returned to production review.`, "Production team", "production", "info", campaign.stage, "review"), ...state.activity],
        };
      });
      reconcile({ type: "edit-campaign", id, caption, note });
    },
    submitCampaign: (id) => {
      set((state) => {
        const campaign = state.campaigns.find((item) => item.id === id);
        if (!campaign) return state;
        return {
          campaigns: state.campaigns.map((item) => item.id === id ? { ...item, stage: "doctor-approval", approval: "pending", reviewer: "Dr. Harika", updated: timestamp(), updatedAt: new Date().toISOString() } : item),
          activity: [event(id, "approval", "Submitted for doctor approval", `${campaign.title} is awaiting clinical review.`, "Production team", "production", "warning", campaign.stage, "doctor-approval"), ...state.activity],
          notifications: [notice("doctor", "Approval", "clinical-approval", "Content ready for your review", campaign.title, "warning", id), ...state.notifications],
        };
      });
      reconcile({ type: "submit-campaign", id });
    },
    decideCampaign: (id, decision) => {
      set((state) => {
        const campaign = state.campaigns.find((item) => item.id === id);
        if (!campaign) return state;
        const approved = decision === "approve";
        const stage: CampaignStage = approved ? "scheduled" : "review";
        const approval = approved ? "approved" : decision === "reject" ? "rejected" : "revision-requested";
        const title = approved ? "Campaign approved and scheduled" : decision === "reject" ? "Campaign rejected" : "Revision requested";
        const detail = approved ? `${campaign.title} is released to the next publishing window.` : `${campaign.title} returned to production review with clinical notes.`;
        return {
          campaigns: state.campaigns.map((item) => item.id === id ? { ...item, stage, approval, reviewer: "Dr. Harika", scheduledFor: approved ? nextWindow() : undefined, updated: timestamp(), updatedAt: new Date().toISOString() } : item),
          contentVersions: state.contentVersions.map((item) => item.campaignId === id && item.version === Math.max(...state.contentVersions.filter((entry) => entry.campaignId === id).map((entry) => entry.version)) ? { ...item, approval } : item),
          activity: [event(id, "approval", title, detail, "Dr. Harika", "doctor", approved ? "success" : "warning", campaign.stage, stage), ...state.activity],
          notifications: [notice("production", "Clinical decision", "clinical-decision", title, detail, approved ? "success" : "warning", id), ...state.notifications],
        };
      });
      reconcile({ type: "decide-campaign", id, decision });
    },
    decideStrategy: (title, decision) => {
      const approved = decision === "approve";
      const status: RecommendationStatus = approved ? "applied" : "dismissed";
      const activityTitle = approved ? "Strategy approved" : "AI recommendation rejected";
      const detail = approved ? `${title} is cleared for a production brief.` : `${title} will not proceed without revised clinical rationale.`;
      set((state) => ({
        recommendationStatus: { ...state.recommendationStatus, [title]: status },
        activity: [event(undefined, "recommendation", activityTitle, detail, "Dr. Harika", "doctor", approved ? "success" : "warning"), ...state.activity],
        notifications: [notice("production", "AI recommendation update", "recommendations", activityTitle, detail, approved ? "success" : "warning"), ...state.notifications],
      }));
      reconcile({ type: "decide-strategy", title, decision });
    },
    actOnRecommendation: (title, action) => {
      set((state) => {
        const status: RecommendationStatus = action === "convert" ? "converted" : action === "attach" ? "attached" : action === "apply" ? "applied" : "dismissed";
        const created: OperationalCampaign | undefined = action === "convert" ? {
          id: `campaign-${Date.now()}`, title: `${title} campaign`, channel: "Instagram", stage: "draft", approval: "not-submitted", clinicalRisk: "Review required",
          caption: "Patient-friendly educational copy in preparation.", strategyNote: "Created from measured AI recommendation; requires production and clinical review.",
          objective: "Translate a measured opportunity into clinically reviewed patient education.", audienceNotes: "Audience definition required during brief review.",
          engagementExpectation: "Measurement target will be set from approved comparable content.", hashtags: ["PatientEducation"], format: "carousel",
          recommendation: title, owner: "Production team", participants: ["production", "doctor", "admin"], updated: timestamp(), updatedAt: new Date().toISOString(),
        } : undefined;
        const campaigns = created ? [created, ...state.campaigns] : state.campaigns.map((campaign, index) => action === "attach" && index === 0 ? { ...campaign, recommendation: title, updated: timestamp(), updatedAt: new Date().toISOString() } : campaign);
        const verb = action === "convert" ? "converted into a campaign" : action === "attach" ? "attached to active content" : action === "apply" ? "accepted for production review" : "dismissed";
        return {
          campaigns,
          recommendationStatus: { ...state.recommendationStatus, [title]: status },
          activity: [event(undefined, "recommendation", "AI recommendation updated", `${title} was ${verb}.`, "Production team", "production", action === "dismiss" ? "neutral" : "info"), ...state.activity],
        };
      });
      reconcile({ type: "recommendation-action", title, action });
    },
    markNotificationRead: (id) => {
      set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, unread: false } : item) }));
      reconcile({ type: "read-notification", id });
    },
    markRoleNotificationsRead: (role) => {
      set((state) => ({ notifications: state.notifications.map((item) => item.role === role ? { ...item, unread: false } : item) }));
      reconcile({ type: "read-role-notifications", role });
    },
    submitTask: (id) => {
      set((state) => {
        const task = state.staffTasks.find((item) => item.id === id);
        if (!task || task.status !== "Assigned") return state;
        return {
          staffTasks: state.staffTasks.map((item) => item.id === id ? { ...item, status: "Submitted" } : item),
          activity: [event(undefined, "submission", "Clinic confirmation submitted", `${task.title} is ready for production validation.`, "Hospital staff", "staff", "info"), ...state.activity],
          notifications: [notice("production", "Staff submission", "clinic-input", "Clinic confirmation received", task.title, "info"), ...state.notifications],
        };
      });
      reconcile({ type: "submit-task", id });
    },
    completeTask: (id) => {
      set((state) => {
        const task = state.staffTasks.find((item) => item.id === id);
        if (!task || task.completed) return state;
        return {
          staffTasks: state.staffTasks.map((item) => item.id === id ? { ...item, completed: true, status: "Complete" } : item),
          activity: [event(undefined, "submission", "Clinic task completed", task.title, "Hospital staff", "staff", "success"), ...state.activity],
        };
      });
      reconcile({ type: "complete-task", id });
    },
    submitUpload: (name, fileType = "image/jpeg", campaignId) => {
      set((state) => ({
        staffTasks: state.staffTasks.map((item) => item.id === "task-photo" ? { ...item, status: "Submitted", completed: true } : item),
        mediaAssets: [newAsset(name, fileType, "staff", campaignId), ...state.mediaAssets],
        activity: [event(undefined, "submission", "Asset submitted for review", `${name} entered production review.`, "Hospital staff", "staff", "info"), ...state.activity],
        notifications: [notice("production", "Upload", "clinic-input", "New clinic asset submitted", `${name} requires content review.`, "info"), ...state.notifications],
      }));
      reconcile({ type: "submit-upload", name, fileType, campaignId });
    },
    uploadMedia: (name, fileType, sourceRole, campaignId) => {
      set((state) => ({
        mediaAssets: [newAsset(name, fileType, sourceRole, campaignId), ...state.mediaAssets],
        activity: [event(campaignId, "media", "Media uploaded", `${name} is available for production review.`, sourceRole === "staff" ? "Hospital staff" : "Production team", sourceRole, "info"), ...state.activity],
      }));
      reconcile({ type: "upload-media", name, fileType, sourceRole, campaignId });
    },
    attachMedia: (id, campaignId) => {
      set((state) => ({
        mediaAssets: state.mediaAssets.map((asset) => asset.id === id ? { ...asset, campaignId } : asset),
        activity: [event(campaignId, "media", "Media attached to campaign", "An approved or draft asset was linked for publishing review.", "Production team", "production", "info"), ...state.activity],
      }));
      reconcile({ type: "attach-media", id, campaignId });
    },
    updateMediaStatus: (id, status) => {
      set((state) => ({
        mediaAssets: state.mediaAssets.map((asset) => asset.id === id ? { ...asset, status } : asset),
        activity: [event(undefined, "media", "Media status updated", `Asset moved to ${status.replace("-", " ")}.`, "Production team", "production", status === "approved" ? "success" : "info"), ...state.activity],
      }));
      reconcile({ type: "update-media-status", id, status });
    },
    scheduleCampaign: (id, scheduledFor) => {
      set((state) => {
        const campaign = state.campaigns.find((item) => item.id === id);
        if (!campaign || campaign.approval !== "approved") return state;
        return {
          campaigns: state.campaigns.map((item) => item.id === id ? { ...item, scheduledFor, stage: "scheduled", updated: timestamp(), updatedAt: new Date().toISOString() } : item),
          activity: [event(id, "schedule", "Publishing schedule updated", `${campaign.title} scheduled for ${scheduleLabel(scheduledFor)}.`, "Production team", "production", "success", campaign.stage, "scheduled"), ...state.activity],
        };
      });
      reconcile({ type: "schedule-campaign", id, scheduledFor });
    },
  };
});

function timestamp() {
  return `Today, ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date())}`;
}

function event(campaignId: string | undefined, category: ActivityEvent["category"], title: string, description: string, actor: string, actorRole: ActivityEvent["actorRole"], tone: Tone, transitionFrom?: CampaignStage, transitionTo?: CampaignStage): ActivityEvent {
  const occurredAt = new Date().toISOString();
  return { id: `activity-${Date.now()}-${title}`, campaignId, category, title, description, actor, actorRole, time: timestamp(), occurredAt, tone, visibleTo: actorRole === "staff" ? ["admin", "production", "doctor", "staff"] : ["admin", "production", "doctor"], transitionFrom, transitionTo };
}

function notice(role: Role, category: string, groupKey: string, title: string, detail: string, tone: Tone, campaignId?: string): OperationalNotification {
  return { id: `notice-${Date.now()}-${role}`, campaignId, role, category, groupKey, title, detail, unread: true, tone, createdAt: new Date().toISOString() };
}

function nextWindow() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(18, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}

function scheduleLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function newAsset(name: string, fileType: string, sourceRole: "production" | "staff", campaignId?: string): MediaAsset {
  const kind = fileType.includes("video") ? "video" : fileType.includes("pdf") ? "document" : "image";
  return {
    id: `asset-${Date.now()}`,
    title: name.replace(/\.[^.]+$/, "").replaceAll("-", " "),
    fileName: name,
    fileType,
    kind,
    status: sourceRole === "staff" ? "under-review" : "draft",
    sourceRole,
    campaignId,
    uploadedBy: sourceRole === "staff" ? "Hospital staff" : "Production team",
    uploadedAt: new Date().toISOString(),
    altText: kind === "image" ? "Uploaded healthcare communication image pending description review." : "Uploaded communication asset.",
    rightsNote: "Permissions and clinical suitability pending production validation.",
    visibleTo: sourceRole === "staff" ? ["admin", "production", "staff"] : ["admin", "production", "doctor"],
  };
}
