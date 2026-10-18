/**
 * Автопостинг в Телеграм-канал SlyNet Radio.
 *   node scripts/telegram-post.mjs <mode>
 *   mode: auto | day | station | news | release | ask | promo | setup
 * Тексты пишет нейросеть Google Gemini (бесплатный ключ); если она недоступна — шаблоны.
 * Нужны секреты: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL (@имя_канала), GEMINI_API_KEY.
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

// Подпись под каждым постом: канал, сайт, приложения, бот (ссылки спрятаны под названия)
let BOT_USERNAME = '';
async function footer() {
  if (!BOT_USERNAME) {
    try {
      BOT_USERNAME = (await tg('getMe', {})).username || '';
    } catch {}
  }
  const ch = CHANNEL.startsWith('@') ? CHANNEL.slice(1) : 'SlyNetRadio';
  return (
    `\n\n➖➖➖\n` +
    `📢 Подписывайтесь: <a href="https://t.me/${ch}">Telegram @${ch}</a> · <a href="https://vk.com/clubslynet">ВКонтакте</a>\n` +
    `🎧 Слушать: <a href="${SITE}">в браузере</a> · <a href="${SITE}#apps">Android</a> · <a href="${SITE}#apps">iPhone/iPad</a>` +
    (BOT_USERNAME ? ` · <a href="https://t.me/${BOT_USERNAME}?startapp">в Telegram</a>` : '')
  );
}
const CAPTION_MAX = 1024;
/** Текст + подпись, с обрезкой основной части, чтобы влезть в лимит Telegram */
async function withFooter(text, limit = CAPTION_MAX) {
  const f = await footer();
  const room = limit - f.length - 5;
  // обрезаем только по тексту без HTML-тегов внутри (тексты у нас простые: <b>, <a>)
  let t = text;
  if (t.length > room) t = t.slice(0, room).replace(/<[^>]*$/, '').replace(/\s+\S*$/, '') + '…';
  return t + f;
}

async function postPhotoOrText({ photo, caption, buttons, preview = false }) {
  // photo: Buffer (наша карточка), URL или null
  if (photo && Buffer.isBuffer(photo)) {
    try {
      const fd = new FormData();
      fd.append('chat_id', CHANNEL);
      fd.append('caption', caption);
      fd.append('parse_mode', 'HTML');
      if (buttons) fd.append('reply_markup', JSON.stringify(buttons));
      fd.append('photo', new Blob([photo], { type: 'image/png' }), 'slynet.png');
      const r = await fetchT(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, { method: 'POST', body: fd }, 30000);
      const j = await r.json();
      if (j.ok) return j.result;
      log('фото-карточка не отправилась:', j.description);
    } catch (e) {
      log('фото-карточка не отправилась:', e.message);
    }
    photo = BANNER;
  }
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

// ---------- ВКонтакте: тот же пост на стену группы (если заданы VK_TOKEN и VK_GROUP_ID) ----------
const VK_TOKEN = process.env.VK_TOKEN;
const VK_GROUP = String(process.env.VK_GROUP_ID || '').replace(/^-?(club|public)?/, '');
const htmlToPlain = (h) =>
  String(h)
    .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
// RSS-лента сайта: ВКонтакте («Импорт в сообщество») и другие сервисы забирают посты отсюда
const RSS_FILE = path.join(ROOT, 'public', 'rss.xml');
const RSS_ITEMS = path.join(ROOT, 'data', 'rss-items.json');
async function addToFeed(html, link) {
  try {
    const items = JSON.parse(await fs.readFile(RSS_ITEMS, 'utf8').catch(() => '[]'));
    const plain = htmlToPlain(html).trim();
    const title = plain.split('\n')[0].replace(/^[^\p{L}\p{N}]+/u, '').slice(0, 120) || 'SlyNet Radio';
    const ch = CHANNEL.startsWith('@') ? CHANNEL.slice(1) : 'SlyNetRadio';
    const text = plain + `\n\n🎧 Слушать: ${SITE}\n📱 Приложения: ${SITE}#apps\n📢 Telegram: https://t.me/${ch}`;
    items.unshift({ title, link: link || SITE, text, date: new Date().toUTCString(), id: `slynet-${Date.now()}` });
    const keep = items.slice(0, 40);
    await fs.writeFile(RSS_ITEMS, JSON.stringify(keep, null, 1));
    const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n` +
      `<title>SlyNet Radio</title><link>${SITE}</link><description>Радио со всего мира: станции дня, новости музыки и обновления SlyNet Radio</description><language>ru</language>\n` +
      keep
        .map(
          (i) =>
            `<item><title>${x(i.title)}</title><link>${x(i.link)}</link><guid isPermaLink="false">${i.id}</guid><pubDate>${i.date}</pubDate><description>${x(i.text)}</description></item>`
        )
        .join('\n') +
      `\n</channel></rss>\n`;
    await fs.writeFile(RSS_FILE, xml);
  } catch (e) {
    log('RSS не обновилась:', e.message);
  }
}

async function vkApi(method, params) {
  const body = new URLSearchParams({ ...params, access_token: VK_TOKEN, v: '5.199' });
  const r = await fetchT(`https://api.vk.com/method/${method}`, { method: 'POST', body }, 20000);
  const j = await r.json();
  if (j.error) throw new Error(`${method} ${j.error.error_code}: ${j.error.error_msg}`);
  return j.response;
}

/** Загружаем картинку на стену группы (если ВК разрешит ключом сообщества) */
async function vkPhoto(buf) {
  if (!buf) return '';
  try {
    const srv = await vkApi('photos.getWallUploadServer', { group_id: VK_GROUP });
    const fd = new FormData();
    fd.append('photo', new Blob([buf], { type: 'image/png' }), 'slynet.png');
    const up = await (await fetchT(srv.upload_url, { method: 'POST', body: fd }, 30000)).json();
    const saved = await vkApi('photos.saveWallPhoto', { group_id: VK_GROUP, photo: up.photo, server: String(up.server), hash: up.hash });
    const p = saved[0];
    return `photo${p.owner_id}_${p.id}`;
  } catch (e) {
    log('ВК: картинка не загрузилась —', e.message);
    VK_PHOTO_ERROR = e.message;
    return '';
  }
}

async function vkPost(html, link, photoBuf) {
  await addToFeed(html, link);
  if (!VK_TOKEN || !VK_GROUP) return;
  try {
    const ch = CHANNEL.startsWith('@') ? CHANNEL.slice(1) : 'SlyNetRadio';
    const text =
      htmlToPlain(html) +
      `\n\n➖➖➖\n🎧 Слушать: ${link && link.startsWith(SITE) ? link : SITE}\n📱 Приложения для Android и iPhone: ${SITE}#apps\n` +
      `📢 Подписывайтесь: Telegram https://t.me/${ch} · ВКонтакте https://vk.com/clubslynet`;
    let buf = photoBuf;
    if (!buf) buf = await fs.readFile(path.join(ROOT, 'public', 'telegram-card.png')).catch(() => null);
    const photo = await vkPhoto(buf);
    const params = { owner_id: '-' + VK_GROUP, from_group: '1', message: text.slice(0, 15000) };
    if (photo) params.attachments = photo;
    const res = await vkApi('wall.post', params);
    VK_ERROR = photo ? '' : `опубликовано без картинки (${VK_PHOTO_ERROR})`;
    log('ВК: пост опубликован', res?.post_id);
  } catch (e) {
    VK_ERROR = e.message;
    log('ВК не принял пост:', e.message);
  }
}
let VK_ERROR = '';
let VK_PHOTO_ERROR = '';

// ---------- фирменная картинка поста (рисуем сами, чтобы не было белых/битых картинок) ----------
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  log('sharp не установлен — картинки будут баннером');
}
const xmlEsc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Логотип станции: скачиваем, проверяем размер и «не однотонность», кладём на тёмную подложку */
async function stationLogo(url) {
  if (!sharp || !/^https:\/\//.test(url || '')) return null;
  try {
    const r = await fetchT(url, {}, 10000);
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const img = sharp(buf, { failOn: 'none' });
    const meta = await img.metadata();
    if (!meta.width || meta.width < 64 || meta.height < 64) return null;
    const flat = await sharp(buf).resize(380, 380, { fit: 'contain', background: { r: 24, g: 24, b: 27, alpha: 1 } }).flatten({ background: '#18181b' }).png().toBuffer();
    const st = await sharp(flat).stats();
    const spread = st.channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3;
    if (spread < 12) return null; // почти однотонная — значит пустая/белая
    return flat;
  } catch {
    return null;
  }
}

async function makeCard({ label, title, subtitle, logoUrl }) {
  if (!sharp) return null;
  try {
    const globe = await sharp(path.join(ROOT, 'public', 'logo-globe.png')).resize(380, 380).png().toBuffer();
    const logo = (await stationLogo(logoUrl)) || globe;
    // Название: 1–2 строки, шрифт подбираем под длину (ширина поля ~640px)
    const words = String(title).split(/\s+/);
    const lines = [];
    const maxChars = title.length <= 20 ? 20 : 24;
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last && (last + ' ' + w).length <= maxChars) lines[lines.length - 1] = last + ' ' + w;
      else lines.push(w);
    }
    if (lines.length > 2) lines.splice(1, lines.length - 1, (lines.slice(1).join(' ').slice(0, maxChars - 1) + '…'));
    const fs1 = lines.length === 1 && title.length <= 20 ? 56 : 44;
    const titleSvg = lines
      .map((l, i) => `<text x="580" y="${lines.length === 1 ? 330 : 312 + i * 52}" font-family="DejaVu Sans, sans-serif" font-size="${fs1}" font-weight="bold" fill="#ffffff">${xmlEsc(l.length > maxChars + 2 ? l.slice(0, maxChars) + '…' : l)}</text>`)
      .join('');
    const subY = lines.length === 1 ? 395 : 420;
    const svg = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="25%" cy="50%" r="55%"><stop offset="0" stop-color="#065f46" stop-opacity=".9"/><stop offset="1" stop-color="#09090b" stop-opacity="0"/></radialGradient>
        <radialGradient id="g2" cx="90%" cy="0%" r="60%"><stop offset="0" stop-color="#0e7490" stop-opacity=".7"/><stop offset="1" stop-color="#09090b" stop-opacity="0"/></radialGradient>
        <linearGradient id="acc" x1="0" x2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#10b981"/><stop offset="1" stop-color="#a3e635"/></linearGradient>
      </defs>
      <rect width="1280" height="720" fill="#09090b"/><rect width="1280" height="720" fill="url(#g1)"/><rect width="1280" height="720" fill="url(#g2)"/>
      <rect x="96" y="150" width="420" height="420" rx="48" fill="#18181b" stroke="url(#acc)" stroke-width="4"/>
      <text x="580" y="240" font-family="DejaVu Sans, sans-serif" font-size="34" font-weight="bold" fill="#34d399">${xmlEsc(label)}</text>
      ${titleSvg}
      <text x="580" y="${subY}" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#a1a1aa">${xmlEsc(subtitle || '')}</text>
      <rect x="580" y="465" width="420" height="6" rx="3" fill="url(#acc)"/>
      <text x="580" y="530" font-family="DejaVu Sans, sans-serif" font-size="34" font-weight="bold" fill="#ffffff">SlyNet <tspan fill="#34d399">Radio</tspan></text>
      <text x="580" y="575" font-family="DejaVu Sans, sans-serif" font-size="24" fill="#71717a">Радио со всего мира · бесплатно</text>
    </svg>`;
    return await sharp(Buffer.from(svg))
      .composite([{ input: logo, left: 116, top: 170 }])
      .png()
      .toBuffer();
  } catch (e) {
    log('карточка не собралась:', e.message);
    return null;
  }
}

// ---------- нейросеть (Google Gemini) ----------
let AI_ERROR = '';
async function ai(system, user, maxTokens = 700) {
  // Google Gemini (бесплатный ключ из Google AI Studio → секрет GEMINI_API_KEY)
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    AI_ERROR = 'нет секрета GEMINI_API_KEY';
    return null;
  }
  for (const model of ['gemini-flash-latest', 'gemini-2.5-flash']) {
    try {
      const r = await fetchT(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens + 1500 },
          }),
        },
        60000
      );
      const raw = await r.text();
      let j = null;
      try {
        j = JSON.parse(raw);
      } catch {}
      const text = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (text) {
        AI_ERROR = '';
        return text;
      }
      AI_ERROR = `${model} HTTP ${r.status}: ${raw.slice(0, 300)}`;
      log('нейросеть не ответила:', AI_ERROR);
    } catch (e) {
      AI_ERROR = `${model}: ${e.message}`;
      log('нейросеть недоступна:', AI_ERROR);
    }
  }
  return null;
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

async function postStation(state, isDay = false) {
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
    (await ai(STYLE, `Напиши пост «${isDay ? 'Станция дня' : 'Интересная станция'}» (3–4 предложения): чем она может понравиться и под какое настроение подходит. ${isDay ? 'Это утренний пост — можно пожелать хорошего дня.' : ''}\nФакты:\n${facts}`)) ||
    `${st.name} — ${country ? `радио из страны ${country}` : 'радио со всего мира'}${tags ? `, в эфире: ${tags}` : ''}. Включайте и слушайте бесплатно, без рекламы и регистрации.`;
  const caption =
    `${isDay ? '🌅 <b>Станция дня' : '📻 <b>Интересная станция'}: ${esc(st.name)}</b>\n` +
    `${country ? `🌍 ${esc(country)}` : ''}${st.bitrate ? ` · 🎧 ${st.bitrate} kbps` : ''}${st.group ? ' · ⭐ Эксклюзив SlyNet' : ''}\n\n` +
    `${esc(body)}`;
  const photo =
    (await makeCard({ label: isDay ? 'СТАНЦИЯ ДНЯ' : 'ИНТЕРЕСНАЯ СТАНЦИЯ', title: st.name, subtitle: [country, st.bitrate ? `${st.bitrate} kbps` : '', st.group ? 'Эксклюзив SlyNet' : ''].filter(Boolean).join(' · '), logoUrl: st.favicon })) ||
    BANNER;
  await postPhotoOrText({ photo, caption: await withFooter(caption), buttons: listenButton(`${SITE}#station=${st.stationuuid}`) });
  await vkPost(caption, `${SITE}#station=${st.stationuuid}`, Buffer.isBuffer(photo) ? photo : null);
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
  if (!fresh.length) {
    log('свежих новостей нет — вместо неё интересная станция');
    return postStation(state);
  }
  // Пробуем самые свежие (чередуя источники): нейросеть пишет по-русски и отбрасывает не-музыкальное
  const lastSource = state.lastNewsSource;
  const ordered = [...fresh.filter((i) => i.source !== lastSource), ...fresh.filter((i) => i.source === lastSource)].slice(0, 6);
  let item = null;
  let title = '';
  let body = '';
  for (const cand of ordered) {
    const text = await ai(
      STYLE,
      `Ниже анонс новости. Если она НЕ про музыку (исполнители, группы, альбомы, песни, концерты, радио, музыкальная индустрия, шоу-бизнес вокруг музыки), ответь одним словом: НЕ_МУЗЫКА.\n` +
        `Иначе перескажи её своими словами ПО-РУССКИ (имена и названия можно оставить в оригинале). Формат строго:\nЗАГОЛОВОК: <короткий заголовок по-русски>\nТЕКСТ: <2–3 предложения пересказа по-русски>\n` +
        `Опирайся только на заголовок и анонс, ничего не добавляй от себя.\n\nЗаголовок: ${cand.title}\nАнонс: ${cand.desc}`
    );
    if (!text) {
      state.news.push(cand.link); // не смогли перевести — не публикуем на английском
      continue;
    }
    if (/НЕ_МУЗЫКА/.test(text)) {
      state.news.push(cand.link);
      continue;
    }
    title = (text.match(/ЗАГОЛОВОК:\s*(.+)/) || [])[1]?.trim() || '';
    body = (text.match(/ТЕКСТ:\s*([\s\S]+)/) || [])[1]?.trim() || '';
    if (title && body && /[а-яё]/i.test(body)) {
      item = cand;
      break;
    }
    state.news.push(cand.link);
  }
  if (!item) {
    log('подходящей новости на русском нет — вместо неё интересная станция');
    return postStation(state);
  }
  const caption = await withFooter(
    `🎵 <b>${esc(title)}</b>\n\n${esc(body)}\n\n🔗 Источник: <a href="${esc(item.link)}">${esc(item.source)}</a>`,
    4000
  );
  await tg('sendMessage', {
    chat_id: CHANNEL,
    text: caption,
    parse_mode: 'HTML',
    link_preview_options: { url: item.link, prefer_large_media: true },
  });
  await vkPost(`🎵 <b>${esc(title)}</b>\n\n${esc(body)}\n\nИсточник: ${item.source} — ${item.link}`, item.link);
  state.news.push(item.link);
  state.lastNewsSource = item.source;
  log('опубликована новость:', item.source, item.title);
}

// ---------- 3. Обновление сайта/приложения ----------
async function postRelease(state) {
  // Не чаще раза в сутки: все непубликованные версии собираем в один пост
  const releases = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'releases.json'), 'utf8').catch(() => '[]'));
  const fresh = releases.filter((r) => !state.releases.includes(r.version));
  if (!fresh.length) return log('новых релизов для публикации нет');
  const merged = (k) => [...new Set(fresh.flatMap((r) => r[k] || []))];
  const r = fresh[0];
  const list = (title, arr, icon) => (arr?.length ? `\n<b>${title}</b>\n${arr.map((x) => `${icon} ${esc(x)}`).join('\n')}\n` : '');
  const caption =
    `🚀 <b>SlyNet Radio обновлён до версии ${esc(r.version)}</b>\n${r.title ? `${esc(r.title)}\n` : ''}` +
    list('Что нового', merged('added'), '✨') +
    list('Улучшено', merged('improved'), '⚡') +
    list('Исправлено', merged('fixed'), '🛠') +
    list('Убрано', merged('removed'), '🗑') +
    `\nСайт обновится сам, приложение — при следующем запуске.`;
  await postPhotoOrText({ photo: BANNER, caption: await withFooter(caption), buttons: listenButton(SITE, '🚀 Открыть SlyNet Radio') });
  await vkPost(caption, SITE);
  state.releases.push(...fresh.map((x) => x.version));
  state.lastReleaseAt = Date.now();
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
  await postPhotoOrText({ photo: null, caption: await withFooter(ASKS[i], 4000), buttons: listenButton(SITE, '✍️ Открыть сайт') });
  await vkPost(ASKS[i], SITE);
  state.askIndex = i + 1;
  log('опубликован вопрос подписчикам');
}

// ---------- 4б. Напоминание о приложениях ----------
const PROMOS = [
  '📱 <b>SlyNet Radio всегда под рукой</b>\n\n🤖 <b>Android:</b> скачайте приложение (APK) на сайте — раздел «Mobile Apps». Музыка играет даже при выключенном экране, обновления приходят сами.\n🍏 <b>iPhone и iPad:</b> откройте сайт в Safari → «Поделиться» → «На экран „Домой“» — и радио станет полноценным приложением.\n\n⏳ В Google Play и App Store — скоро. Как только выйдем, объявим здесь!',
  '🎧 <b>Слушаете радио в браузере?</b>\n\nПоставьте SlyNet Radio как приложение — так удобнее:\n• Android — APK с нашего сайта (раздел «Mobile Apps»)\n• iPhone — Safari → «Поделиться» → «На экран „Домой“»\n\nСкоро — в Google Play и App Store. Следите за новостями канала!',
  '⭐ <b>Знаете ли вы?</b>\n\nВ SlyNet Radio можно собрать <b>свой плейлист</b> — просто нажимайте ♥ у любимых станций. А Radio Record — 117 официальных каналов — уже в разделе «Эксклюзив».\n\n📱 Приложение для Android — на сайте, для iPhone — через «На экран „Домой“». Google Play и App Store — скоро!',
];
async function postPromo(state) {
  const i = (state.promoIndex || 0) % PROMOS.length;
  await postPhotoOrText({ photo: BANNER, caption: await withFooter(PROMOS[i]), buttons: { inline_keyboard: [[{ text: '📱 Скачать / установить', url: SITE + '#apps' }], [{ text: '▶️ Слушать сейчас', url: SITE }]] } });
  await vkPost(PROMOS[i], SITE + '#apps');
  state.promoIndex = i + 1;
  log('опубликовано напоминание о приложениях');
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
// Расписание приходит из GitHub (строка cron), по ней понимаем, что публиковать
function autoMode() {
  const cron = process.env.SCHEDULE || '';
  if (cron.startsWith('40 18')) return 'ask';
  if (cron.startsWith('10 15')) return 'promo';
  const h = Number(cron.split(' ')[1] ?? new Date().getUTCHours());
  if (h === 6) return 'day';
  if ([10, 14, 18].includes(h)) return 'station';
  return 'news';
}

const mode = (process.argv[2] || 'auto') === 'auto' ? autoMode() : process.argv[2];
if (!TOKEN || !CHANNEL) {
  log('Секреты TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL не заданы — пропускаю.');
  process.exit(0);
}
const state = await loadState();
try {
  if (mode === 'day') await postStation(state, true);
  else if (mode === 'station') await postStation(state);
  else if (mode === 'promo') await postPromo(state);
  else if (mode === 'news') await postNews(state);
  else if (mode === 'release') await postRelease(state);
  else if (mode === 'ask') await postAsk(state);
  else if (mode === 'setup') await setup();
  else log('неизвестный режим', mode);
} finally {
  state.aiError = AI_ERROR || undefined;
  state.vkError = VK_ERROR || undefined;
  await saveState(state);
}
