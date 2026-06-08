import type { ExecutionWindow } from "./types";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const SEND_TIME = "09:00";

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
};

export function determineExecutionWindow(
  runDate: Date = new Date(),
  timezone = DEFAULT_TIMEZONE
): ExecutionWindow {
  const parts = getLocalDateParts(runDate, timezone);
  const sendWeekday = [0, 3, 6].includes(parts.weekday)
    ? parts.weekday
    : nextSendWeekday(parts.weekday);
  const sendDate = addLocalDays(parts, daysUntil(parts.weekday, sendWeekday));

  if (sendWeekday === 0) {
    const start = addLocalDays(sendDate, 1);
    const end = addLocalDays(sendDate, 3);

    return {
      windowType: "MONDAY_WEDNESDAY",
      sendDay: "Sunday",
      sendTime: SEND_TIME,
      windowStartDate: toIsoDate(start),
      windowEndDate: toIsoDate(end),
      label: "Monday-Wednesday Content Execution Plan",
      purpose: "Prepare for first half of week",
      timezone,
    };
  }

  if (sendWeekday === 3) {
    const start = addLocalDays(sendDate, 1);
    const end = addLocalDays(sendDate, 3);

    return {
      windowType: "THURSDAY_SATURDAY",
      sendDay: "Wednesday",
      sendTime: SEND_TIME,
      windowStartDate: toIsoDate(start),
      windowEndDate: toIsoDate(end),
      label: "Thursday-Saturday Content Execution Plan",
      purpose: "Prepare for second half of week",
      timezone,
    };
  }

  const start = addLocalDays(sendDate, 1);
  const end = addLocalDays(sendDate, 3);

  return {
    windowType: "WEEKEND_NEXT_WEEK",
    sendDay: "Saturday",
    sendTime: SEND_TIME,
    windowStartDate: toIsoDate(start),
    windowEndDate: toIsoDate(end),
    label: "Weekend + Next Week Preparation Plan",
    purpose: "Prepare for weekend + next week start",
    timezone,
  };
}

export function determineFromTodayExecutionWindow(
  runDate: Date = new Date(),
  timezone = DEFAULT_TIMEZONE
): ExecutionWindow {
  const start = getLocalDateParts(runDate, timezone);
  const end = addLocalDays(start, 2);

  return {
    windowType: "FROM_TODAY",
    sendDay: "Manual",
    sendTime: SEND_TIME,
    windowStartDate: toIsoDate(start),
    windowEndDate: toIsoDate(end),
    label: `${formatWindowRange(start, end)} Content Execution Plan`,
    purpose: "Prepare and execute the next 3 days of content from today.",
    timezone,
    generationMode: "fromToday",
  };
}

export const CONTENT_EXECUTION_CRON_JOBS = [
  { cron: "0 9 * * 0", timezone: DEFAULT_TIMEZONE, label: "Sunday content execution plan" },
  { cron: "0 9 * * 3", timezone: DEFAULT_TIMEZONE, label: "Wednesday content execution plan" },
  { cron: "0 9 * * 6", timezone: DEFAULT_TIMEZONE, label: "Saturday content execution plan" },
] as const;

export function dateRangeForWindow(window: ExecutionWindow) {
  return {
    start: fromIsoDate(window.windowStartDate),
    end: endOfIsoDate(window.windowEndDate),
  };
}

export function dayName(date: string, timezone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(fromIsoDate(date));
}

function nextSendWeekday(weekday: number) {
  if (weekday < 3) return 3;
  if (weekday < 6) return 6;
  return 0;
}

function daysUntil(from: number, to: number) {
  return (to - from + 7) % 7;
}

function getLocalDateParts(date: Date, timezone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: weekdays.indexOf(value("weekday")),
  };
}

function addLocalDays(parts: LocalDateParts, days: number): LocalDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    weekday: date.getUTCDay(),
  };
}

function toIsoDate(parts: Pick<LocalDateParts, "year" | "month" | "day">) {
  return [
    parts.year.toString().padStart(4, "0"),
    parts.month.toString().padStart(2, "0"),
    parts.day.toString().padStart(2, "0"),
  ].join("-");
}

function formatWindowRange(start: LocalDateParts, end: LocalDateParts) {
  const startDate = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const endDate = new Date(Date.UTC(end.year, end.month - 1, end.day));
  const startDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(endDate);

  return `${startDay}–${endLabel}`;
}

function fromIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfIsoDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}
