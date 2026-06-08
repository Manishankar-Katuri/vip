export type MorningBriefingDto = {
  hospital:{
    id:string;
    name:string;
    specialty:string | null;
    city:string | null;
  };
  generatedAt:string;
  welcome:{
    greeting:string;
    currentVipScore:number;
    scoreTrend:"UP" | "DOWN" | "STABLE";
    lastUpdated:string;
  };
  vipHealthScore:{
    overallScore:number;
    previousScore:number;
    changePercent:number;
    status:"Excellent" | "Good" | "Needs Attention" | "Critical";
  };
  revenue:{
    influencedRevenue:number;
    trend:"UP" | "DOWN" | "STABLE";
    topContributingChannels:Array<{
      channel:string;
      value:number;
    }>;
    summary:string;
  };
  reputation:{
    averageRating:number;
    reviewVolume:number;
    positiveTrend:number;
    negativeTrend:number;
    sentimentSummary:string;
  };
  social:{
    instagramGrowth:number;
    facebookGrowth:number;
    engagement:number;
    bestPerformingContent:string;
    summary:string;
  };
  competitor:{
    currentRanking:string;
    topCompetitor:string;
    movement:string;
    keyOpportunity:string;
  };
  insightOfTheDay:{
    title:string;
    summary:string;
    confidence:number;
  };
  goals:Array<{
    title:string;
    progress:number;
    targetDate:string;
    status:string;
  }>;
  recommendations:Array<{
    title:string;
    action:string;
    priority:string;
    confidence:number;
  }>;
};
