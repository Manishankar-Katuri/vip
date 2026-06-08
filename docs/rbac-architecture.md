# VIP RBAC Foundation

VIP now has a role context that is both role-aware and hospital-aware.

## Roles

- `ADMIN`: global access to every hospital.
- `PRODUCTION`: global access to every hospital.
- `DOCTOR`: scoped to one assigned hospital.
- `STAFF`: scoped to one assigned hospital.

## Database

The `User` model stores:

- `role`: `UserRole` enum.
- `hospitalId`: nullable relation to `HospitalWorkspace`.
- `isGlobal`: persisted scope flag for auditing and future workflows.

`hospitalId` is nullable so global users can exist without a hospital assignment. Doctor and staff users must carry a hospital assignment before a JWT can be issued.

## JWT Payload

Application JWTs carry the access context future API and intelligence layers need:

```json
{
  "userId": "user-id",
  "role": "DOCTOR",
  "hospitalId": "hospital-id",
  "isGlobal": false
}
```

The API signs and validates HS256 tokens in `auth/jwt.ts`. `JwtAuthGuard` attaches the validated payload to `request.user`.

## Backend Authorization

Use `@Roles()` with `JwtAuthGuard` and `RolesGuard` on protected Nest controllers or handlers:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PRODUCTION)
```

Hospital-scoped access should use `assertHospitalAccess()` from `common/context/hospital-context.ts` before reading or mutating hospital data.

## Frontend Authorization

`src/middleware.ts` redirects role entry points:

- `ADMIN` -> `/admin`
- `DOCTOR` -> `/doctor`
- `PRODUCTION` -> `/production`
- `STAFF` -> `/staff`

The frontend permission layer lives in `src/permissions.ts`. Future pages should consume `usePermission()` instead of hardcoding role checks.
