# VIP Admin Command Centre Foundation

Phase B.1 introduces the first production portal surface: `/admin/command-centre`.

## Security

The admin portal uses the existing authorization stack:

1. JWT validation.
2. Role payload validation.
3. Permission validation.
4. Hospital context validation for hospital-scoped configuration.

The frontend does not hardcode role checks. Admin visibility is driven by permissions, primarily `manage_users`, `manage_hospitals`, `view_audit_logs`, `manage_brand_voice`, `manage_templates`, and `manage_integrations`.

## Routes

- `/admin/command-centre`
- `/admin/users`
- `/admin/hospitals`
- `/admin/audit-logs`
- `/admin/brand-voice`
- `/admin/templates`
- `/admin/integrations`

## Backend APIs

Admin APIs are mounted under `/admin`:

- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`
- `GET /admin/hospitals`
- `POST /admin/hospitals`
- `PATCH /admin/hospitals/:id`
- `GET /admin/audit-logs`
- `GET /admin/brand-voice`
- `PATCH /admin/brand-voice`
- `GET /admin/templates`
- `POST /admin/templates`
- `PATCH /admin/templates/:id`
- `DELETE /admin/templates/:id`
- `GET /admin/integrations`

## User Validation

Global roles are always persisted with `hospitalId = null` and `isGlobal = true`:

- `ADMIN`
- `PRODUCTION`

Hospital-scoped roles require a `hospitalId` and persist with `isGlobal = false`:

- `DOCTOR`
- `STAFF`

Deletes are soft deactivations through `isActive = false`.

## Audit Foundation

`AuditLog` records:

- `userId`
- `action`
- `resource`
- `resourceId`
- `hospitalId`
- `createdAt`

Audit entries are written for user creation/update/deactivation, role change, hospital creation/update, brand voice updates, and template changes.

## Configuration Foundations

`BrandVoice` stores tone, style, audience, and messaging per hospital.

`Template` stores reusable active/inactive templates per hospital. No AI generation is included in this phase.

`Integrations` is read-only and returns future integration cards for Google Business, Meta, Instagram, YouTube, and OpenAI.
