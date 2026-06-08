import "server-only";

import prisma from "@vip/database";
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
  type OperationalAction,
  type OperationalCampaign,
  type OperationalNotification,
  type OperationalSnapshot,
  type RecommendationStatus,
  type StaffTask,
} from "@/collaboration/operational-domain";

const visibleToAll: Role[] = ["admin", "production", "doctor", "staff"];

async function operationalWorkspaceId() {
  const workspaces = await prisma.workspace.findMany({
    select: { id: true, _count: { select: { socialPosts: true } } },
  });
  const connected = workspaces.sort((left, right) => right._count.socialPosts - left._count.socialPosts)[0];
  if (connected) return connected.id;
  const workspace = await prisma.workspace.upsert({
    where: { slug: "harika-ent-operational" },
    update: {},
    create: { slug: "harika-ent-operational", name: "Harika ENT Care Network" },
    select: { id: true },
  });
  return workspace.id;
}

async function seedOperationalWorkflow(workspaceId: string) {
  await prisma.$transaction([
    prisma.operationalCampaign.createMany({
      data: seedCampaigns.map((item) => ({
        id: item.id,
        workspaceId,
        title: item.title,
        channel: item.channel,
        stage: item.stage,
        approval: item.approval,
        clinicalRisk: item.clinicalRisk,
        caption: item.caption,
        strategyNote: item.strategyNote,
        objective: item.objective,
        audienceNotes: item.audienceNotes,
        engagementExpectation: item.engagementExpectation,
        hashtags: item.hashtags,
        format: item.format,
        recommendation: item.recommendation,
        scheduledFor: item.scheduledFor,
        performance: item.performance,
        owner: item.owner,
        reviewer: item.reviewer,
        participants: item.participants,
        updatedLabel: item.updated,
        createdAt: new Date(item.updatedAt),
        updatedAt: new Date(item.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.operationalActivityEvent.createMany({
      data: seedActivity.map((item) => ({
        id: item.id,
        workspaceId,
        campaignId: item.campaignId,
        category: item.category,
        title: item.title,
        description: item.description,
        actor: item.actor,
        actorRole: item.actorRole,
        tone: item.tone,
        visibleTo: item.visibleTo,
        transitionFrom: item.transitionFrom,
        transitionTo: item.transitionTo,
        occurredAt: new Date(item.occurredAt),
      })),
      skipDuplicates: true,
    }),
    prisma.operationalNotification.createMany({
      data: seedNotifications.map((item) => ({
        id: item.id,
        workspaceId,
        campaignId: item.campaignId,
        role: item.role,
        category: item.category,
        groupKey: item.groupKey,
        title: item.title,
        detail: item.detail,
        tone: item.tone,
        unread: item.unread,
        createdAt: new Date(item.createdAt),
      })),
      skipDuplicates: true,
    }),
    prisma.operationalTask.createMany({
      data: seedTasks.map((item) => ({
        id: item.id,
        workspaceId,
        title: item.title,
        due: item.due,
        completed: item.completed,
        status: item.status,
      })),
      skipDuplicates: true,
    }),
    prisma.operationalMediaAsset.createMany({
      data: seedMediaAssets.map((item) => ({
        id: item.id,
        workspaceId,
        campaignId: item.campaignId,
        title: item.title,
        fileName: item.fileName,
        fileType: item.fileType,
        kind: item.kind,
        status: item.status,
        sourceRole: item.sourceRole,
        uploadedBy: item.uploadedBy,
        altText: item.altText,
        rightsNote: item.rightsNote,
        visibleTo: item.visibleTo,
        uploadedAt: new Date(item.uploadedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.operationalContentVersion.createMany({
      data: seedContentVersions.map((item) => ({
        ...item,
        workspaceId,
        createdAt: new Date(item.createdAt),
      })),
      skipDuplicates: true,
    }),
    ...seedCampaigns.map((item) => prisma.operationalCampaign.updateMany({
      where: { id: item.id, workspaceId, objective: "" },
      data: {
        objective: item.objective,
        audienceNotes: item.audienceNotes,
        engagementExpectation: item.engagementExpectation,
        hashtags: item.hashtags,
        format: item.format,
      },
    })),
  ]);
}

export async function getOperationalSnapshot(): Promise<OperationalSnapshot> {
  const workspaceId = await operationalWorkspaceId();
  await seedOperationalWorkflow(workspaceId);
  const [campaigns, events, notifications, tasks, actions, mediaAssets, versions] = await Promise.all([
    prisma.operationalCampaign.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" } }),
    prisma.operationalActivityEvent.findMany({ where: { workspaceId }, orderBy: { occurredAt: "desc" }, take: 100 }),
    prisma.operationalNotification.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.operationalTask.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.operationalRecommendationAction.findMany({ where: { workspaceId }, orderBy: { actedAt: "desc" } }),
    prisma.operationalMediaAsset.findMany({ where: { workspaceId }, orderBy: { uploadedAt: "desc" } }),
    prisma.operationalContentVersion.findMany({ where: { workspaceId }, orderBy: [{ campaignId: "asc" }, { version: "desc" }] }),
  ]);

  return {
    campaigns: campaigns.map((item): OperationalCampaign => ({
      id: item.id,
      title: item.title,
      channel: item.channel as OperationalCampaign["channel"],
      stage: item.stage as OperationalCampaign["stage"],
      approval: item.approval as OperationalCampaign["approval"],
      clinicalRisk: item.clinicalRisk as OperationalCampaign["clinicalRisk"],
      caption: item.caption,
      strategyNote: item.strategyNote,
      objective: item.objective,
      audienceNotes: item.audienceNotes,
      engagementExpectation: item.engagementExpectation,
      hashtags: asStrings(item.hashtags),
      format: item.format as OperationalCampaign["format"],
      recommendation: item.recommendation ?? undefined,
      scheduledFor: item.scheduledFor ?? undefined,
      performance: item.performance ?? undefined,
      owner: item.owner,
      reviewer: item.reviewer ?? undefined,
      participants: asRoles(item.participants),
      updated: item.updatedLabel,
      updatedAt: item.updatedAt.toISOString(),
    })),
    activity: events.map((item): ActivityEvent => ({
      id: item.id,
      campaignId: item.campaignId ?? undefined,
      category: item.category as ActivityEvent["category"],
      title: item.title,
      description: item.description,
      actor: item.actor,
      actorRole: item.actorRole as ActivityEvent["actorRole"],
      time: formatTime(item.occurredAt),
      occurredAt: item.occurredAt.toISOString(),
      tone: item.tone as Tone,
      visibleTo: asRoles(item.visibleTo),
      transitionFrom: item.transitionFrom as CampaignStage | undefined,
      transitionTo: item.transitionTo as CampaignStage | undefined,
    })),
    notifications: notifications.map((item): OperationalNotification => ({
      id: item.id,
      campaignId: item.campaignId ?? undefined,
      role: item.role as Role,
      category: item.category,
      groupKey: item.groupKey,
      title: item.title,
      detail: item.detail,
      unread: item.unread,
      tone: item.tone as Tone,
      createdAt: item.createdAt.toISOString(),
    })),
    staffTasks: tasks.map((item): StaffTask => ({
      id: item.id,
      title: item.title,
      due: item.due,
      completed: item.completed,
      status: item.status as StaffTask["status"],
    })),
    mediaAssets: mediaAssets.map((item): MediaAsset => ({
      id: item.id,
      title: item.title,
      fileName: item.fileName,
      fileType: item.fileType,
      kind: item.kind as MediaAsset["kind"],
      status: item.status as MediaAsset["status"],
      sourceRole: item.sourceRole as MediaAsset["sourceRole"],
      campaignId: item.campaignId ?? undefined,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt.toISOString(),
      altText: item.altText,
      rightsNote: item.rightsNote,
      visibleTo: asRoles(item.visibleTo),
    })),
    contentVersions: versions.map((item): ContentVersion => ({
      id: item.id,
      campaignId: item.campaignId,
      version: item.version,
      caption: item.caption,
      strategyNote: item.strategyNote,
      changedSummary: item.changedSummary,
      modifiedBy: item.modifiedBy,
      approval: item.approval as ContentVersion["approval"],
      createdAt: item.createdAt.toISOString(),
      rollbackAvailable: item.rollbackAvailable,
    })),
    recommendationStatus: Object.fromEntries(actions.map((item) => [item.title, item.status as RecommendationStatus])),
    syncedAt: new Date().toISOString(),
  };
}

export async function applyOperationalAction(action: OperationalAction) {
  const workspaceId = await operationalWorkspaceId();
  await seedOperationalWorkflow(workspaceId);
  await prisma.$transaction(async (tx) => {
    const campaign = "id" in action && action.type !== "read-notification" && action.type !== "submit-task" && action.type !== "complete-task"
      ? await tx.operationalCampaign.findFirst({ where: { id: action.id, workspaceId } })
      : null;

    switch (action.type) {
      case "move-campaign": {
        if (!campaign || campaign.stage === action.stage) return;
        if (action.stage === "scheduled" && campaign.approval !== "approved") {
          await addNotice(tx, workspaceId, "production", "Approval", "approval-blocked", "Doctor approval required", `${campaign.title} cannot be scheduled before clinical approval.`, "warning", campaign.id);
          return;
        }
        const approval = action.stage === "doctor-approval" ? "pending" : campaign.approval;
        await tx.operationalCampaign.update({ where: { id: campaign.id }, data: { stage: action.stage, approval, updatedLabel: nowLabel() } });
        await addEvent(tx, workspaceId, campaign.id, "campaign", "Workflow stage updated", `${campaign.title} moved to ${label(action.stage)}.`, "Production team", "production", "info", campaign.stage as CampaignStage, action.stage);
        if (action.stage === "doctor-approval") {
          await addNotice(tx, workspaceId, "doctor", "Approval", "clinical-approval", "New campaign requires approval", campaign.title, "warning", campaign.id);
        }
        return;
      }
      case "edit-campaign": {
        if (!campaign) return;
        await tx.operationalCampaign.update({ where: { id: campaign.id }, data: { caption: action.caption, strategyNote: action.note, stage: "review", approval: "revision-requested", updatedLabel: nowLabel() } });
        const latestVersion = await tx.operationalContentVersion.aggregate({ where: { campaignId: campaign.id }, _max: { version: true } });
        await tx.operationalContentVersion.create({
          data: {
            id: `version-${crypto.randomUUID()}`,
            workspaceId,
            campaignId: campaign.id,
            version: (latestVersion._max.version ?? 0) + 1,
            caption: action.caption,
            strategyNote: action.note,
            changedSummary: "Caption or approval annotation revised for clinical review.",
            modifiedBy: "Production team",
            approval: "revision-requested",
          },
        });
        await addEvent(tx, workspaceId, campaign.id, "campaign", "Campaign revision saved", `${campaign.title} returned to production review.`, "Production team", "production", "info", campaign.stage as CampaignStage, "review");
        return;
      }
      case "submit-campaign": {
        if (!campaign) return;
        await tx.operationalCampaign.update({ where: { id: campaign.id }, data: { stage: "doctor-approval", approval: "pending", reviewer: "Dr. Harika", updatedLabel: nowLabel() } });
        await addEvent(tx, workspaceId, campaign.id, "approval", "Submitted for doctor approval", `${campaign.title} is awaiting clinical review.`, "Production team", "production", "warning", campaign.stage as CampaignStage, "doctor-approval");
        await addNotice(tx, workspaceId, "doctor", "Approval", "clinical-approval", "Content ready for your review", campaign.title, "warning", campaign.id);
        await addNotice(tx, workspaceId, "admin", "Approval SLA", "bottleneck", "Clinical review added to queue", `${campaign.title} is waiting on doctor approval.`, "warning", campaign.id);
        return;
      }
      case "decide-campaign": {
        if (!campaign) return;
        const approved = action.decision === "approve";
        const stage = approved ? "scheduled" : "review";
        const approval = approved ? "approved" : action.decision === "reject" ? "rejected" : "revision-requested";
        const title = approved ? "Campaign approved and scheduled" : action.decision === "reject" ? "Campaign rejected" : "Revision requested";
        const detail = approved ? `${campaign.title} is released to the next publishing window.` : `${campaign.title} returned to production review with clinical notes.`;
        await tx.operationalCampaign.update({
          where: { id: campaign.id },
          data: { stage, approval, scheduledFor: approved ? nextWindow() : null, reviewer: "Dr. Harika", updatedLabel: nowLabel() },
        });
        const version = await tx.operationalContentVersion.findFirst({ where: { campaignId: campaign.id }, orderBy: { version: "desc" } });
        if (version) await tx.operationalContentVersion.update({ where: { id: version.id }, data: { approval } });
        await addEvent(tx, workspaceId, campaign.id, "approval", title, detail, "Dr. Harika", "doctor", approved ? "success" : "warning", campaign.stage as CampaignStage, stage);
        await addNotice(tx, workspaceId, "production", "Clinical decision", "clinical-decision", title, detail, approved ? "success" : "warning", campaign.id);
        await addNotice(tx, workspaceId, "admin", "Workflow update", "throughput", title, detail, approved ? "success" : "warning", campaign.id);
        return;
      }
      case "schedule-campaign": {
        if (!campaign || campaign.approval !== "approved") return;
        await tx.operationalCampaign.update({ where: { id: campaign.id }, data: { scheduledFor: action.scheduledFor, stage: "scheduled", updatedLabel: nowLabel() } });
        await addEvent(tx, workspaceId, campaign.id, "schedule", "Publishing schedule updated", `${campaign.title} scheduled for ${formatSchedule(action.scheduledFor)}.`, "Production team", "production", "success", campaign.stage as CampaignStage, "scheduled");
        await addNotice(tx, workspaceId, "admin", "Schedule", "publishing", "Approved campaign scheduled", campaign.title, "info", campaign.id);
        return;
      }
      case "decide-strategy": {
        const approved = action.decision === "approve";
        const status = approved ? "applied" : "dismissed";
        await tx.operationalRecommendationAction.upsert({
          where: { workspaceId_title: { workspaceId, title: action.title } },
          update: { status, actor: "Dr. Harika", actedAt: new Date() },
          create: { workspaceId, title: action.title, status, actor: "Dr. Harika" },
        });
        const title = approved ? "Strategy approved" : "AI recommendation rejected";
        const detail = approved ? `${action.title} is cleared for a production brief.` : `${action.title} will not proceed without revised clinical rationale.`;
        await addEvent(tx, workspaceId, undefined, "recommendation", title, detail, "Dr. Harika", "doctor", approved ? "success" : "warning");
        await addNotice(tx, workspaceId, "production", "AI recommendation update", "recommendations", title, detail, approved ? "success" : "warning");
        return;
      }
      case "recommendation-action": {
        const status = action.action === "convert" ? "converted" : action.action === "attach" ? "attached" : action.action === "apply" ? "applied" : "dismissed";
        await tx.operationalRecommendationAction.upsert({
          where: { workspaceId_title: { workspaceId, title: action.title } },
          update: { status, actor: "Production team", actedAt: new Date() },
          create: { workspaceId, title: action.title, status, actor: "Production team" },
        });
        if (action.action === "convert") {
          await tx.operationalCampaign.create({
            data: {
              id: `campaign-${crypto.randomUUID()}`,
              workspaceId,
              title: `${action.title} campaign`,
              channel: "Instagram",
              stage: "draft",
              approval: "not-submitted",
              clinicalRisk: "Review required",
              caption: "Patient-friendly educational copy in preparation.",
              strategyNote: "Created from measured AI recommendation; requires production and clinical review.",
              objective: "Translate a measured opportunity into clinically reviewed patient education.",
              audienceNotes: "Audience definition required during brief review.",
              engagementExpectation: "Measurement target will be set from approved comparable content.",
              hashtags: ["PatientEducation"],
              format: "carousel",
              recommendation: action.title,
              owner: "Production team",
              participants: ["production", "doctor", "admin"],
              updatedLabel: nowLabel(),
            },
          });
        } else if (action.action === "attach") {
          const first = await tx.operationalCampaign.findFirst({ where: { workspaceId }, orderBy: { updatedAt: "desc" } });
          if (first) await tx.operationalCampaign.update({ where: { id: first.id }, data: { recommendation: action.title, updatedLabel: nowLabel() } });
        }
        const verb = action.action === "convert" ? "converted into a campaign" : action.action === "attach" ? "attached to active content" : action.action === "apply" ? "accepted for production review" : "dismissed";
        await addEvent(tx, workspaceId, undefined, "recommendation", "AI recommendation updated", `${action.title} was ${verb}.`, "Production team", "production", action.action === "dismiss" ? "neutral" : "info");
        return;
      }
      case "read-notification":
        await tx.operationalNotification.updateMany({ where: { id: action.id, workspaceId }, data: { unread: false, readAt: new Date() } });
        return;
      case "read-role-notifications":
        await tx.operationalNotification.updateMany({ where: { workspaceId, role: action.role, unread: true }, data: { unread: false, readAt: new Date() } });
        return;
      case "submit-task": {
        const task = await tx.operationalTask.findFirst({ where: { id: action.id, workspaceId, status: "Assigned" } });
        if (!task) return;
        await tx.operationalTask.update({ where: { id: task.id }, data: { status: "Submitted" } });
        await addEvent(tx, workspaceId, undefined, "submission", "Clinic confirmation submitted", `${task.title} is ready for production validation.`, "Hospital staff", "staff", "info");
        await addNotice(tx, workspaceId, "production", "Staff submission", "clinic-input", "Clinic confirmation received", task.title, "info");
        return;
      }
      case "complete-task": {
        const task = await tx.operationalTask.findFirst({ where: { id: action.id, workspaceId, completed: false } });
        if (!task) return;
        await tx.operationalTask.update({ where: { id: task.id }, data: { status: "Complete", completed: true } });
        await addEvent(tx, workspaceId, undefined, "submission", "Clinic task completed", task.title, "Hospital staff", "staff", "success");
        await addNotice(tx, workspaceId, "production", "Clinic input", "clinic-input", "Staff task completed", task.title, "success");
        return;
      }
      case "submit-upload":
        await tx.operationalTask.updateMany({ where: { id: "task-photo", workspaceId }, data: { status: "Submitted", completed: true } });
        await createMediaAsset(tx, workspaceId, action.name, action.fileType ?? "image/jpeg", "staff", action.campaignId);
        await addEvent(tx, workspaceId, undefined, "submission", "Asset submitted for review", `${action.name} entered production review.`, "Hospital staff", "staff", "info");
        await addNotice(tx, workspaceId, "production", "Upload", "clinic-input", "New clinic asset submitted", `${action.name} requires content review.`, "info");
        return;
      case "upload-media":
        await createMediaAsset(tx, workspaceId, action.name, action.fileType, action.sourceRole, action.campaignId);
        await addEvent(tx, workspaceId, action.campaignId, "media", "Media uploaded", `${action.name} is available for production review.`, action.sourceRole === "staff" ? "Hospital staff" : "Production team", action.sourceRole, "info");
        return;
      case "attach-media": {
        const targetCampaign = await tx.operationalCampaign.findFirst({ where: { id: action.campaignId, workspaceId } });
        const asset = await tx.operationalMediaAsset.findFirst({ where: { id: action.id, workspaceId } });
        if (!targetCampaign || !asset) return;
        await tx.operationalMediaAsset.update({ where: { id: asset.id }, data: { campaignId: targetCampaign.id } });
        await addEvent(tx, workspaceId, targetCampaign.id, "media", "Media attached to campaign", `${asset.title} linked to ${targetCampaign.title}.`, "Production team", "production", "info");
        return;
      }
      case "update-media-status": {
        const asset = await tx.operationalMediaAsset.findFirst({ where: { id: action.id, workspaceId } });
        if (!asset) return;
        await tx.operationalMediaAsset.update({ where: { id: asset.id }, data: { status: action.status } });
        await addEvent(tx, workspaceId, asset.campaignId ?? undefined, "media", "Media status updated", `${asset.title} moved to ${label(action.status)}.`, "Production team", "production", action.status === "approved" ? "success" : "info");
        return;
      }
    }
  });
  return getOperationalSnapshot();
}

type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function addEvent(
  tx: Transaction,
  workspaceId: string,
  campaignId: string | undefined,
  category: ActivityEvent["category"],
  title: string,
  description: string,
  actor: string,
  actorRole: ActivityEvent["actorRole"],
  tone: Tone,
  transitionFrom?: CampaignStage,
  transitionTo?: CampaignStage,
) {
  await tx.operationalActivityEvent.create({
    data: {
      id: `activity-${crypto.randomUUID()}`,
      workspaceId,
      campaignId,
      category,
      title,
      description,
      actor,
      actorRole,
      tone,
      visibleTo: actorRole === "staff" ? visibleToAll : ["admin", "production", "doctor"],
      transitionFrom,
      transitionTo,
    },
  });
}

async function addNotice(
  tx: Transaction,
  workspaceId: string,
  role: Role,
  category: string,
  groupKey: string,
  title: string,
  detail: string,
  tone: Tone,
  campaignId?: string,
) {
  await tx.operationalNotification.create({
    data: { id: `notice-${crypto.randomUUID()}`, workspaceId, campaignId, role, category, groupKey, title, detail, tone },
  });
}

function asRoles(value: unknown): Role[] {
  return Array.isArray(value) ? value.filter((role): role is Role => visibleToAll.includes(role as Role)) : [];
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function createMediaAsset(
  tx: Transaction,
  workspaceId: string,
  name: string,
  fileType: string,
  sourceRole: "production" | "staff",
  campaignId?: string,
) {
  const kind = fileType.includes("video") ? "video" : fileType.includes("pdf") ? "document" : "image";
  await tx.operationalMediaAsset.create({
    data: {
      id: `asset-${crypto.randomUUID()}`,
      workspaceId,
      campaignId,
      title: name.replace(/\.[^.]+$/, "").replaceAll("-", " "),
      fileName: name,
      fileType,
      kind,
      status: sourceRole === "staff" ? "under-review" : "draft",
      sourceRole,
      uploadedBy: sourceRole === "staff" ? "Hospital staff" : "Production team",
      altText: kind === "image" ? "Uploaded healthcare communication image pending description review." : "Uploaded communication asset.",
      rightsNote: "Permissions and clinical suitability pending production validation.",
      visibleTo: sourceRole === "staff" ? ["admin", "production", "staff"] : ["admin", "production", "doctor"],
    },
  });
}

function nowLabel() {
  return formatTime(new Date());
}

function formatTime(value: Date) {
  return `Today, ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(value)}`;
}

function nextWindow() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(18, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}

function formatSchedule(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("-", " ");
}
