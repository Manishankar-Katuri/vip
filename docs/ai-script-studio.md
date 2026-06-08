# VIP AI Script Studio

Phase D.3 introduces the production Script Studio at `/production/script-studio`.

## Security

The studio uses the existing production authorization stack:

1. JWT validation.
2. Role payload validation.
3. Permission validation through `create_content`.
4. Hospital context validation through `CurrentHospitalService`.

Production users can generate scripts for the active hospital. Admin users can access through permission ownership. Doctor and staff users do not receive `create_content`.

## Database

`ContentCalendarScript` now supports versioned scripts:

- `calendarItemId`
- `hospitalId`
- `scriptType`
- `status`
- `hook`
- `script`
- `caption`
- `cta`
- `hashtags`
- `metadata`
- `version`
- `createdBy`
- `approvedBy`
- `approvedAt`

The one-script-per-calendar-item constraint was removed and replaced with `@@unique([calendarItemId, version])`. Each regeneration creates a new version and retains previous versions.

New enums:

- `ContentScriptType`
- `ContentScriptStatus`

## Backend API

Script Studio APIs are mounted under `/production/script-studio`:

- `GET /production/script-studio`
- `GET /production/script-studio/:id`
- `POST /production/script-studio/generate`
- `POST /production/script-studio`
- `PATCH /production/script-studio/:id`
- `DELETE /production/script-studio/:id`

Deletes archive scripts by setting `status = ARCHIVED`.

## Provider Architecture

Generation runs through `ContentGenerationService`, which depends on an `AIContentProvider` interface.

The provider interface supports:

- `generateScript()`
- `generateCaption()`
- `generateHooks()`
- `generateCTAs()`

The current adapter is `MockContentProvider`, so this phase does not couple VIP to OpenAI, Claude, Gemini, or any specific AI vendor. Future providers can implement the same interface.

## Brand Voice Integration

Generation context includes:

- active hospital name
- specialty
- city
- brand voice tone
- style
- audience
- messaging
- selected calendar item
- selected template
- doctor name
- goal
- tone

## Calendar Integration

The content calendar links to Script Studio with `calendarItemId` in the URL. Script generation requires a calendar item and stores the generated version against that item. The calendar response continues to expose the latest linked script for planning surfaces.

## Frontend

The studio has:

- left generation input panel
- center script editor
- right hooks, CTA, hashtags, and version panel
- template presets
- auto-save foundation
- approval field foundation

No publishing, scheduling, collaboration, social posting, or approval workflow is implemented in this phase.
