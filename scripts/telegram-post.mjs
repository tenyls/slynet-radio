/**
 * Автопостинг в Телеграм-канал SlyNet Radio.
 *   node scripts/telegram-post.mjs <mode>
 *   mode: auto | station | news | release | ask | setup
 * Тексты пишет нейросеть (GitHub Models, бесплатно для GitHub Actions); если она недоступна — шаблоны.
 * Нужны секреты: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL (@имя_канала).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_FILE = path.join(ROOT, 'data', 'telegram-state.json');
const SITE = 'https://tenyls.github.io/slynet-radio/';
const BANNER = SITE + 'telegram-card.png';
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL = process.env.TELEGRAM_CHANNEL;
const UA = 'SlyNetRadio-TelegramBot/1.0 (+https://github.com/tenyls/slynet-radio)';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchT(url, opts = {}, ms = 15000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: c.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
  } finally {
    clearTimeout(t);
  }
}

// ---------- состояние (что уже публиковали) ----------
async function loadState() {
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
  } catch {
    return { stations: [], news: [], releases: [], askIndex: 0 };
  }
}
async function saveState(s) {
  s.stations = s.stations.slice(-400);
  s.news = s.news.slice(-400);
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2));
}

// ---------- Telegram ----------
async function tg(method, body) {
  const r = await fetchT(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`${method}: ${j.description}`);
  return j.result;
}
const listenButton = (url, text = '▶️ Слушать в SlyNet Radio') => ({ inline_keyboard: [[{ text, url }]] });

async function postPhotoOrText({ photo, caption, buttons, preview = false }) {
  if (photo) {
    try {
      return await tg('sendPhoto', { chat_id: CHANNEL, photo, caption, parse_mode: 'HTML', reply_markup: buttons });
    } catch (e) {
      log('фото не отправилось, шлём текстом:', e.message);
    }
  }
  return tg('sendMessage', {
    chat_id: CHANNEL,
    text: caption,
    parse_mode: 'HTML',
    reply_markup: buttons,
    link_preview_options: { is_disabled: !preview },
  });
}

// ---------- нейросеть (GitHub Models) ----------
async function ai(system, user, maxTokens = 450) {
  const key = process.env.GITHUB_TOKEN;
  if (!key) return null;
  try {
    const r = await fetchT(
      'https://models.github.ai/inference/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          temperature: 0.8,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      },
      40000
    );
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    if (!text) log('нейросеть не ответила:', JSON.stringify(j).slice(0, 200));
    return text || null;
  } catch (e) {
    log('нейросеть недоступна:', e.message);
    return null;
  }
}
const STYLE =
  'Ты ведёшь Телеграм-канал SlyNet Radio — бесплатного сайта и приложения с радиостанциями со всего мира. ' +
  'Пиши по-русски, живо и дружелюбно, коротко, 1–2 уместных эмодзи. Без хештегов, без markdown, без ссылок. ' +
  'НИКОГДА не выдумывай факты: используй только то, что дано. Если фактов мало — говори о жанре и настроении в общих словах.';

// ---------- 1. Станция дня ----------
const COUNTRY_RU = new Intl.DisplayNames(['ru'], { type: 'region' });
const ROTATION = ['DE', 'FR', 'IT', 'ES', 'GB', 'US', 'BR', 'JP', 'NL', 'PL', 'UA', 'KZ', 'GR', 'TR', 'MX', 'CA', 'AU', 'SE', 'CZ', 'PT', 'AR', 'IN', 'KR', 'CH', 'AT', 'IE', 'NO', 'FI', 'BE', 'IL', 'RS', 'GE', 'AM', 'BY', 'LT', 'LV', 'EE', 'RO', 'BG', 'HU'];

async function pickStation(state) {
  const catalog = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'catalog.json'), 'utf8'));
  const content = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'content.json'), 'utf8').catch(() => '{}'));
  const hidden = new Set((content.hiddenCountries?.radio || []).map((c) => c.toUpperCase()));
  const posted = new Set(state.stations);

  // Чередуем: эксклюзив SlyNet ↔ популярная станция другой страны
  const useExclusive = state.stations.length % 2 === 0;
  if (useExclusive) {
    const groups = catalog.exclusive || [];
    const pool = groups.flatMap((g) => g.stations.map((s) => ({ ...s, group: g.name, groupNote: g.note }))).filter((s) => !posted.has(s.stationuuid));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  const start = state.stations.length % ROTATION.length;
  for (let i = 0; i < ROTATION.length; i++) {
    const cc = ROTATION[(start + i) % ROTATION.length];
    if (hidden.has(cc)) continue;
    try {
      const r = await fetchT(`https://de1.api.radio-browser.info/json/stations/search?countrycode=${cc}&order=votes&reverse=true&limit=40&hidebroken=true&is_https=true`);
      const list = (await r.json()).filter((s) => !posted.has(s.stationuuid) && !/(xxx|porn|sex|erotic|nsfw)/i.test(`${s.name} ${s.tags}`));
      if (list.length) return list[Math.floor(Math.random() * Math.min(list.length, 15))];
    } catch (e) {
      log('Radio Browser:', e.message);
    }
  }
  return null;
}

async function postStation(state) {
  const st = await pickStation(state);
  if (!st) return log('станция не найдена');
  const country = st.countrycode ? COUNTRY_RU.of(st.countrycode.toUpperCase()) : st.country || '';
  const tags = String(st.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5).join(', ');
  const facts = [
    `Название: ${st.name}`,
    country && `Страна: ${country}`,
    tags && `Жанры/теги: ${tags}`,
    st.bitrate && `Качество: ${st.bitrate} kbps ${st.codec || ''}`,
    st.group && `Это эксклюзив SlyNet из подборки «${st.group}» (${st.groupNote})`,
    st.homepage && `Официальный сайт: ${st.homepage}`,
  ]
    .filter(Boolean)
    .join('\n');
  const body =
    (await ai(STYLE, `Напиши пост «Станция дня» (3–4 предложения): чем она может понравиться и под какое настроение подходит.\nФакты:\n${facts}`)) ||
    `${st.name} — ${country ? `радио из страны ${country}` : 'радио со всего мира'}${tags ? `, в эфире: ${tags}` : ''}. Включайте и слушайте бесплатно, без рекламы и регистрации.`;
  const caption =
    `📻 <b>Станция дня: ${esc(st.name)}</b>\n` +
    `${country ? `🌍 ${esc(country)}` : ''}${st.bitrate ? ` · 🎧 ${st.bitrate} kbps` : ''}${st.group ? ' · ⭐ Эксклюзив SlyNet' : ''}\n\n` +
    `${esc(body)}`;
  const photo = /^https:\/\/.+\.(png|jpe?g|webp)(\?|$)/i.test(st.favicon || '') ? st.favicon : BANNER;
  await postPhotoOrText({ photo, caption, buttons: listenButton(`${SITE}#station=${st.stationuuid}`) });
  state.stations.push(st.stationuuid);
  log('опубликована станция дня:', st.name);
}

// ---------- 2. Новости музыки ----------
const FEEDS = [
  ['Billboard', 'https://www.billboard.com/feed/'],
  ['NME', 'https://www.nme.com/news/music/feed'],
  ['Pitchfork', 'https://pitchfork.com/feed/feed-news/rss'],
  ['Rolling Stone', 'https://www.rollingstone.com/music/music-news/feed/'],
  ['Consequence', 'https://consequence.net/category/music/feed/'],
  ['Stereogum', 'https://www.stereogum.com/feed/'],
  ['InterMedia', 'https://www.intermedia.ru/rss/news'],
  ['Радио Record', 'https://www.radiorecord.ru/news/rss/'],
];

const strip = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function readFeed([source, url]) {
  const r = await fetchT(url);
  if (!r.ok) throw new Error(`${source} ${r.status}`);
  const xml = await r.text();
  const items = xml.split(/<item[\s>]/).slice(1).map((chunk) => {
    const tag = (t) => (chunk.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || '';
    return {
      source,
      title: strip(tag('title')),
      link: strip(tag('link')) || (chunk.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/) || [])[1] || '',
      desc: strip(tag('description')).slice(0, 600),
      date: new Date(strip(tag('pubDate')) || Date.now()),
    };
  });
  return items.filter((i) => i.title && /^https?:\/\//.test(i.link));
}

async function postNews(state) {
  const posted = new Set(state.news);
  const all = (await Promise.allSettled(FEEDS.map(readFeed))).flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const fresh = all
    .filter((i) => !posted.has(i.link) && Date.now() - i.date.getTime() < 2 * 86400000)
    .sort((a, b) => b.date - a.date);
  if (!fresh.length) return log('свежих новостей нет');
  // Берём одну из самых свежих, чередуя источники
  const lastSource = state.lastNewsSource;
  const item = fresh.find((i) => i.source !== lastSource) || fresh[0];
  const text = await ai(
    STYLE,
    `Перескажи музыкальную новость своими словами по-русски. Формат строго такой:\nЗАГОЛОВОК: <короткий заголовок по-русски>\nТЕКСТ: <2–3 предложения пересказа>\n` +
      `Опирайся только на заголовок и анонс ниже, ничего не добавляй от себя.\n\nЗаголовок: ${item.title}\nАнонс: ${item.desc}`
  );
  let title = item.title;
  let body = item.desc.slice(0, 280);
  if (text) {
    title = (text.match(/ЗАГОЛОВОК:\s*(.+)/) || [])[1]?.trim() || title;
    body = (text.match(/ТЕКСТ:\s*([\s\S]+)/) || [])[1]?.trim() || body;
  }
  const caption =
    `🎵 <b>${esc(title)}</b>\n\n${esc(body)}\n\n` +
    `🔗 Источник: <a href="${esc(item.link)}">${esc(item.source)}</a>\n` +
    `📻 Слушайте музыку со всего мира — <a href="${SITE}">SlyNet Radio</a>`;
  await tg('sendMessage', {
    chat_id: CHANNEL,
    text: caption,
    parse_mode: 'HTML',
    link_preview_options: { url: item.link, prefer_large_media: true },
  });
  state.news.push(item.link);
  state.lastNewsSource = item.source;
  log('опубликована новость:', item.source, item.title);
}

// ---------- 3. Обновление сайта/приложения ----------
async function postRelease(state) {
  const releases = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'releases.json'), 'utf8').catch(() => '[]'));
  const r = releases[0];
  if (!r || state.releases.includes(r.version)) return log('новых релизов для публикации нет');
  const list = (title, arr, icon) => (arr?.length ? `\n<b>${title}</b>\n${arr.map((x) => `${icon} ${esc(x)}`).join('\n')}\n` : '');
  const caption =
    `🚀 <b>SlyNet Radio обновлён до версии ${esc(r.version)}</b>\n${r.title ? `${esc(r.title)}\n` : ''}` +
    list('Что нового', r.added, '✨') +
    list('Улучшено', r.improved, '⚡') +
    list('Исправлено', r.fixed, '🛠') +
    list('Убрано', r.removed, '🗑') +
    `\nСайт обновится сам, приложение — при следующем запуске.`;
  await postPhotoOrText({ photo: BANNER, caption: caption.slice(0, 1020), buttons: listenButton(SITE, '🚀 Открыть SlyNet Radio') });
  state.releases.push(r.version);
  log('опубликован релиз', r.version);
}

// ---------- 4. Вопрос подписчикам ----------
const ASKS = [
  'Какие станции или жанры добавить в SlyNet Radio? 🎧 Напишите нам через кнопку «Написать в поддержку» на сайте — читаем всё!',
  'Что слушаете сегодня? 📻 Поделитесь любимой станцией — лучшие попадут в рубрику «Станция дня».',
  'Есть идея, как сделать SlyNet Radio удобнее? 💡 Кнопка «Написать в поддержку» на сайте и в приложении — ждём ваши предложения.',
  'Нашли станцию, которая не играет? 🛠 Сообщите через «Написать в поддержку» — починим или заменим.',
];
async function postAsk(state) {
  const i = (state.askIndex || 0) % ASKS.length;
  await postPhotoOrText({ photo: null, caption: ASKS[i], buttons: listenButton(SITE, '✍️ Открыть сайт') });
  state.askIndex = i + 1;
  log('опубликован вопрос подписчикам');
}

// ---------- 5. Настройка бота (кнопка «Слушать» в чате с ботом — мини-приложение) ----------
async function setup() {
  await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: '🎧 Слушать', web_app: { url: SITE } } });
  await tg('setMyDescription', { description: 'SlyNet Radio — тысячи радиостанций со всего мира бесплатно. Нажмите «🎧 Слушать», чтобы открыть радио прямо в Telegram.' });
  await tg('setMyShortDescription', { short_description: 'Радио со всего мира — бесплатно, без рекламы 📻' });
  await tg('setMyCommands', { commands: [{ command: 'start', description: 'Открыть SlyNet Radio' }] });
  log('бот настроен: кнопка «Слушать» открывает сайт как мини-приложение');
}

// ---------- запуск ----------
function autoMode() {
  const d = new Date();
  const h = d.getUTCHours();
  if (d.getUTCDay() === 0 && h >= 18) return 'ask';
  return h < 8 || (h >= 13 && h < 16) ? 'station' : 'news';
}

const mode = (process.argv[2] || 'auto') === 'auto' ? autoMode() : process.argv[2];
if (!TOKEN || !CHANNEL) {
  log('Секреты TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL не заданы — пропускаю.');
  process.exit(0);
}
const state = await loadState();
try {
  if (mode === 'station') await postStation(state);
  else if (mode === 'news') await postNews(state);
  else if (mode === 'release') await postRelease(state);
  else if (mode === 'ask') await postAsk(state);
  else if (mode === 'setup') await setup();
  else log('неизвестный режим', mode);
} finally {
  await saveState(state);
}
