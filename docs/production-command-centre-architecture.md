# VIP Production Command Centre Foundation

Phase D.1 introduces the Production Portal surface: `/production/command-centre`.

## Security

The production command centre uses the existing authorization stack:

1. JWT validation.
2. Role payload validation.
3. Permission validation through `view_content`.
4. Hospital context validation through `CurrentHospitalService`.

Production users are global users and can switch active hospitals at runtime. Admin users can access through permission ownership. Doctor and staff users do not receive `view_content`, so they are redirected by middleware and rejected by the API guard.

## Route

- `/production/command-centre`

The `/production` index redirects to the command centre. The production layout provides the header, hospital switcher, user menu placeholder, notifications placeholder, sidebar, and workspace content area.

## Placeholder Routes

These routes are present as foundations only and display "Coming in next phase":

- `/production/content-calendar`
- `/production/script-studio`
- `/production/content-pipeline`
- `/production/campaigns`
- `/production/social-intelligence`
- `/production/hashtags`

No calendar, script generation, pipeline, campaign, or hashtag logic is implemented in this phase.

## Backend API

Production APIs are mounted under `/production`:

- `GET /production/command-centre`

The endpoint returns a single DTO containing:

- active hospital
- content pipeline summary
- upcoming content
- campaign summary
- approval summary

## Aggregation Layer

`ProductionCommandCentreService` builds the command centre payload from existing platform records:

- `HospitalWorkspace` for active hospital context.
- `ContentDraft` for content status, upcoming items, and approval readiness.
- `IntelligenceSignal` for social intelligence context.
- `IntelligencePriority` for production blockers.

The service avoids financial, revenue, user administration, and audit data.

## Frontend Authorization

The production sidebar is permission-driven. Items are shown only when the current user has the matching permission:

- content tools use `view_content` and `create_content`
- campaign tools use `manage_campaigns` and `manage_calendar`
- analytics tools use `view_social_intelligence` and `manage_hashtags`

The hospital switcher is visible for global users so Production can switch hospitals without receiving hospital administration permissions.
