# VIP Production Content Calendar System

Phase D.2 introduces the operational planning engine at `/production/content-calendar`.

## Security

The calendar uses the existing production authorization stack:

1. JWT validation.
2. Role payload validation.
3. Permission validation through `manage_calendar`.
4. Hospital context validation through `CurrentHospitalService`.

Production users are global users and can switch active hospitals. Admin users can access through permission ownership. Doctor and staff users do not receive `manage_calendar`.

## Database

New enums:

- `ContentCalendarType`
- `ContentCalendarStatus`
- `ContentCalendarPriority`
- `ContentCalendarCategory`

New models:

- `ContentCalendarItem`
- `ContentCalendarScript`

`ContentCalendarItem` stores the planning record for posts, reels, stories, YouTube shorts, blogs, special days, campaign-linked content, assignment, tags, schedule, status, priority, drag position, and soft deletion through `deletedAt`.

`ContentCalendarScript` is a one-to-one script relation stub for future Script Studio integration. Script generation is not implemented in this phase.

`campaignId` is nullable and intentionally string-based until the Campaign Manager schema lands.

## Backend API

Calendar APIs are mounted under `/production/content-calendar`:

- `GET /production/content-calendar`
- `POST /production/content-calendar`
- `PATCH /production/content-calendar/:id`
- `DELETE /production/content-calendar/:id`

Deletes are soft deletes. All reads and writes are constrained to the resolved active hospital.

## Filtering

The list endpoint accepts:

- `status`
- `contentType`
- `category`
- `assignedTo`
- `campaignId`
- `dateFrom`
- `dateTo`

The response includes the filtered items, available filter metadata, and summary counts.

## Frontend

The production calendar page supports:

- month view
- week view
- list view
- summary panel
- filters
- create, edit, update, and soft delete
- hospital-aware reload
- basic reschedule controls as the drag/drop foundation

The page calls the backend through a single calendar API family and relies on `apiFetch` for `x-hospital-id` propagation.
