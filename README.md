# ForLMS — E-Learning Platform for Uprava carina Srbije (SCA)

Custom-built, SCORM 1.2–compliant Learning Management System, designed to be
hosted on virtual machines in the SCA Data Center and integrated with the
Uprava carina Srbije Active Directory. This repository contains the
application scaffold derived from the requirements in **Anex 1 (Strane
30-33), I.1. Zahtevi za platformu za e-učenje i obuku**.

## Repository layout

```
ForLMS/
├── backend/    NestJS + TypeScript API (auth, users, courses, SCORM runtime, reports)
├── frontend/   React + TypeScript SPA (catalog, SCORM player, admin console)
├── deploy/     systemd units, Nginx config, VM install script
└── docs/       architecture, requirements traceability, deployment guide
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Node.js 20 LTS, NestJS, TypeScript, Prisma ORM | Single runtime, `npm install && npm run build`, runs under a plain `systemd` service — no app server / container orchestration required on the SCA VM. Mature LDAP client libraries (`ldapjs`, `passport-ldapauth`). |
| Database | PostgreSQL 15 | Standard on-prem RDBMS, easy `apt install postgresql` on the same or an adjacent VM. |
| Frontend | React + TypeScript, Vite | Builds to static assets served by Nginx; no client-side install for end users (ELR_LMS_004). |
| SCORM runtime | SCORM 1.2 RTE implemented in `backend/src/scorm` + `frontend/src/components/ScormPlayer` | Native implementation of the SCORM 1.2 JavaScript API (`LMSInitialize`/`LMSGetValue`/`LMSSetValue`/`LMSCommit`/`LMSFinish`) so no third-party LMS engine is required. |
| Auth | Active Directory via LDAP (`ldapjs`), JWT sessions, bcrypt local auth fallback | Meets ELR_LMS_009: AD-based login with auto-provisioning, attribute sync, AD-group→role mapping, and a local path for admin accounts not managed by AD. |
| Localization | `i18next` / `react-i18next`, `sr-Cyrl` and `sr-Latn` locales | Meets ELR_LMS_007 / ELR_CNT_003. |

See [`docs/architecture.md`](docs/architecture.md) for the component and data
model design, [`docs/requirements-traceability.md`](docs/requirements-traceability.md)
for a line-by-line mapping of every ELR_CNT_* / ELR_LMS_* requirement to the
code that implements it, and [`docs/deployment-vm.md`](docs/deployment-vm.md)
for the install procedure on the SCA DC virtual machines.

## Getting started (local development)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Status

This is the initial application structure / scaffold: data model, module
boundaries, auth flow, SCORM runtime contract, and admin/learner UI routes
are in place. Business-logic depth (reporting exports, full LDAP group sync
job, content-authoring workflows) is intended to be filled in incrementally
against this structure during implementation (Aktivnost 1 onward).
