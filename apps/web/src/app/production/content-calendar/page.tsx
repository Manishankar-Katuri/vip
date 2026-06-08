"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCheck,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Rows3,
  Save,
  Tag,
  Trash2
} from "lucide-react";

import { useHospital } from "@/hooks/useHospital";
import { apiFetch } from "@/lib/api-client";
import { hasPermission, PERMISSIONS } from "@/permissions-core";

type CalendarView = "month" | "week" | "list";

type CalendarItem = {
  id:string;
  hospitalId:string;
  title:string;
  description:string;
  contentType:ContentType;
  category:ContentCategory;
  status:ContentStatus;
  priority:Priority;
  scheduledDate:string;
  publishedDate:string | null;
  campaignId:string | null;
  createdBy:string;
  assignedTo:string | null;
  tags:string[];
  isSpecialDay:boolean;
  specialDayName:string | null;
  position:number;
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

type ContentType =
  | "REEL"
  | "POST"
  | "CAROUSEL"
  | "STORY"
  | "YOUTUBE_SHORT"
  | "BLOG";

type ContentStatus =
  | "IDEA"
  | "PLANNED"
  | "SCRIPT_READY"
  | "IN_PRODUCTION"
  | "READY_TO_POST"
  | "PUBLISHED"
  | "CANCELLED";

type Priority = "LOW" | "MEDIUM" | "HIGH";

type ContentCategory =
  | "EDUCATIONAL"
  | "AWARENESS"
  | "PROMOTIONAL"
  | "PATIENT_STORY"
  | "DOCTOR_BRANDING"
  | "SEASONAL"
  | "SPECIAL_DAY"
  | "TRENDING";

type CalendarResponse = {
  items:CalendarItem[];
  filters:{
    statuses:ContentStatus[];
    contentTypes:ContentType[];
    categories:ContentCategory[];
    priorities:Priority[];
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

type CalendarFilters = {
  status:string;
  contentType:string;
  category:string;
  assignedTo:string;
  campaignId:string;
  dateFrom:string;
  dateTo:string;
};

type ItemFormState = {
  id?:string;
  title:string;
  description:string;
  contentType:ContentType;
  category:ContentCategory;
  status:ContentStatus;
  priority:Priority;
  scheduledDate:string;
  publishedDate:string;
  campaignId:string;
  assignedTo:string;
  tags:string;
  isSpecialDay:boolean;
  specialDayName:string;
};

type DailyPlaybookTask = {
  label:string;
  detail:string;
  tone:"plan" | "produce" | "approve" | "measure";
};

const DEFAULT_FILTERS:CalendarFilters = {
  status:"",
  contentType:"",
  category:"",
  assignedTo:"",
  campaignId:"",
  dateFrom:"",
  dateTo:""
};

const DEFAULT_FORM:ItemFormState = {
  title:"",
  description:"",
  contentType:"POST",
  category:"EDUCATIONAL",
  status:"IDEA",
  priority:"MEDIUM",
  scheduledDate:toDateInput(new Date()),
  publishedDate:"",
  campaignId:"",
  assignedTo:"",
  tags:"",
  isSpecialDay:false,
  specialDayName:""
};

const DAILY_PLAYBOOK:DailyPlaybookTask[] = [
  {
    label:"Review and reset",
    detail:"Check last week performance, fill calendar gaps, and confirm special-day needs.",
    tone:"measure"
  },
  {
    label:"Plan topics",
    detail:"Pick the day's content mission, campaign, owner, format, and audience need.",
    tone:"plan"
  },
  {
    label:"Write scripts",
    detail:"Draft hook, caption, clinical claims, CTA, and approval notes before production.",
    tone:"plan"
  },
  {
    label:"Capture assets",
    detail:"Shoot doctor bytes, clinic visuals, patient-safe b-roll, or design references.",
    tone:"produce"
  },
  {
    label:"Edit and package",
    detail:"Finalize creative, caption, hashtags, thumbnail, and platform-specific version.",
    tone:"produce"
  },
  {
    label:"Clinical approval",
    detail:"Get final sign-off, resolve comments, and move ready content into schedule.",
    tone:"approve"
  },
  {
    label:"Publish and learn",
    detail:"Post ready work, check early responses, and capture learnings for next cycle.",
    tone:"measure"
  }
];

const DEMO_CALENDAR_RESPONSE:CalendarResponse = {
  items:[
    sampleItem({
      id:"demo-calendar-1",
      title:"Monday performance reset",
      description:"Review last week's posts, identify the best hook, and choose two content gaps to fill this week.",
      contentType:"POST",
      category:"EDUCATIONAL",
      status:"PLANNED",
      priority:"MEDIUM",
      scheduledDate:addDays(startOfDay(new Date()), 0),
      assignedTo:"demo-producer",
      assigneeName:"Production lead",
      tags:["weekly review", "planning"]
    }),
    sampleItem({
      id:"demo-calendar-2",
      title:"Doctor myth-busting reel",
      description:"Draft a 30-second doctor script that corrects one common ENT misconception with safe wording.",
      contentType:"REEL",
      category:"DOCTOR_BRANDING",
      status:"SCRIPT_READY",
      priority:"HIGH",
      scheduledDate:addDays(startOfDay(new Date()), 1),
      assignedTo:"demo-writer",
      assigneeName:"Script writer",
      tags:["doctor reel", "myth busting"],
      scriptTitle:"ENT myth-busting reel script"
    }),
    sampleItem({
      id:"demo-calendar-3",
      title:"Clinic b-roll capture",
      description:"Capture reception, consultation-room, and equipment shots for this week's reels and carousels.",
      contentType:"STORY",
      category:"AWARENESS",
      status:"IN_PRODUCTION",
      priority:"MEDIUM",
      scheduledDate:addDays(startOfDay(new Date()), 3),
      assignedTo:"demo-creator",
      assigneeName:"Content creator",
      tags:["assets", "clinic visuals"]
    }),
    sampleItem({
      id:"demo-calendar-4",
      title:"Weekly publishing checklist",
      description:"Approve caption, thumbnail, platform tags, and clinical wording before scheduling.",
      contentType:"CAROUSEL",
      category:"EDUCATIONAL",
      status:"READY_TO_POST",
      priority:"HIGH",
      scheduledDate:addDays(startOfDay(new Date()), 5),
      assignedTo:"demo-approver",
      assigneeName:"Clinical reviewer",
      tags:["approval", "ready"]
    })
  ],
  filters:{
    statuses:[
      "IDEA",
      "PLANNED",
      "SCRIPT_READY",
      "IN_PRODUCTION",
      "READY_TO_POST",
      "PUBLISHED",
      "CANCELLED"
    ],
    contentTypes:[
      "REEL",
      "POST",
      "CAROUSEL",
      "STORY",
      "YOUTUBE_SHORT",
      "BLOG"
    ],
    categories:[
      "EDUCATIONAL",
      "AWARENESS",
      "PROMOTIONAL",
      "PATIENT_STORY",
      "DOCTOR_BRANDING",
      "SEASONAL",
      "SPECIAL_DAY",
      "TRENDING"
    ],
    priorities:["LOW", "MEDIUM", "HIGH"],
    assignedUsers:[
      {
        id:"demo-producer",
        email:"producer@vip.local",
        name:"Production lead"
      },
      {
        id:"demo-writer",
        email:"writer@vip.local",
        name:"Script writer"
      },
      {
        id:"demo-creator",
        email:"creator@vip.local",
        name:"Content creator"
      },
      {
        id:"demo-approver",
        email:"doctor@vip.local",
        name:"Clinical reviewer"
      }
    ],
    campaigns:[
      {
        id:"weekly-growth",
        title:"Weekly growth rhythm"
      }
    ]
  },
  summary:{
    contentPlanned:4,
    readyToPost:1,
    published:0,
    overdue:0,
    upcomingThisWeek:4
  }
};

export default function ProductionContentCalendarPage() {
  const { activeHospital, currentUser } = useHospital();
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [filters, setFilters] =
    useState<CalendarFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(startOfDay(new Date()));
  const [form, setForm] = useState<ItemFormState | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canPreview = !currentUser;
  const canManageCalendar =
    canPreview || hasPermission(currentUser, PERMISSIONS.MANAGE_CALENDAR);

  const loadCalendar = useCallback(async () => {
    if (!activeHospital) {
      return;
    }

    setIsLoading(true);
    setError(null);

    if (canPreview) {
      setData(DEMO_CALENDAR_RESPONSE);
      setIsLoading(false);
      return;
    }

    try {
      const query = buildQuery(filters);
      const response = await apiFetch<CalendarResponse>(
        `/production/content-calendar${query}`
      );

      setData(response);
    } catch {
      setData(DEMO_CALENDAR_RESPONSE);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeHospital, canPreview, filters]);

  useEffect(() => {
    void Promise.resolve().then(loadCalendar);
  }, [loadCalendar]);

  const items = data?.items ?? [];
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  const moveCalendarItem = async (
    item:CalendarItem,
    date:Date
  ) => {
    if (canPreview) {
      setData((current) =>
        current
          ? {
              ...current,
              items:current.items.map((candidate) =>
                candidate.id === item.id
                  ? {
                      ...candidate,
                      scheduledDate:date.toISOString(),
                      position:candidate.position + 1
                    }
                  : candidate
              )
            }
          : current
      );
      setSelectedItemId(item.id);
      return;
    }

    await apiFetch(`/production/content-calendar/${item.id}`, {
      method:"PATCH",
      body:JSON.stringify({
        scheduledDate:date.toISOString(),
        position:item.position + 1
      })
    });
    setSelectedItemId(item.id);
    await loadCalendar();
  };

  const deleteCalendarItem = async (
    item:CalendarItem
  ) => {
    if (canPreview) {
      setData((current) =>
        current
          ? {
              ...current,
              items:current.items.filter((candidate) => candidate.id !== item.id)
            }
          : current
      );
      setSelectedItemId(null);
      return;
    }

    await apiFetch(`/production/content-calendar/${item.id}`, {
      method:"DELETE"
    });
    setSelectedItemId(null);
    await loadCalendar();
  };

  const saveCalendarItem = async () => {
    if (!form) {
      return;
    }

    const payload = payloadFromForm(form);

    if (canPreview) {
      const localItem = calendarItemFromForm(
        form,
        activeHospital?.id ?? "demo-hospital"
      );

      setData((current) => {
        const base = current ?? DEMO_CALENDAR_RESPONSE;
        const exists = base.items.some((item) => item.id === localItem.id);

        return {
          ...base,
          items:exists
            ? base.items.map((item) =>
                item.id === localItem.id ? localItem : item
              )
            : [...base.items, localItem],
          summary:summarizeItems(
            exists
              ? base.items.map((item) =>
                  item.id === localItem.id ? localItem : item
                )
              : [...base.items, localItem]
          )
        };
      });
      setSelectedItemId(localItem.id);
      setForm(null);
      return;
    }

    if (form.id) {
      await apiFetch(`/production/content-calendar/${form.id}`, {
        method:"PATCH",
        body:JSON.stringify(payload)
      });
    } else {
      await apiFetch("/production/content-calendar", {
        method:"POST",
        body:JSON.stringify(payload)
      });
    }
    setForm(null);
    await loadCalendar();
  };

  return (
    <>
      {!canManageCalendar ? (
        <AccessDenied />
      ) : (
      <div className="space-y-6">
        <Header
          activeHospitalName={activeHospital?.name ?? "Select hospital"}
          view={view}
          setView={setView}
          onCreate={() => setForm(DEFAULT_FORM)}
        />

        {data ? <Summary summary={data.summary} /> : null}

        <Filters
          filters={filters}
          response={data}
          setFilters={setFilters}
        />

        {isLoading ? (
          <StatePanel message="Loading content calendar..." />
        ) : error ? (
          <StatePanel message={error} tone="danger" />
        ) : data ? (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <CalendarWorkspace
              view={view}
              items={items}
              anchorDate={anchorDate}
              setAnchorDate={setAnchorDate}
              selectedItemId={selectedItem?.id ?? null}
              onSelect={(item) => setSelectedItemId(item.id)}
              onCreateDate={(date) =>
                setForm({
                  ...DEFAULT_FORM,
                  scheduledDate:toDateInput(date)
                })
              }
              onEdit={(item) => setForm(formFromItem(item))}
              onMove={async (item, date) => {
                await moveCalendarItem(item, date);
              }}
              onDelete={async (item) => {
                await deleteCalendarItem(item);
              }}
            />
            <ReadinessPanel
              item={selectedItem}
              onEdit={(item) => setForm(formFromItem(item))}
              onMove={async (item, offset) => {
                await moveCalendarItem(
                  item,
                  addDays(new Date(item.scheduledDate), offset)
                );
              }}
              onDelete={async (item) => {
                await deleteCalendarItem(item);
              }}
            />
          </div>
        ) : (
          <StatePanel message="Select an active hospital to plan content." />
        )}

        {form ? (
          <ItemEditor
            form={form}
            response={data}
            setForm={setForm}
            onClose={() => setForm(null)}
            onSave={saveCalendarItem}
          />
        ) : null}
      </div>
      )}
    </>
  );
}

function Header({
  activeHospitalName,
  view,
  setView,
  onCreate
}: Readonly<{
  activeHospitalName:string;
  view:CalendarView;
  setView:(view:CalendarView) => void;
  onCreate:() => void;
}>) {
  return (
    <section className="rounded-lg bg-stone-950 p-6 text-white shadow-sm lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            Content Calendar
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal lg:text-4xl">
            {activeHospitalName}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-200">
            Master planning for posts, reels, campaigns, special days,
            scripts, and everyday execution tasks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SegmentedControl
            view={view}
            setView={setView}
          />
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-emerald-950"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
            New Item
          </button>
        </div>
      </div>
    </section>
  );
}

function SegmentedControl({
  view,
  setView
}: Readonly<{
  view:CalendarView;
  setView:(view:CalendarView) => void;
}>) {
  const options:Array<{
    value:CalendarView;
    label:string;
    icon:React.ComponentType<{ className?:string }>;
  }> = [
    { value:"month", label:"Month", icon:LayoutGrid },
    { value:"week", label:"Week", icon:Rows3 },
    { value:"list", label:"List", icon:List }
  ];

  return (
    <div className="inline-flex rounded-lg border border-white/15 bg-white/10 p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === view;

        return (
          <button
            key={option.value}
            className={[
              "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium",
              active
                ? "bg-white text-stone-950"
                : "text-stone-200 hover:bg-white/10"
            ].join(" ")}
            onClick={() => setView(option.value)}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Summary({
  summary
}: Readonly<{
  summary:CalendarResponse["summary"];
}>) {
  const cards = [
    {
      label:"Content Planned",
      value:summary.contentPlanned,
      icon:CalendarDays
    },
    {
      label:"Ready To Post",
      value:summary.readyToPost,
      icon:CheckCircle2
    },
    {
      label:"Published",
      value:summary.published,
      icon:Save
    },
    {
      label:"Overdue",
      value:summary.overdue,
      icon:Clock
    },
    {
      label:"Upcoming This Week",
      value:summary.upcomingThisWeek,
      icon:Rows3
    }
  ];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950">
            Readiness
          </p>
          <p className="text-sm text-stone-500">
            Planned work, production state, and publishing risk at a glance.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
          Production calendar
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-stone-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Filters({
  filters,
  response,
  setFilters
}: Readonly<{
  filters:CalendarFilters;
  response:CalendarResponse | null;
  setFilters:React.Dispatch<React.SetStateAction<CalendarFilters>>;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-700">
        <Filter className="h-4 w-4" />
        Planning filters
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <SelectFilter
          label="Status"
          value={filters.status}
          options={response?.filters.statuses ?? []}
          onChange={(status) =>
            setFilters((current) => ({ ...current, status }))
          }
        />
        <SelectFilter
          label="Type"
          value={filters.contentType}
          options={response?.filters.contentTypes ?? []}
          onChange={(contentType) =>
            setFilters((current) => ({ ...current, contentType }))
          }
        />
        <SelectFilter
          label="Category"
          value={filters.category}
          options={response?.filters.categories ?? []}
          onChange={(category) =>
            setFilters((current) => ({ ...current, category }))
          }
        />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-stone-600">Assigned</span>
          <select
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
            value={filters.assignedTo}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                assignedTo:event.target.value
              }))
            }
          >
            <option value="">All</option>
            {(response?.filters.assignedUsers ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ?? user.email}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-stone-600">Campaign</span>
          <select
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
            value={filters.campaignId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                campaignId:event.target.value
              }))
            }
          >
            <option value="">All</option>
            {(response?.filters.campaigns ?? []).map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
        </label>
        <DateFilter
          label="From"
          value={filters.dateFrom}
          onChange={(dateFrom) =>
            setFilters((current) => ({ ...current, dateFrom }))
          }
        />
        <DateFilter
          label="To"
          value={filters.dateTo}
          onChange={(dateTo) =>
            setFilters((current) => ({ ...current, dateTo }))
          }
        />
      </div>
    </section>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange
}: Readonly<{
  label:string;
  value:string;
  options:string[];
  onChange:(value:string) => void;
}>) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-stone-600">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange
}: Readonly<{
  label:string;
  value:string;
  onChange:(value:string) => void;
}>) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-stone-600">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CalendarWorkspace({
  view,
  items,
  anchorDate,
  setAnchorDate,
  selectedItemId,
  onSelect,
  onCreateDate,
  onEdit,
  onMove,
  onDelete
}: Readonly<{
  view:CalendarView;
  items:CalendarItem[];
  anchorDate:Date;
  setAnchorDate:(date:Date) => void;
  selectedItemId:string | null;
  onSelect:(item:CalendarItem) => void;
  onCreateDate:(date:Date) => void;
  onEdit:(item:CalendarItem) => void;
  onMove:(item:CalendarItem, date:Date) => Promise<void>;
  onDelete:(item:CalendarItem) => Promise<void>;
}>) {
  if (view === "list") {
    return (
      <ListView
        items={items}
        selectedItemId={selectedItemId}
        onSelect={onSelect}
        onCreateDate={onCreateDate}
        onEdit={onEdit}
        onMove={onMove}
        onDelete={onDelete}
      />
    );
  }

  const days = view === "month"
    ? monthDays(anchorDate)
    : weekDays(anchorDate);

  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <CalendarToolbar
        view={view}
        anchorDate={anchorDate}
        setAnchorDate={setAnchorDate}
      />
      <div className="grid grid-cols-7 border-t border-stone-200 text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="border-r border-stone-100 py-2 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7">
        {days.map((day) => {
          const dailyTask = dailyPlaybookTask(day);
          const dayItems = items
            .filter((item) => sameDay(new Date(item.scheduledDate), day))
            .sort((left, right) => left.position - right.position);

          return (
            <div
              key={day.toISOString()}
              className={[
                "min-h-36 border-t border-stone-100 p-3 md:border-r md:last:border-r-0",
                !sameMonth(day, anchorDate) && view === "month"
                  ? "bg-stone-50 text-stone-400"
                  : "bg-white"
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {day.getDate()}
                </span>
                {isToday(day) ? (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                    Today
                  </span>
                ) : null}
              </div>
              <DailyTaskCard
                task={dailyTask}
                itemCount={dayItems.length}
                onCreate={() => onCreateDate(day)}
              />
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <CalendarItemChip
                    key={item.id}
                    item={item}
                    selected={item.id === selectedItemId}
                    onSelect={() => onSelect(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CalendarToolbar({
  view,
  anchorDate,
  setAnchorDate
}: Readonly<{
  view:CalendarView;
  anchorDate:Date;
  setAnchorDate:(date:Date) => void;
}>) {
  const shift = view === "month" ? 30 : 7;

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold">
        {view === "month"
          ? anchorDate.toLocaleDateString("en-IN", {
              month:"long",
              year:"numeric"
            })
          : `Week of ${formatDate(startOfWeek(anchorDate))}`}
      </h2>
      <div className="flex gap-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200"
          aria-label="Previous period"
          onClick={() => setAnchorDate(addDays(anchorDate, -shift))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="h-9 rounded-lg border border-stone-200 px-3 text-sm font-medium"
          onClick={() => setAnchorDate(startOfDay(new Date()))}
        >
          Today
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200"
          aria-label="Next period"
          onClick={() => setAnchorDate(addDays(anchorDate, shift))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DailyTaskCard({
  task,
  itemCount,
  onCreate
}: Readonly<{
  task:DailyPlaybookTask;
  itemCount:number;
  onCreate:() => void;
}>) {
  return (
    <div
      className={[
        "mb-2 rounded-lg border p-2 text-xs",
        dailyTaskClass(task.tone)
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {task.label}
          </p>
          <p className="mt-1 line-clamp-2 leading-4 opacity-85">
            {task.detail}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-white/65 px-1.5 py-0.5 font-semibold">
          {itemCount || "0"}
        </span>
      </div>
      {itemCount === 0 ? (
        <button
          type="button"
          className="mt-2 inline-flex h-6 items-center gap-1 rounded-md bg-white/75 px-2 text-[11px] font-semibold hover:bg-white"
          onClick={onCreate}
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      ) : null}
    </div>
  );
}

function ListView({
  items,
  selectedItemId,
  onSelect,
  onCreateDate,
  onEdit,
  onMove,
  onDelete
}: Readonly<{
  items:CalendarItem[];
  selectedItemId:string | null;
  onSelect:(item:CalendarItem) => void;
  onCreateDate:(date:Date) => void;
  onEdit:(item:CalendarItem) => void;
  onMove:(item:CalendarItem, date:Date) => Promise<void>;
  onDelete:(item:CalendarItem) => Promise<void>;
}>) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 p-4">
        <h2 className="text-lg font-semibold">List View</h2>
      </div>
      <div className="divide-y divide-stone-100">
        {(items.length ? items : []).map((item) => (
          <div
            key={item.id}
            className={[
              "grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_140px_140px_160px]",
              item.id === selectedItemId ? "bg-emerald-50/70" : ""
            ].join(" ")}
          >
            <CalendarItemCard
              item={item}
              selected={item.id === selectedItemId}
              onSelect={() => onSelect(item)}
              onEdit={() => onEdit(item)}
              onMove={(offset) =>
                onMove(
                  item,
                  addDays(new Date(item.scheduledDate), offset)
                )
              }
              onDelete={() => onDelete(item)}
            />
            <MetaBlock label="Date" value={formatDate(item.scheduledDate)} />
            <MetaBlock label="Status" value={labelize(item.status)} />
            <MetaBlock
              label="Assigned"
              value={item.assignee?.name ?? item.assignee?.email ?? "Open"}
            />
          </div>
        ))}
        {items.length === 0 ? (
          <div className="p-8">
            <p className="text-sm text-stone-500">
              No content matches the current filters.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-900 px-3 text-sm font-semibold text-white"
              onClick={() => onCreateDate(new Date())}
            >
              <Plus className="h-4 w-4" />
              Add today&apos;s item
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CalendarItemChip({
  item,
  selected,
  onSelect
}: Readonly<{
  item:CalendarItem;
  selected:boolean;
  onSelect:() => void;
}>) {
  return (
    <button
      type="button"
      className={[
        "w-full rounded-lg border p-2 text-left text-xs shadow-sm transition",
        selected
          ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
          : "border-stone-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
      ].join(" ")}
      onClick={onSelect}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-semibold text-stone-700">
          {labelize(item.contentType)}
        </span>
        <span
          className={[
            "rounded-md px-1.5 py-0.5 font-semibold",
            priorityClass(item.priority)
          ].join(" ")}
        >
          {item.priority}
        </span>
      </div>
      <p className="truncate font-semibold text-stone-950">
        {item.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={statusPillClass(item.status)}>
          {labelize(item.status)}
        </span>
        {item.isSpecialDay ? (
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-900">
            Special
          </span>
        ) : null}
      </div>
    </button>
  );
}

function CalendarItemCard({
  item,
  selected,
  onSelect,
  onEdit,
  onMove,
  onDelete
}: Readonly<{
  item:CalendarItem;
  selected:boolean;
  onSelect:() => void;
  onEdit:() => void;
  onMove:(offset:number) => Promise<void>;
  onDelete:() => Promise<void>;
}>) {
  return (
    <article
      className={[
        "rounded-lg border bg-white p-3 shadow-sm",
        selected ? "border-emerald-300 ring-1 ring-emerald-100" : "border-stone-200"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            type="button"
            className="block max-w-full truncate text-left text-sm font-semibold text-stone-950 hover:text-emerald-900"
            onClick={onSelect}
          >
            {item.title}
          </button>
          <p className="mt-1 text-xs text-stone-500">
            {labelize(item.contentType)} / {labelize(item.category)}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
            priorityClass(item.priority)
          ].join(" ")}
        >
          {item.priority}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {item.description || "No description added."}
      </p>
      {item.isSpecialDay ? (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
          {item.specialDayName || "Special day"}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="inline-flex h-7 items-center gap-1 rounded-md border border-stone-200 px-2 text-xs font-medium"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
        <Link
          className="h-7 rounded-md border border-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
          href={`/production/script-studio?calendarItemId=${item.id}`}
        >
          Script
        </Link>
        <button
          className="h-7 rounded-md border border-stone-200 px-2 text-xs font-medium"
          onClick={() => void onMove(-1)}
        >
          -1 day
        </button>
        <button
          className="h-7 rounded-md border border-stone-200 px-2 text-xs font-medium"
          onClick={() => void onMove(1)}
        >
          +1 day
        </button>
        <button
          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-100 px-2 text-xs font-medium text-red-700"
          onClick={() => void onDelete()}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </article>
  );
}

function ReadinessPanel({
  item,
  onEdit,
  onMove,
  onDelete
}: Readonly<{
  item:CalendarItem | null;
  onEdit:(item:CalendarItem) => void;
  onMove:(item:CalendarItem, offset:number) => Promise<void>;
  onDelete:(item:CalendarItem) => Promise<void>;
}>) {
  if (!item) {
    return (
      <aside className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm xl:sticky xl:top-24">
        Select a calendar item to see production readiness.
      </aside>
    );
  }

  const checks = readinessChecks(item);

  return (
    <aside className="rounded-lg border border-stone-200 bg-white shadow-sm xl:sticky xl:top-24">
      <div className="border-b border-stone-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Selected item
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {item.description || "No brief added yet."}
            </p>
          </div>
          <span className={statusPillClass(item.status)}>
            {labelize(item.status)}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <InspectorMeta
            label="Scheduled"
            value={formatDate(item.scheduledDate)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <InspectorMeta
            label="Owner"
            value={item.assignee?.name ?? item.assignee?.email ?? "Open"}
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
          <InspectorMeta
            label="Campaign"
            value={item.campaignId ?? "No campaign"}
            icon={<Rows3 className="h-4 w-4" />}
          />
          <InspectorMeta
            label="Format"
            value={`${labelize(item.contentType)} / ${labelize(item.category)}`}
            icon={<LayoutGrid className="h-4 w-4" />}
          />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-950">
              Approval readiness
            </p>
            <span
              className={[
                "rounded-md px-2 py-0.5 text-xs font-semibold",
                priorityClass(item.priority)
              ].join(" ")}
            >
              {item.priority}
            </span>
          </div>
          <div className="space-y-2">
            {checks.map((check) => {
              const Icon = check.done ? CheckCircle2 : AlertCircle;

              return (
                <div
                  key={check.label}
                  className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3"
                >
                  <Icon
                    className={[
                      "mt-0.5 h-4 w-4",
                      check.done ? "text-emerald-700" : "text-amber-700"
                    ].join(" ")}
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {check.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      {check.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {item.tags.length || item.isSpecialDay ? (
          <section>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-950">
              <Tag className="h-4 w-4" />
              Planning tags
            </p>
            <div className="flex flex-wrap gap-2">
              {item.isSpecialDay ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  {item.specialDayName || "Special day"}
                </span>
              ) : null}
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-medium"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <Link
            className="inline-flex h-9 items-center rounded-lg border border-emerald-100 px-3 text-sm font-medium text-emerald-800"
            href={`/production/script-studio?calendarItemId=${item.id}`}
          >
            Script
          </Link>
          <button
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm font-medium"
            onClick={() => void onMove(item, -1)}
          >
            -1 day
          </button>
          <button
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm font-medium"
            onClick={() => void onMove(item, 1)}
          >
            +1 day
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-sm font-medium text-red-700"
            onClick={() => void onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}

function InspectorMeta({
  label,
  value,
  icon
}: Readonly<{
  label:string;
  value:string;
  icon:React.ReactNode;
}>) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-stone-800">
        {value}
      </p>
    </div>
  );
}

function MetaBlock({
  label,
  value
}: Readonly<{
  label:string;
  value:string;
}>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-stone-700">{value}</p>
    </div>
  );
}

function ItemEditor({
  form,
  response,
  setForm,
  onClose,
  onSave
}: Readonly<{
  form:ItemFormState;
  response:CalendarResponse | null;
  setForm:React.Dispatch<React.SetStateAction<ItemFormState | null>>;
  onClose:() => void;
  onSave:() => Promise<void>;
}>) {
  const update = <K extends keyof ItemFormState>(
    key:K,
    value:ItemFormState[K]
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]:value
          }
        : current
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 p-4">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-semibold">
            {form.id ? "Edit calendar item" : "Create calendar item"}
          </h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-stone-600">Title</span>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-stone-600">Description</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-stone-200 p-3"
              value={form.description}
              onChange={(event) =>
                update("description", event.target.value)
              }
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <EditorSelect
              label="Type"
              value={form.contentType}
              options={response?.filters.contentTypes ?? ["POST"]}
              onChange={(value) => update("contentType", value as ContentType)}
            />
            <EditorSelect
              label="Category"
              value={form.category}
              options={response?.filters.categories ?? ["EDUCATIONAL"]}
              onChange={(value) =>
                update("category", value as ContentCategory)
              }
            />
            <EditorSelect
              label="Status"
              value={form.status}
              options={response?.filters.statuses ?? ["IDEA"]}
              onChange={(value) => update("status", value as ContentStatus)}
            />
            <EditorSelect
              label="Priority"
              value={form.priority}
              options={response?.filters.priorities ?? ["MEDIUM"]}
              onChange={(value) => update("priority", value as Priority)}
            />
            <label className="space-y-1 text-sm">
              <span className="font-medium text-stone-600">Scheduled</span>
              <input
                className="h-10 w-full rounded-lg border border-stone-200 px-3"
                type="date"
                value={form.scheduledDate}
                onChange={(event) =>
                  update("scheduledDate", event.target.value)
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-stone-600">Published</span>
              <input
                className="h-10 w-full rounded-lg border border-stone-200 px-3"
                type="date"
                value={form.publishedDate}
                onChange={(event) =>
                  update("publishedDate", event.target.value)
                }
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-stone-600">Assigned</span>
              <select
                className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3"
                value={form.assignedTo}
                onChange={(event) =>
                  update("assignedTo", event.target.value)
                }
              >
                <option value="">Open</option>
                {(response?.filters.assignedUsers ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-stone-600">Campaign ID</span>
              <input
                className="h-10 w-full rounded-lg border border-stone-200 px-3"
                value={form.campaignId}
                onChange={(event) =>
                  update("campaignId", event.target.value)
                }
              />
            </label>
          </div>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-stone-600">Tags</span>
            <input
              className="h-10 w-full rounded-lg border border-stone-200 px-3"
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="Reels, ENT, awareness"
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.isSpecialDay}
              onChange={(event) =>
                update("isSpecialDay", event.target.checked)
              }
            />
            <span className="font-medium text-stone-700">
              Special day content
            </span>
          </label>
          {form.isSpecialDay ? (
            <label className="space-y-1 text-sm">
              <span className="font-medium text-stone-600">Special Day</span>
              <input
                className="h-10 w-full rounded-lg border border-stone-200 px-3"
                value={form.specialDayName}
                onChange={(event) =>
                  update("specialDayName", event.target.value)
                }
              />
            </label>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-200 p-5">
          <button
            className="h-10 rounded-lg border border-stone-200 px-4 text-sm font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white"
            onClick={() => void onSave()}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorSelect({
  label,
  value,
  options,
  onChange
}: Readonly<{
  label:string;
  value:string;
  options:string[];
  onChange:(value:string) => void;
}>) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-stone-600">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labelize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatePanel({
  message,
  tone = "default"
}: Readonly<{
  message:string;
  tone?:"default" | "danger";
}>) {
  return (
    <div
      className={[
        "rounded-lg border p-8 text-sm shadow-sm",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-stone-200 bg-white text-stone-600"
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function AccessDenied() {
  return (
    <StatePanel
      tone="danger"
      message="You do not have access to the production content calendar."
    />
  );
}

function buildQuery(
  filters:CalendarFilters
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(
        key,
        value
      );
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

function sampleItem({
  id,
  title,
  description,
  contentType,
  category,
  status,
  priority,
  scheduledDate,
  assignedTo,
  assigneeName,
  tags,
  scriptTitle
}: Readonly<{
  id:string;
  title:string;
  description:string;
  contentType:ContentType;
  category:ContentCategory;
  status:ContentStatus;
  priority:Priority;
  scheduledDate:Date;
  assignedTo:string;
  assigneeName:string;
  tags:string[];
  scriptTitle?:string;
}>):CalendarItem {
  return {
    id,
    hospitalId:"demo-hospital",
    title,
    description,
    contentType,
    category,
    status,
    priority,
    scheduledDate:scheduledDate.toISOString(),
    publishedDate:null,
    campaignId:"weekly-growth",
    createdBy:"demo-user",
    assignedTo,
    tags,
    isSpecialDay:false,
    specialDayName:null,
    position:0,
    creator:{
      id:"demo-user",
      email:"production@vip.local",
      name:"Production"
    },
    assignee:{
      id:assignedTo,
      email:`${assignedTo}@vip.local`,
      name:assigneeName
    },
    script:scriptTitle
      ? {
          id:`${id}-script`,
          status:"READY",
          title:scriptTitle
        }
      : null
  };
}

function payloadFromForm(
  form:ItemFormState
) {
  return {
    title:form.title,
    description:form.description,
    contentType:form.contentType,
    category:form.category,
    status:form.status,
    priority:form.priority,
    scheduledDate:dateInputToIso(form.scheduledDate),
    publishedDate:form.publishedDate
      ? dateInputToIso(form.publishedDate)
      : null,
    campaignId:form.campaignId || null,
    assignedTo:form.assignedTo || null,
    tags:form.tags,
    isSpecialDay:form.isSpecialDay,
    specialDayName:form.specialDayName || null
  };
}

function formFromItem(
  item:CalendarItem
):ItemFormState {
  return {
    id:item.id,
    title:item.title,
    description:item.description,
    contentType:item.contentType,
    category:item.category,
    status:item.status,
    priority:item.priority,
    scheduledDate:toDateInput(new Date(item.scheduledDate)),
    publishedDate:item.publishedDate
      ? toDateInput(new Date(item.publishedDate))
      : "",
    campaignId:item.campaignId ?? "",
    assignedTo:item.assignedTo ?? "",
    tags:item.tags.join(", "),
    isSpecialDay:item.isSpecialDay,
    specialDayName:item.specialDayName ?? ""
  };
}

function calendarItemFromForm(
  form:ItemFormState,
  hospitalId:string
):CalendarItem {
  const id =
    form.id ??
    `preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    hospitalId,
    title:form.title || "Untitled content task",
    description:form.description,
    contentType:form.contentType,
    category:form.category,
    status:form.status,
    priority:form.priority,
    scheduledDate:dateInputToIso(form.scheduledDate),
    publishedDate:form.publishedDate
      ? dateInputToIso(form.publishedDate)
      : null,
    campaignId:form.campaignId || null,
    createdBy:"preview-user",
    assignedTo:form.assignedTo || null,
    tags:form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isSpecialDay:form.isSpecialDay,
    specialDayName:form.specialDayName || null,
    position:0,
    creator:{
      id:"preview-user",
      email:"preview@vip.local",
      name:"Preview user"
    },
    assignee:form.assignedTo
      ? {
          id:form.assignedTo,
          email:`${form.assignedTo}@vip.local`,
          name:form.assignedTo
        }
      : null,
    script:null
  };
}

function summarizeItems(
  items:CalendarItem[]
):CalendarResponse["summary"] {
  const now = startOfDay(new Date());
  const weekEnd = addDays(now, 7);

  return {
    contentPlanned:items.length,
    readyToPost:items.filter((item) => item.status === "READY_TO_POST").length,
    published:items.filter((item) => item.status === "PUBLISHED").length,
    overdue:items.filter(
      (item) =>
        new Date(item.scheduledDate) < now &&
        item.status !== "PUBLISHED" &&
        item.status !== "CANCELLED"
    ).length,
    upcomingThisWeek:items.filter((item) => {
      const scheduled = new Date(item.scheduledDate);

      return scheduled >= now && scheduled <= weekEnd;
    }).length
  };
}

function monthDays(
  anchor:Date
) {
  const first = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1
  );
  const start = startOfWeek(first);

  return Array.from(
    { length:42 },
    (_, index) => addDays(start, index)
  );
}

function weekDays(
  anchor:Date
) {
  const start = startOfWeek(anchor);

  return Array.from(
    { length:7 },
    (_, index) => addDays(start, index)
  );
}

function startOfWeek(
  date:Date
) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());

  return start;
}

function startOfDay(
  date:Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addDays(
  date:Date,
  days:number
) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function sameDay(
  left:Date,
  right:Date
) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function sameMonth(
  left:Date,
  right:Date
) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function isToday(
  date:Date
) {
  return sameDay(
    date,
    new Date()
  );
}

function dailyPlaybookTask(
  date:Date
) {
  return DAILY_PLAYBOOK[date.getDay()];
}

function toDateInput(
  date:Date
) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateInputToIso(
  value:string
) {
  return new Date(`${value}T09:00:00`).toISOString();
}

function formatDate(
  value:string | Date
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:"numeric",
      month:"short",
      year:"numeric"
    }
  ).format(typeof value === "string" ? new Date(value) : value);
}

function labelize(
  value:string
) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readinessChecks(
  item:CalendarItem
) {
  const scriptReady =
    Boolean(item.script) ||
    ["SCRIPT_READY", "IN_PRODUCTION", "READY_TO_POST", "PUBLISHED"].includes(
      item.status
    );
  const readyToPost =
    item.status === "READY_TO_POST" || item.status === "PUBLISHED";

  return [
    {
      label:"Brief added",
      detail:item.description
        ? "Production has a usable working brief."
        : "Add a short brief before scripting.",
      done:Boolean(item.description)
    },
    {
      label:"Owner assigned",
      detail:item.assignee
        ? `${item.assignee.name ?? item.assignee.email} owns this item.`
        : "Assign an owner before production starts.",
      done:Boolean(item.assignee)
    },
    {
      label:"Script ready",
      detail:scriptReady
        ? item.script?.title ?? "Script status is ready or beyond."
        : "Open Script Studio when the brief is approved.",
      done:scriptReady
    },
    {
      label:"Ready to post",
      detail:readyToPost
        ? "This item has cleared the publishing readiness gate."
        : "Keep this visible until clinical and production review are complete.",
      done:readyToPost
    }
  ];
}

function dailyTaskClass(
  tone:DailyPlaybookTask["tone"]
) {
  if (tone === "produce") return "border-blue-100 bg-blue-50 text-blue-900";
  if (tone === "approve") return "border-amber-100 bg-amber-50 text-amber-900";
  if (tone === "measure") return "border-emerald-100 bg-emerald-50 text-emerald-900";

  return "border-stone-200 bg-stone-50 text-stone-800";
}

function statusPillClass(
  status:ContentStatus
) {
  const base = "rounded-md px-2 py-0.5 text-xs font-semibold";

  if (status === "PUBLISHED") return `${base} bg-emerald-100 text-emerald-900`;
  if (status === "READY_TO_POST") return `${base} bg-green-50 text-green-800`;
  if (status === "IN_PRODUCTION") return `${base} bg-blue-50 text-blue-800`;
  if (status === "SCRIPT_READY") return `${base} bg-cyan-50 text-cyan-800`;
  if (status === "CANCELLED") return `${base} bg-red-50 text-red-700`;
  if (status === "PLANNED") return `${base} bg-amber-50 text-amber-800`;

  return `${base} bg-stone-100 text-stone-700`;
}

function priorityClass(
  priority:Priority
) {
  if (priority === "HIGH") return "bg-red-50 text-red-700";
  if (priority === "LOW") return "bg-stone-100 text-stone-600";

  return "bg-amber-50 text-amber-700";
}
