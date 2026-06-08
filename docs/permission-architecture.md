# VIP Permission Matrix And Module Access

Phase A.3 centralizes VIP authorization around permissions instead of scattered role checks.

## Authorization Chain

Protected API routes should compose guards in this order:

```ts
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.VIEW_REVENUE)
```

The chain validates:

1. JWT identity and role context.
2. Role payload sanity and scoped user assignment.
3. Permission ownership through the central permission map.
4. Hospital context through `CurrentHospitalService` for hospital-scoped modules.

`@Roles()` still exists for compatibility, but new module access should use `@Permissions()` so authorization remains permission-driven.

## Canonical Permission Source

Backend:

- `auth/permissions/permissions.enum.ts`
- `auth/permissions/permission-map.ts`
- `auth/permissions/module-registry.ts`

Frontend:

- `src/permissions.ts`
- `src/module-registry.ts`
- `src/navigation/permission-navigation.ts`

## Role Mapping

`ADMIN` receives every permission.

`DOCTOR` receives executive and intelligence read access:

- morning briefing, VIP score, revenue, reputation, competitors, AI insights
- market intelligence, social intelligence, recommendations

`PRODUCTION` receives content production access:

- view, create, edit, delete content
- campaigns, calendar, hashtags
- social intelligence

`STAFF` receives operations access:

- leads, followups, calls, templates

## Frontend Usage

Use `PermissionGate` for conditional rendering:

```tsx
<PermissionGate permission="view_revenue">
  <RevenuePanel />
</PermissionGate>
```

Use `getNavigationForPermissions()` to make sidebars and menus permission-driven.

## Auditability

`getUserPermissions()` exists in both backend and frontend permission maps. It resolves the effective permission list for a role or user and is intended for debugging, audit logs, and future admin tooling.

## Future Modules

New modules must register their permission surface in `MODULES` before pages or APIs consume those permissions.
