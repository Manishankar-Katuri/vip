export type EditorialPlatform = "Instagram" | "Facebook" | "Google Business Profile" | "YouTube" | "WhatsApp";

export type ScriptBeat = {
  scene: string;
  duration: string;
  speaker: string;
  dialogue: string;
  shot: string;
  onScreenText: string;
  direction: string;
};

export type EditorialBrief = {
  id: string;
  day: number;
  date: string;
  platform: EditorialPlatform;
  format: string;
  topic: string;
  shortLabel: string;
  pillar: string;
  objective: string;
  channelRole: string;
  impactHypothesis: string;
  intelligenceBasis: string[];
  followThrough: string;
  audience: string;
  language: string;
  recommendedTime: string;
  timeConfidence: number;
  timeEvidence: string;
  timeSource: "measured" | "benchmark";
  reason: string[];
  hook: string;
  keyPoints: string[];
  script: ScriptBeat[];
  caption: string;
  hashtags: string[];
  callToAction: string;
  productionNotes: string[];
  approvalChecks: string[];
  measurement: string[];
  status: "AI draft" | "Evidence linked" | "Clinical review priority";
};

export type EditorialPlan = {
  period: string;
  startsOn: string;
  endsOn: string;
  today: string;
  strategyTitle: string;
  generatedFrom: string[];
  cadence: string;
  recommendedWindow: string;
  intelligenceFlow: string[];
  knowledgeSignals: string[];
  themes: StrategicTheme[];
  channelMix: Array<{ platform: EditorialPlatform; count: number; role: string }>;
  briefs: EditorialBrief[];
  growthPlan: ContentGrowthPlan;
};

export type ContentGrowthPlan = {
  contentHealthScore: ContentHealthScore;
  opportunities: ContentOpportunity[];
  calendarRecommendations: {
    dailyPostingPlan: string;
    weeklyContentMix: Array<{ label: string; count: number; reason: string }>;
    monthlyCampaignThemes: string[];
  };
  contentTypeStrategy: ContentTypeRecommendation[];
  bestPostingTimes: PostingTimeRecommendation[];
  captionRecommendations: CaptionRecommendation[];
  hashtagRecommendations: HashtagRecommendation[];
  competitorContentGaps: CompetitorContentGap[];
  priorityActions: PriorityAction[];
  expectedOutcomes: ExpectedOutcome[];
};

export type ContentHealthScore = {
  score: number;
  label: string;
  benchmarkComparison: string;
  strongReasons: string[];
  weakReasons: string[];
};

export type ContentOpportunity = {
  category: "Missing healthcare topic" | "Missing specialty" | "Seasonal opportunity" | "Local market opportunity";
  title: string;
  action: string;
  evidence: string;
  impact: PriorityImpact;
};

export type ContentTypeRecommendation = {
  type: "Reels" | "Doctor videos" | "Patient stories" | "Educational content" | "Awareness campaigns";
  recommendation: string;
  execution: string;
  cadence: string;
  impact: PriorityImpact;
};

export type PostingTimeRecommendation = {
  platform: EditorialPlatform;
  window: string;
  source: "measured" | "benchmark";
  action: string;
};

export type CaptionRecommendation = {
  style: string;
  example: string;
  cta: string;
  safetyNote: string;
};

export type HashtagRecommendation = {
  tag: string;
  rank: number;
  reason: string;
  risk: "low" | "review";
};

export type CompetitorContentGap = {
  gap: string;
  vipAction: string;
  evidence: string;
  impact: PriorityImpact;
};

export type PriorityAction = {
  impact: PriorityImpact;
  title: string;
  action: string;
  owner: "Doctor" | "Production" | "Staff" | "Admin";
  due: string;
};

export type ExpectedOutcome = {
  metric: "Reach increase" | "Engagement increase" | "Lead increase";
  estimate: string;
  basis: string;
};

export type PriorityImpact = "High Impact" | "Medium Impact" | "Low Impact";

export type ContentIntelligenceInput = {
  hospitalSpecialty: string;
  hospitalPromise: string;
  languages: readonly string[];
  channels: readonly string[];
  locations: readonly string[];
  marketThemes: string[];
  healthcareSignals: string[];
  opportunitySignals: string[];
  audienceSignals: string[];
  recommendations: string[];
};

export type StrategicTheme = {
  key: string;
  title: string;
  score: number;
  rationale: string;
  channels: EditorialPlatform[];
  outcome: string;
};

export type StrategyEvidence = {
  recommendedWindow?: string;
  timingConfidence?: number;
  timingEvidence?: string;
  timingSource?: "measured" | "benchmark";
  platformWindows?: Partial<Record<EditorialPlatform, PlatformTimingEvidence>>;
  timingOptions?: Partial<Record<EditorialPlatform, PlatformTimingEvidence[]>>;
  formatEvidence?: string;
  engagementEvidence?: string;
  audienceEvidence?: string;
  measuredPostCount?: number;
  avgEngagementRate?: number;
  bestFormat?: string;
  topHashtag?: string;
  competitorEvidence?: string[];
};

export type PlatformTimingEvidence = {
  window: string;
  confidence: number;
  evidence: string;
  source: "measured" | "benchmark";
};

type TopicPlan = {
  platform: EditorialPlatform;
  format: string;
  topic: string;
  shortLabel: string;
  pillar: string;
  objective: string;
  strategyKey?: string;
  channelRole?: string;
  impactHypothesis?: string;
  followThrough?: string;
  audience: string;
  language?: string;
  hook: string;
  body: string;
  close: string;
  keyPoints?: string[];
  script?: ScriptBeat[];
  status?: EditorialBrief["status"];
  reason?: string[];
};

export const contentStrategySources = [
  {
    name: "Best times to post on social media in 2026",
    publisher: "Sprout Social",
    url: "https://sproutsocial.com/insights/best-times-to-post-on-social-media/?survey=123",
    use: "Cross-platform benchmark windows and midweek engagement baseline.",
  },
  {
    name: "Best time to post on Instagram: 2026 data from 9.6M posts",
    publisher: "Buffer",
    url: "https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram/",
    use: "Instagram-specific timing benchmark and reminder to validate against account analytics.",
  },
  {
    name: "Best Time to Post on Social Media Tool",
    publisher: "Hootsuite",
    url: "https://www.hootsuite.com/platform/best-time-to-post-on-social-media",
    use: "Methodology reference for preferring recent account performance and audience behavior.",
  },
  {
    name: "Sprout Social Q4 2025 Pulse Survey",
    publisher: "Sprout Social",
    url: "https://media.sproutsocial.com/uploads/2025/11/Sprout-Social-Q4-2025-Pulse-Survey.pdf",
    use: "Consumer preference signal for human-generated content and smaller community spaces.",
  },
  {
    name: "Instagram Professional Dashboard Best Practices",
    publisher: "Meta",
    url: "https://about.fb.com/news/2024/10/best-practices-education-hub-creators-instagram/",
    use: "Creation, reach and engagement optimization reference.",
  },
  {
    name: "Instagram Reel Insights",
    publisher: "Instagram Help Centre",
    url: "https://www.facebook.com/help/instagram/202865988324236?locale=en_GB",
    use: "Watch time, reach, saves, shares and follows measurement.",
  },
  {
    name: "Business Profile Posts",
    publisher: "Google Business Profile Help",
    url: "https://support.google.com/business/answer/7342169?hl=en",
    use: "Google Search and Maps update planning and scheduling.",
  },
  {
    name: "Business Profile prohibited and restricted content",
    publisher: "Google Business Profile Help",
    url: "https://support.google.com/business/answer/7400114",
    use: "Review integrity and restricted medical promotion safeguards.",
  },
  {
    name: "Get started creating YouTube Shorts",
    publisher: "YouTube Help",
    url: "https://support.google.com/youtube/answer/10059070?hl=en",
    use: "Shorts creation and measurement reference for doctor-led short-form explainers.",
  },
  {
    name: "DPDP Rules, 2025 notification",
    publisher: "Press Information Bureau, Government of India",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190655&lang=2&reg=3",
    use: "Indian digital personal data governance context.",
  },
] as const;

const entTopics: TopicPlan[] = [
  {
    platform: "Instagram",
    format: "Reel",
    topic: "Monsoon ENT preparedness: allergies, congestion and safe next steps",
    shortLabel: "Reel: Monsoon ENT care",
    pillar: "Seasonal family readiness",
    strategyKey: "seasonal",
    channelRole: "Public discovery and shareable seasonal education",
    impactHypothesis: "Timely seasonal guidance can earn saves and shares from families preparing for recurring symptoms.",
    followThrough: "Repurpose the approved checklist as a WhatsApp card for consented patient communities.",
    objective: "Become the timely local voice for safe ENT preparation as monsoon symptoms emerge.",
    audience: "Families and working adults in Hyderabad",
    hook: "Monsoon is approaching. Here are three ENT symptoms families commonly prepare for.",
    body: "During monsoon, many people notice blocked nose, allergy flare-ups, or ear discomfort. If symptoms keep coming back, write down when they happen, what triggers them, and how long they last. That helps during a consultation.",
    close: "Do not ignore symptoms that are severe, persistent, or affecting sleep, hearing, or breathing. Save this checklist and share it with your family.",
    status: "Clinical review priority",
  },
  {
    platform: "WhatsApp",
    format: "Shareable care card",
    topic: "Monsoon ENT family checklist in English and Telugu",
    shortLabel: "WhatsApp: Monsoon checklist",
    pillar: "Accessible patient community",
    strategyKey: "whatsapp",
    channelRole: "Trusted, consent-based family distribution",
    impactHypothesis: "Useful bilingual cards can reach caregivers directly and encourage appropriate questions without relying on algorithmic discovery.",
    followThrough: "Track opt-in responses and commonly asked questions to inform the next public explainer.",
    objective: "Translate approved education into a format people can save and forward in family groups.",
    audience: "Consented patient communities and family caregivers",
    language: "Approved English master plus Telugu version",
    hook: "Monsoon ENT checklist: keep this message saved for your family.",
    body: "If someone at home has repeated nasal blockage, ear pain, or allergy symptoms, note the symptom, duration, and trigger. Avoid putting cotton buds, oil, or home tools inside the ear.",
    close: "For symptoms that continue or feel severe, use the hospital's verified contact pathway for guidance.",
  },
  {
    platform: "Instagram",
    format: "Doctor-led Reel",
    topic: "Tobacco and throat health: a responsible awareness conversation",
    shortLabel: "Reel: Throat awareness",
    pillar: "Official prevention moment",
    strategyKey: "tobacco",
    channelRole: "High-trust awareness reach ahead of an official health day",
    impactHypothesis: "A clinician-led preventive message ahead of World No Tobacco Day can increase useful shares and qualified health questions.",
    followThrough: "Publish a concise WhatsApp reminder after approval and a verified Google Business Profile awareness update on May 31.",
    objective: "Use the official public-health moment to deliver careful throat-health awareness without diagnosis claims.",
    audience: "Adults and families seeking preventive health information",
    hook: "Tobacco can affect more than the lungs. Your throat and voice matter too.",
    body: "If a person has a persistent change in voice, throat irritation, difficulty swallowing, or a non-healing mouth ulcer, it should not be brushed aside. Awareness is not a diagnosis, but persistent symptoms deserve a proper clinical evaluation.",
    close: "This World No Tobacco Day, share responsible health information, not fear. Encourage people to seek help early.",
    status: "Evidence linked",
  },
  {
    platform: "WhatsApp",
    format: "Approved awareness message",
    topic: "World No Tobacco Day family-forwardable reminder",
    shortLabel: "WhatsApp: Throat reminder",
    pillar: "Official prevention moment",
    strategyKey: "tobacco",
    channelRole: "Direct community reinforcement after master-copy approval",
    impactHypothesis: "Short, approved messages allow preventive education to travel through trusted family networks.",
    followThrough: "Collect general topic questions only; do not provide diagnosis in replies.",
    objective: "Carry a clinically safe awareness message into consented community channels.",
    audience: "Consented community recipients and caregivers",
    hook: "A gentle World No Tobacco Day reminder for your family.",
    body: "Tobacco exposure can affect oral and throat health. If someone has a persistent voice change, throat discomfort, swallowing difficulty, or a mouth ulcer that is not healing, they should speak to a qualified doctor.",
    close: "Forward awareness, not panic. Use a verified hospital contact route for consultation needs.",
    status: "Evidence linked",
  },
  {
    platform: "Instagram",
    format: "Reel",
    topic: "Ear wax: what not to do at home",
    shortLabel: "Reel: Ear wax safety",
    pillar: "Everyday ENT education",
    strategyKey: "safe-care",
    channelRole: "Evergreen myth correction and saveable education",
    impactHypothesis: "Common safe-care myths remain useful supporting content after higher-priority seasonal and awareness themes.",
    followThrough: "Use only when it supports the balanced monthly pillar mix.",
    objective: "Earn saves and shares with safe, practical ear-care guidance.",
    audience: "Parents and young adults in Hyderabad",
    hook: "Cotton buds can push wax deeper. Here is what to do instead.",
    body: "Ear wax is normal and protects the ear. Avoid inserting cotton buds, pins or home tools into the ear canal. Pain, blocked hearing or discharge needs qualified evaluation.",
    close: "Save this reminder and speak with an ENT professional if symptoms persist.",
    script: [
      {
        scene: "Pattern interrupt",
        duration: "0-03 sec",
        speaker: "Doctor",
        dialogue: "Are you using cotton buds to clean inside your ear? Please stop for a moment.",
        shot: "Doctor in clinic holds up a cotton bud, then moves it away from the ear.",
        onScreenText: "Cotton buds inside the ear? Avoid this.",
        direction: "Open with direct eye contact and a calm, cautionary tone.",
      },
      {
        scene: "Simple explanation",
        duration: "04-10 sec",
        speaker: "Doctor",
        dialogue: "Ear wax is normal. It helps protect the ear. Pushing objects inside can move wax deeper and may injure the canal.",
        shot: "Doctor speaks to camera; cut to a clean illustrated ear diagram with an outward arrow.",
        onScreenText: "Ear wax is protective. Do not push it deeper.",
        direction: "Use an illustration only; do not show graphic clinical imagery.",
      },
      {
        scene: "Safe action",
        duration: "11-17 sec",
        speaker: "Doctor",
        dialogue: "If your ear feels blocked, painful, or has discharge, avoid home tools and get it examined by a qualified ENT professional.",
        shot: "Medium shot of doctor; supporting text appears one symptom at a time.",
        onScreenText: "Blocked hearing | Pain | Discharge = seek advice",
        direction: "Keep the wording educational, not diagnostic.",
      },
      {
        scene: "Saveable close",
        duration: "18-22 sec",
        speaker: "Doctor",
        dialogue: "Save this ear-care reminder and share it with someone who still uses cotton buds inside the ear.",
        shot: "Doctor closes with hospital-branded end card.",
        onScreenText: "Save and share responsible ear care",
        direction: "End card includes hospital identity and a general consultation CTA.",
      },
    ],
    status: "Clinical review priority",
    reason: ["High-frequency patient education topic", "Short original video format suited to measurable watch time", "Safety-led information consistent with the hospital tone"],
  },
  {
    platform: "Facebook",
    format: "Carousel",
    topic: "Three signs a child may be struggling to hear",
    shortLabel: "Carousel: Child hearing",
    pillar: "Family hearing health",
    strategyKey: "hearing",
    channelRole: "Caregiver education and saveable awareness",
    impactHypothesis: "Caregiver-friendly hearing guidance can produce saves and appropriate assessment questions.",
    followThrough: "Adapt the approved signs checklist for WhatsApp caregivers.",
    objective: "Help parents identify when professional guidance may be appropriate.",
    audience: "Parents and caregivers",
    hook: "Is your child turning the volume up often?",
    body: "If a child often asks people to repeat, keeps the TV volume very high, or struggles to follow speech in noisy places, it may be worth checking their hearing. This post cannot diagnose hearing loss, but it can help parents notice signs earlier.",
    close: "Share this with a caregiver, and consider a hearing assessment if these signs are repeated.",
  },
  {
    platform: "Instagram",
    format: "Story sequence",
    topic: "Sinus pressure or allergy symptoms?",
    shortLabel: "Stories: Sinus vs allergy",
    pillar: "Symptom literacy",
    strategyKey: "seasonal",
    channelRole: "Interactive symptom-literacy education",
    impactHypothesis: "Question-led stories can expose education needs for future doctor explainers.",
    followThrough: "Use anonymous general questions to plan the next education asset.",
    objective: "Create responsible engagement through a question-led education sequence.",
    audience: "Working adults during seasonal symptom periods",
    hook: "Nasal blockage is common, but the cause can differ.",
    body: "Allergies and sinus problems can feel similar. The timing, triggers, duration, fever, headache, and repeated pattern all matter. Please do not self-diagnose from a social media post.",
    close: "Use the question sticker for general education topics. For personal symptoms, consult a qualified clinician.",
  },
  {
    platform: "Google Business Profile",
    format: "Update",
    topic: "Accurate centre access and ENT consultation information",
    shortLabel: "GBP: Centre access",
    pillar: "Local discoverability",
    strategyKey: "access",
    channelRole: "Search-to-access conversion through verified facts",
    impactHypothesis: "Accurate locations and contact routes support patient access once GBP measurement is connected.",
    followThrough: "Measure listing actions after connector restoration.",
    objective: "Improve patient access with verified location information.",
    audience: "People searching locally for ENT guidance",
    hook: "Find verified ENT care information for our Hyderabad centres.",
    body: "Before visiting, check the confirmed address, consultation pathway, and verified contact details. This helps avoid confusion and makes care access smoother.",
    close: "Use the verified hospital website or official contact route for current information.",
  },
  {
    platform: "Instagram",
    format: "Reel",
    topic: "Headphone listening habits and ear safety",
    shortLabel: "Reel: Listening safety",
    pillar: "Preventive hearing care",
    strategyKey: "hearing",
    channelRole: "Youth discovery and preventive education",
    impactHypothesis: "Listening-safety video content can reach younger audiences through shareable preventive advice.",
    followThrough: "Offer a WhatsApp-friendly prevention checklist after approval.",
    objective: "Encourage preventive habits through shareable visual education.",
    audience: "Students and young professionals",
    hook: "Your listening volume today can matter for your hearing tomorrow.",
    body: "If your headphones are loud enough that people around you can hear them, that is a warning sign. Keep the volume comfortable, take breaks, and avoid long listening sessions at high volume.",
    close: "If you notice ringing, blocked hearing, or hearing changes that persist, get it checked. Send this to someone who always has headphones on.",
  },
  {
    platform: "WhatsApp",
    format: "Approved education card",
    topic: "When a sore throat needs medical attention",
    shortLabel: "Card: Sore throat",
    pillar: "Responsible guidance",
    strategyKey: "whatsapp",
    channelRole: "Direct consent-based patient education",
    impactHypothesis: "Practical red-flag education may prompt appropriate care questions in a trusted channel.",
    followThrough: "Escalate medical queries to appropriate consultation routes.",
    objective: "Provide concise patient education suitable for an approved community message.",
    audience: "Existing community subscribers",
    hook: "Most sore throats improve, but some symptoms should not be ignored.",
    body: "A sore throat with difficulty breathing, inability to swallow, significant swelling, high fever, or symptoms that do not settle needs medical attention. Do not depend only on home remedies when red flags are present.",
    close: "For medical concerns, use an appropriate consultation channel.",
  },
  {
    platform: "YouTube",
    format: "Short",
    topic: "Doctor explains why ears feel blocked after a cold",
    shortLabel: "Short: Blocked ears",
    pillar: "Doctor authority",
    strategyKey: "hearing",
    channelRole: "Doctor credibility and explainable education",
    impactHypothesis: "Doctor-led explanation strengthens trusted education beyond short discovery clips.",
    followThrough: "Extract a bilingual WhatsApp summary card after review.",
    objective: "Build trusted, understandable clinical education through a doctor-led explainer.",
    audience: "Adults experiencing common ENT discomfort",
    hook: "Why can your ears feel blocked during or after a cold?",
    body: "During a cold, congestion can affect the tube that helps balance pressure in the middle ear. That is why the ear may feel blocked or heavy. Do not force remedies or insert anything into the ear.",
    close: "If pain, discharge, or hearing change continues, get an ENT evaluation. This is general education, not a personal diagnosis.",
  },
  {
    platform: "Instagram",
    format: "Carousel",
    topic: "Do not ignore persistent hoarseness",
    shortLabel: "Carousel: Voice care",
    pillar: "Early guidance",
    strategyKey: "tobacco",
    channelRole: "Saveable early-guidance education",
    impactHypothesis: "Clear, non-alarmist voice guidance supports the prevention theme.",
    followThrough: "Pair with the official awareness sequence only after clinical review.",
    objective: "Promote timely guidance without alarmist claims.",
    audience: "Teachers, speakers and adults with voice strain",
    hook: "A voice change that does not settle deserves attention.",
    body: "Temporary voice strain can happen, but hoarseness that persists should be discussed with a qualified clinician, especially if there is throat pain, swallowing difficulty, tobacco exposure, or repeated voice loss.",
    close: "Save this for voice-care awareness and seek guidance if symptoms continue.",
  },
  {
    platform: "Facebook",
    format: "Post with illustration",
    topic: "Monsoon preparation for allergy-prone families",
    shortLabel: "Post: Monsoon allergies",
    pillar: "Seasonal relevance",
    strategyKey: "seasonal",
    channelRole: "Family education around seasonal concerns",
    impactHypothesis: "Seasonally relevant checklists may earn saves as symptoms become salient.",
    followThrough: "Adapt into an approved WhatsApp family card.",
    objective: "Prepare seasonal education around likely local needs.",
    audience: "Families planning ahead for monsoon season",
    hook: "Planning ahead can make seasonal nasal symptoms easier to manage.",
    body: "For allergy-prone families, keep indoor spaces clean, reduce dust exposure where possible, and note what triggers symptoms. If symptoms are frequent, a consultation can help identify the right next step.",
    close: "Follow for clinically reviewed seasonal education.",
  },
  {
    platform: "Instagram",
    format: "Reel",
    topic: "Myth: Ear pain always means infection",
    shortLabel: "Reel: Ear pain myth",
    pillar: "Myth correction",
    strategyKey: "safe-care",
    channelRole: "Myth correction and trust building",
    impactHypothesis: "Responsible myth correction reduces unsafe self-treatment messages.",
    followThrough: "Measure saves and safe-care questions.",
    objective: "Correct common misconceptions while encouraging appropriate evaluation.",
    audience: "General Hyderabad audience",
    hook: "Ear pain does not always mean an infection.",
    body: "Ear pain can have many causes. It may be wax, pressure change, injury, infection, or something else. A social media post cannot tell the cause for you, and antibiotics should not be used without appropriate advice.",
    close: "Get persistent, severe, or repeated ear pain assessed by a qualified professional.",
  },
  {
    platform: "Google Business Profile",
    format: "Health awareness update",
    topic: "World No Tobacco Day and throat health awareness",
    shortLabel: "GBP: Tobacco awareness",
    pillar: "Official health moment",
    strategyKey: "tobacco",
    channelRole: "Local search awareness through an official moment",
    impactHypothesis: "A verified awareness update can strengthen discoverability when GBP access is measurable.",
    followThrough: "Track profile actions after authorization is restored.",
    objective: "Publish preventive awareness supported by an official health-day trigger.",
    audience: "Local search visitors and families",
    hook: "This World No Tobacco Day, make throat health part of the conversation.",
    body: "Tobacco exposure can affect health, including the mouth, throat, and voice. Persistent symptoms such as voice change, throat discomfort, swallowing difficulty, or a non-healing ulcer should be evaluated.",
    close: "Use preventive, factual guidance. Seek qualified medical guidance for persistent symptoms.",
    status: "Evidence linked",
    reason: ["Official WHO health-day opportunity", "Relevant to ENT preventive education", "Suitable for reviewed, factual GBP update"],
  },
];

const geriatricTopics: TopicPlan[] = [
  {
    platform: "Instagram",
    format: "Reel",
    topic: "Three early signs an elderly parent may need a geriatric review",
    shortLabel: "Reel: Elderly review signs",
    pillar: "Healthy ageing",
    strategyKey: "healthy-ageing",
    objective: "Help families notice practical warning signs early without creating fear.",
    audience: "Adult children and caregivers in Hyderabad",
    hook: "If your parent is suddenly weaker, more forgetful, or falling often, do not ignore it.",
    body: "Cover three signs: repeated falls, new confusion or memory changes, and sudden difficulty with daily activities. Explain that these signs may have treatable causes and need a proper review.",
    close: "Encourage families to book a geriatric consultation instead of waiting for a crisis.",
    keyPoints: [
      "Repeated falls are not a normal part of ageing and should be reviewed.",
      "New confusion, forgetfulness, or behaviour change can have medical causes.",
      "Difficulty with bathing, walking, eating, or medicines needs family attention.",
      "Tell families to seek a geriatric review early, not only during emergencies.",
    ],
  },
  {
    platform: "WhatsApp",
    format: "Caregiver checklist",
    topic: "Weekly home checklist for elderly parents",
    shortLabel: "WhatsApp: Elder care checklist",
    pillar: "Caregiver support",
    strategyKey: "caregiver",
    objective: "Give families a simple checklist they can save and use at home.",
    audience: "Caregivers and adult children",
    hook: "A simple weekly checklist for families caring for elderly parents.",
    body: "Cover appetite, sleep, medicines, walking stability, mood, hydration, and any new pain or confusion.",
    close: "Ask families to note changes and share them with the doctor during review.",
    keyPoints: [
      "Check whether medicines were taken correctly.",
      "Notice appetite, sleep, hydration, and mood changes.",
      "Watch walking stability, dizziness, falls, or new weakness.",
      "Write down new symptoms before the doctor visit.",
    ],
  },
  {
    platform: "Facebook",
    format: "Carousel",
    topic: "Fall prevention at home for senior citizens",
    shortLabel: "Carousel: Fall prevention",
    pillar: "Home safety",
    strategyKey: "healthy-ageing",
    objective: "Educate families on practical safety changes at home.",
    audience: "Families with elderly parents",
    hook: "Small home changes can reduce fall risk for elderly parents.",
    body: "Cover removing loose rugs, improving lighting, bathroom support, footwear, and medication review.",
    close: "Tell families to discuss repeated falls or dizziness with a doctor.",
    keyPoints: [
      "Remove loose rugs, clutter, and slippery mats.",
      "Improve lighting near bathrooms, stairs, and bedrooms.",
      "Use stable footwear and bathroom support where needed.",
      "Repeated falls or dizziness needs medical review.",
    ],
  },
  {
    platform: "YouTube",
    format: "Short",
    topic: "Why medicine review matters for elderly patients",
    shortLabel: "Short: Medicine review",
    pillar: "Medication safety",
    strategyKey: "caregiver",
    objective: "Explain why older patients need periodic medicine review.",
    audience: "Elderly patients and caregivers",
    hook: "Elderly patients should not keep taking old medicines without review.",
    body: "Cover duplicate medicines, side effects, dizziness, kidney/liver changes, and bringing all prescriptions to visits.",
    close: "Ask caregivers to carry all medicine strips and prescriptions for review.",
    keyPoints: [
      "Old prescriptions may not always remain suitable.",
      "Some medicines can increase dizziness, sleepiness, or fall risk.",
      "Carry every medicine strip and prescription to the doctor.",
      "Do not stop medicines suddenly without medical advice.",
    ],
  },
  {
    platform: "Google Business Profile",
    format: "Update",
    topic: "Geriatric consultation access and caregiver support",
    shortLabel: "GBP: Geriatric access",
    pillar: "Local access",
    strategyKey: "access",
    objective: "Help local search visitors understand how to access geriatric care.",
    audience: "Families searching for elderly care support",
    hook: "Geriatric care supports elderly patients and the families caring for them.",
    body: "Mention consultation access, caregiver questions, medicine review, fall concerns, and chronic-condition coordination.",
    close: "Use the verified hospital contact route for appointments.",
    keyPoints: [
      "State that geriatric care is for elderly health, function, medicines, and caregiver concerns.",
      "Mention falls, memory changes, weakness, and multiple medicines as review reasons.",
      "Keep contact details and appointment route verified.",
    ],
  },
];

const multispecialtyTopics: TopicPlan[] = [
  {
    platform: "Instagram",
    format: "Reel",
    topic: "When fever needs medical attention",
    shortLabel: "Reel: Fever warning signs",
    pillar: "General health guidance",
    strategyKey: "general-care",
    objective: "Help families understand when fever should not be managed casually.",
    audience: "Families in Vijayawada",
    hook: "Not every fever is an emergency, but some signs should not be ignored.",
    body: "Cover high fever, breathing difficulty, drowsiness, dehydration, persistent fever, and fever in vulnerable patients.",
    close: "Encourage timely consultation for red flags instead of self-medication.",
    keyPoints: [
      "Mention fever with breathing difficulty, drowsiness, dehydration, or severe weakness.",
      "Persistent fever should be evaluated instead of repeated self-medication.",
      "Children, elderly people, pregnant women, and chronic patients need extra care.",
      "End with a safe consultation CTA.",
    ],
  },
  {
    platform: "Facebook",
    format: "Carousel",
    topic: "Basic health checkup: what families should track",
    shortLabel: "Carousel: Health checkup",
    pillar: "Preventive care",
    strategyKey: "preventive",
    objective: "Promote preventive health awareness for families.",
    audience: "Working adults and families",
    hook: "A health checkup is not only for when you feel sick.",
    body: "Cover blood pressure, sugar, weight, cholesterol, family history, and follow-up after abnormal results.",
    close: "Ask people to keep reports and review them with a doctor.",
    keyPoints: [
      "Track blood pressure, blood sugar, weight, and cholesterol.",
      "Mention family history and lifestyle risks.",
      "Explain that abnormal reports need doctor interpretation.",
      "Ask patients to carry previous reports.",
    ],
  },
  {
    platform: "WhatsApp",
    format: "Family health card",
    topic: "Emergency symptoms families should not delay",
    shortLabel: "WhatsApp: Emergency signs",
    pillar: "Care navigation",
    strategyKey: "general-care",
    objective: "Give families a saveable safety message.",
    audience: "Family groups and caregivers",
    hook: "Keep this saved: symptoms that need urgent medical attention.",
    body: "Cover chest pain, breathing difficulty, fainting, stroke-like symptoms, severe injury, and severe dehydration.",
    close: "Tell families to use emergency care pathways for urgent symptoms.",
    keyPoints: [
      "Chest pain or severe breathing difficulty needs urgent care.",
      "Face drooping, arm weakness, speech trouble, or fainting should not wait.",
      "Severe injury, severe dehydration, or sudden worsening needs urgent attention.",
      "Do not use WhatsApp replies for emergencies.",
    ],
  },
  {
    platform: "YouTube",
    format: "Short",
    topic: "Why follow-up after discharge matters",
    shortLabel: "Short: Discharge follow-up",
    pillar: "Continuity of care",
    strategyKey: "preventive",
    objective: "Explain the value of follow-up visits after hospital care.",
    audience: "Patients and caregivers",
    hook: "Discharge from hospital does not always mean treatment is fully complete.",
    body: "Cover medicine changes, warning signs, wound review, reports, diet/activity advice, and follow-up timing.",
    close: "Ask patients to bring discharge summary and medicines to follow-up.",
    keyPoints: [
      "Follow-up checks recovery and medicine response.",
      "Bring discharge summary, reports, and current medicines.",
      "Ask about diet, activity, wound care, and warning signs.",
      "Do not skip follow-up just because symptoms improved.",
    ],
  },
  {
    platform: "Google Business Profile",
    format: "Update",
    topic: "Verified hospital access and consultation information",
    shortLabel: "GBP: Hospital access",
    pillar: "Local access",
    strategyKey: "access",
    objective: "Keep local search visitors clear on care access.",
    audience: "People searching locally for hospital care",
    hook: "Use verified hospital information before planning your visit.",
    body: "Cover departments, appointment route, emergency access, address, and contact pathway.",
    close: "Direct users to the verified hospital contact route.",
    keyPoints: [
      "Keep address, departments, and contact route clear.",
      "Mention appointment and emergency access separately.",
      "Avoid broad treatment claims.",
    ],
  },
];

export function buildEditorialPlan(today: string, input: ContentIntelligenceInput, evidence: StrategyEvidence = {}): EditorialPlan {
  const recommendedWindow = evidence.recommendedWindow ?? "7:30 PM IST";
  const timingEvidence = evidence.timingEvidence ?? "Initial planning window; validate after publishing performance is available.";
  const themes = rankThemes(today, input);
  const sequence = synthesizeStrategySequence(intelligentSequence(themes, input), themes, input, 31);
  const topics = topicPoolFor(input);
  const briefs = Array.from({ length: 31 }, (_, index) => {
    const date = addDays(today, index);
    const base = date === "2026-05-31" && topics === entTopics
      ? topics.at(-1)!
      : sequence[index];
    return makeBrief(date, index, base, themes, input, recommendedWindow, timingEvidence, evidence);
  });

  return {
    period: `${formatDate(today)} - ${formatDate(briefs.at(-1)!.date)}`,
    startsOn: today,
    endsOn: briefs.at(-1)!.date,
    today,
    strategyTitle: "AI-selected ENT growth and community engagement plan",
    generatedFrom: [
      `${input.hospitalSpecialty}: ${input.hospitalPromise}`,
      evidence.audienceEvidence ?? "Audience activity observations awaiting continued measurement",
      evidence.formatEvidence ?? "Content format response signals awaiting continued measurement",
      input.marketThemes[0] ?? "Seasonality, official public-health dates and local discoverability needs",
      evidence.engagementEvidence ?? "Post-level results feed the next planning cycle",
    ],
    cadence: "31 intelligently sequenced touchpoints across public discovery, trusted sharing and local access",
    recommendedWindow,
    intelligenceFlow: [
      "Hospital knowledge base",
      "Audience and regional signals",
      "Seasonal and official opportunities",
      "Measured content patterns",
      "Ranked theme and channel plan",
      "Approval, publication and learning",
    ],
    knowledgeSignals: [
      `${input.hospitalSpecialty} specialty with centres in ${input.locations.join(", ")}`,
      `${input.languages.join(", ")} communication plan after approved master copy`,
      `Available channels: ${input.channels.join(", ")}`,
      ...input.healthcareSignals.slice(0, 1),
      ...input.opportunitySignals.slice(0, 1),
    ],
    themes,
    channelMix: countChannelMix(briefs),
    briefs,
    growthPlan: buildContentGrowthPlan(input, evidence, themes, briefs),
  };
}

function buildContentGrowthPlan(
  input: ContentIntelligenceInput,
  evidence: StrategyEvidence,
  themes: StrategicTheme[],
  briefs: EditorialBrief[],
): ContentGrowthPlan {
  const specialty = specialtyProfile(input);
  const measuredPostCount = evidence.measuredPostCount ?? 0;
  const hasMeasuredBase = measuredPostCount >= 10;
  const timingQuality = bestTimingQuality(evidence);
  const formatDiversity = new Set(briefs.map((brief) => brief.format)).size;
  const topicCoverage = new Set(briefs.map((brief) => brief.pillar)).size;
  const score = clampScore(
    34 +
    Math.min(18, measuredPostCount * 1.2) +
    Math.min(12, timingQuality / 7) +
    Math.min(12, formatDiversity * 2) +
    Math.min(12, topicCoverage * 1.5) +
    (evidence.topHashtag ? 5 : 0) +
    (evidence.competitorEvidence?.length ? 7 : 3),
  );
  const highPriority = score < 72 || !hasMeasuredBase;

  const opportunities = buildOpportunities(input, evidence, specialty);
  const contentTypeStrategy = buildContentTypeStrategy(input, evidence, specialty);
  const bestPostingTimes = buildPostingTimes(evidence, briefs);
  const hashtagRecommendations = buildHashtagRecommendations(input, evidence, specialty);
  const competitorContentGaps = buildCompetitorGaps(input, evidence, specialty);
  const priorityActions = rankPriorityActions([
    {
      impact: "High Impact",
      title: `Record ${specialty.primaryVideo} doctor reels`,
      action: `Shoot three short doctor-led videos this week: one warning-sign reel, one myth-vs-fact reel, and one checklist reel for ${input.locations[0] ?? "the local market"}.`,
      owner: "Production",
      due: "This week",
    },
    {
      impact: highPriority ? "High Impact" : "Medium Impact",
      title: "Fill missing topic gaps",
      action: opportunities.slice(0, 3).map((item) => item.title).join(", "),
      owner: "Doctor",
      due: "Before next weekly batch",
    },
    {
      impact: timingQuality >= 70 ? "Medium Impact" : "High Impact",
      title: "Test posting windows",
      action: bestPostingTimes.slice(0, 3).map((item) => `${item.platform} at ${item.window}`).join("; "),
      owner: "Production",
      due: "Next 14 days",
    },
    {
      impact: "Medium Impact",
      title: "Improve caption CTAs",
      action: "Use one clear patient-safe CTA per post: save, share with family, bring notes to consultation, or use verified contact route.",
      owner: "Staff",
      due: "Every post brief",
    },
    {
      impact: "Low Impact",
      title: "Review hashtags monthly",
      action: "Remove low-intent tags and keep specialty, locality, awareness, and education tags only.",
      owner: "Admin",
      due: "Monthly",
    },
  ]);

  return {
    contentHealthScore: {
      score,
      label: score >= 82 ? "Strong execution base" : score >= 68 ? "Good but needs sharper execution" : "Needs focused content recovery",
      benchmarkComparison: hasMeasuredBase
        ? `Compared with ${measuredPostCount} measured VIP posts and benchmark timing guidance.`
        : "Benchmark-led until at least 10 recent posts create a stronger account-specific baseline.",
      strongReasons: [
        `${briefs.length} daily ideas mapped to platform, format, time and approval workflow.`,
        `${topicCoverage} content pillars and ${formatDiversity} formats reduce repeated generic posting.`,
        evidence.bestFormat ? `${evidence.bestFormat} is used as measured format evidence.` : `${specialty.primaryFormat} is prioritized as the starting format.`,
      ],
      weakReasons: [
        hasMeasuredBase ? "Continue testing beyond the strongest existing posting slots." : "Publishing history is thin, so benchmark timing must be treated as a test.",
        evidence.competitorEvidence?.length ? "Competitor gaps need execution, not more reporting." : "Competitor evidence is not fully connected for this hospital.",
      ],
    },
    opportunities,
    calendarRecommendations: {
      dailyPostingPlan: "Publish one clinically reviewed content mission per day, with platform, topic, caption, hashtags and timing selected before production starts.",
      weeklyContentMix: buildWeeklyMix(briefs),
      monthlyCampaignThemes: themes.slice(0, 3).map((theme) => theme.title),
    },
    contentTypeStrategy,
    bestPostingTimes,
    captionRecommendations: buildCaptionRecommendations(input, specialty),
    hashtagRecommendations,
    competitorContentGaps,
    priorityActions,
    expectedOutcomes: buildExpectedOutcomes(score, timingQuality, formatDiversity),
  };
}

function buildOpportunities(input: ContentIntelligenceInput, evidence: StrategyEvidence, specialty: ReturnType<typeof specialtyProfile>): ContentOpportunity[] {
  return [
    {
      category: "Missing healthcare topic",
      title: specialty.missingTopics[0],
      action: `Create a doctor-led reel explaining what patients should notice, when to seek review, and what not to self-treat.`,
      evidence: input.healthcareSignals[0] ?? `${input.hospitalSpecialty} education needs a clearer warning-sign series.`,
      impact: "High Impact",
    },
    {
      category: "Missing specialty",
      title: specialty.missingSpecialty,
      action: `Add one weekly post that explains this service area in plain patient language, without treatment promises.`,
      evidence: `${input.hospitalSpecialty} growth plan should cover the visible service breadth, not only one repeated topic.`,
      impact: "High Impact",
    },
    {
      category: "Seasonal opportunity",
      title: input.marketThemes[0] ?? specialty.seasonalTheme,
      action: "Turn the seasonal theme into one reel, one carousel, one WhatsApp checklist and one GBP update.",
      evidence: input.opportunitySignals[0] ?? "Seasonal content earns saves because it matches immediate patient concerns.",
      impact: "Medium Impact",
    },
    {
      category: "Local market opportunity",
      title: `${input.locations[0] ?? "Local"} patient-access clarity`,
      action: "Publish verified location, consultation route, emergency distinction and contact-path content.",
      evidence: evidence.audienceEvidence ?? "Local discoverability improves when patients see clear access information.",
      impact: "Medium Impact",
    },
  ];
}

function buildContentTypeStrategy(input: ContentIntelligenceInput, evidence: StrategyEvidence, specialty: ReturnType<typeof specialtyProfile>): ContentTypeRecommendation[] {
  return [
    {
      type: "Reels",
      recommendation: `Prioritize ${specialty.primaryVideo} reels for discovery and saves.`,
      execution: "Doctor speaks one core point, then production adds subtitles and a simple save/share CTA.",
      cadence: "3 per week",
      impact: "High Impact",
    },
    {
      type: "Doctor videos",
      recommendation: "Use doctor-led explainers for trust-building topics that patients often misunderstand.",
      execution: "Record 30-45 second clips in batches; keep one medical point per video.",
      cadence: "2 per week",
      impact: "High Impact",
    },
    {
      type: "Patient stories",
      recommendation: "Use only consented, anonymized patient-journey education.",
      execution: "Replace testimonials with safe story frames: symptom, consultation preparation, follow-up lesson.",
      cadence: "1 per month after approval",
      impact: "Medium Impact",
    },
    {
      type: "Educational content",
      recommendation: evidence.bestFormat ? `Lean into ${evidence.bestFormat} plus checklists.` : "Use carousels and WhatsApp cards for saveable patient education.",
      execution: `Cover ${input.hospitalSpecialty} signs, preparation steps, prevention and follow-up guidance.`,
      cadence: "3 to 4 per week",
      impact: "High Impact",
    },
    {
      type: "Awareness campaigns",
      recommendation: `Build monthly campaigns around ${specialty.seasonalTheme}.`,
      execution: "Create a campaign set: reel, carousel, GBP update, WhatsApp card and measurement note.",
      cadence: "1 theme per month",
      impact: "Medium Impact",
    },
  ];
}

function buildPostingTimes(evidence: StrategyEvidence, briefs: EditorialBrief[]): PostingTimeRecommendation[] {
  const platforms = Array.from(new Set(briefs.map((brief) => brief.platform)));
  return platforms.map((platform) => {
    const timingOption = evidence.timingOptions?.[platform]?.[0];
    const brief = briefs.find((item) => item.platform === platform);
    const source = timingOption?.source ?? brief?.timeSource ?? "benchmark";
    const window = timingOption?.window ?? brief?.recommendedTime ?? benchmarkTiming[platform].window;
    return {
      platform,
      window,
      source,
      action: source === "measured"
        ? "Use this measured slot first, then test adjacent windows for two weeks."
        : "Use as a clearly labeled benchmark test until enough client post history exists.",
    };
  });
}

function buildCaptionRecommendations(input: ContentIntelligenceInput, specialty: ReturnType<typeof specialtyProfile>): CaptionRecommendation[] {
  return [
    {
      style: "Doctor clarity hook",
      example: `Doctor says: ${specialty.captionExample}`,
      cta: "Save this before your next consultation.",
      safetyNote: "Avoid diagnosis language; invite review for persistent or severe symptoms.",
    },
    {
      style: "Family checklist",
      example: `If someone at home is dealing with this, note the symptom, duration and trigger before visiting ${input.locations[0] ?? "the hospital"}.`,
      cta: "Share this with your family group.",
      safetyNote: "Do not include patient identity or case details without valid permission.",
    },
    {
      style: "Local access",
      example: `For ${input.locations[0] ?? "local"} patients: use the verified contact route before planning your visit.`,
      cta: "Use the verified hospital contact details.",
      safetyNote: "Keep hours, address and service claims verified before publishing.",
    },
  ];
}

function buildHashtagRecommendations(input: ContentIntelligenceInput, evidence: StrategyEvidence, specialty: ReturnType<typeof specialtyProfile>): HashtagRecommendation[] {
  const tags = [
    evidence.topHashtag,
    specialty.hashtags[0],
    specialty.hashtags[1],
    `${input.locations[0] ?? "Hyderabad"}Healthcare`.replace(/[^a-zA-Z0-9]/g, ""),
    "PatientEducation",
    specialty.hashtags[2],
  ].filter((tag): tag is string => Boolean(tag));
  return Array.from(new Set(tags)).slice(0, 6).map((tag, index) => ({
    tag,
    rank: index + 1,
    reason: index === 0 && evidence.topHashtag ? "Measured VIP hashtag signal." : `Supports ${input.hospitalSpecialty} discovery and patient education.`,
    risk: tag.toLowerCase().includes("cure") || tag.toLowerCase().includes("best") ? "review" : "low",
  }));
}

function buildCompetitorGaps(input: ContentIntelligenceInput, evidence: StrategyEvidence, specialty: ReturnType<typeof specialtyProfile>): CompetitorContentGap[] {
  const connected = evidence.competitorEvidence?.length ? evidence.competitorEvidence : [
    "Competitor content is benchmark-mode for this hospital.",
    "Use local specialty and topic gaps until direct competitor post data is connected.",
  ];
  return [
    {
      gap: `${specialty.missingTopics[1]} explainers`,
      vipAction: "Create a doctor-led explainer before competitors own the patient question.",
      evidence: connected[0],
      impact: "High Impact",
    },
    {
      gap: `${input.locations[0] ?? "Local"} access and service clarity`,
      vipAction: "Publish GBP and WhatsApp access posts with verified consultation routes.",
      evidence: connected[1] ?? "Local access clarity is a common competitor gap.",
      impact: "Medium Impact",
    },
    {
      gap: "Clinically safe story-led education",
      vipAction: "Use anonymized journey-style education instead of testimonial claims.",
      evidence: "Most healthcare social content underuses safe story structure because approval is difficult.",
      impact: "Medium Impact",
    },
  ];
}

function buildWeeklyMix(briefs: EditorialBrief[]) {
  const firstWeek = briefs.slice(0, 7);
  return countChannelMix(firstWeek)
    .filter((item) => item.count > 0)
    .map((item) => ({
      label: item.platform,
      count: item.count,
      reason: item.role,
    }));
}

function buildExpectedOutcomes(score: number, timingQuality: number, formatDiversity: number): ExpectedOutcome[] {
  const reachBase = score >= 75 ? 18 : 10;
  const engagementBase = timingQuality >= 70 ? 12 : 7;
  const leadBase = formatDiversity >= 5 ? 8 : 5;
  return [
    {
      metric: "Reach increase",
      estimate: `${reachBase}-${reachBase + 14}%`,
      basis: "Daily cadence, platform-specific timing and stronger reel/carousel mix.",
    },
    {
      metric: "Engagement increase",
      estimate: `${engagementBase}-${engagementBase + 10}%`,
      basis: "Doctor hooks, saveable points, hashtag cleanup and measured timing tests.",
    },
    {
      metric: "Lead increase",
      estimate: `${leadBase}-${leadBase + 8}%`,
      basis: "Clear CTA, WhatsApp follow-through and verified local access posts.",
    },
  ];
}

function rankPriorityActions(actions: PriorityAction[]) {
  const order: Record<PriorityImpact, number> = { "High Impact": 0, "Medium Impact": 1, "Low Impact": 2 };
  return actions.sort((left, right) => order[left.impact] - order[right.impact]);
}

function specialtyProfile(input: ContentIntelligenceInput) {
  const specialty = input.hospitalSpecialty.toLowerCase();
  if (specialty.includes("geriatric")) {
    return {
      primaryVideo: "falls, memory, medicine-safety and caregiver",
      primaryFormat: "caregiver checklist reels",
      seasonalTheme: "monsoon safety and elderly fall prevention",
      missingSpecialty: "Memory, falls and medicine-review education",
      missingTopics: ["Fall warning signs for elderly parents", "Medicine review questions families should ask"],
      captionExample: "elderly patients need timely review when a small change affects walking, memory or medicines.",
      hashtags: ["GeriatricCare", "ElderlyCare", "CaregiverEducation"],
    };
  }
  if (specialty.includes("multi")) {
    return {
      primaryVideo: "warning-sign, follow-up and preventive health",
      primaryFormat: "family health reels",
      seasonalTheme: "family health and preventive checkup readiness",
      missingSpecialty: "Department-wise preventive and emergency navigation",
      missingTopics: ["When fever or pain needs timely medical review", "Follow-up after discharge or reports"],
      captionExample: "families should know the warning signs that need timely medical review.",
      hashtags: ["MultispecialtyCare", "FamilyHealth", "PreventiveHealth"],
    };
  }
  return {
    primaryVideo: "ENT symptom, hearing and throat-health",
    primaryFormat: "ENT doctor reels",
    seasonalTheme: "monsoon ENT preparedness",
    missingSpecialty: "Hearing, allergy, throat and voice-care coverage",
    missingTopics: ["Persistent throat or voice warning signs", "Hearing difficulty and ear-care mistakes"],
    captionExample: "persistent throat, voice, ear or nose symptoms should be tracked and reviewed by a qualified clinician.",
    hashtags: ["ENTCare", "HearingHealth", "ThroatHealth"],
  };
}

function bestTimingQuality(evidence: StrategyEvidence) {
  const options = Object.values(evidence.timingOptions ?? {}).flat();
  if (!options.length) return evidence.timingConfidence ?? 48;
  return Math.max(...options.map((option) => option.confidence));
}

function clampScore(value: number) {
  return Math.max(42, Math.min(94, Math.round(value)));
}

function makeBrief(
  date: string,
  index: number,
  base: TopicPlan,
  themes: StrategicTheme[],
  input: ContentIntelligenceInput,
  recommendedWindow: string,
  timingEvidence: string,
  evidence: StrategyEvidence,
): EditorialBrief {
  const day = Number(date.slice(-2));
  const status = base.status ?? "AI draft";
  const timing = timingFor(base.platform, date, index, recommendedWindow, timingEvidence, evidence);
  return {
    id: `${date}-${base.platform.toLowerCase().replaceAll(" ", "-")}-${slug(base.topic)}`,
    day,
    date,
    platform: base.platform,
    format: base.format,
    topic: base.topic,
    shortLabel: base.shortLabel,
    pillar: base.pillar,
    objective: base.objective,
    channelRole: base.channelRole ?? "Clinically reviewed education asset",
    impactHypothesis: base.impactHypothesis ?? "The asset will be measured against stored response signals before repetition.",
    intelligenceBasis: intelligenceFor(base, themes, input),
    followThrough: base.followThrough ?? "Measure response, review learning and revise future content decisions.",
    audience: base.audience,
    language: base.language ?? (day % 7 === 0 ? "English master with Telugu adaptation after approval" : "English master copy"),
    recommendedTime: timing.window,
    timeConfidence: timing.confidence,
    timeEvidence: timing.evidence,
    timeSource: timing.source,
    reason: base.reason ?? [
      `Balances the ${base.pillar.toLowerCase()} content pillar`,
      `Matches the ${input.hospitalSpecialty} education tone in the client knowledge base`,
      "Designed for measurement and future strategy learning",
    ],
    hook: base.hook,
    keyPoints: base.keyPoints ?? defaultKeyPoints(base),
    script: base.script ?? standardScript(base),
    caption: `${base.hook}\n\n${base.body}\n\n${base.close}`,
    hashtags: hashtagsFor(base),
    callToAction: base.close,
    productionNotes: [
      "Use original hospital-created visuals or doctor-led recording.",
      "Keep language factual, calm and understandable; avoid outcome promises.",
      base.platform === "Google Business Profile" ? "Verify location details and comply with Google medical-content restrictions." : "Prepare vertical-safe visual framing and clear subtitles.",
    ],
    approvalChecks: [
      "Clinical accuracy review required before publishing.",
      "No patient identity, medical record, image or testimonial without valid permission.",
      "No diagnosis, guaranteed outcome or unsupported superiority claim.",
    ],
    measurement: measurementsFor(base.platform, base.format),
    status,
  };
}

function timingFor(
  platform: EditorialPlatform,
  date: string,
  index: number,
  recommendedWindow: string,
  timingEvidence: string,
  evidence: StrategyEvidence,
): PlatformTimingEvidence {
  const timingOptions = evidence.timingOptions?.[platform];
  if (timingOptions?.length) {
    return timingOptions[index % timingOptions.length];
  }

  const platformEvidence = evidence.platformWindows?.[platform];
  if (platformEvidence) return platformEvidence;

  if (platform === "Instagram") {
    const hour = Number.parseInt(recommendedWindow, 10);
    const shiftedHour = Number.isFinite(hour) ? Math.max(9, Math.min(21, hour + (index % 3) - 1)) : undefined;
    return {
      window: shiftedHour === undefined ? recommendedWindow : `${clockLabel(shiftedHour)} IST`,
      confidence: evidence.timingConfidence ?? (evidence.timingEvidence ? 68 : 61),
      evidence: timingEvidence,
      source: evidence.timingSource ?? (evidence.timingEvidence ? "measured" : "benchmark"),
    };
  }

  return rotatedBenchmarkTiming(platform, date, index);
}

const benchmarkTiming: Record<EditorialPlatform, PlatformTimingEvidence> = {
  Instagram: {
    window: "1:00 PM IST",
    confidence: 52,
    source: "benchmark",
    evidence: "Benchmark starting test from Sprout Social and Buffer 2026 research: Instagram performs best around midweek midday to evening. Replace with VIP measured timing once enough posts exist.",
  },
  Facebook: {
    window: "6:00 PM IST",
    confidence: 48,
    source: "benchmark",
    evidence: "Benchmark starting test from Sprout Social 2026 research: Facebook activity sustains from midday into evening on weekdays. Use as a test until VIP Facebook performance is connected.",
  },
  "Google Business Profile": {
    window: "11:00 AM IST",
    confidence: 44,
    source: "benchmark",
    evidence: "Google Business Profile updates are access and trust content, not feed-engagement content. Schedule during business hours so location, contact and awareness updates are fresh when patients search.",
  },
  YouTube: {
    window: "7:00 PM IST",
    confidence: 45,
    source: "benchmark",
    evidence: "YouTube Shorts are treated as doctor-led evergreen explainers. This evening slot is a controlled test until VIP YouTube analytics are connected.",
  },
  WhatsApp: {
    window: "10:00 AM IST",
    confidence: 46,
    source: "benchmark",
    evidence: "WhatsApp is a consent-based follow-through channel. Send approved education during daytime hours when staff can respond and route medical questions appropriately.",
  },
};

function rotatedBenchmarkTiming(platform: EditorialPlatform, date: string, index: number): PlatformTimingEvidence {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const options: Record<EditorialPlatform, Array<{ hour: number; confidence: number }>> = {
    Instagram: [
      { hour: 11.5, confidence: 52 },
      { hour: 13, confidence: 53 },
      { hour: 18.5, confidence: 55 },
      { hour: 19.5, confidence: 54 },
      { hour: 20.25, confidence: 52 },
    ],
    Facebook: [
      { hour: 12.5, confidence: 48 },
      { hour: 16.5, confidence: 49 },
      { hour: 18, confidence: 50 },
      { hour: 19, confidence: 48 },
    ],
    "Google Business Profile": [
      { hour: 10.5, confidence: 44 },
      { hour: 11, confidence: 45 },
      { hour: 12, confidence: 44 },
    ],
    YouTube: [
      { hour: 18.5, confidence: 45 },
      { hour: 19, confidence: 46 },
      { hour: 20, confidence: 45 },
    ],
    WhatsApp: [
      { hour: 9.5, confidence: 46 },
      { hour: 10, confidence: 47 },
      { hour: 11, confidence: 46 },
      { hour: 17.5, confidence: 45 },
    ],
  };
  const slot = options[platform][(index + day) % options[platform].length];
  return {
    window: `${clockLabel(slot.hour)} IST`,
    confidence: slot.confidence,
    source: "benchmark",
    evidence: `${benchmarkTiming[platform].evidence} AI selected this ${clockLabel(slot.hour)} test slot by combining platform benchmark ranges, day rotation and the topic's channel role so the calendar does not repeat one default time.`,
  };
}

function rankThemes(today: string, input: ContentIntelligenceInput): StrategicTheme[] {
  const specialty = input.hospitalSpecialty.toLowerCase();
  if (specialty.includes("geriatric")) {
    return [
      {
        key: "healthy-ageing",
        title: "Healthy ageing and early review signals",
        score: 92,
        rationale: "The client specialty is geriatrics, so family education should focus on falls, function, memory, medicines and timely review.",
        channels: ["Instagram", "Facebook", "WhatsApp"],
        outcome: "Caregiver saves, family forwards and appropriate appointment questions.",
      },
      {
        key: "caregiver",
        title: "Caregiver support and medicine safety",
        score: 88,
        rationale: "Caregivers need simple, practical checklists that help them prepare for consultations.",
        channels: ["WhatsApp", "YouTube", "Facebook"],
        outcome: "Better prepared family consultations and useful community sharing.",
      },
      {
        key: "access",
        title: "Verified geriatric care access",
        score: 70,
        rationale: "Local access posts should make consultation pathways clear for families searching for elderly care.",
        channels: ["Google Business Profile", "WhatsApp"],
        outcome: "Clear appointment access and fewer confused inquiries.",
      },
    ];
  }

  if (specialty.includes("multi")) {
    return [
      {
        key: "general-care",
        title: "Family care navigation and warning signs",
        score: 90,
        rationale: "The client is multispecialty, so content should help families know when to seek timely care.",
        channels: ["Instagram", "WhatsApp", "Facebook"],
        outcome: "Saved safety posts, family forwards and appropriate care navigation.",
      },
      {
        key: "preventive",
        title: "Preventive health and follow-up discipline",
        score: 84,
        rationale: "Preventive checkups and discharge follow-up are broadly relevant across multispecialty care.",
        channels: ["Facebook", "YouTube", "Instagram"],
        outcome: "More report reviews, follow-up awareness and preventive-care questions.",
      },
      {
        key: "access",
        title: "Verified hospital access",
        score: 72,
        rationale: "Local search posts should clarify departments, appointment routes and emergency access.",
        channels: ["Google Business Profile", "WhatsApp"],
        outcome: "Cleaner local discovery and better patient routing.",
      },
    ];
  }

  const withinTobaccoWindow = today <= "2026-05-31" && addDays(today, 10) >= "2026-05-31";
  const text = [...input.marketThemes, ...input.healthcareSignals, ...input.opportunitySignals, ...input.recommendations].join(" ").toLowerCase();
  const candidates: StrategicTheme[] = [
    {
      key: "tobacco",
      title: "World No Tobacco Day: throat and voice awareness",
      score: withinTobaccoWindow ? 97 : 73,
      rationale: withinTobaccoWindow
        ? "Official WHO awareness date falls inside the next ten days and is directly relevant to responsible throat-health education."
        : "Preventive throat-health education remains relevant but is outside the immediate official-date window.",
      channels: ["Instagram", "WhatsApp", "Google Business Profile"],
      outcome: "Useful shares, qualified questions and local awareness actions.",
    },
    {
      key: "seasonal",
      title: "Monsoon ENT preparedness for Hyderabad families",
      score: isMonsoonPlanningWindow(today) ? 91 : 68,
      rationale: "Seasonal family education aligns with local context and supports practical, non-diagnostic content people may save and share.",
      channels: ["Instagram", "WhatsApp", "Facebook"],
      outcome: "Saves, family forwards and recurring-question insight.",
    },
    {
      key: "whatsapp",
      title: "WhatsApp patient-community education pathway",
      score: 89,
      rationale: "The hospital knowledge base includes WhatsApp and multilingual communication; direct consent-based sharing is a major distribution pillar, not an afterthought.",
      channels: ["WhatsApp", "Instagram"],
      outcome: "Opt-in reach, appropriate inquiries and reusable education cards.",
    },
    {
      key: "hearing",
      title: "Hearing protection and caregiver awareness",
      score: text.includes("hearing") ? 87 : 78,
      rationale: "ENT specialty knowledge and caregiver-friendly education create a repeatable authority-building topic family.",
      channels: ["Instagram", "WhatsApp", "YouTube"],
      outcome: "Video completion, saves and appropriate hearing-care queries.",
    },
    {
      key: "access",
      title: "Verified local access and discoverability",
      score: 70,
      rationale: "Location and contact clarity support discovery, but GBP action measurement remains a connection gap.",
      channels: ["Google Business Profile", "WhatsApp"],
      outcome: "Direction, call and verified contact actions once measurable.",
    },
  ];
  return candidates.sort((left, right) => right.score - left.score);
}

function intelligentSequence(themes: StrategicTheme[], input: ContentIntelligenceInput) {
  const topics = topicPoolFor(input);
  const ordered: TopicPlan[] = [];
  const picks: Record<string, number[]> = {
    tobacco: [2, 3, 11],
    seasonal: [0, 1, 6, 12],
    whatsapp: [1, 3, 9],
    hearing: [8, 5, 9],
    access: [7],
  };
  for (const theme of themes) {
    for (const index of picks[theme.key] ?? []) {
      const item = topics[index];
      if (item && !ordered.includes(item)) ordered.push(item);
    }
  }
  return ordered.length ? ordered : topics;
}

const executionAngles = [
  {
    label: "Doctor says",
    hookPrefix: "Doctor says:",
    objectivePrefix: "Turn a repeated patient question into a clear doctor-led explanation.",
    pointPrefix: "Explain what the doctor wants patients to understand first.",
  },
  {
    label: "Warning signs",
    hookPrefix: "Do not ignore this:",
    objectivePrefix: "Help families separate normal discomfort from a reason to seek review.",
    pointPrefix: "List the warning signs that should prompt timely medical review.",
  },
  {
    label: "Myth vs fact",
    hookPrefix: "Myth vs fact:",
    objectivePrefix: "Correct a common misconception without creating fear or making claims.",
    pointPrefix: "State the common myth, then explain the safer factual version.",
  },
  {
    label: "Checklist",
    hookPrefix: "Save this checklist:",
    objectivePrefix: "Create a practical post people can save before a consultation.",
    pointPrefix: "Give the patient or caregiver a clear checklist they can follow.",
  },
  {
    label: "Before visit",
    hookPrefix: "Before you visit:",
    objectivePrefix: "Improve consultation quality by helping patients arrive prepared.",
    pointPrefix: "Tell viewers what to observe, write down, and bring to the appointment.",
  },
  {
    label: "Family share",
    hookPrefix: "Share this with family:",
    objectivePrefix: "Package the advice for family forwarding and caregiver clarity.",
    pointPrefix: "Make the message simple enough for a family member to act on.",
  },
  {
    label: "Local season",
    hookPrefix: "This season, remember:",
    objectivePrefix: "Use local seasonality and current healthcare signals to make the idea timely.",
    pointPrefix: "Connect the topic to a current season, local concern, or observed behavior.",
  },
  {
    label: "After care",
    hookPrefix: "After treatment:",
    objectivePrefix: "Reduce confusion after visits by explaining follow-through clearly.",
    pointPrefix: "Explain what patients should track after the consultation or treatment.",
  },
];

function synthesizeStrategySequence(seedTopics: TopicPlan[], themes: StrategicTheme[], input: ContentIntelligenceInput, count: number) {
  const seeds = seedTopics.length ? seedTopics : topicPoolFor(input);
  const uniquePlans: TopicPlan[] = [];
  const usedTopics = new Set<string>();
  let attempts = 0;

  while (uniquePlans.length < count && attempts < count * 8) {
    const seed = seeds[attempts % seeds.length];
    const theme = themes[attempts % Math.max(themes.length, 1)];
    const angle = executionAngles[Math.floor(attempts / seeds.length) % executionAngles.length];
    const signal = intelligenceSignal(input, attempts);
    const platform = channelFor(seed, theme, input, attempts);
    const synthesized = synthesizeTopic(seed, angle, signal, platform, theme, input, uniquePlans.length);
    const key = synthesized.topic.toLowerCase();
    if (!usedTopics.has(key)) {
      usedTopics.add(key);
      uniquePlans.push(synthesized);
    }
    attempts += 1;
  }

  return uniquePlans.length >= count ? uniquePlans : [...uniquePlans, ...seeds].slice(0, count);
}

function synthesizeTopic(
  seed: TopicPlan,
  angle: (typeof executionAngles)[number],
  signal: string,
  platform: EditorialPlatform,
  theme: StrategicTheme | undefined,
  input: ContentIntelligenceInput,
  index: number,
): TopicPlan {
  const topicCore = stripExecutionPrefix(seed.topic);
  const topic = `${angle.label}: ${topicCore}`;
  const format = formatForPlatform(platform, seed.format, index);
  const shortLabel = `${platformLabel(platform)}: ${angle.label}`;
  const hook = `${angle.hookPrefix} ${seed.hook.replace(/\.$/, "")}.`;
  const body = `${seed.body} Tie it to ${signal.toLowerCase()} so the post feels specific to ${input.locations[0] ?? "the local audience"}.`;
  const close = seed.close;

  return {
    ...seed,
    platform,
    format,
    topic,
    shortLabel,
    objective: `${angle.objectivePrefix} ${seed.objective}`,
    channelRole: channelRoleFor(platform, format),
    impactHypothesis: `This is a unique ${angle.label.toLowerCase()} angle built from ${theme?.title.toLowerCase() ?? seed.pillar.toLowerCase()}, ${signal.toLowerCase()}, and previous-content learning. Measure saves, shares, watch time and qualified responses before repeating the idea.`,
    followThrough: `Compare this ${format.toLowerCase()} against prior ${platform} response before reusing the same topic angle.`,
    hook,
    body,
    close,
    keyPoints: [
      angle.pointPrefix,
      `Cover the core medical point: ${topicCore}.`,
      `Use this intelligence context: ${signal}.`,
      `Say what patients should watch for or prepare next: ${close}`,
      platform === "WhatsApp" ? "Keep it short enough for staff to forward with approved wording." : "Keep the doctor wording direct, visual, and easy to save.",
    ],
    reason: [
      `Unique angle: ${angle.label} applied to ${topicCore}.`,
      theme ? `Uses ranked strategy theme: ${theme.title}.` : `Uses ${input.hospitalSpecialty} intelligence signals.`,
      "Avoids repeating the same idea by changing the audience intent, channel and execution points.",
    ],
    status: index < 7 ? "Evidence linked" : seed.status,
  };
}

function intelligenceSignal(input: ContentIntelligenceInput, index: number) {
  const signals = [
    ...input.recommendations,
    ...input.healthcareSignals,
    ...input.opportunitySignals,
    ...input.audienceSignals,
    ...input.marketThemes,
  ].filter(Boolean);
  return signals[index % Math.max(signals.length, 1)] ?? `${input.hospitalSpecialty} patient education and local access data`;
}

function channelFor(seed: TopicPlan, theme: StrategicTheme | undefined, input: ContentIntelligenceInput, index: number): EditorialPlatform {
  const preferred = [...(theme?.channels ?? []), ...input.channels.filter(isEditorialPlatform), seed.platform];
  return preferred[index % preferred.length] ?? seed.platform;
}

function isEditorialPlatform(value: string): value is EditorialPlatform {
  return ["Instagram", "Facebook", "Google Business Profile", "YouTube", "WhatsApp"].includes(value);
}

function formatForPlatform(platform: EditorialPlatform, fallback: string, index: number) {
  const formats: Record<EditorialPlatform, string[]> = {
    Instagram: ["Reel", "Carousel", "Story"],
    Facebook: ["Post", "Carousel", "Short video"],
    "Google Business Profile": ["Update", "Q&A style update", "Service update"],
    YouTube: ["Short", "Doctor explainer"],
    WhatsApp: ["Approved card", "Checklist message"],
  };
  return formats[platform]?.[index % formats[platform].length] ?? fallback;
}

function channelRoleFor(platform: EditorialPlatform, format: string) {
  if (platform === "Google Business Profile") return "Verified local discovery and patient-access clarity";
  if (platform === "WhatsApp") return "Approved direct sharing for existing community and patient inquiries";
  if (platform === "YouTube") return "Evergreen doctor-led explanation with searchable replay value";
  if (format === "Carousel") return "Saveable education asset for later patient reference";
  return "Discovery and engagement asset designed for saves, shares and watch-time learning";
}

function platformLabel(platform: EditorialPlatform) {
  if (platform === "Google Business Profile") return "GBP";
  return platform;
}

function stripExecutionPrefix(value: string) {
  return value
    .replace(/^(Doctor says|Warning signs|Myth vs fact|Checklist|Before visit|Family share|Local season|After care):\s*/i, "")
    .trim();
}

function intelligenceFor(base: TopicPlan, themes: StrategicTheme[], input: ContentIntelligenceInput) {
  const theme = themes.find((item) => item.key === base.strategyKey);
  return [
    theme ? `Ranked theme: ${theme.title} (${theme.score}/100)` : "Balanced supporting education topic",
    theme?.rationale ?? "Selected to maintain a balanced, clinically governed education mix.",
    base.platform === "WhatsApp"
      ? `WhatsApp chosen as a trusted distribution pillar for approved ${input.languages.slice(0, 2).join(" and ")} content.`
      : `${base.platform} chosen for its role in ${base.channelRole?.toLowerCase() ?? "clinically reviewed education"}.`,
  ];
}

function topicPoolFor(input: ContentIntelligenceInput) {
  const specialty = input.hospitalSpecialty.toLowerCase();
  if (specialty.includes("geriatric")) return geriatricTopics;
  if (specialty.includes("multi")) return multispecialtyTopics;
  return entTopics;
}

function countChannelMix(briefs: EditorialBrief[]) {
  const roles: Record<EditorialPlatform, string> = {
    Instagram: "Discovery, shareable education and measured engagement",
    WhatsApp: "Consented community distribution and appropriate inquiry pathways",
    Facebook: "Family and caregiver reach",
    "Google Business Profile": "Verified local discovery and access",
    YouTube: "Doctor-led evergreen explanation",
  };
  const order: EditorialPlatform[] = ["Instagram", "WhatsApp", "Facebook", "Google Business Profile", "YouTube"];
  return order.map((platform) => ({
    platform,
    count: briefs.filter((brief) => brief.platform === platform).length,
    role: roles[platform],
  }));
}

function isMonsoonPlanningWindow(today: string) {
  const month = Number(today.slice(5, 7));
  return month >= 5 && month <= 9;
}

function standardScript(plan: TopicPlan): ScriptBeat[] {
  const presenter = plan.platform === "Google Business Profile" ? "Narration / copy" : plan.format === "Carousel" || plan.format.includes("card") || plan.format.includes("Post") ? "Slide copy" : "Doctor";
  return [
    {
      scene: "Opening",
      duration: "0-03 sec",
      speaker: presenter,
      dialogue: plan.hook,
      shot: plan.format === "Carousel" ? "Cover slide with high-contrast headline." : "Doctor or branded opening visual framed vertically.",
      onScreenText: plan.hook,
      direction: "Keep the first statement direct and readable without audio.",
    },
    {
      scene: "Main message",
      duration: "04-15 sec",
      speaker: presenter,
      dialogue: plan.body,
      shot: "Use simple supportive visuals, subtitles and hospital-approved branding.",
      onScreenText: conciseText(plan.body),
      direction: "Maintain a calm explanatory tone and avoid diagnostic conclusions.",
    },
    {
      scene: "Close",
      duration: "16-22 sec",
      speaker: presenter,
      dialogue: plan.close,
      shot: "Close with a clean branded card and appropriate patient-access pathway.",
      onScreenText: plan.close,
      direction: "Include a general CTA only after the clinical wording is approved.",
    },
  ];
}

function defaultKeyPoints(plan: TopicPlan) {
  return [
    `Open with: ${plan.hook}`,
    plan.body,
    `Close with: ${plan.close}`,
  ];
}

function conciseText(value: string) {
  const sentence = value.split(".")[0]?.trim() ?? value;
  return sentence.length > 72 ? `${sentence.slice(0, 69)}...` : sentence;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));
}

function clockLabel(hour: number) {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 1, wholeHour, minutes)));
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function hashtagsFor(plan: TopicPlan) {
  const common = ["ENTCare", "DrHarikaENTCare", "HyderabadHealthcare"];
  if (plan.pillar.includes("hearing") || plan.topic.toLowerCase().includes("hearing")) return [...common, "HearingHealth"];
  if (plan.topic.toLowerCase().includes("tobacco")) return [...common, "WorldNoTobaccoDay"];
  if (plan.topic.toLowerCase().includes("sinus") || plan.topic.toLowerCase().includes("allergy")) return [...common, "SinusCare"];
  return [...common, "PatientEducation"];
}

function measurementsFor(platform: EditorialPlatform, format: string) {
  if (platform === "Google Business Profile") return ["Profile views", "Website clicks", "Calls or direction requests after connection"];
  if (format === "Reel" || format === "Short") return ["Accounts reached", "Average watch time", "Saves and shares", "Profile actions"];
  if (platform === "WhatsApp") return ["Delivered approved messages", "Qualified responses", "Escalations to appropriate consultation"];
  return ["Accounts reached", "Saves and shares", "Profile visits", "Qualified inquiries"];
}
