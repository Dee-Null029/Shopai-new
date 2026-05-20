#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/shopai}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "APP_DIR does not exist: ${APP_DIR}"
  echo "Set APP_DIR=/path/to/Shopai or copy the repo to /var/www/shopai."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f server/.env ]]; then
  cp server/.env.production.example server/.env
  echo "Created server/.env from production template."
  echo "Edit server/.env with real secrets and ALLOWED_ORIGINS, then rerun this script."
  exit 1
fi

npm --prefix server ci --omit=dev
npm --prefix client ci
npm --prefix client run build

mkdir -p server/logs

if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.cjs --env production
  pm2 save
else
  echo "pm2 is not installed. Run setup-ubuntu.sh first."
  exit 1
fi

if [[ "${EUID}" -eq 0 ]]; then
  cp deploy/azure-vm/nginx-shopai.conf /etc/nginx/sites-available/shopai
  ln -sfn /etc/nginx/sites-available/shopai /etc/nginx/sites-enabled/shopai
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
else
  echo "Skipping Nginx install because this script is not running as root."
  echo "Run this to install Nginx config:"
  echo "sudo cp deploy/azure-vm/nginx-shopai.conf /etc/nginx/sites-available/shopai"
  echo "sudo ln -sfn /etc/nginx/sites-available/shopai /etc/nginx/sites-enabled/shopai"
  echo "sudo rm -f /etc/nginx/sites-enabled/default"
  echo "sudo nginx -t && sudo systemctl reload nginx"
fi

echo "ShopAI deployment complete."
