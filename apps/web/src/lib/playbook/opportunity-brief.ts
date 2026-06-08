import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { evidenceSources, hospitalProfile, officialDemographicBaseline, type PlaybookEvent } from "@/lib/playbook/harika-playbook";
import type { ProductExperience } from "@/lib/product-experience";
import { executeTrackedAI } from "@/lib/ai-audit";

const OpportunityBriefSchema = z.object({
  executiveSummary: z.string(),
  recommendation: z.object({
    decision: z.string(),
    strategicFit: z.string(),
    businessObjective: z.string(),
  }),
  audienceAnalysis: z.array(z.object({
    segment: z.string(),
    reason: z.string(),
    adaptation: z.string(),
  })),
  reachRationale: z.array(z.object({
    factor: z.string(),
    evidence: z.string(),
    action: z.string(),
    expectedSignal: z.string(),
  })),
  assetPlan: z.array(z.object({
    format: z.string(),
    channel: z.string(),
    purpose: z.string(),
    concept: z.string(),
    callToAction: z.string(),
    productionNotes: z.string(),
  })),
  executionTimeline: z.array(z.object({
    timing: z.string(),
    owner: z.string(),
    task: z.string(),
    dependency: z.string(),
  })),
  distributionPlan: z.array(z.object({
    channel: z.string(),
    timing: z.string(),
    distributionAction: z.string(),
  })),
  clinicalSafetyChecklist: z.array(z.string()),
  measurementPlan: z.array(z.object({
    metric: z.string(),
    baseline: z.string(),
    successDirection: z.string(),
    decisionRule: z.string(),
  })),
  risksAndLimits: z.array(z.string()),
  businessNextMoves: z.array(z.string()),
});

export type OpportunityBrief = z.infer<typeof OpportunityBriefSchema>;

export type GeneratedOpportunityBrief = {
  brief: OpportunityBrief;
  generatedBy: "OpenAI" | "Evidence-backed fallback";
  model?: string;
  note: string;
};

export async function generateOpportunityBrief(event: PlaybookEvent, experience: ProductExperience): Promise<GeneratedOpportunityBrief> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_PLANNING_MODEL ?? "gpt-5.5";
  if (!apiKey) return getBaselineOpportunityBrief(event, experience, "OPENAI_API_KEY is not configured; displaying the complete rule-based planning brief.");

  try {
    const client = new OpenAI({ apiKey, timeout: 120000, maxRetries: 0 });
    const response = await executeTrackedAI({
      feature:"playbook.opportunity-brief",
      provider:"openai",
      model,
      operation:()=>client.responses.parse({
      model,
      reasoning: { effort: "medium" },
      store: false,
      instructions: [
        "You are the senior healthcare growth strategist for a multi-tenant hospital intelligence product.",
        "Create a complete, operational A-to-Z campaign brief for one awareness-day or calendar opportunity.",
        "Use only the supplied facts as measured evidence. Do not invent hospital services, demographic precision, results, partnerships or patient claims.",
        "Never promise increased reach. Explain testable reasons an action may improve discoverability, engagement or qualified inquiries, with metrics.",
        "For clinical topics, keep language educational and direct diagnosis, screening or treatment statements to doctor approval.",
        "If the event is weakly relevant to ENT, recommend a low-effort or no-post decision plainly.",
        "Demographic figures are dated context, and social analytics remain channel evidence until tenant mapping is verified.",
      ].join(" "),
      input: JSON.stringify(contextFor(event, experience)),
      text: { format: zodTextFormat(OpportunityBriefSchema, "opportunity_action_plan") },
      })
    });
    if (!response.output_parsed) throw new Error("The model did not return a structured opportunity brief.");
    return {
      brief: response.output_parsed,
      generatedBy: "OpenAI",
      model,
      note: "Generated from supplied tenant, official-source and measured-channel context. Clinical review is still required before publication.",
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "OpenAI generation was unavailable.";
    return getBaselineOpportunityBrief(event, experience, `AI generation unavailable (${reason}). Displaying the complete evidence-backed planning brief.`);
  }
}

function contextFor(event: PlaybookEvent, experience: ProductExperience) {
  const analytics = experience.analytics;
  const bestFormat = analytics?.contentTypeBreakdown.formats.slice().sort((left, right) => right.avgEngagementRate - left.avgEngagementRate)[0];
  const bestWindow = analytics?.bestPostingTimes[0];
  return {
    tenant: {
      name: hospitalProfile.name,
      specialty: hospitalProfile.specialty,
      centres: hospitalProfile.locations.map((location) => location.name),
      languages: hospitalProfile.languages,
      channels: hospitalProfile.channels,
      governance: hospitalProfile.governance,
    },
    opportunity: {
      name: event.name,
      date: event.date,
      type: event.type,
      relevance: event.relevance,
      officialBasis: event.officialBasis,
      sources: evidenceSources.filter((source) => event.sourceIds.includes(source.id)).map((source) => ({
        publisher: source.publisher,
        title: source.title,
        url: source.url,
      })),
    },
    demographics: {
      classification: "Official district-level baseline, Census 2011; not real-time targeting data.",
      metrics: officialDemographicBaseline,
      languagePlan: "English master content may be adapted into Telugu and Hindi only after clinical meaning is approved.",
    },
    measuredChannelEvidence: analytics ? {
      provenance: `${experience.workspaceName}; do not attribute to tenant until mapping is confirmed.`,
      updatedThrough: experience.lastMeasuredAt,
      totalPosts: analytics.totalPosts,
      totalReach: analytics.totalReach,
      averageEngagementRate: analytics.avgEngagementRate,
      trend: analytics.engagementTrend,
      bestObservedFormat: bestFormat,
      bestObservedPublishingWindow: bestWindow,
    } : {
      provenance: "No measured social evidence currently available.",
    },
    requiredOutput: "A-to-Z practical plan including decision, formats, copy concept, distribution, task ownership, approvals, reach rationale, measurement, risks and subsequent business actions.",
  };
}

export function getBaselineOpportunityBrief(event: PlaybookEvent, experience: ProductExperience, note = "Complete evidence-backed baseline plan. Generate with GPT-5.5 to produce a richer brief from the same verified inputs."): GeneratedOpportunityBrief {
  const analytics = experience.analytics;
  const measuredBaseline = analytics
    ? `${analytics.avgEngagementRate.toFixed(2)}% average engagement and ${new Intl.NumberFormat("en-IN").format(analytics.totalReach)} recorded reach across ${analytics.totalPosts} stored Instagram posts`
    : "Baseline to be established after a verified channel is connected";
  const isCancerDay = event.slug === "world-cancer-day-2027";
  const clinicalAngle = isCancerDay
    ? "Use prevention-oriented education about tobacco risk and persistent throat or voice concerns; do not present the hospital as an oncology service."
    : event.relevance;
  return {
    generatedBy: "Evidence-backed fallback",
    note,
    brief: {
      executiveSummary: `${event.name} is an evidence-linked opportunity for ${hospitalProfile.name}. ${clinicalAngle} The campaign should move from official reference to clinical approval, publication and measured learning.`,
      recommendation: {
        decision: isCancerDay ? "Prepare a clinically reviewed awareness micro-campaign." : "Prepare a focused, clinically reviewed content brief.",
        strategicFit: clinicalAngle,
        businessObjective: "Increase trustworthy local discovery and qualified patient questions while preserving clinical credibility.",
      },
      audienceAnalysis: [
        { segment: "Hyderabad patients and caregivers", reason: "The tenant provides ENT care across verified Hyderabad centres.", adaptation: "Use clear English master copy, local contact access and one action-oriented consultation prompt." },
        { segment: "Telugu and Hindi readers", reason: "The client intends language-accessible communication; district demographics are contextual rather than targeting proof.", adaptation: "Adapt approved meaning into Telugu and Hindi after doctor review." },
        { segment: "People seeking preventive information", reason: event.officialBasis, adaptation: "Offer education and appropriate consultation guidance without diagnostic promises." },
      ],
      reachRationale: [
        { factor: "Timely relevance", evidence: event.officialBasis, action: "Publish a sourced education asset around the official date.", expectedSignal: "Compare saves, shares and profile actions against ordinary education content." },
        { factor: "Measured content learning", evidence: measuredBaseline, action: "Use the highest-response observed format and test the next approved topic.", expectedSignal: "Observe engagement rate and qualified inquiry change; do not assume causation." },
        { factor: "Local access clarity", evidence: "Three official centres are represented in the tenant profile.", action: "Include verified centre/contact route in the final approved call to action.", expectedSignal: "Track direction, call or enquiry actions when listing instrumentation is restored." },
      ],
      assetPlan: [
        { format: "Doctor-led short reel", channel: "Instagram / YouTube Short", purpose: "Human, credible awareness explanation", concept: clinicalAngle, callToAction: "Seek qualified medical guidance for persistent concerns.", productionNotes: "Record in clinic setting; add subtitles; doctor approves spoken and on-screen text." },
        { format: "Five-panel carousel", channel: "Instagram / Facebook", purpose: "Saveable educational summary", concept: `What ${event.name} means for safe ENT awareness`, callToAction: "Save the information and contact the clinic for appropriate ENT guidance.", productionNotes: "Cite the official campaign source; avoid prevalence or outcome claims." },
        { format: "Patient-access update", channel: "Google Business Profile / WhatsApp", purpose: "Convert awareness into practical access", concept: "Verified centre details and consultation access", callToAction: "Use the verified clinic contact information.", productionNotes: "Release only once GBP access and clinic facts are verified." },
      ],
      executionTimeline: [
        { timing: "14-10 days before", owner: "Strategist", task: "Confirm official campaign source, objective, channels and measurements.", dependency: "Official event reference attached." },
        { timing: "9-7 days before", owner: "Production", task: "Draft reel script, carousel and access message.", dependency: "Tenant facts and language plan confirmed." },
        { timing: "6-4 days before", owner: "Clinical reviewer", task: "Approve medical phrasing, risk statements and call to action.", dependency: "All draft copy complete." },
        { timing: "3-1 days before", owner: "Publisher", task: "Schedule approved content in measured window and verify links.", dependency: "Approval and connector availability." },
        { timing: "1-7 days after", owner: "Analyst", task: "Report reach, engagement, saves and inquiry signals against baseline.", dependency: "Published assets and measured data." },
      ],
      distributionPlan: [
        { channel: "Instagram", timing: "Official-date campaign window", distributionAction: "Publish the hero educational asset and answer comments with approved non-diagnostic guidance." },
        { channel: "WhatsApp", timing: "After master content approval", distributionAction: "Share concise patient education only through consented communication routes." },
        { channel: "Google Business Profile", timing: "When GBP authorization is restored", distributionAction: "Publish verified access information rather than medical claims." },
      ],
      clinicalSafetyChecklist: [
        "Attach the official event source to the brief before clinical approval.",
        "Do not diagnose, promise outcomes or claim specialist oncology services unless verified.",
        "Doctor-review all symptom, prevention and referral language before public release.",
        "Do not use patient stories, images or testimonials without documented consent.",
        "Translate only the approved clinical meaning and verify contact details before publication.",
      ],
      measurementPlan: [
        { metric: "Instagram engagement rate", baseline: measuredBaseline, successDirection: "Improve or sustain response with responsible education.", decisionRule: "Repeat the format only if engagement and clinical quality remain acceptable." },
        { metric: "Saves and shares", baseline: "Capture from published asset analytics.", successDirection: "Increase useful-information interactions.", decisionRule: "Use high save/share topics for the next reviewed education brief." },
        { metric: "Qualified inquiries and location actions", baseline: "Requires restored GBP or website attribution.", successDirection: "Increase appropriate patient-access actions.", decisionRule: "Do not claim business impact until attribution is connected." },
      ],
      risksAndLimits: [
        "Census 2011 data provides regional context, not current individual targeting.",
        "Stored Instagram measurements cannot be called tenant outcomes until account mapping is confirmed.",
        "GBP measurement is unavailable until OAuth authorization is restored.",
        "A health-day post is not proof of reach or revenue growth; publish, measure and learn.",
      ],
      businessNextMoves: [
        "Restore Google Business Profile authorization so location actions and reviews become measurable.",
        "Confirm Meta account ownership mapping to the current tenant before performance attribution.",
        "Set up inquiry attribution for calls, WhatsApp and appointment forms.",
        "Convert successful approved formats into a repeatable tenant-level content playbook.",
      ],
    },
  };
}
