export type ProductionCommandCentreDto = {
  activeHospital:{
    id:string;
    name:string;
    specialty:string | null;
    city:string | null;
    status:string;
  };
  generatedAt:string;
  pipelineSummary:{
    totalContent:number;
    draft:number;
    approved:number;
    published:number;
    status:string;
  };
  upcomingContent:Array<{
    id:string;
    title:string;
    platform:string;
    status:string;
    scheduledFor:string;
  }>;
  campaignSummary:{
    activeCampaigns:number;
    plannedCampaigns:number;
    socialSignals:number;
    summary:string;
  };
  approvalSummary:{
    pendingApprovals:number;
    readyToPublish:number;
    blockedItems:number;
    summary:string;
  };
};
