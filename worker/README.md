# slynet-api — мини-сервер SlyNet Radio (Cloudflare Workers, бесплатно)

Даёт сайту: пароль админки, сообщения в техподдержку (в админку и в Telegram), вход и синхронизацию избранного
между устройствами, названия песен из потока (RDS), определение страны посетителя, публикацию из админки одной кнопкой.
Бесплатный тариф: 100 000 запросов в день. VPS не нужен.

## Размещение (≈10 минут)

**1. Аккаунт.** https://dash.cloudflare.com → Sign up (бесплатно, подтвердите почту).

**2. Хранилище.** Слева **Storage & Databases → KV** → **Create** → имя `slynet-db` → Create.

**3. Worker.** Слева **Compute (Workers) → Workers & Pages** → **Create** → **Create Worker** (шаблон Hello World) →
имя `slynet-api` → **Deploy**.

**4. Код.** Нажмите **Edit code** → удалите всё → вставьте весь файл `worker/index.js` → **Deploy**.

**5. Привязать хранилище.** Вкладка **Bindings** → **Add binding** → **KV namespace** →
Variable name: `DB`, KV namespace: `slynet-db` → **Add binding** / **Deploy**.

**6. Пароли (вводите сами, никому не показывайте).** Вкладка **Settings → Variables and Secrets** → **Add**:
| Тип | Имя | Значение |
|---|---|---|
| Secret | `ADMIN_PASSWORD` | ваш пароль админки |
| Secret | `TOKEN_SECRET` | любые 40+ случайных символов (например, из генератора паролей) |
| Secret | `TELEGRAM_BOT_TOKEN` | *(по желанию)* токен бота от @BotFather — сообщения поддержки в Telegram |
| Text | `TELEGRAM_CHAT_ID` | *(по желанию)* ваш chat id (узнать у @userinfobot); напишите боту /start |
| Secret | `GITHUB_TOKEN` | *(по желанию)* для кнопки «Опубликовать» — см. ниже |
→ **Deploy**.

**7. Адрес.** Скопируйте адрес воркера: `https://slynet-api.<ваш-логин>.workers.dev`.
Откройте его в браузере — должно быть `{"ok":true,...,"kv":true}`.
Затем: сайт → `#admin` → Админка → вкладка **«Сервер»** → вставьте адрес → Сохранить → Опубликовать.

### GITHUB_TOKEN (кнопка «Опубликовать» без ручной загрузки файлов)
github.com → аватар → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**:
Name `slynet-publish`, Expiration 1 год, Repository access → **Only select repositories** → `slynet-radio`,
Permissions → Repository permissions → **Contents: Read and write** → Generate → скопируйте и вставьте как Secret `GITHUB_TOKEN`.

## Веб-камеры Windy (необязательно)

1. Зарегистрируйтесь на https://api.windy.com → **Keys** → создайте ключ для **Webcams API** (Free).
2. Cloudflare → Workers & Pages → slynet-api → Settings → Variables and Secrets → Add →
   Type **Secret**, имя `WINDY_API_KEY`, значение — ваш ключ → Deploy.
3. Обновите код воркера из `worker/index.js` (Edit code → вставить → Deploy).
Проверка: https://slynet-api.tenylse.workers.dev/health → `"windy": true`.
