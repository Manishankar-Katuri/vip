import {
  ContentCalendarCategory,
  ContentCalendarPriority,
  ContentCalendarStatus,
  ContentCalendarType
} from "@prisma/client";

export type ContentCalendarItemDto = {
  id:string;
  hospitalId:string;
  title:string;
  description:string;
  contentType:ContentCalendarType;
  category:ContentCalendarCategory;
  status:ContentCalendarStatus;
  priority:ContentCalendarPriority;
  scheduledDate:string;
  publishedDate:string | null;
  campaignId:string | null;
  createdBy:string;
  assignedTo:string | null;
  tags:string[];
  isSpecialDay:boolean;
  specialDayName:string | null;
  position:number;
  createdAt:string;
  updatedAt:string;
  creator:{
    id:string;
    email:string;
    name:string | null;
  };
  assignee:{
    id:string;
    email:string;
    name:string | null;
  } | null;
  script:{
    id:string;
    status:string;
    title:string;
  } | null;
};

export type ContentCalendarResponseDto = {
  items:ContentCalendarItemDto[];
  filters:{
    statuses:ContentCalendarStatus[];
    contentTypes:ContentCalendarType[];
    categories:ContentCalendarCategory[];
    priorities:ContentCalendarPriority[];
    assignedUsers:Array<{
      id:string;
      email:string;
      name:string | null;
    }>;
    campaigns:Array<{
      id:string;
      title:string;
    }>;
  };
  summary:{
    contentPlanned:number;
    readyToPost:number;
    published:number;
    overdue:number;
    upcomingThisWeek:number;
  };
};

export type ContentCalendarQuery = {
  status?:string;
  contentType?:string;
  category?:string;
  assignedTo?:string;
  campaignId?:string;
  dateFrom?:string;
  dateTo?:string;
};
