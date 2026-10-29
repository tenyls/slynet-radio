# SlyNet Radio — паспорт проекта (для продолжения в новом чате)

Владелец — начинающий разработчик, живёт в Германии. **Отвечать по-русски**, объяснять по шагам, какие кнопки нажимать.
Пароли и ключи он вводит сам (секреты GitHub / Cloudflare) — **никогда не просить их прислать**.

## Что это
Бесплатное легальное интернет-радио со всего мира: сайт (PWA) + Android-приложение (+ Android TV, Android Auto).
- Сайт: https://tenyls.github.io/slynet-radio/ (GitHub Pages, репозиторий `tenyls/slynet-radio`, открытый)
- Зеркало: https://slynet-radio.pages.dev (Cloudflare Pages, отдельный аккаунт slynet.radio@…; публикуется из `deploy.yml` вместе с GitHub Pages — секреты CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- Сервер: Cloudflare Worker `slynet-api` → https://slynet-api.tenylse.workers.dev (код: `worker/index.js`; KV `DB`).
  Деплой сервера — **вручную владельцем**: Cloudflare → Workers & Pages → slynet-api → Edit code → вставить весь файл → Deploy.
  Проверка версии: `/health` (сейчас `version: 2026-10-29b`, `share/playlists/probe: true`).
- Telegram-канал @SlyNetRadio + стена ВК (vk.com/clubslynet) — автопостинг ботом.

## Правила владельца (важно)
- Только легальные официальные потоки, никакого пиратства. Станции, которые сами запрещают сторонние приложения, скрыты везде: `data/stream-policy.json` (сейчас SomaFM, Big R Radio, 2000 FM, Sleep Radio, StreamingSoundtracks, SBS, Al Jazeera и др.). Робот `permissions-scan.yml` раз в месяц обходит сайты 3000 популярных станций → отчёт `docs/STREAM-PERMISSIONS.md`; новые запреты проверяем вручную и добавляем в список. ТВ-раздел есть только на сайте и в APK с сайта (не в сторах).
- **ТВ нигде не упоминать в рекламе, постерах и постах.**
- **В рекламе, постерах, QR-кодах и подписях постов — только адрес https://slynet-radio.pages.dev/** (старый tenyls.github.io/slynet-radio продолжает работать; на нём остаются служебные вещи: обновления приложения, каталог для приложений, политика конфиденциальности в магазинах).
- Все посты в Telegram — **без звука** (`SILENT = true` в боте).
- Каждое обновление — сразу пост в канал с «хук»-текстом и своим постером (`public/releases.json` → поля `post`, `image`; запуск: workflow `telegram.yml`, mode=`release`).
- ВК: документы/бизнес-верификацию VK ID не проходит — только ключ сообщества. Картинки в ВК пока не работают (сбой ВК), посты идут текстом.
- Одно универсальное Android-приложение (телефон, планшет, ТВ).

## Устройство
- React 19 + TS + Vite + Tailwind v4. Android — Capacitor 7, папка `android/` создаётся в CI (`android.yml`), свои нативные части — `native/android/` + `scripts/android-native-patch.py` (виджет, будильник, Android Auto, «Поделиться», ссылки `slynet://open`).
- Автообновление приложения без APK: `deploy.yml` собирает `app/bundle-<id>.zip` + `version.json` (Capgo updater). Новый APK нужен только при изменении нативных частей.
- Роботы (GitHub Actions):
  - `catalog.yml` — ежедневно: `public/catalog.json` (эксклюзивы, подборки `curated`, ночная проверка мёртвых `dead`, ТВ), `public/geo.json` (глобус).
  - `telegram.yml` — один пост в час, 07–22 по Берлину (16 в день; расписание по часам — `HOURLY` в `scripts/telegram-post.mjs`): станции ×5, новости ×3, «фишки» с постерами ×4 (`public/promo/*.jpg`), веб-камеры ×3, большой рекламный пост ×1, вс вечером — вопрос. RuStore в рекламе — только после одобрения: `data/stores.json` → `"rustore": true` (тогда в рекламу добавляются ссылки на приложение в RuStore и «нет RuStore? скачать: rustore.ru/download», для Android TV — rustore.ru/tv).
- Секреты GitHub (имена): ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL, GEMINI_API_KEY, VK_TOKEN, VK_GROUP_ID. Cloudflare: ADMIN_PASSWORD, TOKEN_SECRET, GITHUB_TOKEN, WINDY_API_KEY.
- Коммиты: автор `Claude <noreply@anthropic.com>`; перед push — `git pull --rebase` (боты коммитят каждый час). Ожидание CI — циклом `until … do sleep; done`.

## Что уже сделано (кратко)
Каталог по жанрам/странам/настроениям, поиск, глобус, веб-камеры Windy, эксклюзивы (Radio Record 117 каналов, Radio Paradise, FIP, Swiss, KEXP, NTS, Nightride), «Подборки SlyNet», «Похожие» (вкладка в плеере), избранное + свои плейлисты (синхронизация через аккаунт), «Поделиться» станцией/плейлистом (мессенджеры, QR, превью ссылок через `/s` на сервере, открытие в приложении), качество: всегда максимум + переключатель «Слабый интернет», HLS через hls.js, проверка станций (повтор для эксклюзивов, `/probe` на сервере → «🔒 не открывается из вашей страны» или «⚠️ не работает»), белый экран iPhone исправлен, виджет, нативный будильник, Android Auto, админка с видимостью разделов. Последняя версия в канале — 1.0.12.
**29.10.2026:** нативный плеер Android (Media3/ExoPlayer, `native/android/java/SlyNetPlayer.java` + `SlyNetDsp.java`, JS-переходник `src/services/nativeAudio.ts`): 10-полосный эквалайзер с пресетами и басами, визуализация по настоящему спектру (без микрофона), буфер 1–12 с, автопереподключение, http-станции, название песни из потока (ICY). Окно «Звук» (`EqualizerModal.tsx`) и кнопки показываются только при нативном плеере (`nativeEngine`). Старые APK — как раньше. Аварийный выключатель: Админка → Видимость → «Нативный плеер Android». Сайт/iPhone: анимация «в такт» на обложке (`Visualizer.tsx`), на экране блокировки — обложка песни (iTunes) или фирменная карточка станции (`lockArtwork.ts`). История: «Треки из эфира» с поиском (без слова Shazam). Логотипы: запасной значок сайта станции. APK с сайта — native 1.0.13 (нужна проверка на телефоне/ТВ владельцем, пост в канал — после проверки). Ветка `native-player` на GitHub влита, её можно удалить.

## План на потом (делать, когда владелец спросит «что ещё»)
- Статистика в админке (регистрации, гости/вошедшие, страны, платформы, топ станций) — Cloudflare D1, без списков сырых IP (GDPR).
- Таймер прослушивания («▶ 12:34 в эфире»).
- Защита от обрывов: буфер 10–30 с (по-настоящему — нативный плеер в Android; настройкой).
- Сайт на английском и немецком; Chromecast; «Топ SlyNet»; светлая тема; свой домен; картинки в ВК после восстановления ВК.
- Google Play / App Store — отложено (в магазинной сборке `SlyNet-Store` раздела ТВ нет).
- RuStore — отдельная сборка `com.slynet.radio.rustore` (ТВ без РФ/Украины и новостей, без автообновления кода): всё в `docs/RUSTORE.md`, графика в `docs/rustore/`, сборка — workflow «Android RuStore». Версия 1.0.12 (код 101) отправлена на модерацию 29.10.2026, публикация автоматическая, приложение универсальное (телефон + ТВ).

## Второй проект
Отдельное приложение (рабочее имя Wave Radio Hub, имя будет другим) — в другом чате, на новых аккаунтах GitHub/Cloudflare. Здесь его не трогать.
