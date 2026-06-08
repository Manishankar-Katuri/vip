export type EvidenceSource = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  use: string;
};

export type PlaybookEvent = {
  slug: string;
  date: string;
  name: string;
  type: "Health day" | "Festival" | "Public holiday";
  relevance: string;
  officialBasis: string;
  sourceIds: string[];
  status: "Upcoming" | "Completed" | "Plan next";
};

export const platformProfile = {
  name: "VIP Healthcare Intelligence",
  product: "Multi-tenant growth playbooks",
  currentTenantLabel: "Current client workspace",
} as const;

export const hospitalProfile = {
  id: "dr-harika-ent-care",
  name: "Dr. Harika ENT Care Hospitals",
  location: "Hyderabad, Telangana / multiple centres",
  specialty: "Ear, nose and throat care",
  promise: "Clear, responsible ENT education for families in Hyderabad.",
  governance: "All patient-facing clinical guidance requires Dr. Harika review before publishing.",
  languages: ["English", "Telugu", "Hindi"],
  channels: ["Instagram", "Google Business Profile", "WhatsApp", "Facebook", "YouTube"],
  locations: [
    {
      name: "Kondapur",
      address: "3rd Floor, GVR Sapphire, Botanical Garden Rd, above Ratnadeep Super Market, Camelot Layout, Kondapur, Hyderabad, Telangana 500084",
      phone: "+91 9848336090",
    },
    {
      name: "Chandanagar",
      address: "2-132/5 & 5/A, MMTS Rd, Engineers Enclave, Chanda Nagar, Hyderabad, Telangana 500050",
      phone: "+91 9848336090",
    },
    {
      name: "Vanasthalipuram",
      address: "#MIG 112, TV Colony, Vanasthalipuram Main Rd, near Hanuman Temple, Phase IV, Hyderabad, Telangana 500070",
      phone: "+91 9848336090",
    },
  ],
} as const;

export const evidenceSources: EvidenceSource[] = [
  {
    id: "harika-official-site",
    publisher: "Dr. Harika ENT Care Hospitals",
    title: "Official website and locations",
    url: "https://drharikaentcare.com/",
    use: "Current client identity, services and listed hospital centre addresses.",
  },
  {
    id: "telangana-des-hyd",
    publisher: "Directorate of Economics and Statistics, Government of Telangana",
    title: "Hyderabad District at a Glance",
    url: "https://ecostat.telangana.gov.in/hyd_glance.html",
    use: "Official Hyderabad district demographic baseline derived from Census 2011.",
  },
  {
    id: "census-population-finder",
    publisher: "Office of the Registrar General & Census Commissioner, India",
    title: "Population Finder 2011",
    url: "https://censusindia.gov.in/census.website/data/population-finder",
    use: "Government census reference for population indicators and administrative-area analysis.",
  },
  {
    id: "telangana-calendar-2026",
    publisher: "Government of Telangana",
    title: "Calendar 2026",
    url: "https://www.telangana.gov.in/downloads/calendar-2026/0/",
    use: "Telangana festival and public-holiday planning dates.",
  },
  {
    id: "who-health-days",
    publisher: "World Health Organization",
    title: "Global health days and campaigns",
    url: "https://www.who.int/campaigns",
    use: "International public-health campaign dates and themes.",
  },
  {
    id: "who-tobacco-day-2026",
    publisher: "World Health Organization",
    title: "World No Tobacco Day 2026",
    url: "https://www.who.int/campaigns/world-no-tobacco-day/2026",
    use: "Official 31 May 2026 campaign trigger and communication context.",
  },
  {
    id: "who-hearing-day-2026",
    publisher: "World Health Organization",
    title: "World Hearing Day 2026",
    url: "https://www.who.int/campaigns/world-hearing-day/2026",
    use: "Official hearing-care campaign reference for ENT communication.",
  },
  {
    id: "dghs-nppcd",
    publisher: "Directorate General of Health Services, Ministry of Health and Family Welfare",
    title: "National Programme for Prevention and Control of Deafness",
    url: "https://dghs.mohfw.gov.in/national-programme-for-prevention-and-control-of-deafness.php",
    use: "Indian public-health basis for hearing-loss prevention and care awareness.",
  },
  {
    id: "world-cancer-day-uicc",
    publisher: "Union for International Cancer Control",
    title: "World Cancer Day / United by Unique",
    url: "https://www.worldcancerday.org/",
    use: "Official World Cancer Day campaign identity, 4 February date and 2025-2027 people-centred care theme.",
  },
  {
    id: "iarc-cancer-day",
    publisher: "WHO International Agency for Research on Cancer",
    title: "World Cancer Day: cancer prevention awareness",
    url: "https://iarc60.iarc.who.int/en/world-cancer-day-4-february/",
    use: "WHO/IARC institutional reference for prevention-focused World Cancer Day communication.",
  },
  {
    id: "hootsuite-strategy",
    publisher: "Hootsuite",
    title: "How to Create a Social Media Strategy",
    url: "https://blog.hootsuite.com/how-to-create-a-social-media-marketing-plan/",
    use: "Method reference: objectives, audience research, competitor review, content calendar and iterative evaluation.",
  },
  {
    id: "sprout-calendar",
    publisher: "Sprout Social",
    title: "Social Media Calendar Guide",
    url: "https://sproutsocial.com/insights/social-media-content-calendar/",
    use: "Method reference: calendar fields, ownership, assets, campaign tags, approval status and performance feedback.",
  },
  {
    id: "buffer-calendar",
    publisher: "Buffer",
    title: "Create a Social Media Content Calendar",
    url: "https://buffer.com/resources/social-media-calendar/",
    use: "Method reference: goals, audience, content pillars, channel choice and cadence.",
  },
];

export const officialDemographicBaseline = [
  { label: "Hyderabad district population", value: "39,43,323", context: "Census 2011" },
  { label: "Population density", value: "18,172 / sq. km", context: "Census 2011" },
  { label: "Sex ratio", value: "954", context: "Females per 1,000 males / Census 2011" },
  { label: "Literacy rate", value: "83.25%", context: "Census 2011" },
] as const;

export const playbookEvents: PlaybookEvent[] = [
  {
    slug: "world-no-tobacco-day-2026",
    date: "2026-05-31",
    name: "World No Tobacco Day",
    type: "Health day",
    relevance: "ENT education on tobacco-related oral and throat risks, using reviewed preventive wording.",
    officialBasis: "WHO observes World No Tobacco Day on 31 May; content must stay preventive and must not diagnose cancer or other conditions.",
    sourceIds: ["who-tobacco-day-2026"],
    status: "Upcoming",
  },
  {
    slug: "world-food-safety-day-2026",
    date: "2026-06-07",
    name: "World Food Safety Day",
    type: "Health day",
    relevance: "Optional general community-health acknowledgement; lower ENT priority.",
    officialBasis: "WHO identifies World Food Safety Day as a public-health awareness date; the relevance to an ENT tenant is limited unless a verified clinical angle exists.",
    sourceIds: ["who-health-days"],
    status: "Plan next",
  },
  {
    slug: "world-blood-donor-day-2026",
    date: "2026-06-14",
    name: "World Blood Donor Day",
    type: "Health day",
    relevance: "Community goodwill post only where aligned with hospital participation.",
    officialBasis: "WHO recognizes World Blood Donor Day; do not imply donation facilities or partnerships unless the hospital confirms participation.",
    sourceIds: ["who-health-days"],
    status: "Plan next",
  },
  {
    slug: "independence-day-2026",
    date: "2026-08-15",
    name: "Independence Day",
    type: "Public holiday",
    relevance: "Confirm clinic hours and publish patient-access guidance before the holiday.",
    officialBasis: "Government of Telangana calendar date used for verified operating-hours and access communication.",
    sourceIds: ["telangana-calendar-2026"],
    status: "Plan next",
  },
  {
    slug: "vijaya-dasami-2026",
    date: "2026-10-20",
    name: "Vijaya Dasami",
    type: "Festival",
    relevance: "Festival greetings paired with verified holiday-hours messaging.",
    officialBasis: "Government of Telangana calendar date used for culturally relevant greeting and verified access information.",
    sourceIds: ["telangana-calendar-2026"],
    status: "Plan next",
  },
  {
    slug: "world-cancer-day-2027",
    date: "2027-02-04",
    name: "World Cancer Day",
    type: "Health day",
    relevance: "A carefully scoped opportunity for tobacco-risk, persistent throat/voice symptom awareness and appropriate specialist guidance, without claiming oncology treatment capability.",
    officialBasis: "World Cancer Day is observed every 4 February and the 2025-2027 UICC campaign theme is United by Unique, emphasizing people-centred care; WHO/IARC supports prevention-focused awareness.",
    sourceIds: ["world-cancer-day-uicc", "iarc-cancer-day"],
    status: "Plan next",
  },
  {
    slug: "world-hearing-day-2027",
    date: "2027-03-03",
    name: "World Hearing Day",
    type: "Health day",
    relevance: "Flagship annual hearing-awareness campaign; prepare screening and prevention plan in advance.",
    officialBasis: "WHO World Hearing Day and DGHS/MoHFW NPPCD provide hearing-care awareness and prevention references.",
    sourceIds: ["who-hearing-day-2026", "dghs-nppcd"],
    status: "Plan next",
  },
];

export const todayAgenda = [
  {
    title: "Review World No Tobacco Day ENT education brief",
    owner: "Dr. Harika",
    due: "Due today",
    channel: "Clinical approval",
    detail: "Confirm preventive wording before a May 31 awareness carousel is scheduled.",
    tone: "warning" as const,
  },
  {
    title: "Prepare three language-ready campaign variants",
    owner: "Production",
    due: "Due tomorrow",
    channel: "Instagram / WhatsApp",
    detail: "English master copy first; Telugu and Hindi variants follow the approved meaning.",
    tone: "info" as const,
  },
  {
    title: "Confirm holiday-hours source data",
    owner: "Front office",
    due: "This week",
    channel: "Google Business Profile",
    detail: "Verified facility hours are required before public holiday posts are prepared.",
    tone: "neutral" as const,
  },
];

export const growthPillars = [
  {
    title: "Search trust",
    objective: "Help Hyderabad families discover reliable ENT guidance and accurate appointment information.",
    actions: ["Google Business Profile accuracy", "Service-page clarity", "Reviewed symptom education"],
    outcome: "Calls, directions and appointment-intent clicks",
  },
  {
    title: "Doctor authority",
    objective: "Make clinical expertise understandable without unsupported claims or alarmist messaging.",
    actions: ["Short educational videos", "Hearing awareness", "Myth-versus-fact posts"],
    outcome: "Qualified inquiries and saves of education content",
  },
  {
    title: "Community access",
    objective: "Build referral and awareness relationships around verified hospital centres.",
    actions: ["School and workplace hearing awareness", "RWA information sessions", "Referral coordination"],
    outcome: "Event leads and attributable referrals",
  },
];

export const campaignDrafts = [
  {
    name: "World No Tobacco Day: throat health awareness",
    trigger: "May 31 official WHO health day",
    platforms: ["Instagram carousel", "WhatsApp patient community", "Google Business Profile"],
    copy: "Tobacco use can harm more than the lungs. This World No Tobacco Day, speak with a qualified clinician about persistent throat or voice concerns.",
    safety: "Avoid diagnostic claims; include consultation guidance only after clinical approval.",
    stage: "Awaiting clinical review",
  },
  {
    name: "Hearing-care education series",
    trigger: "NPPCD hearing-loss prevention reference",
    platforms: ["Reel", "YouTube short", "Clinic poster"],
    copy: "Difficulty hearing conversations can affect everyday connection. A professional hearing evaluation can help identify the appropriate next step.",
    safety: "Do not promise treatment outcome; align terminology with approved clinical guidance.",
    stage: "Evidence ready",
  },
];

export const marketQuestions = [
  "Which Hyderabad localities generate verified appointment inquiries?",
  "Which ENT topics are supported by search, review and social-response signals?",
  "Which competitors dominate local listing visibility and why?",
  "Which communities or referral partners produce measurable patient access outcomes?",
];

export const outreachTracks = [
  {
    audience: "Resident communities",
    first30: "Identify nearby communities and offer reviewed hearing-health awareness material.",
    next60: "Run one documented education session with consented lead capture.",
    next90: "Measure referrals and repeat only effective partnerships.",
  },
  {
    audience: "Referring clinicians",
    first30: "Create an accurate services and referral information pack.",
    next60: "Record outreach and questions requiring doctor clarification.",
    next90: "Attribute suitable referrals without marketing medical outcomes.",
  },
  {
    audience: "Schools and workplaces",
    first30: "Develop hearing-safety and voice-care education proposals.",
    next60: "Pilot an approved session with attendance tracking.",
    next90: "Evaluate inquiry quality and educational benefit.",
  },
];

export const websiteChecks = [
  { area: "Business facts", status: "Needs verification", action: "Confirm locations, hours, phone numbers and doctor credentials." },
  { area: "ENT service pages", status: "Audit queued", action: "Check discoverability, plain-language explanations and safe calls to action." },
  { area: "Google Business Profile", status: "Connect source", action: "Track listing completeness, reviews, calls and direction requests." },
  { area: "Medical claims", status: "Approval required", action: "Flag unverified outcomes, superlatives and urgent-care ambiguity." },
];

export const resultMeasures = [
  { label: "Discovery", measures: ["Google listing views", "Search impressions", "Directions requests"] },
  { label: "Intent", measures: ["Phone taps", "WhatsApp inquiries", "Appointment form submits"] },
  { label: "Trust", measures: ["Review themes", "Educational saves", "Approved content performance"] },
  { label: "Execution", measures: ["Approval turnaround", "Posts scheduled", "Recommendation outcomes"] },
];

export type StrategyWeek = {
  week: string;
  dates: string;
  objective: string;
  pillar: string;
  trigger: string;
  deliverables: string[];
  tasks: Array<{ owner: string; task: string; due: string }>;
  measurement: string;
};

export function buildEightWeekSchedule(input?: {
  bestFormat?: string;
  publishingWindow?: string;
  engagementSignal?: string;
}): StrategyWeek[] {
  const format = input?.bestFormat ?? "Doctor-led carousel or short video";
  const window = input?.publishingWindow ?? "Publishing window to be validated from connected channel analytics";
  const signal = input?.engagementSignal ?? "Measure performance after publishing";
  return [
    {
      week: "Week 1",
      dates: "27 May - 2 Jun 2026",
      objective: "Respond to an official awareness moment with safe ENT education.",
      pillar: "Doctor authority",
      trigger: "World No Tobacco Day / WHO / 31 May",
      deliverables: [`${format}: tobacco and throat-health education`, "Google Business Profile awareness post", "WhatsApp approved reminder"],
      tasks: [
        { owner: "Strategist", task: "Define objective, CTA and evidence source", due: "27 May" },
        { owner: "Clinical reviewer", task: "Approve preventive wording", due: "28 May" },
        { owner: "Publisher", task: `Schedule in measured window: ${window}`, due: "30 May" },
      ],
      measurement: `${signal}; track saves, profile actions and inquiries.`,
    },
    {
      week: "Week 2",
      dates: "3 - 9 Jun 2026",
      objective: "Explain when everyday ENT symptoms warrant professional guidance.",
      pillar: "Search trust",
      trigger: "Evergreen patient education",
      deliverables: [`${format}: sinus/allergy symptom explainer`, "Website service-page check", "Short FAQ response set"],
      tasks: [
        { owner: "Insights", task: "Review highest-response symptom topic", due: "3 Jun" },
        { owner: "Production", task: "Draft platform variants", due: "5 Jun" },
        { owner: "Clinical reviewer", task: "Review claims and escalation language", due: "6 Jun" },
      ],
      measurement: "Saves, website actions and qualified question themes.",
    },
    {
      week: "Week 3",
      dates: "10 - 16 Jun 2026",
      objective: "Increase hearing-care awareness using India's public-health reference.",
      pillar: "Doctor authority",
      trigger: "DGHS/MoHFW NPPCD",
      deliverables: ["Hearing evaluation education reel", "Telugu adaptation after approval", "Clinic-ready informational asset"],
      tasks: [
        { owner: "Strategist", task: "Attach NPPCD evidence and audience goal", due: "10 Jun" },
        { owner: "Doctor", task: "Record or approve clinical explanation", due: "12 Jun" },
        { owner: "Publisher", task: "Release approved language variants", due: "15 Jun" },
      ],
      measurement: "Video completion, saves and hearing-service inquiries.",
    },
    {
      week: "Week 4",
      dates: "17 - 23 Jun 2026",
      objective: "Make centre discovery and appointment access accurate.",
      pillar: "Search trust",
      trigger: "Verified location and listing accuracy audit",
      deliverables: ["Centre/location confirmation post", "Google listing audit actions", "Hours and contact verification checklist"],
      tasks: [
        { owner: "Front office", task: "Confirm centre facts and hours", due: "17 Jun" },
        { owner: "Listings owner", task: "Resolve GBP connection and compare locations", due: "19 Jun" },
        { owner: "Analyst", task: "Baseline profile actions once connected", due: "22 Jun" },
      ],
      measurement: "Location actions, direction requests and phone taps once GBP is restored.",
    },
    {
      week: "Week 5",
      dates: "24 - 30 Jun 2026",
      objective: "Turn strong content patterns into a clinically reviewed repeatable series.",
      pillar: "Learning loop",
      trigger: "Connected Instagram performance evidence",
      deliverables: [`Repeatable ${format} series brief`, "Top-post repurpose candidate", "Approval-ready media brief"],
      tasks: [
        { owner: "Analyst", task: "Identify best format and timing signal", due: "24 Jun" },
        { owner: "Production", task: "Repurpose one proven education format", due: "26 Jun" },
        { owner: "Doctor", task: "Approve revised clinical text", due: "29 Jun" },
      ],
      measurement: `Compare to measured baseline: ${signal}.`,
    },
    {
      week: "Week 6",
      dates: "1 - 7 Jul 2026",
      objective: "Reach nearby communities through education rather than unsupported promotion.",
      pillar: "Community access",
      trigger: "Outreach pathway planning",
      deliverables: ["RWA hearing-health session proposal", "Referral information sheet", "Consent-aware lead capture plan"],
      tasks: [
        { owner: "Outreach lead", task: "Identify suitable local partner list", due: "1 Jul" },
        { owner: "Clinical reviewer", task: "Approve education material", due: "3 Jul" },
        { owner: "Coordinator", task: "Log outreach and follow-up tasks", due: "6 Jul" },
      ],
      measurement: "Partner responses, attendance and attributable inquiries.",
    },
    {
      week: "Week 7",
      dates: "8 - 14 Jul 2026",
      objective: "Create a multilingual patient education test with controlled meaning.",
      pillar: "Accessible communication",
      trigger: "Hyderabad language planning and audience response",
      deliverables: ["Approved English master copy", "Telugu variant", "Language-performance measurement brief"],
      tasks: [
        { owner: "Production", task: "Prepare English master based on approved topic", due: "8 Jul" },
        { owner: "Clinical reviewer", task: "Lock medical meaning before translation", due: "9 Jul" },
        { owner: "Publisher", task: "Publish labelled language test", due: "12 Jul" },
      ],
      measurement: "Language-specific saves, shares and inquiry quality.",
    },
    {
      week: "Week 8",
      dates: "15 - 21 Jul 2026",
      objective: "Close the strategy cycle and decide what earns another eight weeks.",
      pillar: "Measurement and iteration",
      trigger: "Eight-week review",
      deliverables: ["Outcome report", "Next-cycle recommendations", "Content and outreach decisions"],
      tasks: [
        { owner: "Analyst", task: "Compile channel and workflow metrics", due: "15 Jul" },
        { owner: "Leadership", task: "Approve continuation or correction decisions", due: "17 Jul" },
        { owner: "Strategist", task: "Generate next eight-week plan", due: "20 Jul" },
      ],
      measurement: "Review outcomes against objectives, approvals, reach and patient-access actions.",
    },
  ];
}
