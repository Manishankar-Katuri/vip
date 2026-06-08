# VIP Doctor Morning Briefing Portal

Phase C.1 introduces the first doctor-facing portal surface: `/doctor/morning-briefing`.

## Security

The morning briefing uses the existing authorization stack:

1. JWT validation.
2. Role payload validation.
3. Permission validation through `view_morning_briefing`.
4. Hospital context validation through `CurrentHospitalService`.

Doctors and staff remain hospital-scoped. Admin users can access the briefing through permission ownership and must provide or select an active hospital context. Production and staff users do not receive the briefing permission.

## Route

- `/doctor/morning-briefing`

The frontend route is wrapped by the dedicated doctor layout and uses `PermissionGate` instead of role checks.

## Backend API

Doctor APIs are mounted under `/doctor`:

- `GET /doctor/morning-briefing`

The endpoint returns a single executive DTO so the page loads from one frontend request.

## Aggregation Layer

`MorningBriefingService` builds the unified briefing payload from existing platform outputs:

- `HospitalWorkspace` for hospital identity.
- `Review` and `ReviewAlert` for reputation health.
- `IntelligencePriority` for executive insight and action urgency.
- `RecommendationProvenance` and `RecommendationOutcomeTracking` for recommended actions.
- `IntelligenceSignal` for social, revenue, and competitor indicators.

The service does not create new intelligence engines. When a source has no current records, it returns conservative empty-state values so existing engines remain unaffected.

## Frontend Experience

The page is a single-scroll executive dashboard covering:

- welcome header and current VIP score
- VIP health score
- revenue attribution
- reputation snapshot
- social presence summary
- competitor pulse
- AI insight of the day
- goal tracker foundation
- top three action recommendations

The design is desktop-first and responsive, with no doctor portal navigation beyond the morning briefing foundation.
