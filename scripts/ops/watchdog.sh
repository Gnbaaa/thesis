#!/usr/bin/env bash
# Сервер дээр 5 мин тутам cron-оор ажиллуулбал health муу болоход DB + API сэргээнэ.
# Жишээ: */5 * * * * /var/www/diploma/scripts/ops/watchdog.sh >> /var/log/pet-watchdog.log 2>&1
set -euo pipefail

ROOT="${ROOT:-/var/www/diploma}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:4000/health}"

health_ok() {
  local body
  body="$(curl -sf --max-time 5 "$HEALTH_URL" 2>/dev/null)" || return 1
  echo "$body" | grep -q '"postgres":"ok"' && echo "$body" | grep -q '"mongo":"ok"'
}

if health_ok; then
  exit 0
fi

echo "[$(date -Is)] degraded — recovering stack"

cd "$ROOT"
docker compose up -d

docker exec diploma-postgres psql -U postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'pet_platform'" | grep -q 1 \
  || docker exec diploma-postgres psql -U postgres -c "CREATE DATABASE pet_platform;"

docker exec diploma-postgres psql -U postgres -c \
  "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null

(cd "$ROOT/backend" && npm run migrate) || true

pm2 restart pet-api --cwd "$ROOT/backend" || {
  pm2 delete pet-api 2>/dev/null || true
  pm2 start "$ROOT/backend/dist/server.js" --name pet-api --cwd "$ROOT/backend"
}

sleep 3
curl -sf "$HEALTH_URL" || echo "[$(date -Is)] health still failing"
