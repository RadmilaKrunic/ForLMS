# Deployment on SCA DC virtual machines

This covers installing ForLMS on the virtual machine(s) provided by Uprava
carina Srbije (SCA) in the SCA Data Center (ELR_LMS_001 / ELR_LMS_002). It
assumes a single Linux VM (RHEL/CentOS/Ubuntu); adjust package-manager
commands if the confirmed OS differs — the exact VM spec (CPU/RAM/disk/OS)
is confirmed during Aktivnost 1.

## 1. Prerequisites on the VM

- Node.js 20 LTS
- PostgreSQL 15 (local or reachable over the internal network)
- Nginx
- Network access to an SCA Active Directory domain controller on the LDAP
  port (389, or 636 for LDAPS — LDAPS strongly recommended)
- A DNS name / internal hostname for the LMS, and a TLS certificate issued
  by SCA's PKI (or an internally trusted CA)

## 2. Application user & directories

```bash
sudo useradd --system --home /opt/forlms --shell /usr/sbin/nologin forlms
sudo mkdir -p /opt/forlms/{backend,frontend,storage/scorm-packages}
sudo chown -R forlms:forlms /opt/forlms
```

## 3. Build & deploy the backend

```bash
cd /opt/forlms/backend
sudo -u forlms git clone <repo-url> .        # or copy a release tarball
sudo -u forlms npm ci --omit=dev
sudo -u forlms npm run build
sudo -u forlms cp .env.example .env          # then fill in real values, see below
sudo -u forlms npx prisma migrate deploy
```

`.env` values to set: `DATABASE_URL`, `JWT_SECRET`, `LDAP_URL`,
`LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_BASE_DN`, `LDAP_USER_FILTER`,
`SCORM_STORAGE_PATH`. See `backend/.env.example` for the full list.

## 4. Build & deploy the frontend

```bash
cd /opt/forlms/frontend
sudo -u forlms npm ci
sudo -u forlms npm run build     # outputs to frontend/dist
```

Nginx serves `frontend/dist` as static files and reverse-proxies `/api/*`
to the backend (see `deploy/nginx/forlms.conf`).

## 5. Run the backend as a service

```bash
sudo cp deploy/systemd/forlms-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now forlms-backend
```

## 6. Configure Nginx

```bash
sudo cp deploy/nginx/forlms.conf /etc/nginx/conf.d/forlms.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Verify

- `systemctl status forlms-backend` is `active (running)`.
- `curl -k https://<host>/api/health` returns `200`.
- Log in with an AD account → account is auto-provisioned (ELR_LMS_009).
- Log in with a local admin account created via `npx prisma db seed`
  (bootstraps one `Administrator` local account for first access, before
  any AD-group mapping is configured).

## 8. Automated install

`deploy/scripts/install-vm.sh` runs steps 1–6 non-interactively given a
populated `.env`; intended as a starting point to adapt to SCA's actual
provisioning tooling (Ansible/etc.), not a replacement for it.

## 9. Ongoing administration (ELR_LMS_008 / ELR_LMS_010)

Once handed over, SCA administrators add new courses without vendor
involvement or a redeploy:

1. Log in to `/admin/courses` with an `Administrator` or `ContentManager`
   account.
2. Create a course, upload a SCORM 1.2 `.zip` package — the backend
   validates `imsmanifest.xml` and publishes it.
3. Assign learners (individually or by AD group, once group→role/course
   mapping is configured under `/admin/users`).

Full admin and user-management instructions ship as part of the As-Built
Documentation deliverable per ELR_LMS_010.
