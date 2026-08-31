# Architecture

## Component overview

```
                         ┌─────────────────────────┐
                         │   SCA Active Directory    │
                         │   (LDAP, port 389/636)    │
                         └────────────▲──────────────┘
                                      │ bind + search
┌───────────────┐   HTTPS   ┌────────┴─────────┐   TCP    ┌──────────────┐
│  Browser (SPA) │◄─────────┤   Nginx (TLS,     │◄─────────┤  NestJS API   │
│  React + Vite  │           │   static assets,  │          │  (Node 20)    │
│  SCORM player  │──────────►│   reverse proxy)  │─────────►│  port 3000    │
└───────────────┘   HTTPS   └───────────────────┘   HTTP   └──────┬───────┘
                                                                   │ SQL
                                                            ┌──────▼───────┐
                                                            │ PostgreSQL 15 │
                                                            └──────────────┘
                                                                   │
                                                            ┌──────▼───────┐
                                                            │ SCORM package  │
                                                            │ storage (disk) │
                                                            └───────────────┘
```

All four processes (Nginx, Node API, PostgreSQL, file storage) can run on a
single SCA DC VM for the target deployment size, or be split across two VMs
(app VM + DB VM) — nothing in the design assumes co-location.

## Backend module boundaries (`backend/src`)

- **auth** — `LdapService` (AD bind/search via `ldapjs`), `AuthService`
  (tries local bcrypt auth first for `authSource = LOCAL` accounts, else
  authenticates against AD and calls `provisionFromLdap()` for first-login
  account creation + attribute sync), `JwtStrategy` (guards protected
  routes), `AdGroupRoleMapping` → role resolution.
- **users** — CRUD, role assignment, profile fields synced from AD
  (`displayName`, `email`, `orgUnit`).
- **roles** — `Administrator`, `ContentManager`, `Learner` seed roles;
  `RolesGuard` + `@Roles()` decorator enforce access per endpoint.
- **courses** — course/catalog CRUD, publish/archive lifecycle.
- **scorm** — package upload (zip), `imsmanifest.xml` parsing/validation,
  static content serving, and the SCORM 1.2 Run-Time Environment endpoints
  (`Initialize`/`GetValue`/`SetValue`/`Commit`/`Terminate`) that the frontend
  player calls.
- **enrollments** — assigns learners to courses, tracks status/score,
  aggregates SCORM tracking records into completion state.
- **reports** — read-side aggregation over enrollments + tracking records,
  CSV export.
- **audit** — append-only log of security-relevant actions (login,
  role change, package upload).
- **common** — `PrismaService`, exception filters, request logging
  interceptor.

## Data model (see `backend/prisma/schema.prisma`)

`User (1)──(N) UserRole (N)──(1) Role`
`Role (1)──(N) AdGroupRoleMapping`
`Course (1)──(N) ScormPackage` (versioned content)
`Course (1)──(N) Enrollment (N)──(1) User`
`Enrollment (1)──(N) ScormTrackingRecord`
`User (1)──(N) AuditLog`

## Frontend routes (`frontend/src/routes`)

- `/login` — AD credentials (falls back to local auth form).
- `/dashboard` — learner's assigned courses + progress.
- `/catalog` — browsable course catalog.
- `/course/:id` — `ScormPlayer`, embeds the package in an iframe and wires
  `window.API` (SCORM 1.2) to the backend RTE endpoints.
- `/admin/users`, `/admin/courses`, `/admin/reports` — role-gated admin
  console (`ContentManager`/`Administrator` only).

## Localization

`frontend/src/i18n` loads `sr-Cyrl` (default) and `sr-Latn` resource bundles
via `react-i18next`; a nav-bar switcher toggles script at runtime without
reload. Backend API responses are locale-agnostic (data, not UI strings).

## Security

- TLS terminated at Nginx; API only reachable from the Nginx host on the
  internal SCA network.
- JWT access tokens (short-lived) + refresh cookie (`httpOnly`, `secure`).
- All mutating endpoints behind `JwtAuthGuard` + `RolesGuard`.
- AD bind credentials and DB credentials read from environment variables
  only (`backend/.env`, not committed — see `.env.example`).
- `AuditLog` records who did what, for handover accountability.
