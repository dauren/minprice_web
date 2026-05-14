#!/usr/bin/env bash
set -euo pipefail

# Требования:
# - В среде должны быть установлены:
#   VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
# - Для деплоя в team-аккаунт дополнительно можно указать VERCEL_SCOPE.
# - Опционально для автоповторения в чат Telegram:
#   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN before running this script}"
: "${VERCEL_ORG_ID:?Set VERCEL_ORG_ID before running this script}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID before running this script}"

# Проверим сборку локально (чтобы не деплоить сломанную версию)
npm install
npm run build

mkdir -p .vercel
cat > .vercel/project.json <<EOF
{
  "orgId": "${VERCEL_ORG_ID}",
  "projectId": "${VERCEL_PROJECT_ID}"
}
EOF

VERCEL_ARGS=(--yes)
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  VERCEL_ARGS+=(--scope "$VERCEL_SCOPE")
fi
VERCEL_ARGS+=(--token "$VERCEL_TOKEN")
VERCEL_ARGS+=(.)

DEPLOY_OUT="$(npx --yes vercel deploy "${VERCEL_ARGS[@]}" 2>&1)"
echo "$DEPLOY_OUT"

DEPLOY_URL="$(echo "$DEPLOY_OUT" | grep -Eo 'https://[^[:space:]]+\.vercel\.app' | head -n 1 || true)"
if [[ -z "$DEPLOY_URL" ]]; then
  # Иногда URL появляется в последней строке без .app, поэтому берем последнюю https-ссылку как fallback
  DEPLOY_URL="$(echo "$DEPLOY_OUT" | grep -Eo 'https://[^[:space:]]+' | tail -n 1 || true)"
fi

if [[ -z "$DEPLOY_URL" ]]; then
  echo "[ERROR] Не удалось вытащить URL Vercel из вывода"
  exit 1
fi

echo "VERCEL_PREVIEW_URL=$DEPLOY_URL"

action_msg="Готова minprice.kz dev-проверка: $DEPLOY_URL"
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${action_msg}" >/tmp/hermes_telegram_send.out
  echo "✅ Ссылка отправлена в Telegram"
else
  echo "ℹ️ TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы — автопост в чат не сделан"
fi
