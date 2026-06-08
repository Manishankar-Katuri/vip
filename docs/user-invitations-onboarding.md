# VIP User Invitations And Account Provisioning

Phase B.2 makes user onboarding invitation-first.

## Invitation Model

`Invitation` stores:

- `email`
- `role`
- nullable `hospitalId`
- `isGlobal`
- `token`
- `status`: `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`
- `expiresAt`
- `createdAt`
- `acceptedAt`

The `token` column stores a SHA-256 hash of the raw invitation token. The raw token is only returned at creation/resend time inside the mock onboarding URL.

## Admin APIs

- `POST /admin/invitations`
- `GET /admin/invitations`
- `POST /admin/invitations/:id/revoke`
- `POST /admin/invitations/:id/resend`

`POST /admin/users` is kept for compatibility but now delegates to invitation creation, so admin-created accounts still follow the onboarding flow.

## Auth APIs

- `POST /auth/accept-invite`
- `POST /auth/set-password`

Accept invite validates token existence, pending status, non-expiry, and non-revocation.

Set password creates or activates the user, stores a scrypt password hash, marks the invitation accepted, and returns the normal login JWT payload with a role-based redirect.

## Role Scope Validation

Global roles:

- `ADMIN`
- `PRODUCTION`

Persist with `hospitalId = null` and `isGlobal = true`.

Hospital-scoped roles:

- `DOCTOR`
- `STAFF`

Require `hospitalId` and persist with `isGlobal = false`.

## Redirects

After login or password setup:

- `ADMIN` -> `/admin/command-centre`
- `PRODUCTION` -> `/production/command-centre`
- `DOCTOR` -> `/doctor/morning-briefing`
- `STAFF` -> `/staff/operations-centre`

## Email

`EmailService` is a mock provider with:

- `sendInvitation()`
- `sendPasswordReset()`

No SMTP or external email provider is integrated in this phase.

## Audit Events

Audit logs are written for:

- `invitation.created`
- `invitation.resent`
- `invitation.revoked`
- `invitation.accepted`
- `password.set`
- `user.activated`
