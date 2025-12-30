# Запуск Telegram Web App

1) Создать/настроить бота в @BotFather  
   - `/newbot` → получите токен.  
   - `/setdomain` → укажите публичный HTTPS‑домен, на котором будет хоститься веб‑апп (например, `app.mydomain.com`). Без HTTPS webview не откроется.  
   - `/setmenubutton` → выбрать `Web App` и указать URL (пример: `https://app.mydomain.com/`).  
   - Дополнительно: `/setname`, `/setdescription`, `/setabouttext` для карточки бота.

2) Локальная разработка  
   - Установите зависимости: `npm install`.  
   - Скопируйте `.env.example` → `.env` и пропишите `VITE_API_URL` (бэкенд) и при необходимости `VITE_TELEGRAM_BOT_NAME`.  
   - Запустите дев‑сервер: `npm run dev`.  
   - Для теста в Telegram можно использовать туннель (например, `cloudflared` или `ngrok`) и временно указать выданный https‑адрес через `/setdomain`.  

3) Продакшн/деплой  
   - Собрать проект: `npm run build` → статика лежит в `dist/`.  
   - Задеплойте `dist/` на любой HTTPS‑хостинг/статический CDN.  
   - Убедитесь, что `Content-Security-Policy` не запрещает встраивание в `frame` со стороны Telegram.  
   - В @BotFather установите конечный прод‑домен через `/setdomain` и обновите URL в `/setmenubutton` при необходимости.

4) Тест открытия из Telegram  
   - Откройте ссылку: `https://t.me/<ВАШ_БОТ>?startapp=debug` — бот загрузит Web App в вебвью.  
   - Проверьте, что `window.Telegram.WebApp.initData` присутствует и тема (light/dark) применяется.

5) Авторизация через Telegram (подготовка бэкенда)  
   - На фронте уже есть вызов `POST /auth/telegram` (см. `features/auth/api.ts`). Реализуйте его на бэкенде:  
     1. Получите `initData` из тела запроса.  
     2. Проверьте подпись согласно [официальной инструкции](https://core.telegram.org/bots/webapps#initializing-mini-apps) (HMAC-SHA256 с бот‑токеном).  
     3. Если проверка прошла — создайте/найдите пользователя, верните `LoginResponse` (профиль + access/refresh).  
   - После этого Web App сможет логинить пользователя автоматически при открытии из Telegram.

6) Использование внутри чатов  
   - Можно прикреплять веб‑апп в инлайн‑клавиатуру сообщений: в боте отправляйте клавиатуру с полем `web_app` и URL.  
   - Для быстрого доступа используйте кнопку меню (Web App) — Telegram сам открывает ваш домен внутри webview.
