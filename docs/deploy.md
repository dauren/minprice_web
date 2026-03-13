# Деплой и обновление minprice.kz

## Первоначальный деплой

### 1. Подготовка сервера

```bash
# Обновить пакеты
sudo apt update && sudo apt upgrade -y

# Установить Node.js через nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Установить Nginx
sudo apt install nginx -y
```

### 2. Получить код

```bash
# Создать папку и передать права своему пользователю
sudo mkdir -p /var/www/minprice_web
sudo chown $USER:$USER /var/www/minprice_web

# Склонировать репозиторий
git clone git@github.com:dauren/minprice_web.git /var/www/minprice_web
cd /var/www/minprice_web
git checkout main
```

### 3. Собрать проект

```bash
cd /var/www/minprice_web
npm install
npm run build
```

### 4. Запустить Node-сервер через PM2

```bash
# Установить PM2 глобально
npm install -g pm2

# Запустить
pm2 start server.js --name minprice-web

# Автозапуск при перезагрузке сервера
pm2 save
pm2 startup
# → скопировать и выполнить команду, которую выдаст pm2 startup
```

### 5. Настроить Nginx

```bash
sudo nano /etc/nginx/sites-available/pricecompare
```

Конфиг (добавить/заменить блок `minprice.kz`):

```nginx
upstream pricecompare_app {
    server unix:/home/pricecompare/price_compare/gunicorn.sock fail_timeout=0;
}

# backend.minprice.kz → Django полностью
server {
    listen 443 ssl;
    server_name backend.minprice.kz;

    location /static/ { alias /home/pricecompare/price_compare/staticfiles/; }
    location /media/  { alias /home/pricecompare/price_compare/media/; }
    location / {
        proxy_pass http://pricecompare_app;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    ssl_certificate     /etc/letsencrypt/live/minprice.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minprice.xyz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
}

# minprice.kz → Node.js SSR proxy (порт 3000)
server {
    listen 443 ssl;
    server_name minprice.kz www.minprice.kz;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $http_host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   User-Agent        $http_user_agent;
    }

    ssl_certificate     /etc/letsencrypt/live/minprice.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minprice.xyz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
}

# minprice.xyz → /api/* на Django, остальное редирект на minprice.kz
server {
    listen 443 ssl;
    server_name minprice.xyz www.minprice.xyz;

    location /api/ {
        proxy_pass http://pricecompare_app;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /static/ { alias /home/pricecompare/price_compare/staticfiles/; }
    location /media/  { alias /home/pricecompare/price_compare/media/; }
    location / {
        return 301 https://minprice.kz$request_uri;
    }

    ssl_certificate     /etc/letsencrypt/live/minprice.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/minprice.xyz/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP → HTTPS редиректы
server {
    listen 80;
    server_name minprice.kz www.minprice.kz minprice.xyz www.minprice.xyz backend.minprice.kz;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Redeploy (обновление после изменений в коде)

### Вариант 1 — Скрипт (рекомендуется)

На сервере создать `deploy.sh` (один раз):

```bash
cat > /var/www/minprice_web/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying minprice.kz..."
cd /var/www/minprice_web

git pull origin main
npm install
npm run build
pm2 restart minprice-web

echo "✅ Done! https://minprice.kz"
EOF

chmod +x /var/www/minprice_web/deploy.sh
```

Запуск обновления:

```bash
/var/www/minprice_web/deploy.sh
```

### Вариант 2 — Вручную

```bash
cd /var/www/minprice_web
git pull origin main       # получить изменения
npm install                # если менялся package.json
npm run build              # пересобрать
pm2 restart minprice-web   # перезапустить сервер
```

---

## Полезные команды PM2

```bash
pm2 status                        # статус всех процессов
pm2 logs minprice-web --lines 30  # последние логи
pm2 flush minprice-web            # очистить логи
pm2 restart minprice-web          # перезапустить
pm2 stop minprice-web             # остановить
```

---

## Архитектура

```
Пользователь / Telegram-бот
        │
        ▼
   Nginx (443 HTTPS)
        │
        ├── backend.minprice.kz  → Django / Gunicorn
        │
        ├── minprice.kz          → Node.js SSR proxy (порт 3000)
        │       │
        │       ├── обычный пользователь → dist/index.html (SPA)
        │       └── бот (TG/WA/FB)      → fetch API + inject OG meta
        │
        └── minprice.xyz/api/*   → Django / Gunicorn
            minprice.xyz/*       → 301 → minprice.kz
```

## Схема доменов

| Домен | Куда |
|---|---|
| `minprice.kz` | React SPA / SSR meta proxy |
| `www.minprice.kz` | → `minprice.kz` |
| `backend.minprice.kz` | Django API |
| `minprice.xyz/api/*` | Django API |
| `minprice.xyz/*` | 301 → `minprice.kz` |
