import { dayName } from "./execution-window";
import type {
  ContentDecision,
  ContentExecutionDocumentMode,
  ContentExecutionGenerationMode,
  DailyIntelligenceSnapshot,
  DetailedContentInstruction,
  ExecutionWindow,
  PlannedCalendarItem,
  ThreeDayContentExecutionDocument,
} from "./types";

type DocumentInput = {
  workspaceId: string;
  clientName: string;
  window: ExecutionWindow;
  plannedItems: PlannedCalendarItem[];
  decisions: ContentDecision[];
  intelligence: DailyIntelligenceSnapshot;
  mode?: ContentExecutionDocumentMode;
  generationMode?: ContentExecutionGenerationMode;
  generatedAt?: Date;
};

export class ContentPlanDocumentGenerator {
  generate(input: DocumentInput) {
    const generatedAt = input.generatedAt ?? new Date();
    const mode = input.mode ?? "real";
    const generationMode = input.generationMode ?? input.window.generationMode ?? "scheduled";
    const plannedById = new Map(input.plannedItems.map((item) => [item.id, item]));
    const activeDecisions = sortDecisions(input.decisions.filter((decision) => decision.decision !== "PAUSE"), input.window);
    const platforms = unique(activeDecisions.map((decision) => displayPlatform(decision.platform ?? "INSTAGRAM")));
    const clientAssets = unique(activeDecisions.flatMap((decision) =>
      decision.generatedContent?.clientPreparationTasks ?? []
    ));
    const internalAssets = unique(activeDecisions.flatMap((decision) =>
      decision.generatedContent?.internalTeamTasks ?? []
    ));
    const adjustedItemsCount = input.decisions.filter((decision) =>
      ["IMPROVE", "REPLACE", "PAUSE"].includes(decision.decision)
    ).length;
    const freshAiItemsCount = input.decisions.filter((decision) => decision.decision === "ADD").length;
    const topPriorityActions = buildPriorityActions(activeDecisions);
    const title = input.window.label;
    const email = generateEmailPayload(input.window, input.clientName, topPriorityActions);
    const document: ThreeDayContentExecutionDocument = {
      title,
      mode,
      modeLabel: mode === "preview" ? "Preview document" : "Real document",
      generationMode,
      clientName: input.clientName,
      workspaceName: input.clientName,
      workspaceId: input.workspaceId,
      generatedAt: generatedAt.toISOString(),
      contentWindow: {
        startDate: readableDate(input.window.windowStartDate, "short"),
        endDate: readableDate(input.window.windowEndDate, "short"),
        displayStartDate: readableDate(input.window.windowStartDate, "long"),
        displayEndDate: readableDate(input.window.windowEndDate, "long"),
        displayRange: readableRange(input.window.windowStartDate, input.window.windowEndDate),
        label: input.window.label,
        purpose: input.window.purpose,
        sendDay: input.window.sendDay,
        sendTime: input.window.sendTime,
      },
      executiveBrief: {
        mainTheme: mainTheme(input.plannedItems, input.decisions),
        primaryGoal: primaryGoal(input.plannedItems),
        platformsCovered: platforms,
        totalContentPieces: activeDecisions.length,
        adjustedItemsCount,
        freshAiItemsCount,
        priorityPreparationSummary: topPriorityActions.slice(0, 3).join(" "),
      },
      intelligenceNote: buildIntelligenceNote(input.intelligence, adjustedItemsCount, freshAiItemsCount, mode),
      intelligenceBasedAdjustments: input.decisions.map((decision) => {
        const original = decision.calendarItemId ? plannedById.get(decision.calendarItemId) : null;

        return {
          date: readableDate(decision.date ?? input.window.windowStartDate, "short"),
          platform: displayPlatform(decision.platform ?? "INSTAGRAM"),
          originalPlan: original?.plannedTopic ?? "New intelligence-led item",
          finalPlan: decision.finalTopic,
          decision: decision.decision,
          reason: decision.decisionReason,
        };
      }),
      dayWiseSchedule: activeDecisions.map((decision) => ({
        date: readableDate(decision.date ?? input.window.windowStartDate, "compact"),
        day: dayName(decision.date ?? input.window.windowStartDate, input.window.timezone),
        platform: displayPlatform(decision.platform ?? "INSTAGRAM"),
        contentType: decision.finalContentType,
        topic: decision.finalTopic,
        postingTime: decision.postingTime ?? "09:30",
        assetNeeded: (decision.generatedContent?.assetRequirements ?? ["Approved creative"]).join(", "),
        approvalStatus: decision.approvalStatus ?? (decision.decision === "ADD" ? "NEEDS_APPROVAL" : "PENDING"),
      })),
      detailedContentInstructions: activeDecisions.map((decision) =>
        buildDetailedInstruction(decision, input.window, input.clientName)
      ),
      assetChecklist: {
        neededFromClient: clientAssets.length ? clientAssets : ["Approval confirmation"],
        neededFromInternalTeam: internalAssets.length ? internalAssets : ["Schedule post"],
      },
      priorityActions: topPriorityActions,
      emailSummaryPreview: email,
    };

    return {
      document,
      email,
    };
  }
}

export function generateEmailPayload(
  window: ExecutionWindow,
  clientName: string,
  priorityActions: string[]
) {
  const subject = window.sendDay === "Saturday"
    ? `VIP Weekend + Next Week Prep Plan | ${clientName}`
    : window.sendDay === "Manual"
    ? `VIP Content Plan: ${readableRange(window.windowStartDate, window.windowEndDate)} | ${clientName}`
    : `VIP Content Execution Plan: ${window.sendDay === "Sunday" ? "Monday-Wednesday" : "Thursday-Saturday"} | ${clientName}`;
  const topThree = priorityActions.slice(0, 3);

  return {
    subject,
    body: [
      `Hi ${clientName} team,`,
      "",
      `Your content plan for ${readableRange(window.windowStartDate, window.windowEndDate)} has been generated.`,
      "",
      "Please review:",
      "1. Posts planned for each day",
      "2. Doctor video scripts",
      "3. Carousel slide text",
      "4. Clinic materials needed",
      "5. Final checks before posting",
      "",
      "Top preparation needed:",
      ...topThree.map((action, index) => `${index + 1}. ${action}`),
      "",
      "The execution document is attached with the final schedule, content instructions, and asset checklist.",
      "",
      "Best,",
      "VIP Intelligence OS",
    ].join("\n"),
  };
}

function mainTheme(plannedItems: PlannedCalendarItem[], decisions: ContentDecision[]) {
  return plannedItems.find((item) => item.campaignTheme)?.campaignTheme ??
    decisions[0]?.finalTopic ??
    "Adaptive content execution";
}

function primaryGoal(plannedItems: PlannedCalendarItem[]) {
  const goal = plannedItems.find((item) => item.goal)?.goal;
  if (!goal || /saved educational posts|appointment enquiries/i.test(goal)) {
    return "Increase patient education, trust, and appointment enquiries.";
  }

  return goal;
}

function buildIntelligenceNote(
  intelligence: DailyIntelligenceSnapshot,
  adjustedItemsCount: number,
  freshAiItemsCount: number,
  mode: ContentExecutionDocumentMode
) {
  const trend = intelligence.trendSignalsNormalized[0]?.topic ?? intelligence.trendSignals[0]?.label;
  const platform = intelligence.platformAnalytics[0];
  const topPerformance = intelligence.platformPerformance[0];
  const signalList = [
    platform?.bestContentType ? `${platform.platform} ${platform.bestContentType.toLowerCase()} performance` : null,
    topPerformance?.saves ? `${topPerformance.saves} recent save signal(s)` : null,
    topPerformance?.shares ? `${topPerformance.shares} recent share signal(s)` : null,
    trend ? `${trend} trend signal` : null,
  ].filter(Boolean);
  const baseline = signalList.length
    ? `This plan was prepared using recent ${signalList.join(", ")} captured by VIP Intelligence OS.`
    : "This plan was prepared using the latest available reach, engagement, saves, shares, audience response, trend signal, and asset readiness data captured by VIP Intelligence OS.";

  const modeLead = mode === "preview"
    ? "Preview document generated for review."
    : "Generated by VIP Intelligence OS using the monthly content calendar and latest available intelligence signals.";

  return `${modeLead} ${baseline} The plan below shows the final content schedule, scripts, clinic materials needed, and final checks for the upcoming content window.`;
}

function buildPriorityActions(decisions: ContentDecision[]) {
  const videoCount = decisions.filter((decision) => isVideoType(decision.finalContentType)).length;
  const carouselCount = decisions.filter((decision) => isCarouselType(decision.finalContentType)).length;
  const gbpCount = decisions.filter((decision) => isGbpType(decision.platform ?? "", decision.finalContentType)).length;
  const actions = [
    videoCount ? `Record ${videoCount} doctor-led vertical video${videoCount > 1 ? "s" : ""} in 9:16 format.` : null,
    carouselCount ? `Approve ${carouselCount} carousel slide script${carouselCount > 1 ? "s" : ""} before design.` : null,
    "Share clinic visuals, logo, and doctor availability.",
    gbpCount ? "Confirm GBP service details and preferred clinic image." : null,
    "Review captions, approval checklist, and medical safety notes.",
  ];

  return actions.filter(Boolean) as string[];
}

function sortDecisions(decisions: ContentDecision[], window: ExecutionWindow) {
  const platformRank = new Map([
    ["INSTAGRAM", 1],
    ["FACEBOOK", 2],
    ["GBP", 3],
    ["WHATSAPP", 4],
    ["YOUTUBE", 5],
    ["LINKEDIN", 6],
  ]);

  return [...decisions].sort((left, right) => {
    const leftDate = left.date ?? window.windowStartDate;
    const rightDate = right.date ?? window.windowStartDate;
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);

    const leftTime = left.postingTime ?? "09:30";
    const rightTime = right.postingTime ?? "09:30";
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);

    const leftPlatform = platformRank.get((left.platform ?? "INSTAGRAM").toUpperCase()) ?? 99;
    const rightPlatform = platformRank.get((right.platform ?? "INSTAGRAM").toUpperCase()) ?? 99;
    return leftPlatform - rightPlatform;
  });
}

function expectedImpact(decision: ContentDecision) {
  if (decision.decision === "ADD") return "Captures a timely opportunity while it is still relevant.";
  if (decision.decision === "IMPROVE") return "Improves the chance of stronger engagement without changing the core idea.";
  if (decision.decision === "REPLACE") return "Avoids weak or repetitive content and shifts effort toward a stronger angle.";
  return "Keeps the calendar moving with a clear execution-ready post.";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildDetailedInstruction(
  decision: ContentDecision,
  window: ExecutionWindow,
  clientName: string
): DetailedContentInstruction {
  const contentType = decision.finalContentType;
  const topic = cleanTopic(decision.finalTopic);
  const rawPlatform = decision.platform ?? "INSTAGRAM";
  const platform = displayPlatform(rawPlatform);
  const base = {
    date: readableDate(decision.date ?? window.windowStartDate, "long"),
    platform,
    decision: decision.decision,
    postingTime: decision.postingTime ?? "09:30",
    contentType,
    topic,
    objective: objectiveFor(topic, decision, clientName),
    targetAudience: targetAudienceFor(topic, clientName),
    hook: hookFor(topic, decision),
    caption: captionFor(topic, clientName),
    hashtags: hashtagsFor(topic, clientName),
    cta: ctaFor(clientName),
    creativeDirection: decision.generatedContent?.creativeDirection ?? creativeDirectionFor(contentType),
    assetsRequired: decision.generatedContent?.assetRequirements ?? assetsFor(contentType),
    clientPreparationNeeded: decision.generatedContent?.clientPreparationTasks ?? clientTasksFor(contentType),
    internalTeamTasks: decision.generatedContent?.internalTeamTasks ?? internalTasksFor(contentType),
    approvalChecklist: approvalChecklistFor(contentType),
    medicalSafetyNote: medicalSafetyNoteFor(topic),
    expectedImpact: expectedImpact(decision),
  };

  if (isVideoType(contentType)) {
    return {
      ...base,
      duration: "30-40 seconds",
      thumbnailText: thumbnailFor(topic),
      fullScript: { scenes: videoScenesFor(topic, clientName) },
      recordingInstructions: [
        "Record vertically in 9:16 format with the doctor centered in frame.",
        "Use a quiet consultation room, good front lighting, and clear eye contact.",
        "Doctor should speak at a calm pace and pause briefly between scenes for clean edits.",
        "Record one extra take of the opening line and patient action for editing flexibility.",
      ],
      editingInstructions: [
        "Add clean subtitles for every doctor line.",
        "Use clinic logo in one corner and keep it away from captions.",
        "Cut in clinic visuals during the problem and practical-tips scenes.",
        "End with a simple patient action card using the clinic name and appointment prompt.",
      ],
    };
  }

  if (isCarouselType(contentType)) {
    return {
      ...base,
      carouselSlides: carouselSlidesFor(topic, clientName),
      designInstructions: [
        "Use one clear point per slide with large readable text.",
        "Use clinic brand colors, simple icons, and calm medical imagery.",
        "Keep the doctor/clinic branding visible but secondary to the patient message.",
        "Use the final slide for appointment/contact guidance.",
      ],
    };
  }

  if (isGbpType(rawPlatform, contentType)) {
    return {
      ...base,
      gbpPostCopy: gbpCopyFor(topic, clientName),
      gbpSuggestedImage: "Clinic exterior, reception area, doctor consultation setup, or a clean service-related clinic image.",
      gbpServiceCategory: serviceCategoryFor(topic),
    };
  }

  if (isWhatsAppType(rawPlatform, contentType)) {
    return {
      ...base,
      whatsappAudienceSegment: targetAudienceFor(topic, clientName),
      whatsappMessage: whatsappMessageFor(topic, clientName),
      whatsappFollowUpNote: "If the patient replies with symptoms, ask duration and severity, then route to appointment booking or doctor review.",
    };
  }

  if (isBlogType(contentType)) {
    return {
      ...base,
      blogArticlePlan: {
        title: `${topic}: What patients should know`,
        outline: [
          `Why ${topic.toLowerCase()} matters`,
          "Common symptoms or situations patients notice",
          "What patients can safely do at home",
          isGeriatricContext(clientName, topic) ? "When to book a geriatric review" : "When to consult an ENT specialist",
          `How ${clientName} can help`,
        ],
        introParagraph: isGeriatricContext(clientName, topic)
          ? `${topic} can affect daily care, family confidence, and safety. This article should help families understand the issue in simple language and know when it is time to book a geriatric review.`
          : `${topic} can affect comfort, daily routine, and peace of mind. This article should help patients understand the issue in simple language and know when it is time to consult an ENT specialist.`,
        sectionHeadings: ["What patients usually notice", "Common triggers", "Safe next steps", "When to book a consultation"],
        cta: ctaFor(clientName),
      },
    };
  }

  return base;
}

function videoScenesFor(topic: string, clientName: string) {
  const geriatric = isGeriatricContext(clientName, topic);
  return [
    {
      sceneNumber: 1,
      sceneTitle: "Opening",
      timestamp: "0-3 sec",
      doctorLines: [openingLineFor(topic)],
      onScreenText: [`${shortText(topic)}? Watch this.`],
      visualDirection: "Doctor faces camera in consultation room, calm and direct.",
      brollSuggestions: geriatric
        ? ["Doctor in clinic", "Clinic name board", "Caregiver consultation setup"]
        : ["Doctor in clinic", "Clinic name board", "Patient consultation setup"],
    },
    {
      sceneNumber: 2,
      sceneTitle: "Problem",
      timestamp: "4-10 sec",
      doctorLines: [problemLineFor(topic)],
      onScreenText: ["Do not wait for symptoms to worsen"],
      visualDirection: "Cut between doctor speaking and simple clinic visuals.",
      brollSuggestions: geriatric
        ? ["Doctor speaking with caregiver", "Medicine strips or walking-support visual"]
        : ["Doctor checking ear/nose/throat", "Otoscope or clinic equipment close-up"],
    },
    {
      sceneNumber: 3,
      sceneTitle: "Practical Guidance",
      timestamp: "11-25 sec",
      doctorLines: [
        "Keep the affected area clean and avoid self-treatment.",
        geriatric
          ? "Track changes like falls, confusion, weakness, appetite, sleep, walking, or medicine issues."
          : "Track symptoms like pain, discharge, blockage, fever, or reduced hearing.",
        geriatric
          ? "If changes continue, book a geriatric review early."
          : "If symptoms continue, consult an ENT specialist early.",
      ],
      onScreenText: geriatric
        ? ["Avoid guessing", "Watch changes", "Book geriatric review"]
        : ["Avoid self-treatment", "Watch symptoms", "Consult ENT early"],
      visualDirection: "Use three quick cuts with subtitles and simple icons.",
      brollSuggestions: ["Doctor reviewing patient notes", "Clinic corridor", "Consultation room"],
    },
    {
      sceneNumber: 4,
      sceneTitle: "Patient action",
      timestamp: "26-35 sec",
      doctorLines: [geriatric ? `For ongoing concerns, book a geriatric consultation with ${clientName}.` : `For persistent symptoms, book an ENT consultation with ${clientName}.`],
      onScreenText: [geriatric ? "Book a geriatric consultation" : "Book an ENT consultation"],
      visualDirection: "Doctor finishes with reassuring tone; end card shows clinic appointment prompt.",
      brollSuggestions: ["Reception desk", "Appointment booking visual", "Clinic exterior"],
    },
  ];
}

function carouselSlidesFor(topic: string, clientName: string) {
  const geriatric = isGeriatricContext(clientName, topic);
  return [
    { slideNumber: 1, headline: `${shortText(topic)}?`, body: "Here are signs families should not ignore.", visualSuggestion: "Bold title slide with doctor/clinic branding." },
    { slideNumber: 2, headline: "Notice the pattern", body: geriatric ? "Falls, new confusion, weakness, appetite change, sleep change, or medicine issues can be a signal to get reviewed." : "Pain, blockage, irritation, discharge, or repeated discomfort can be a signal to get checked.", visualSuggestion: "Simple symptom icons in a clean grid." },
    { slideNumber: 3, headline: "Avoid guessing", body: geriatric ? "Do not change medicines, ignore repeated falls, or wait for a crisis without medical guidance." : "Do not use random drops, deep earbuds, or online remedies without medical advice.", visualSuggestion: "Warning icon with calm medical colors." },
    { slideNumber: 4, headline: "Act early", body: geriatric ? "Early geriatric review can help families understand the next safe step." : "Early ENT consultation can help identify the cause and avoid unnecessary delay.", visualSuggestion: "Doctor consultation image or illustration." },
    { slideNumber: 5, headline: "Prepare for your visit", body: "Note symptom duration, triggers, medicines taken, and any recurring history.", visualSuggestion: "Checklist layout with large text." },
    { slideNumber: 6, headline: `Book with ${clientName}`, body: geriatric ? "Message or call the clinic team to schedule a geriatric consultation." : "Message or call the clinic team to schedule an ENT consultation.", visualSuggestion: "Final slide with clinic branding and appointment prompt." },
  ];
}

function gbpCopyFor(topic: string, clientName: string) {
  if (isGeriatricContext(clientName, topic)) {
    return `${topic} can be easy to ignore until it affects daily care, safety, or family confidence. If an elderly parent has repeated falls, new confusion, weakness, appetite change, sleep change, or medicine concerns, a geriatric consultation can help guide the next step.\n\n${clientName} is available for elderly care review and caregiver guidance. Message or call the clinic team to book an appointment.`;
  }

  return `${topic} can be easy to ignore until it affects daily comfort. If you are noticing persistent pain, blockage, irritation, discharge, reduced hearing, or repeated symptoms, an ENT consultation can help identify the cause early.\n\n${clientName} is available for ENT evaluation and guidance. Message or call the clinic team to book an appointment.`;
}

function whatsappMessageFor(topic: string, clientName: string) {
  if (isGeriatricContext(clientName, topic)) {
    return `Hi, this is ${clientName}. If you are caring for an elderly parent and noticing ${topic.toLowerCase()}, please note the changes and speak with the clinic team. Reply to this message or call us to book a geriatric consultation.`;
  }

  return `Hi, this is ${clientName}. If you or someone in your family is noticing ${topic.toLowerCase()}, please do not ignore persistent symptoms. Reply to this message or call the clinic team to book an ENT consultation.`;
}

function objectiveFor(topic: string, decision: ContentDecision, clientName: string) {
  if (decision.decision === "ADD") return `Use this timely topic to educate patients and guide them toward the right clinic appointment when needed.`;
  if (decision.decision === "IMPROVE") return `Make this planned topic clearer for patients with a stronger opening line, safer explanation, and clear appointment guidance.`;
  if (decision.decision === "REPLACE") return `Replace a weaker planned topic with a more relevant patient education angle around ${topic.toLowerCase()}.`;
  if (isGeriatricContext(clientName, topic)) return `Educate families about ${topic.toLowerCase()} and encourage timely geriatric review when changes persist.`;
  return `Educate patients about ${topic.toLowerCase()} and encourage early ENT consultation when symptoms persist.`;
}

function targetAudienceFor(topic: string, clientName: string) {
  const lower = topic.toLowerCase();
  if (isGeriatricContext(clientName, topic)) return "Adult children, caregivers, and families supporting elderly parents.";
  if (lower.includes("hearing")) return "Families, older adults, and patients who are missing sounds or increasing device volume.";
  if (lower.includes("child") || lower.includes("parent")) return "Parents and caregivers looking for safe ENT guidance.";
  if (lower.includes("monsoon") || lower.includes("allergy")) return "Working adults, parents, and recurring ENT patients affected during rainy season.";
  return "Patients and families looking for practical ENT guidance before symptoms become urgent.";
}

function captionFor(topic: string, clientName: string) {
  if (isGeriatricContext(clientName, topic)) {
    return `${topic} should not be ignored when changes persist or affect daily care. Watch for repeated falls, new confusion, weakness, appetite change, sleep change, walking difficulty, or medicine concerns. A geriatric review can help families understand the right next step.\n\nBook a geriatric consultation with ${clientName}.`;
  }

  return `${topic} should not be ignored when symptoms persist or keep returning. Watch for pain, blockage, irritation, discharge, reduced hearing, or discomfort that affects daily life. Early ENT evaluation can help identify the cause and guide the right next step.\n\nBook an ENT consultation with ${clientName}.`;
}

function hookFor(topic: string, decision: ContentDecision) {
  if (decision.decision === "KEEP") return `A clear patient checklist for ${topic.toLowerCase()}`;
  return `What patients should know now about ${topic.toLowerCase()}`;
}

function hashtagsFor(topic: string, clientName: string) {
  const clinicTag = `#${clientName.replace(/[^a-z0-9]/gi, "")}`;
  const topicTags = topic
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 2)
    .map((word) => `#${word.replace(/[^a-z0-9]/gi, "")}`);

  const careTags = isGeriatricContext(clientName, topic)
    ? ["#GeriatricCare", "#ElderlyCare", "#CaregiverSupport"]
    : ["#ENTCare", "#PatientEducation", "#HealthAwareness"];

  return unique([...careTags, ...topicTags, clinicTag]);
}

function ctaFor(clientName: string) {
  if (isGeriatricContext(clientName)) return `Message or call ${clientName} to book a geriatric consultation.`;
  return `Message or call ${clientName} to book an ENT consultation.`;
}

function thumbnailFor(topic: string) {
  return `${shortText(topic)}?`;
}

function shortText(topic: string) {
  return topic.split(":")[0].slice(0, 42);
}

function cleanTopic(topic: string) {
  return topic.replace(/:\s*timely content opportunity$/i, "");
}

function creativeDirectionFor(contentType: string) {
  if (isVideoType(contentType)) return "Doctor speaking to camera with simple subtitles, clinic visuals, and a clear appointment prompt.";
  if (isCarouselType(contentType)) return "Clinic-branded carousel with one clear patient point per slide.";
  return "Clean clinic-branded creative with one patient-friendly message and a direct next step.";
}

function assetsFor(contentType: string) {
  if (isVideoType(contentType)) return ["Doctor video", "Clinic visuals", "Clinic logo", "Appointment end card"];
  if (isCarouselType(contentType)) return ["Carousel template", "Doctor-reviewed key points", "Clinic logo"];
  return ["Approved clinic image", "Clinic logo", "Service details"];
}

function clientTasksFor(contentType: string) {
  if (isVideoType(contentType)) return ["Record doctor video", "Confirm medical accuracy", "Approve final caption"];
  if (isCarouselType(contentType)) return ["Approve slide copy", "Share clinic image if needed", "Confirm medical accuracy"];
  return ["Confirm service details", "Approve final copy"];
}

function internalTasksFor(contentType: string) {
  if (isVideoType(contentType)) return ["Edit video with subtitles", "Add clinic visuals and logo", "Finalize caption and hashtags", "Run approval check", "Schedule post"];
  if (isCarouselType(contentType)) return ["Design carousel", "Finalize caption and hashtags", "Run approval check", "Schedule post"];
  return ["Prepare creative", "Finalize copy", "Run approval check", "Schedule post"];
}

function approvalChecklistFor(contentType: string) {
  const base = ["Medical accuracy confirmed", "No guaranteed-cure or emergency claim", "Patient action is appointment-oriented", "Clinic branding is correct"];
  if (isVideoType(contentType)) return [...base, "Doctor lines approved", "Subtitles checked"];
  if (isCarouselType(contentType)) return [...base, "Slide copy checked", "Design is readable on mobile"];
  return base;
}

function medicalSafetyNoteFor(topic: string) {
  return `Avoid claiming guaranteed cure for ${topic.toLowerCase()}. Keep language educational and encourage consultation for persistent, worsening, or recurring symptoms.`;
}

function openingLineFor(topic: string) {
  const lower = topic.toLowerCase();
  if (lower.includes("monsoon") && lower.includes("ear")) {
    return "During the rainy season, ear pain, blockage, itching, or discharge can become more common.";
  }
  if (lower.includes("monsoon") && lower.includes("allergy")) {
    return "If you are sneezing often, having nasal blockage, or feeling throat irritation during the rainy season, allergies may be one reason.";
  }
  if (lower.includes("rainy") && lower.includes("throat")) {
    return "A scratchy throat, repeated throat clearing, or irritation can become more common during rainy weather.";
  }
  if (lower.includes("hearing")) {
    return "If someone in your family is missing sounds or asking people to repeat often, it may be time to check their hearing.";
  }
  return "If symptoms keep returning or start affecting daily comfort, it is better to get them checked early.";
}

function problemLineFor(topic: string) {
  const lower = topic.toLowerCase();
  if (lower.includes("ear")) return "Moisture, water exposure, and unsafe ear cleaning can increase the risk of ear discomfort or infection.";
  if (lower.includes("allergy")) return "Weather changes, dust, dampness, and allergens can trigger sneezing, blockage, throat irritation, or cough.";
  if (lower.includes("throat")) return "Rainy weather, post-nasal drip, infection, or voice strain can make throat irritation worse.";
  if (lower.includes("hearing")) return "Hearing changes are often ignored until they affect conversations, work, or family life.";
  return "Small symptoms can become harder to manage when patients delay care or try random remedies.";
}

function serviceCategoryFor(topic: string) {
  const lower = topic.toLowerCase();
  if (isGeriatricContext("", topic)) return "Geriatric consultation";
  if (lower.includes("hearing")) return "Hearing evaluation";
  if (lower.includes("ear")) return "ENT consultation";
  if (lower.includes("sinus") || lower.includes("allergy") || lower.includes("throat")) return "ENT and allergy care";
  return "ENT consultation";
}

function isGeriatricContext(clientName: string, topic = "") {
  const text = `${clientName} ${topic}`.toLowerCase();
  return /aayu|geriatric|elderly|senior|caregiver|fall|falls|medicine|memory|parent/.test(text);
}

function displayPlatform(platform: string) {
  const normalized = platform.toUpperCase();
  if (normalized === "INSTAGRAM") return "Instagram";
  if (normalized === "FACEBOOK") return "Facebook";
  if (normalized === "GBP") return "Google Business Profile";
  if (normalized === "WHATSAPP") return "WhatsApp";
  if (normalized === "YOUTUBE") return "YouTube";
  if (normalized === "LINKEDIN") return "LinkedIn";
  return platform;
}

function isVideoType(contentType: string) {
  return ["REEL", "SHORT", "SHORTS", "VIDEO", "YOUTUBE_SHORT"].includes(contentType.toUpperCase());
}

function isCarouselType(contentType: string) {
  return contentType.toUpperCase() === "CAROUSEL";
}

function isGbpType(platform: string, contentType: string) {
  return platform.toUpperCase() === "GBP" || contentType.toUpperCase() === "GBP_POST";
}

function isWhatsAppType(platform: string, contentType: string) {
  return platform.toUpperCase() === "WHATSAPP" || contentType.toUpperCase() === "WHATSAPP";
}

function isBlogType(contentType: string) {
  return ["BLOG", "ARTICLE"].includes(contentType.toUpperCase());
}

function readableDate(value: string, format: "compact" | "short" | "long") {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (format === "compact") {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  }

  if (format === "short") {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function readableRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const startDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate);

  return `${startDay}–${endLabel}`;
}
