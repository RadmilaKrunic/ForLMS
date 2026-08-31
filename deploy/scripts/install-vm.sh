#!/usr/bin/env bash
# Non-interactive install of ForLMS on an SCA DC VM.
# See docs/deployment-vm.md for the annotated, step-by-step version.
# Adapt to SCA's actual provisioning tooling (Ansible, etc.) rather than
# running as-is against a production VM.
set -euo pipefail

APP_DIR="/opt/forlms"
APP_USER="forlms"
REPO_URL="${REPO_URL:?Set REPO_URL to the ForLMS git repository URL}"

if ! id "$APP_USER" &>/dev/null; then
    useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$APP_DIR"/{backend,frontend,storage/scorm-packages}
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

sudo -u "$APP_USER" git clone "$REPO_URL" /tmp/forlms-src
rsync -a --delete /tmp/forlms-src/backend/ "$APP_DIR/backend/"
rsync -a --delete /tmp/forlms-src/frontend/ "$APP_DIR/frontend/"
rm -rf /tmp/forlms-src

echo "==> Backend: installing dependencies and building"
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && npm ci --omit=dev && npm run build"
if [ ! -f "$APP_DIR/backend/.env" ]; then
    sudo -u "$APP_USER" cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
    echo "!! Edit $APP_DIR/backend/.env with real DB/LDAP/JWT values before starting the service."
fi
sudo -u "$APP_USER" bash -c "cd $APP_DIR/backend && npx prisma migrate deploy"

echo "==> Frontend: installing dependencies and building"
sudo -u "$APP_USER" bash -c "cd $APP_DIR/frontend && npm ci && npm run build"

echo "==> Installing systemd service"
cp "$APP_DIR/backend/../deploy/systemd/forlms-backend.service" /etc/systemd/system/ 2>/dev/null || \
    cp deploy/systemd/forlms-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable forlms-backend

echo "==> Installing Nginx site config"
cp deploy/nginx/forlms.conf /etc/nginx/conf.d/forlms.conf
nginx -t

echo "Done. Review $APP_DIR/backend/.env, then: systemctl start forlms-backend && systemctl reload nginx"
