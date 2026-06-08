# VIP Hospital Context Foundation

Phase A.2 adds runtime hospital selection on top of the RBAC foundation.

## Hospital Workspace

`HospitalWorkspace` now exposes canonical tenant fields:

- `id`
- `name`
- `slug`
- `specialty`
- `city`
- `status`
- `createdAt`
- `updatedAt`

The legacy `hospitalName` field remains in place for compatibility with existing intelligence and onboarding code. Future hospital-scoped entities should treat `HospitalWorkspace.id` as their `hospitalId`; existing modules that use `workspaceId` already point at the same tenant record in the API schema.

## Runtime Context

JWT payloads remain unchanged. The selected hospital is runtime context and is sent as:

```text
x-hospital-id: <HospitalWorkspace.id>
```

`CurrentHospitalService` validates this header server-side. Frontend selection is only a convenience; API services must call the context service before reading or mutating hospital-scoped data.

## Access Rules

- `ADMIN`: can list and select any hospital.
- `PRODUCTION`: can list and select any hospital.
- `DOCTOR`: can list only their assigned hospital and cannot switch.
- `STAFF`: can list only their assigned hospital and cannot switch.

Global users must select an active hospital before running hospital-scoped operations.

## APIs

`GET /hospitals`

Returns hospitals available to the authenticated user and, when `x-hospital-id` is present, the validated active hospital.

`POST /hospitals/select`

Accepts `{ "hospitalId": "..." }`. Only `ADMIN` and `PRODUCTION` can select a hospital.

## Frontend

`HospitalContextProvider` loads available hospitals, tracks the active hospital, and persists the selected hospital id in local storage.

`useHospital()` returns:

- `activeHospital`
- `setActiveHospital`
- `availableHospitals`
- `currentUser`
- `isLoading`
- `refreshHospitals`

`apiFetch()` automatically propagates `x-hospital-id` to future intelligence, analytics, recommendation, workflow, campaign, lead, review, and dashboard calls.
