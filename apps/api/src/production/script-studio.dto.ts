import {
  ContentCalendarCategory,
  ContentCalendarType,
  ContentScriptStatus,
  ContentScriptType
} from "@prisma/client";

export type ScriptStudioTemplate = {
  id:string;
  title:string;
  type:string;
  goal:string;
  tone:string;
  category:ContentCalendarCategory;
  scriptType:ContentScriptType;
};

export type ScriptStudioResponseDto = {
  scripts:ScriptStudioScriptDto[];
  calendarItems:Array<{
    id:string;
    title:string;
    description:string;
    contentType:ContentCalendarType;
    category:ContentCalendarCategory;
    scheduledDate:string;
    specialDayName:string | null;
  }>;
  templates:ScriptStudioTemplate[];
  brandVoice:{
    tone:string;
    style:string;
    audience:string;
    messaging:string;
  } | null;
};

export type ScriptStudioScriptDto = {
  id:string;
  calendarItemId:string;
  hospitalId:string;
  title:string;
  scriptType:ContentScriptType;
  status:ContentScriptStatus;
  hook:string;
  script:string;
  caption:string;
  cta:string;
  hashtags:string[];
  metadata:unknown;
  version:number;
  createdBy:string;
  approvedBy:string | null;
  approvedAt:string | null;
  createdAt:string;
  updatedAt:string;
  calendarItem:{
    id:string;
    title:string;
    category:ContentCalendarCategory;
    contentType:ContentCalendarType;
  };
};
