# VIP Enterprise Control Plane

`@vip/control-plane` supplies framework-agnostic multi-tenant authorization, credentials, usage metering, onboarding, and billing-ready boundaries.

## Capabilities

- Workspace provisioning with subscription assignment and owner roles.
- Tenant isolation and scoped cache-key helpers.
- RBAC permission contexts and guards suitable for API, worker, or agent entry points.
- Hashed API keys with optional AES-256-GCM envelope storage, expiration, and revocation.
- HMAC signed webhook verification.
- Usage metering, subscription quota snapshots, and rate-limit hooks.
- PostgreSQL repository adapter and control-plane audit events.
- Input validation for tenant identifiers, provisioning details, and scoped credentials.

Every repository operation accepts or resolves a `workspaceId`; production handlers should apply `TenantIsolationGuard` before loading workspace records and `PermissionGuard` before mutations.
