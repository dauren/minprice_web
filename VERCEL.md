# Vercel preview для minprice.kz (без изменения прод-сервера)

Задача: каждый не-prod коммит/пулл-реквест автоматически получает ссылку на проверочную сборку.

## Что уже включено
- `vercel.json` в корне `minprice_web`
  - `npm run build`
  - SPA-роутинг через `index.html`
- `.github/workflows/vercel-preview.yml`
  - пуш в не-main ветки или PR в `main` => preview-деплой
  - после успешного деплоя шлёт ссылку в Telegram (через секреты GitHub Actions)
- `scripts/vercel-preview-deploy.sh`
  - ручной деплой в Vercel из текущей папки проекта
  - после деплоя может отправить ссылку в Telegram (если заданы токен и chat id)
- `package.json`:
  - `npm run deploy:vercel` — запускает вышеописанный скрипт

## Как включить (без затрагивания текущего `minprice.kz`)
1. В GitHub Actions добавить секреты репозитория:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
2. Опционально: `VERCEL_SCOPE` как отдельный slug команды/организации (для `--scope` в CLI).
3. Подключить проект к Vercel (можно через Import из GitHub) или использовать существующий `VERCEL_PROJECT_ID`.
4. Делать изменения и пушить в ветку, отличную от `main`.

## Что происходит после изменения (как вы просили)
- Пуш в branch => workflow стартует автоматически.
- Vercel собирает новую версию и даёт preview URL вида:
  - `https://<project>-<branch>-<hash>.vercel.app`
- URL отправляется в Telegram chat, где настроен бот.
- На текущий сайт на сервере это **не влияет**.

## Ручной быстрый путь
- Экспортируй env и запусти:
  - `npm run deploy:vercel`
- Скрипт сразу выведет `VERCEL_PREVIEW_URL=<url>` и попытается отправить в Telegram.
