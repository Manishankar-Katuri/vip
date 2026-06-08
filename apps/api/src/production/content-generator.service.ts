import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentCalendarCategory,
  ContentCalendarPriority,
  ContentCalendarStatus,
  ContentCalendarType,
  ContentScriptStatus,
  ContentScriptType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ContentGenerationService } from './generation/content-generation.service';
import type { ScriptGenerationInput } from './generation/ai-content-provider';
import { SCRIPT_TEMPLATES } from './script-studio.service';

const ACTIVE_STRATEGY_THEMES = [
  {
    key: 'doctor-authority',
    title: 'Doctor-led ENT education',
    rationale:
      'Use expert explanation to build trust without overpromising outcomes.',
  },
  {
    key: 'seasonal-care',
    title: 'Seasonal and practical care',
    rationale:
      'Tie posts to timely Hyderabad family concerns where the advice remains general and safe.',
  },
  {
    key: 'local-access',
    title: 'Verified local access',
    rationale:
      'Use Google Business Profile and simple CTAs for accurate centre, contact and appointment information.',
  },
  {
    key: 'community-follow-through',
    title: 'WhatsApp patient-community education',
    rationale:
      'Move approved master copy into consent-based sharing and route medical questions to consultation.',
  },
] as const;

const SOURCE_REFERENCES = [
  {
    publisher: 'Federal Trade Commission',
    title: 'Health Products Compliance Guidance',
    url: 'https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance',
    use: 'Health claims should be truthful, non-misleading and supported by appropriate evidence.',
  },
  {
    publisher: 'YouTube Help',
    title: 'Medical misinformation policy',
    url: 'https://support.google.com/youtube/answer/13813322',
    use: 'Video scripts should not contradict local health authority guidance or spread medical misinformation.',
  },
  {
    publisher: 'Google Business Profile Help',
    title: 'Business Profile photos, videos and posts policy',
    url: 'https://support.google.com/business/answer/7213077',
    use: 'GBP updates must use verified business facts and compliant post content.',
  },
  {
    publisher: 'World Health Organization',
    title: 'Communicating for health',
    url: 'https://www.who.int/communicating-for-health/en/',
    use: 'Health communication should be actionable, accessible, relevant, timely, understandable and credible.',
  },
] as const;

export type GeneratorInput = {
  idea?: unknown;
  platform?: unknown;
  format?: unknown;
  audience?: unknown;
  objective?: unknown;
  doctorName?: unknown;
  serviceLine?: unknown;
  languagePlan?: unknown;
  urgency?: unknown;
  requestType?: unknown;
  desiredPublishDate?: unknown;
  tone?: unknown;
};

export type PromoteInput = {
  createCalendarItem?: unknown;
  createScript?: unknown;
  reject?: unknown;
  rejectionReason?: unknown;
};

type GeneratedOutput = {
  title: string;
  hook: string;
  hookOptions: string[];
  script: string;
  caption: string;
  cta: string;
  ctaVariants: string[];
  hashtags: string[];
  productionNotes: string[];
  measurementTargets: string[];
  approvalChecklist: string[];
};

@Injectable()
export class ContentGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: ContentGenerationService,
  ) {}

  async getWorkspace(hospitalId: string) {
    const [brandVoice, recentCalendarItems, recentRuns] = await Promise.all([
      this.prisma.brandVoice.findUnique({
        where: { hospitalId },
        select: {
          tone: true,
          style: true,
          audience: true,
          messaging: true,
        },
      }),
      this.prisma.contentCalendarItem.findMany({
        where: {
          hospitalId,
          deletedAt: null,
        },
        orderBy: { scheduledDate: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          status: true,
          category: true,
          contentType: true,
        },
      }),
      this.prisma.contentGeneratorRun.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    return {
      brandVoice,
      activeStrategyThemes: ACTIVE_STRATEGY_THEMES,
      templates: SCRIPT_TEMPLATES.map((template) => ({
        id: template.id,
        title: template.title,
        goal: template.goal,
        tone: template.tone,
        format: String(template.scriptType),
      })),
      recentCalendarItems: recentCalendarItems.map((item) => ({
        ...item,
        scheduledDate: item.scheduledDate.toISOString(),
      })),
      sourceReferences: SOURCE_REFERENCES,
      recentRuns: recentRuns.map(serializeRun),
    };
  }

  async generate(hospitalId: string, actorId: string, input: GeneratorInput) {
    const idea = requiredString(input.idea, 'idea');
    const platform = cleanString(input.platform) || 'Instagram';
    const format = cleanString(input.format) || 'Reel';
    const audience = cleanString(input.audience);
    const objective =
      cleanString(input.objective) || 'Create useful patient-facing content.';
    const requestType = cleanString(input.requestType) || 'outside_strategy';
    const contentPillar = inferContentPillar(
      `${idea} ${objective} ${format} ${requestType}`,
    );
    const strategyFit = inferStrategyFit(
      `${idea} ${objective} ${requestType}`,
      contentPillar,
    );
    const safetyNotes = safetyNotesFor(`${idea} ${objective}`, platform);
    const [hospital, brandVoice, calendarItems] = await Promise.all([
      this.prisma.hospitalWorkspace.findUniqueOrThrow({
        where: { id: hospitalId },
        select: {
          name: true,
          specialty: true,
          city: true,
        },
      }),
      this.prisma.brandVoice.findUnique({
        where: { hospitalId },
        select: {
          tone: true,
          style: true,
          audience: true,
          messaging: true,
        },
      }),
      this.prisma.contentCalendarItem.findMany({
        where: {
          hospitalId,
          deletedAt: null,
        },
        orderBy: { scheduledDate: 'desc' },
        take: 6,
        select: {
          title: true,
          scheduledDate: true,
          status: true,
          category: true,
        },
      }),
    ]);
    const generationInput: ScriptGenerationInput = {
      hospital,
      brandVoice,
      doctorName: cleanString(input.doctorName) || null,
      targetAudience:
        audience || brandVoice?.audience || 'patients and families',
      contentCategory: contentPillar,
      contentType: format,
      goal: objective,
      tone:
        cleanString(input.tone) ||
        brandVoice?.tone ||
        'clear, warm and credible',
      title: titleFromIdea(idea),
      description: idea,
    };
    const [generated, hookOptions, ctaVariants] = await Promise.all([
      this.generation.generateScript(generationInput),
      this.generation.generateHooks(generationInput),
      this.generation.generateCTAs(generationInput),
    ]);
    const output: GeneratedOutput = {
      title: generationInput.title,
      hook: generated.hook,
      hookOptions,
      script: generated.script,
      caption: generated.caption,
      cta: generated.cta,
      ctaVariants,
      hashtags: generated.hashtags,
      productionNotes: productionNotesFor(platform, format),
      measurementTargets: measurementTargetsFor(platform, format),
      approvalChecklist: approvalChecklistFor(platform),
    };
    const generatedContext = {
      strategyFit,
      contentPillar,
      whyThisCanWork: whyThisCanWork(
        strategyFit,
        contentPillar,
        platform,
        format,
      ),
      calendarContext: calendarGapSummary(calendarItems),
      requiresClinicalReview: true,
    };
    const run = await this.prisma.contentGeneratorRun.create({
      data: {
        hospitalId,
        createdBy: actorId,
        idea,
        platform,
        format,
        audience,
        objective,
        doctorName: nullableString(input.doctorName),
        serviceLine: nullableString(input.serviceLine),
        languagePlan: cleanString(input.languagePlan),
        urgency: cleanString(input.urgency) || 'normal',
        requestType,
        desiredPublishDate: optionalDate(input.desiredPublishDate),
        strategyFit,
        contentPillar,
        generatedContext,
        evidence: evidenceFor(brandVoice, calendarItems, platform),
        safetyNotes,
        output,
        status: 'DRAFT',
      },
    });

    return serializeRun(run);
  }

  async promote(
    hospitalId: string,
    actorId: string,
    id: string,
    input: PromoteInput,
  ) {
    const run = await this.prisma.contentGeneratorRun.findFirst({
      where: {
        id,
        hospitalId,
      },
    });

    if (!run) {
      throw new NotFoundException('Content generator run not found');
    }

    if (input.reject) {
      const rejected = await this.prisma.contentGeneratorRun.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason:
            cleanString(input.rejectionReason) ||
            'Rejected by production review.',
        },
      });

      return serializeRun(rejected);
    }

    const shouldCreateCalendarItem = input.createCalendarItem !== false;
    const shouldCreateScript = Boolean(input.createScript);

    if (!shouldCreateCalendarItem && !shouldCreateScript) {
      const draft = await this.prisma.contentGeneratorRun.update({
        where: { id },
        data: { status: 'DRAFT' },
      });

      return serializeRun(draft);
    }

    const output = parseOutput(run.output);
    const scheduledDate = run.desiredPublishDate ?? new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      let calendarItemId = run.calendarItemId;
      let scriptId = run.scriptId;

      if (shouldCreateCalendarItem && !calendarItemId) {
        const calendarItem = await tx.contentCalendarItem.create({
          data: {
            hospitalId,
            createdBy: actorId,
            title: output.title || titleFromIdea(run.idea),
            description: strategyBriefFor(run),
            contentType: contentTypeFor(run.platform, run.format),
            category: categoryFor(run.contentPillar),
            status: shouldCreateScript
              ? ContentCalendarStatus.SCRIPT_READY
              : ContentCalendarStatus.IDEA,
            priority:
              run.urgency === 'urgent'
                ? ContentCalendarPriority.HIGH
                : ContentCalendarPriority.MEDIUM,
            scheduledDate,
            tags: ['content-generator', run.strategyFit, 'clinical-review'],
            isSpecialDay: run.requestType === 'special_day',
            specialDayName:
              run.requestType === 'special_day'
                ? output.title || titleFromIdea(run.idea)
                : null,
          },
        });
        calendarItemId = calendarItem.id;
      }

      if (shouldCreateScript) {
        if (!calendarItemId) {
          throw new BadRequestException(
            'Calendar item is required before creating a script',
          );
        }

        const latest = await tx.contentCalendarScript.findFirst({
          where: { calendarItemId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const script = await tx.contentCalendarScript.create({
          data: {
            hospitalId,
            calendarItemId,
            createdBy: actorId,
            title: output.title || titleFromIdea(run.idea),
            scriptType: scriptTypeFor(run.platform, run.format),
            status: ContentScriptStatus.DRAFT,
            hook: output.hook || '',
            script: output.script || '',
            caption: output.caption || '',
            cta: output.cta || '',
            hashtags: output.hashtags ?? [],
            metadata: {
              source: 'content-generator',
              generatorRunId: run.id,
              strategyFit: run.strategyFit,
              contentPillar: run.contentPillar,
              safetyNotes: run.safetyNotes,
            },
            version: (latest?.version ?? 0) + 1,
          },
        });
        scriptId = script.id;

        await tx.contentCalendarItem.update({
          where: { id: calendarItemId },
          data: { status: ContentCalendarStatus.SCRIPT_READY },
        });
      }

      return tx.contentGeneratorRun.update({
        where: { id },
        data: {
          status: shouldCreateScript
            ? 'PROMOTED_TO_SCRIPT'
            : 'PROMOTED_TO_CALENDAR',
          calendarItemId,
          scriptId,
        },
      });
    });

    return serializeRun(result);
  }
}

function requiredString(value: unknown, field: string) {
  const text = cleanString(value);
  if (!text) {
    throw new BadRequestException(`${field} is required`);
  }

  return text;
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown) {
  const text = cleanString(value);
  return text || null;
}

function optionalDate(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('desiredPublishDate is invalid');
  }

  return date;
}

function titleFromIdea(idea: string) {
  const sentence = idea.split(/[.!?]/)[0]?.trim() || idea;
  return sentence.length > 84 ? `${sentence.slice(0, 81)}...` : sentence;
}

function inferContentPillar(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('doctor') || normalized.includes('expert'))
    return 'doctor_branding';
  if (
    normalized.includes('season') ||
    normalized.includes('monsoon') ||
    normalized.includes('weather')
  )
    return 'seasonal';
  if (
    normalized.includes('offer') ||
    normalized.includes('appointment') ||
    normalized.includes('book')
  )
    return 'promotional';
  if (
    normalized.includes('patient story') ||
    normalized.includes('testimonial')
  )
    return 'patient_story';
  if (normalized.includes('trend') || normalized.includes('viral'))
    return 'trending';
  if (normalized.includes('awareness') || normalized.includes('day'))
    return 'awareness';
  return 'education';
}

function inferStrategyFit(text: string, pillar: string) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes('outside') ||
    normalized.includes('urgent') ||
    normalized.includes('trend')
  )
    return 'Outside current strategy';
  if (
    ['education', 'awareness', 'doctor_branding', 'seasonal'].includes(pillar)
  )
    return 'Aligned';
  return 'Adjacent';
}

function safetyNotesFor(text: string, platform: string) {
  const normalized = text.toLowerCase();
  const notes = [
    'Clinical review is required before publishing.',
    'Avoid diagnosis, guaranteed outcomes, superiority claims and treatment promises.',
  ];
  const riskyPatterns = [
    ['diagnose', 'Do not diagnose a patient from social content.'],
    [
      'cure',
      'Replace cure language with general education and consultation guidance.',
    ],
    ['guarantee', 'Remove guaranteed outcome wording.'],
    ['testimonial', 'Use testimonials only with valid permission and review.'],
    [
      'patient photo',
      'Do not use patient-identifying media without valid permission.',
    ],
    [
      'before after',
      'Before/after framing needs strict review and substantiation.',
    ],
  ];

  riskyPatterns.forEach(([pattern, note]) => {
    if (normalized.includes(pattern)) notes.push(note);
  });

  if (platform.toLowerCase().includes('youtube')) {
    notes.push(
      'Check YouTube medical misinformation policy before publishing video content.',
    );
  }

  if (platform.toLowerCase().includes('google')) {
    notes.push(
      'Use verified business facts and compliant Google Business Profile post wording.',
    );
  }

  return Array.from(new Set(notes));
}

function evidenceFor(
  brandVoice: {
    tone: string;
    style: string;
    audience: string;
    messaging: string;
  } | null,
  calendarItems: Array<{
    title: string;
    scheduledDate: Date;
    status: ContentCalendarStatus;
    category: ContentCalendarCategory;
  }>,
  platform: string,
) {
  return [
    {
      label: 'Hospital brand voice',
      detail: brandVoice
        ? `${brandVoice.tone || 'Configured tone'} / ${brandVoice.audience || 'patient audience'}`
        : 'Brand voice is not configured yet; generator uses safe healthcare defaults.',
    },
    {
      label: 'Current strategy themes',
      detail: ACTIVE_STRATEGY_THEMES.map((theme) => theme.title).join(', '),
    },
    {
      label: 'Calendar context',
      detail: calendarGapSummary(calendarItems),
    },
    {
      label: 'Platform policy',
      detail: policySummaryFor(platform),
    },
    {
      label: 'Credible source baseline',
      detail:
        'FTC, WHO, YouTube and Google Business Profile references are attached for review.',
    },
  ];
}

function calendarGapSummary(
  items: Array<{
    scheduledDate: Date;
    status: ContentCalendarStatus;
  }>,
) {
  if (items.length === 0) {
    return 'No active calendar items found; treat this as a new production idea.';
  }

  const activeCount = items.filter(
    (item) => item.status !== ContentCalendarStatus.CANCELLED,
  ).length;

  return `${activeCount} recent active calendar items considered for conflict and gap awareness.`;
}

function policySummaryFor(platform: string) {
  if (platform.toLowerCase().includes('youtube')) {
    return 'Video health guidance must avoid medical misinformation and stay aligned with qualified clinical review.';
  }

  if (platform.toLowerCase().includes('google')) {
    return 'GBP posts should use verified location, access and health-awareness information.';
  }

  if (platform.toLowerCase().includes('whatsapp')) {
    return 'WhatsApp is consent-based follow-through; route medical questions to consultation.';
  }

  return 'Social posts should be factual, non-diagnostic and reviewable before publishing.';
}

function whyThisCanWork(
  strategyFit: string,
  pillar: string,
  platform: string,
  format: string,
) {
  return `${strategyFit} idea mapped to ${pillar.replaceAll('_', ' ')} for ${platform} ${format}. The output keeps the idea usable while preserving clinical review, evidence labels and measurement targets.`;
}

function productionNotesFor(platform: string, format: string) {
  return [
    `Prepare the asset as a ${platform} ${format} with readable subtitles or slide text.`,
    'Use original hospital-created visuals or approved design assets.',
    'Keep the doctor or hospital voice human, calm and specific.',
    'Do not add patient media, testimonials or medical claims during editing without review.',
  ];
}

function measurementTargetsFor(platform: string, format: string) {
  if (platform.toLowerCase().includes('google')) {
    return [
      'Profile views',
      'Website clicks',
      'Calls or direction requests',
      'Post interaction after publishing',
    ];
  }

  if (platform.toLowerCase().includes('whatsapp')) {
    return [
      'Delivered approved messages',
      'Qualified responses',
      'Consultation-route escalations',
    ];
  }

  if (
    format.toLowerCase().includes('reel') ||
    format.toLowerCase().includes('short')
  ) {
    return [
      'Accounts reached',
      'Average watch time',
      'Saves and shares',
      'Profile actions',
    ];
  }

  return ['Reach', 'Saves', 'Shares', 'Qualified inquiries'];
}

function approvalChecklistFor(platform: string) {
  return [
    'Clinical accuracy reviewed by an approved doctor or reviewer.',
    'No diagnosis, fear-based claim, guaranteed result or unsupported superiority claim.',
    'No patient identity, record, image or testimonial without valid permission.',
    `Platform-specific policy checked for ${platform}.`,
  ];
}

function contentTypeFor(platform: string, format: string) {
  const value = `${platform} ${format}`.toLowerCase();
  if (value.includes('reel')) return ContentCalendarType.REEL;
  if (value.includes('carousel')) return ContentCalendarType.CAROUSEL;
  if (value.includes('story')) return ContentCalendarType.STORY;
  if (value.includes('youtube') || value.includes('short'))
    return ContentCalendarType.YOUTUBE_SHORT;
  if (value.includes('blog')) return ContentCalendarType.BLOG;
  return ContentCalendarType.POST;
}

function categoryFor(pillar: string) {
  if (pillar === 'awareness') return ContentCalendarCategory.AWARENESS;
  if (pillar === 'promotional') return ContentCalendarCategory.PROMOTIONAL;
  if (pillar === 'patient_story') return ContentCalendarCategory.PATIENT_STORY;
  if (pillar === 'doctor_branding')
    return ContentCalendarCategory.DOCTOR_BRANDING;
  if (pillar === 'seasonal') return ContentCalendarCategory.SEASONAL;
  if (pillar === 'trending') return ContentCalendarCategory.TRENDING;
  return ContentCalendarCategory.EDUCATIONAL;
}

function scriptTypeFor(platform: string, format: string) {
  const contentType = contentTypeFor(platform, format);
  if (contentType === ContentCalendarType.REEL) return ContentScriptType.REEL;
  if (contentType === ContentCalendarType.CAROUSEL)
    return ContentScriptType.CAROUSEL;
  if (contentType === ContentCalendarType.YOUTUBE_SHORT)
    return ContentScriptType.SHORT_VIDEO;
  return ContentScriptType.POST;
}

function parseOutput(value: Prisma.JsonValue): GeneratedOutput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return emptyOutput();
  }

  return {
    ...emptyOutput(),
    ...(value as Partial<GeneratedOutput>),
  };
}

function emptyOutput(): GeneratedOutput {
  return {
    title: '',
    hook: '',
    hookOptions: [],
    script: '',
    caption: '',
    cta: '',
    ctaVariants: [],
    hashtags: [],
    productionNotes: [],
    measurementTargets: [],
    approvalChecklist: [],
  };
}

function strategyBriefFor(run: {
  idea: string;
  strategyFit: string;
  contentPillar: string;
  generatedContext: Prisma.JsonValue;
}) {
  const context =
    run.generatedContext &&
    typeof run.generatedContext === 'object' &&
    !Array.isArray(run.generatedContext)
      ? (run.generatedContext as Record<string, unknown>)
      : {};
  const rationale =
    typeof context.whyThisCanWork === 'string'
      ? context.whyThisCanWork
      : 'Generated as an off-strategy production idea requiring review.';

  return [
    run.idea,
    '',
    `Strategy fit: ${run.strategyFit}`,
    `Content pillar: ${run.contentPillar.replaceAll('_', ' ')}`,
    `AI rationale: ${rationale}`,
  ].join('\n');
}

function serializeRun(
  run: Prisma.ContentGeneratorRunGetPayload<Record<string, never>>,
) {
  return {
    ...run,
    desiredPublishDate: run.desiredPublishDate?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
