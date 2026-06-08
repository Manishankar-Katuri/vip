/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("../../../packages/database/src/generated/client");

const prisma = new PrismaClient();

const HOSPITAL_ID = "content-execution-demo-hospital";
const SOCIAL_WORKSPACE_ID = "content-execution-demo-social";
const USER_EMAIL = "content-execution-demo@vip.local";

async function main() {
  const hospital = await prisma.hospitalWorkspace.upsert({
    where: { id: HOSPITAL_ID },
    update: {
      name: "VIP Content Execution Demo",
      hospitalName: "VIP Content Execution Demo",
      slug: "vip-content-execution-demo",
      contactEmail: "client@example.com",
      status: "ACTIVE",
      specialty: "ENT and preventive care",
      city: "Hyderabad",
    },
    create: {
      id: HOSPITAL_ID,
      name: "VIP Content Execution Demo",
      hospitalName: "VIP Content Execution Demo",
      slug: "vip-content-execution-demo",
      contactEmail: "client@example.com",
      status: "ACTIVE",
      specialty: "ENT and preventive care",
      city: "Hyderabad",
    },
  });

  const socialWorkspace = await prisma.workspace.upsert({
    where: { id: SOCIAL_WORKSPACE_ID },
    update: { name: hospital.name, slug: "vip-content-execution-demo-social" },
    create: {
      id: SOCIAL_WORKSPACE_ID,
      name: hospital.name,
      slug: "vip-content-execution-demo-social",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: { hospitalId: hospital.id, role: "PRODUCTION", isActive: true },
    create: {
      email: USER_EMAIL,
      name: "VIP Content Producer",
      hospitalId: hospital.id,
      role: "PRODUCTION",
      isActive: true,
    },
  });

  const baseDate = nextSunday();
  const calendarItems = [
    item(1, "INSTAGRAM", "Ear infection prevention", "REEL", "AWARENESS", "Doctor video", "09:30", "Preventive ENT care", "Increase saved educational posts"),
    item(2, "INSTAGRAM", "Sinus care mistakes", "POST", "EDUCATIONAL", "Static creative", "11:00", "Preventive ENT care", "Reduce weak repetitive content"),
    item(3, "FACEBOOK", "Monsoon allergy checklist", "POST", "SEASONAL", "Carousel template", "16:00", "Seasonal care", "Improve family reach"),
    item(4, "GBP", "Clinic timing reminder", "POST", "PROMOTIONAL", "Approved clinic image", "10:00", "Local visibility", "Improve Google profile actions"),
    item(5, "WHATSAPP", "Guaranteed cure for tinnitus", "POST", "EDUCATIONAL", "Doctor quote", "12:00", "Patient education", "Safety review required"),
    item(6, "INSTAGRAM", "Hearing test checklist", "CAROUSEL", "EDUCATIONAL", "Audiology room photo", "09:30", "Diagnostics awareness", "Increase appointment intent"),
    item(7, "FACEBOOK", "Doctor explains safe ear cleaning", "VIDEO", "DOCTOR_BRANDING", "Doctor video", "17:00", "Doctor trust", "Improve shares"),
    item(8, "INSTAGRAM", "Sinus care mistakes", "POST", "EDUCATIONAL", "Static creative", "11:00", "Preventive ENT care", "Avoid repetition"),
    item(9, "GBP", "Patient FAQ: blocked nose", "POST", "EDUCATIONAL", "FAQ image", "10:00", "Search visibility", "Answer local patient questions"),
    item(10, "WHATSAPP", "Post-surgery care reminder", "POST", "AWARENESS", "Approved instructions", "18:00", "Follow-up care", "Improve patient readiness"),
  ];

  for (const entry of calendarItems) {
    await prisma.contentCalendarItem.upsert({
      where: { id: entry.id },
      update: entry.data,
      create: { id: entry.id, ...entry.data },
    });
  }

  const instagram = await socialAccount(socialWorkspace.id, "INSTAGRAM", "vip-demo-instagram");
  const facebook = await socialAccount(socialWorkspace.id, "FACEBOOK", "vip-demo-facebook");

  await socialPost({
    accountId: instagram.id,
    workspaceId: socialWorkspace.id,
    postId: "strong-ear-infection",
    platform: "INSTAGRAM",
    caption: "Ear infection prevention tips parents saved this week",
    contentType: "SHORT_FORM_VIDEO",
    daysAgo: 5,
    metrics: { reach: 4200, engagementRate: 0.032, saves: 84, shares: 35, comments: 21 },
  });
  await socialPost({
    accountId: instagram.id,
    workspaceId: socialWorkspace.id,
    postId: "weak-sinus-care",
    platform: "INSTAGRAM",
    caption: "Sinus care mistakes repeated from older calendar",
    contentType: "IMAGE",
    daysAgo: 8,
    metrics: { reach: 290, engagementRate: 0.002, saves: 1, shares: 0, comments: 0 },
  });
  await socialPost({
    accountId: facebook.id,
    workspaceId: socialWorkspace.id,
    postId: "strong-facebook-video",
    platform: "FACEBOOK",
    caption: "Doctor explains safe ear cleaning for families",
    contentType: "VIDEO",
    daysAgo: 4,
    metrics: { reach: 3100, engagementRate: 0.021, saves: 18, shares: 44, comments: 16 },
  });

  const observedAt = new Date();
  observedAt.setUTCHours(0, 0, 0, 0);

  await prisma.marketSignalObservation.upsert({
    where: {
      workspaceId_provider_category_regionKey_signalKey_observedAt: {
        workspaceId: socialWorkspace.id,
        provider: "vip-seed",
        category: "seasonal-health",
        regionKey: "hyderabad",
        signalKey: "monsoon-allergy-spike",
        observedAt,
      },
    },
    update: {
      label: "Monsoon allergy spike",
      score: 92,
      momentum: 0.86,
      confidence: 0.82,
      metadata: { recommendedContentType: "REEL", reason: "Seasonal allergy questions are increasing in local searches and clinic conversations." },
    },
    create: {
      workspaceId: socialWorkspace.id,
      provider: "vip-seed",
      category: "seasonal-health",
      regionKey: "hyderabad",
      signalKey: "monsoon-allergy-spike",
      label: "Monsoon allergy spike",
      score: 92,
      volume: 100,
      momentum: 0.86,
      sentiment: 0.3,
      confidence: 0.82,
      metadata: { recommendedContentType: "REEL", reason: "Seasonal allergy questions are increasing in local searches and clinic conversations." },
      observedAt,
    },
  });

  console.log(JSON.stringify({
    hospitalId: hospital.id,
    hospitalSlug: hospital.slug,
    socialWorkspaceId: socialWorkspace.id,
    calendarItems: calendarItems.length,
    message: "Seeded content execution demo data. Select workspace vip-content-execution-demo in the app.",
  }, null, 2));

  function item(offset, platform, topic, type, category, asset, time, campaignTheme, goal) {
    const scheduledDate = new Date(baseDate);
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() + offset);
    const [hour, minute] = time.split(":").map(Number);
    scheduledDate.setUTCHours(hour, minute, 0, 0);

    return {
      id: `content-execution-demo-${offset}`,
      data: {
        hospitalId: hospital.id,
        clientId: hospital.id,
        platform,
        plannedTopic: topic,
        plannedCaption: `Baseline calendar caption for ${topic}.`,
        plannedAssets: [asset],
        plannedPostingTime: time,
        campaignTheme,
        goal,
        title: topic,
        description: `Seeded monthly calendar item for ${topic}.`,
        contentType: mapCalendarType(type),
        category,
        status: "PLANNED",
        priority: offset <= 5 ? "HIGH" : "MEDIUM",
        scheduledDate,
        createdBy: user.id,
        tags: [platform, "content-execution-seed"],
        isSpecialDay: category === "SEASONAL",
        specialDayName: category === "SEASONAL" ? "Monsoon health awareness" : null,
        position: offset,
        approvalStatus: offset === 5 ? "NEEDS_APPROVAL" : "PENDING",
      },
    };
  }
}

async function socialAccount(workspaceId, platform, externalAccountId) {
  return prisma.socialAccount.upsert({
    where: { platform_externalAccountId: { platform, externalAccountId } },
    update: { workspaceId, status: "ACTIVE" },
    create: { workspaceId, platform, externalAccountId, status: "ACTIVE" },
  });
}

async function socialPost(input) {
  const postedAt = new Date();
  postedAt.setUTCDate(postedAt.getUTCDate() - input.daysAgo);

  const post = await prisma.socialPost.upsert({
    where: { platform_postId: { platform: input.platform, postId: input.postId } },
    update: {
      caption: input.caption,
      contentType: input.contentType,
      postedAt,
    },
    create: {
      workspaceId: input.workspaceId,
      socialAccountId: input.accountId,
      platform: input.platform,
      postId: input.postId,
      caption: input.caption,
      contentType: input.contentType,
      postedAt,
      rawData: { seed: "content-execution" },
    },
  });

  await prisma.postMetrics.upsert({
    where: { socialPostId: post.id },
    update: input.metrics,
    create: { socialPostId: post.id, ...input.metrics },
  });
}

function nextSunday() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilSunday = (7 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + daysUntilSunday);
  return date;
}

function mapCalendarType(value) {
  if (value === "VIDEO") return "REEL";
  return value;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
