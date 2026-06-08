import { Permission } from "../auth/permissions/permissions.enum";

export type OverviewModuleType =
  | "analytics"
  | "intelligence"
  | "strategy"
  | "recommendations"
  | "automation";

export type OverviewSummaryStatus =
  | "generated"
  | "fallback";

export type OverviewTrendDirection =
  | "UP"
  | "DOWN"
  | "STABLE";

export type OverviewDataStatus =
  | "live"
  | "fallback"
  | "empty";

export type OverviewCacheStatus =
  | "fresh"
  | "stale"
  | "refreshed";

export type OverviewHospitalDto = {
  id:string;
  name:string;
  slug:string;
  specialty:string | null;
  city:string | null;
  status:string;
};

export type OverviewMetricDto = {
  label:string;
  value:string;
  trend:OverviewTrendDirection;
  detail:string;
};

export type OverviewInsightDto = {
  label:string;
  title:string;
  detail:string;
  tone:"info" | "success" | "warning" | "danger" | "neutral";
};

export type OverviewCard =
  | {
      type:"analytics";
      title:string;
      description:string;
      dataStatus:OverviewDataStatus;
      metrics:OverviewMetricDto[];
    }
  | {
      type:"intelligence";
      title:string;
      description:string;
      dataStatus:OverviewDataStatus;
      insights:OverviewInsightDto[];
    }
  | {
      type:"strategy";
      title:string;
      description:string;
      dataStatus:OverviewDataStatus;
      focus:string;
      topOpportunity:string;
      highestPriorityAction:string;
      progress:{
        completed:number;
        total:number;
        label:string;
      };
    }
  | {
      type:"recommendations";
      title:string;
      description:string;
      dataStatus:OverviewDataStatus;
      recommendations:Array<{
        title:string;
        action:string;
        confidence:number;
      }>;
    }
  | {
      type:"automation";
      title:string;
      description:string;
      dataStatus:OverviewDataStatus;
      activeAutomations:number;
      completedThisWeek:number;
      attentionRequired:number;
      detail:string;
    };

export type OverviewQuickAction = {
  id:string;
  label:string;
  detail:string;
  href:string;
  module:OverviewModuleType;
  priority:"HIGH" | "MEDIUM" | "LOW";
};

export type OverviewResponseDto = {
  hospital:OverviewHospitalDto;
  generatedAt:string;
  source:{
    generatedAt:string;
    cacheStatus:OverviewCacheStatus;
  };
  permissions:Permission[];
  visibleModules:OverviewModuleType[];
  executiveSummary:string;
  summaryStatus:OverviewSummaryStatus;
  cards:OverviewCard[];
  quickActions:OverviewQuickAction[];
};
