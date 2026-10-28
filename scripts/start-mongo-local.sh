#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${ROOT_DIR}/server/data/db"
LOG_PATH="${ROOT_DIR}/server/data/logs/mongod.log"

mkdir -p "${DB_PATH}" "$(dirname "${LOG_PATH}")"

if pgrep -f "mongod .*${DB_PATH}" >/dev/null 2>&1; then
  echo "MongoDB is already running for ${DB_PATH}"
  exit 0
fi

if ss -ltn 2>/dev/null | grep -q ':27017 '; then
  echo "Port 27017 is already in use. Another MongoDB instance may be running."
  exit 1
fi

mongod \
  --dbpath "${DB_PATH}" \
  --logpath "${LOG_PATH}" \
  --fork \
  --bind_ip 127.0.0.1 \
  --port 27017

echo "MongoDB started on 127.0.0.1:27017"
echo "Log: ${LOG_PATH}"
