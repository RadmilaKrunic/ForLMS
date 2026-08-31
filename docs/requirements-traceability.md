# Requirements traceability matrix

Source: Anex 1, Strane 30-33, I.1. Zahtevi za platformu za e-učenje i obuku.

## I.1.1. Zahtevi za sadržaj e-učenja

| ID | Requirement (summary) | Where it's addressed |
|---|---|---|
| ELR_CNT_001 / ELR_CNT_006 | Content packages must be SCORM 1.2 compliant | `backend/src/scorm` validates every uploaded package's `imsmanifest.xml` against SCORM 1.2 (`schemaversion`, organizations/items/resources) before it can be published; `frontend/src/components/ScormPlayer` implements the SCORM 1.2 RTE the packages run against. |
| ELR_CNT_002 | ILT materials transformed into e-learning modules | Content/authoring workflow (out of platform scope — an authoring process, not code); the LMS's job is to host and run the resulting SCORM packages, which `courses` + `scorm` modules support. |
| ELR_CNT_003 | Materials delivered in Serbian (Cyrillic) | Content-authoring concern; the platform's `Course.language` field and UI locale switcher (`frontend/src/i18n`) support tagging and presenting Cyrillic-authored content correctly. |
| ELR_CNT_004 | Modular structure, independently consumable lessons | `Course` → `ScormPackage` (SCORM `organizations`/`items` tree) data model in `backend/prisma/schema.prisma`; catalog UI lists courses/modules independently. |
| ELR_CNT_005 | Reusable, maintainable content, updatable without full rebuild | `ScormPackage` is versioned per `Course` (`version` field); re-uploading a package creates a new version without touching enrollments/history. |

## I.1.1. Zahtevi za platformu za e-učenje (LMS)

| ID | Requirement (summary) | Where it's addressed |
|---|---|---|
| ELR_LMS_001 | Deliver, install, configure a web-based LMS on SCA-provided VMs | `deploy/` (systemd units + Nginx config + `install-vm.sh`); `docs/deployment-vm.md`. |
| ELR_LMS_002 | Install/configure/go-live on SCA DC VMs per network & security requirements | `docs/deployment-vm.md` (firewall ports, service accounts, TLS termination at Nginx, env-based secrets). |
| ELR_LMS_003 | Upload/manage/run SCORM 1.2 packages; verify progress & completion tracking | `backend/src/scorm` (`ScormController`/`ScormService`, package upload + manifest parsing); `ScormTrackingRecord` Prisma model persists `cmi.core.lesson_status`, `cmi.core.score.raw`, `cmi.suspend_data`, session time. |
| ELR_LMS_004 | Access via standard browsers, no client install | Pure React SPA + REST API over HTTPS; no browser plugins or installed clients anywhere in the design. |
| ELR_LMS_005 | User management: course assignment, role-based access control, admin tooling/docs | `backend/src/users`, `backend/src/enrollments`, `backend/src/roles`; `RolesGuard` + `@Roles()` decorator; `frontend/src/routes/admin/AdminUsers.tsx`; admin guide in `docs/deployment-vm.md`. |
| ELR_LMS_006 | Track course access, completion, quiz scores; basic reporting | `AuditLog` + `ScormTrackingRecord` + `Enrollment.status/score`; `backend/src/reports` (`GET /reports/courses/:id`, `GET /reports/users/:id`, CSV export); `frontend/src/routes/admin/AdminReports.tsx`. |
| ELR_LMS_007 | Serbian UI (Cyrillic and/or Latin) | `frontend/src/i18n` with `sr-Cyrl` and `sr-Latn` resource bundles and a language switcher in the nav bar. |
| ELR_LMS_008 | SCA can add courses/materials post-handover without vendor involvement | `POST /courses` + `POST /courses/:id/scorm-package` are self-service admin endpoints, no code deploy needed to add content; documented in `docs/deployment-vm.md`. |
| ELR_LMS_009 | AD/LDAP auth, auto-provisioning, attribute sync, AD-group→role mapping, local admin fallback | `backend/src/auth` — `LdapService` (bind + search via `ldapjs`), `AuthService.provisionFromLdap()` (create-on-first-login + sync `displayName`/`email`/`orgUnit`), `AdGroupRoleMapping` table + `AuthService.syncRolesFromAdGroups()`; `AuthService.login()` authenticates `authSource = LOCAL` accounts against a bcrypt hash instead of AD. |
| ELR_LMS_010 | Full documentation incl. install, config, admin, user-management guides (As-Built) | `docs/architecture.md`, `docs/deployment-vm.md`, this file; intended to be extended into the As-Built Documentation deliverable. |
