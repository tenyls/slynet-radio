# Прокси названий песен (Cloudflare Worker)

Бесплатно (100 000 запросов в день), VPS не нужен. Нужен только для «честного RDS»
у станций, которые передают название песни внутри потока.

## Как развернуть (5 минут, через браузер)
1. Зарегистрируйтесь на https://dash.cloudflare.com (бесплатно).
2. Слева: **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker**.
3. Имя: `slynet-meta` → **Deploy**.
4. Нажмите **Edit code**, удалите всё в редакторе и вставьте содержимое файла `index.js` из этой папки → **Deploy**.
5. Скопируйте адрес воркера (вида `https://slynet-meta.<ваш-логин>.workers.dev`) и пришлите его — его нужно вписать в `src/config.ts`.

Проверка: откройте в браузере
`https://slynet-meta.<логин>.workers.dev/?url=https://ice1.somafm.com/groovesalad-128-mp3`
— должно показать `{"title":"..."}`.
