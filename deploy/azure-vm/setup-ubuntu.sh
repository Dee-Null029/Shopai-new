#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo: sudo bash deploy/azure-vm/setup-ubuntu.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg nginx redis-server git ufw

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update
  apt-get install -y mongodb-org
fi

npm install -g pm2

systemctl enable --now mongod
systemctl enable --now redis-server
systemctl enable --now nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "Azure VM base setup complete. Next: copy the project to /var/www/shopai and run deploy/azure-vm/deploy.sh."
