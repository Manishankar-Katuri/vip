import { UserRole } from "@prisma/client";

import { Permission } from "../auth/permissions/permissions.enum";
import { OverviewAggregationService } from "./overview-aggregation.service";

const baseHospital = {
  id:"hospital-1",
  name:"Harika ENT Care",
  slug:"harika-ent-care",
  specialty:"ENT",
  city:"Hyderabad",
  status:"ACTIVE"
};

const baseReview = {
  id:"review-1",
  workspaceId:"hospital-1",
  author:"Patient",
  rating:5,
  content:"Helpful doctor.",
  source:"GOOGLE",
  sentiment:"POSITIVE",
  category:null,
  issueDetected:false,
  aiReply:null,
  status:"PENDING",
  createdAt:new Date()
};

function createPrismaMock(
  overrides:Partial<ReturnType<typeof createData>> = {}
) {
  const data = {
    ...createData(),
    ...overrides
  };

  return {
    hospitalWorkspace:{
      findUniqueOrThrow:jest.fn().mockResolvedValue(data.hospital)
    },
    review:{
      findMany:jest.fn().mockResolvedValue(data.reviews)
    },
    reviewAlert:{
      count:jest.fn().mockResolvedValue(data.openAlerts)
    },
    intelligenceSignal:{
      findMany:jest.fn().mockResolvedValue(data.signals)
    },
    intelligencePriority:{
      findMany:jest.fn().mockResolvedValue(data.priorities)
    },
    recommendationProvenance:{
      findMany:jest.fn().mockResolvedValue(data.recommendations)
    },
    recommendationOutcomeTracking:{
      findMany:jest.fn().mockResolvedValue(data.outcomes)
    },
    contentCalendarItem:{
      findMany:jest.fn().mockResolvedValue(data.calendarItems)
    },
    contentGeneratorRun:{
      findMany:jest.fn().mockResolvedValue(data.generatorRuns)
    }
  };
}

function createData() {
  return {
    hospital:baseHospital,
    reviews:[baseReview],
    openAlerts:0,
    signals:[
      {
        id:"signal-1",
        workspaceId:"hospital-1",
        signalType:"SOCIAL_GROWTH_TREND",
        direction:"UP",
        severity:"HIGH",
        summary:"Patient engagement increased 18% this month.",
        sourceEventIds:[],
        relatedEntities:[],
        temporalWindow:{},
        scores:{ impact:80, momentum:18 },
        evidence:{},
        propagation:{},
        graphLinks:{},
        correlationKey:"social-growth",
        idempotencyKey:"signal-1",
        detectedAt:new Date(),
        metadata:{},
        createdAt:new Date()
      }
    ],
    priorities:[
      {
        id:"priority-1",
        workspaceId:"hospital-1",
        kind:"STRATEGY",
        title:"Improve local search visibility",
        reason:"Google Business Profile can capture more appointment-ready searches.",
        urgency:0.9,
        confidence:0.92,
        expectedImpact:0.88,
        executionComplexity:0.3,
        strategicImportance:0.95,
        relatedEntities:[],
        supportingSignals:[],
        causalFindings:[],
        evidence:{},
        recommendedActions:["Optimize Google Business Profile"],
        createdAt:new Date()
      }
    ],
    recommendations:[
      {
        id:"recommendation-1",
        workspaceId:"hospital-1",
        title:"Increase short-form education",
        rationale:"Video content is outperforming static posts.",
        supportingSignals:[],
        graphEvidence:{},
        causalEvidence:{},
        historicalComparisons:{},
        expectedOutcome:"More qualified inquiries",
        confidence:0.9,
        executionSteps:["Create a weekly ENT explainer reel."],
        relatedPriorityIds:[],
        downstreamRisks:[],
        downstreamOpportunities:[],
        createdAt:new Date()
      }
    ],
    outcomes:[
      {
        id:"outcome-1",
        workspaceId:"hospital-1",
        recommendationId:"recommendation-1",
        targetKpis:{},
        baseline:{},
        expectedOutcome:"More qualified inquiries",
        measurementWindow:{},
        effectivenessHooks:{},
        confidenceEvolution:{ progress:40 },
        createdAt:new Date(),
        updatedAt:new Date()
      }
    ],
    calendarItems:[
      {
        id:"calendar-1",
        hospitalId:"hospital-1",
        title:"ENT education video",
        description:"",
        contentType:"REEL",
        category:"EDUCATIONAL",
        status:"IN_PRODUCTION",
        priority:"HIGH",
        scheduledDate:new Date(),
        publishedDate:null,
        campaignId:null,
        createdBy:"user-1",
        assignedTo:null,
        tags:[],
        isSpecialDay:false,
        specialDayName:null,
        position:0,
        deletedAt:null,
        createdAt:new Date(),
        updatedAt:new Date()
      }
    ],
    generatorRuns:[
      {
        id:"run-1",
        hospitalId:"hospital-1",
        createdBy:"user-1",
        idea:"ENT video",
        platform:"Instagram",
        format:"Reel",
        audience:"",
        objective:"",
        doctorName:null,
        serviceLine:null,
        languagePlan:"",
        urgency:"normal",
        requestType:"outside_strategy",
        desiredPublishDate:null,
        strategyFit:"Aligned",
        contentPillar:"education",
        generatedContext:{},
        evidence:[],
        safetyNotes:[],
        output:{},
        status:"FAILED",
        rejectionReason:null,
        calendarItemId:null,
        scriptId:null,
        createdAt:new Date(),
        updatedAt:new Date()
      }
    ]
  };
}

function createService(
  input:{
    permissions:Permission[];
    prisma?:ReturnType<typeof createPrismaMock>;
    openai?:unknown;
  }
) {
  const prisma = input.prisma ?? createPrismaMock();
  const permissionService = {
    getRoleAccess:jest.fn().mockResolvedValue(input.permissions)
  };
  const aiUsageTracker = {
    execute:jest.fn((request) => request.operation())
  };

  const service = new OverviewAggregationService(
    prisma as never,
    permissionService as never,
    aiUsageTracker as never,
    (input.openai ?? null) as never
  );

  return {
    service,
    prisma,
    permissionService,
    aiUsageTracker
  };
}

describe("OverviewAggregationService", () => {
  it("returns only analytics and strategy for a limited doctor permission set", async () => {
    const { service } = createService({
      permissions:[
        Permission.VIEW_REVENUE,
        Permission.VIEW_STRATEGY
      ]
    });

    const overview = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });

    expect(overview.visibleModules).toEqual([
      "analytics",
      "strategy"
    ]);
    expect(overview.cards.map((card) => card.type)).toEqual([
      "analytics",
      "strategy"
    ]);
    expect(overview.source.cacheStatus).toBe("refreshed");
    expect(JSON.stringify(overview)).not.toContain("recommendations");
    expect(JSON.stringify(overview)).not.toContain("automation");
  });

  it("returns all overview card types for owner access", async () => {
    const { service } = createService({
      permissions:Object.values(Permission)
    });

    const overview = await service.generate({
      hospitalId:"hospital-1",
      userId:"owner-1",
      roleId:UserRole.ADMIN
    });

    expect(overview.cards.map((card) => card.type)).toEqual([
      "analytics",
      "intelligence",
      "strategy",
      "recommendations",
      "automation"
    ]);
    expect(overview.cards.every((card) => card.dataStatus === "live")).toBe(true);
  });

  it("sends only permission-filtered facts to OpenAI", async () => {
    const create = jest.fn().mockResolvedValue({
      output_text:JSON.stringify({
        summary:"Local search visibility is the highest priority today."
      }),
      usage:{
        input_tokens:10,
        output_tokens:5,
        total_tokens:15
      }
    });
    const { service } = createService({
      permissions:[
        Permission.VIEW_REVENUE,
        Permission.VIEW_STRATEGY
      ],
      openai:{
        responses:{ create }
      }
    });

    await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });

    const request = create.mock.calls[0][0];
    const userMessage = request.input[1].content;

    expect(userMessage).toContain("analytics");
    expect(userMessage).toContain("strategy");
    expect(userMessage).not.toContain("recommendations");
    expect(userMessage).not.toContain("automation");
  });

  it("falls back when OpenAI generation fails", async () => {
    const { service } = createService({
      permissions:[
        Permission.VIEW_REVENUE,
        Permission.VIEW_STRATEGY
      ],
      openai:{
        responses:{
          create:jest.fn().mockRejectedValue(new Error("API down"))
        }
      }
    });

    const overview = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });

    expect(overview.summaryStatus).toBe("fallback");
    expect(overview.executiveSummary).toContain("Strategic focus");
  });

  it("returns stale cache while a background refresh updates the next request", async () => {
    const prisma = createPrismaMock();
    const { service } = createService({
      permissions:[
        Permission.VIEW_REVENUE,
        Permission.VIEW_STRATEGY
      ],
      prisma
    });

    const first = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });
    const cache = (service as unknown as {
      cache:Map<string, {
        refreshedAt:number;
        refreshPromise?:Promise<unknown>;
      }>;
    }).cache;
    const cacheKey = "hospital-1:DOCTOR:doctor-1";
    const cached = cache.get(cacheKey);

    expect(cached).toBeDefined();
    cached!.refreshedAt = Date.now() - 3 * 60 * 1000;
    prisma.hospitalWorkspace.findUniqueOrThrow.mockResolvedValueOnce({
      ...baseHospital,
      name:"Updated Hospital"
    });

    const stale = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });

    expect(stale.hospital.name).toBe(first.hospital.name);
    await cache.get(cacheKey)?.refreshPromise;

    const refreshed = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });

    expect(refreshed.hospital.name).toBe("Updated Hospital");
  });

  it("bypasses cached payload when refresh is requested", async () => {
    const prisma = createPrismaMock();
    const { service } = createService({
      permissions:[
        Permission.VIEW_REVENUE,
        Permission.VIEW_STRATEGY
      ],
      prisma
    });

    await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });
    prisma.hospitalWorkspace.findUniqueOrThrow.mockResolvedValueOnce({
      ...baseHospital,
      name:"Refresh Hospital"
    });

    const refreshed = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR,
      refresh:true
    });

    expect(refreshed.hospital.name).toBe("Refresh Hospital");
    expect(refreshed.source.cacheStatus).toBe("refreshed");
  });

  it("marks empty strategy data without old sample copy", async () => {
    const { service } = createService({
      permissions:[
        Permission.VIEW_STRATEGY
      ],
      prisma:createPrismaMock({
        priorities:[],
        outcomes:[]
      })
    });

    const overview = await service.generate({
      hospitalId:"hospital-1",
      userId:"doctor-1",
      roleId:UserRole.DOCTOR
    });
    const strategy = overview.cards.find((card) => card.type === "strategy");

    expect(strategy?.dataStatus).toBe("empty");
    expect(JSON.stringify(strategy)).not.toContain("Improve local search visibility");
    expect(JSON.stringify(strategy)).not.toContain("Optimize Google Business Profile");
  });
});
