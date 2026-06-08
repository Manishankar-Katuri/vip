import type { ContentExecutionDocumentMode, PlannedCalendarItem } from "./types";

export const NO_CONTENT_CALENDAR_DATA_ERROR = "No content calendar data found for this workspace and execution window.";

export function assertCalendarDataForMode(
  mode: ContentExecutionDocumentMode,
  plannedItems: PlannedCalendarItem[]
) {
  if (mode === "real" && plannedItems.length === 0) {
    throw new Error(NO_CONTENT_CALENDAR_DATA_ERROR);
  }
}
