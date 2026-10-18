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

async function postPhotoOrText({ photo, caption, buttons, preview = false, silent = false }) {
  // photo: Buffer (наша карточка), URL или null
  if (photo && Buffer.isBuffer(photo)) {
    try {
      const fd = new FormData();
      fd.append('chat_id', CHANNEL);
      fd.append('caption', caption);
      fd.append('parse_mode', 'HTML');
      if (silent) fd.append('disable_notification', 'true');
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
      return await tg('sendPhoto', { chat_id: CHANNEL, photo, caption, parse_mode: 'HTML', reply_markup: buttons, disable_notification: silent });
    } catch (e) {
      log('фото не отправилось, шлём текстом:', e.message);
    }
  }
  return tg('sendMessage', {
    chat_id: CHANNEL,
    text: caption,
    parse_mode: 'HTML',
    reply_markup: buttons,
    disable_notification: silent,
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

async function vkApi(method, params, token = VK_TOKEN) {
  const body = new URLSearchParams({ ...params, access_token: token, v: '5.199' });
  const r = await fetchT(`https://api.vk.com/method/${method}`, { method: 'POST', body }, 20000);
  const j = await r.json();
  if (j.error) throw new Error(`${method} ${j.error.error_code}: ${j.error.error_msg}`);
  return j.response;
}

/** Ключ администратора: сервер slynet-api хранит его и сам обновляет (вход через VK ID в админке → «Сервер»). */
const VK_BRIDGE_KEY = process.env.VK_BRIDGE_KEY;
const VK_BRIDGE_URL = (process.env.VK_BRIDGE_URL || 'https://slynet-api.tenylse.workers.dev').replace(/\/+$/, '');
let vkUserToken;
async function vkAdminToken() {
  if (vkUserToken !== undefined) return vkUserToken;
  vkUserToken = '';
  if (!VK_BRIDGE_KEY) return '';
  try {
    const r = await fetchT(`${VK_BRIDGE_URL}/vk/token`, { method: 'POST', headers: { 'X-Bridge-Key': VK_BRIDGE_KEY } }, 20000);
    const j = await r.json();
    if (j.access_token) vkUserToken = j.access_token;
    else VK_PHOTO_ERROR = j.error || `сервер ответил ${r.status}`;
  } catch (e) {
    VK_PHOTO_ERROR = 'сервер ключей недоступен: ' + e.message;
  }
  return vkUserToken;
}

/** Загружаем картинку на стену группы — только ключом администратора (ключ сообщества ВК так не умеет) */
async function vkPhoto(buf, token) {
  if (!buf || !token) return '';
  try {
    const srv = await vkApi('photos.getWallUploadServer', { group_id: VK_GROUP }, token);
    const fd = new FormData();
    fd.append('photo', new Blob([buf], { type: 'image/png' }), 'slynet.png');
    const up = await (await fetchT(srv.upload_url, { method: 'POST', body: fd }, 30000)).json();
    if (!up.photo || up.photo === '[]') throw new Error('сервер загрузки ВК не принял файл');
    const saved = await vkApi('photos.saveWallPhoto', { group_id: VK_GROUP, photo: up.photo, server: String(up.server), hash: up.hash }, token);
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
  if ((!VK_TOKEN && !VK_BRIDGE_KEY) || !VK_GROUP) return;
  try {
    const ch = CHANNEL.startsWith('@') ? CHANNEL.slice(1) : 'SlyNetRadio';
    const text =
      htmlToPlain(html) +
      `\n\n➖➖➖\n🎧 Слушать: ${link && link.startsWith(SITE) ? link : SITE}\n📱 Приложения для Android и iPhone: ${SITE}#apps\n` +
      `📢 Подписывайтесь: Telegram https://t.me/${ch} · ВКонтакте https://vk.com/clubslynet`;
    let buf = photoBuf;
    if (!buf) buf = await fs.readFile(path.join(ROOT, 'public', 'telegram-card.png')).catch(() => null);
    if (!VK_BRIDGE_KEY && VK_TOKEN && sharp && buf) {
      // Сразу пробуем настоящую картинку (загрузка «для сообщений» — ключу сообщества разрешена)
      try {
        const jpg = await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
        const photo = await vkMsgPhoto(jpg);
        const res = await vkApi('wall.post', { owner_id: '-' + VK_GROUP, from_group: '1', message: text.slice(0, 15000), attachments: photo });
        VK_ERROR = '';
        log('ВК: пост с картинкой опубликован', res?.post_id);
        // проверяем, что ВК действительно показал картинку (во время сбоев он её молча теряет)
        try {
          const [w] = await vkApi('wall.getById', { posts: `-${VK_GROUP}_${res?.post_id}` });
          VK_PHOTO_SHOWN = (w?.attachments || []).some((a) => a.type === 'photo');
          if (!VK_PHOTO_SHOWN) VK_ERROR = 'ВК принял пост, но картинку не показал';
        } catch (e) {
          VK_PHOTO_SHOWN = 'не проверено: ' + e.message;
        }
        return;
      } catch (e) {
        log('ВК: картинка сразу не прошла —', e.message, '— ставлю в очередь с превью');
      }
      // Без ключа администратора: картинка — через страницу-превью на нашем сайте (ВК сам покажет её крупно).
      // Страница появится после публикации сайта, поэтому пост уходит в очередь (режим vkflush, следующий шаг workflow).
      await vkQueueAdd(text, html, link, buf);
      return;
    }
    const admin = await vkAdminToken();
    if (!admin && !VK_PHOTO_ERROR) VK_PHOTO_ERROR = 'не задан VK_BRIDGE_KEY';
    const photo = await vkPhoto(buf, admin);
    const params = { owner_id: '-' + VK_GROUP, from_group: '1', message: text.slice(0, 15000) };
    if (photo) params.attachments = photo;
    let res;
    try {
      // пост от имени группы: ключом администратора (с картинкой), иначе — ключом сообщества (текст)
      res = await vkApi('wall.post', params, photo ? admin : VK_TOKEN || admin);
    } catch (e) {
      if (!photo || !VK_TOKEN) throw e;
      log('ВК: ключ администратора не смог опубликовать —', e.message);
      VK_PHOTO_ERROR = e.message;
      delete params.attachments;
      res = await vkApi('wall.post', params, VK_TOKEN);
    }
    VK_ERROR = params.attachments ? '' : `опубликовано без картинки (${VK_PHOTO_ERROR})`;
    log('ВК: пост опубликован', res?.post_id);
  } catch (e) {
    VK_ERROR = e.message;
    log('ВК не принял пост:', e.message);
  }
}
let VK_ERROR = '';
let VK_PHOTO_SHOWN;
let VK_PHOTO_ERROR = '';

// ---------- ВК: картинка через страницу-превью (ключа сообщества достаточно) ----------
const SHARE_DIR = path.join(ROOT, 'public', 's');
const VK_QUEUE = path.join(ROOT, 'data', 'vk-queue.json');
const readQueue = async () => JSON.parse(await fs.readFile(VK_QUEUE, 'utf8').catch(() => '[]'));

async function vkQueueAdd(message, html, link, buf) {
  const id = Date.now().toString(36);
  await fs.mkdir(SHARE_DIR, { recursive: true });
  // ВК показывает крупное превью ссылки в пропорции ~2.24:1 — обрезаем карточку по центру
  const wide = await sharp(buf).resize(1280, 572, { fit: 'cover', position: 'centre' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  await fs.writeFile(path.join(SHARE_DIR, id + '.jpg'), wide);
  const plain = htmlToPlain(html).trim();
  const title = plain.split('\n')[0].replace(/^[^\p{L}\p{N}]+/u, '').slice(0, 90) || 'SlyNet Radio';
  const desc = plain.split('\n').slice(1).join(' ').replace(/\s+/g, ' ').trim().slice(0, 180) || 'Радио со всего мира — бесплатно';
  const target = link && link.startsWith(SITE) ? link : SITE;
  const x = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  await fs.writeFile(
    path.join(SHARE_DIR, id + '.html'),
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${x(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="website"><meta property="og:site_name" content="SlyNet Radio">
<meta property="og:title" content="${x(title)}"><meta property="og:description" content="${x(desc)}">
<meta property="og:image" content="${SITE}s/${id}.jpg"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="572">
<meta property="og:url" content="${SITE}s/${id}.html">
</head><body style="background:#09090b;color:#fff;font-family:system-ui;text-align:center;padding:40px">
<img src="${id}.jpg" alt="" style="max-width:100%;border-radius:16px"><p><a style="color:#34d399" href="${x(target)}">Открыть SlyNet Radio →</a></p>
<script>location.replace(${JSON.stringify(target)})</script></body></html>\n`
  );
  const q = await readQueue();
  q.push({ id, message, at: Date.now() });
  await fs.writeFile(VK_QUEUE, JSON.stringify(q, null, 1));
  log('ВК: пост в очереди, страница-превью', id);
}

/** Картинка через загрузку «для сообщений» — этот метод ключу сообщества разрешён */
async function vkMsgPhoto(buf) {
  const srv = await vkApi('photos.getMessagesUploadServer', { peer_id: '0' });
  const fd = new FormData();
  fd.append('photo', new Blob([buf], { type: 'image/jpeg' }), 'slynet.jpg');
  const up = await (await fetchT(srv.upload_url, { method: 'POST', body: fd }, 30000)).json();
  if (!up.photo || up.photo === '[]') throw new Error('сервер загрузки ВК не принял файл');
  const saved = await vkApi('photos.saveMessagesPhoto', { photo: up.photo, server: String(up.server), hash: up.hash });
  const p = saved[0];
  return `photo${p.owner_id}_${p.id}${p.access_key ? '_' + p.access_key : ''}`;
}

/** Публикуем очередь ВК, когда страницы-превью уже доступны на сайте */
async function vkFlush(state) {
  const q = await readQueue();
  if (!q.length) return log('ВК: очередь пуста');
  if (!VK_TOKEN || !VK_GROUP) return log('ВК: нет VK_TOKEN / VK_GROUP_ID');
  const left = [];
  const deadline = Date.now() + 8 * 60000;
  for (const item of q) {
    const page = `${SITE}s/${item.id}.html`;
    let live = false;
    while (Date.now() < deadline) {
      const r = await fetchT(`${SITE}s/${item.id}.jpg`, { method: 'HEAD' }, 15000).catch(() => null);
      if (r?.ok) {
        live = true;
        break;
      }
      await sleep(20000);
    }
    const params = { owner_id: '-' + VK_GROUP, from_group: '1', message: item.message.slice(0, 15000) };
    // 1) настоящая картинка поста (загрузка «для сообщений»)
    const img = await fs.readFile(path.join(SHARE_DIR, item.id + '.jpg')).catch(() => null);
    if (img) {
      try {
        const photo = await vkMsgPhoto(img);
        const res = await vkApi('wall.post', { ...params, attachments: photo });
        VK_ERROR = '';
        state.vkVia = 'photo';
        log('ВК: пост с картинкой опубликован', res?.post_id);
        continue;
      } catch (e) {
        log('ВК: картинка-вложение не прошла —', e.message);
        state.vkPhotoTry = e.message;
      }
    }
    // 2) превью ссылки на нашу страницу
    if (live) params.attachments = page;
    else if (Date.now() - item.at < 3 * 3600000) {
      left.push(item); // сайт ещё не обновился — попробуем в следующий раз
      continue;
    }
    try {
      const res = await vkApi('wall.post', params);
      VK_ERROR = live ? '' : 'опубликовано без картинки: страница-превью не появилась за 3 часа';
      if (live) state.vkVia = 'link';
      log('ВК: пост опубликован', res?.post_id, live ? 'с картинкой' : 'без картинки');
    } catch (e) {
      if (!params.attachments) {
        VK_ERROR = e.message;
        log('ВК не принял пост:', e.message);
        continue;
      }
      // ВК не смог разобрать превью — публикуем текстом, чтобы пост не пропал
      log('ВК: превью не подошло —', e.message);
      delete params.attachments;
      try {
        await vkApi('wall.post', params);
        VK_ERROR = 'опубликовано без картинки: ' + e.message;
      } catch (e2) {
        VK_ERROR = e2.message;
      }
    }
  }
  await fs.writeFile(VK_QUEUE, JSON.stringify(left, null, 1));
  // убираем старые страницы-превью (оставляем последние 40)
  const files = (await fs.readdir(SHARE_DIR).catch(() => [])).filter((f) => f.endsWith('.html')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - 40))) {
    await fs.rm(path.join(SHARE_DIR, f), { force: true });
    await fs.rm(path.join(SHARE_DIR, f.replace('.html', '.jpg')), { force: true });
  }
  state.vkError = VK_ERROR || undefined;
}

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

/** Поток играет на нашем сайте? (проверяем с адресом сайта — станции, запрещающие чужие сайты, отсеются) */
async function streamOk(url) {
  try {
    const r = await fetchT(url, { headers: { 'Icy-MetaData': '0', Referer: 'https://tenyls.github.io/', Origin: 'https://tenyls.github.io' } }, 10000);
    const type = (r.headers.get('content-type') || '').toLowerCase();
    try {
      await r.body?.cancel();
    } catch {}
    return r.ok && /audio|mpeg|aac|ogg|octet|mpegurl/.test(type);
  } catch {
    return false;
  }
}

async function pickStation(state) {
  for (let i = 0; i < 8; i++) {
    const st = await pickStationOnce(state);
    if (!st) return null;
    if (await streamOk(st.url_resolved || st.url)) return st;
    log('станция не играет на сайте, пропускаем:', st.name);
    state.stations.push(st.stationuuid); // больше не предлагать
  }
  return null;
}

async function pickStationOnce(state) {
  const catalog = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'catalog.json'), 'utf8'));
  const content = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'content.json'), 'utf8').catch(() => '{}'));
  const hidden = new Set((content.hiddenCountries?.radio || []).map((c) => c.toUpperCase()));
  const posted = new Set(state.stations);

  // Чередуем: эксклюзив SlyNet ↔ популярная станция другой страны
  const useExclusive = state.stations.length % 3 === 0; // каждая третья — эксклюзив
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
  await postPhotoOrText({ photo, caption: await withFooter(caption), buttons: listenButton(`${SITE}#station=${st.stationuuid}`), silent: !isDay });
  await vkPost(caption, `${SITE}#station=${st.stationuuid}`, Buffer.isBuffer(photo) ? photo : null);
  state.stations.push(st.stationuuid);
  log('опубликована станция дня:', st.name);
}

// ---------- 1б. Веб-камера (Windy через наш сервер) ----------
const API = 'https://slynet-api.tenylse.workers.dev';
const CAM_COUNTRIES = ['IT', 'ES', 'FR', 'DE', 'AT', 'CH', 'NO', 'IS', 'GR', 'PT', 'HR', 'NL', 'CZ', 'US', 'CA', 'JP', 'AU', 'NZ', 'GB', 'IE', 'SE', 'FI', 'PL', 'SI', 'MT', 'CY', 'TR', 'TH', 'MX', 'BR'];

async function makeCamCard(imgBuf, title, subtitle) {
  if (!sharp) return null;
  try {
    const bg = await sharp(imgBuf).resize(1280, 720, { fit: 'cover' }).modulate({ brightness: 0.9 }).png().toBuffer();
    const svg = `<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient></defs>
      <rect width="1280" height="720" fill="url(#sh)"/>
      <rect x="48" y="44" width="260" height="52" rx="26" fill="#e11d48"/>
      <text x="178" y="79" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="24" font-weight="bold" fill="#fff">● ВЕБ-КАМЕРА</text>
      <text x="56" y="600" font-family="DejaVu Sans, sans-serif" font-size="56" font-weight="bold" fill="#fff">${xmlEsc(title.length > 34 ? title.slice(0, 33) + '…' : title)}</text>
      <text x="56" y="652" font-family="DejaVu Sans, sans-serif" font-size="30" fill="#d4d4d8">${xmlEsc(subtitle)}</text>
      <text x="1232" y="680" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="26" font-weight="bold" fill="#fff">SlyNet <tspan fill="#34d399">Radio</tspan></text>
      <text x="1232" y="706" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="16" fill="#a1a1aa">Webcams provided by windy.com</text>
    </svg>`;
    return await sharp(bg).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  } catch (e) {
    log('карточка камеры не собралась:', e.message);
    return null;
  }
}

async function postWebcam(state) {
  const content = JSON.parse(await fs.readFile(path.join(ROOT, 'public', 'content.json'), 'utf8').catch(() => '{}'));
  if ((content.hiddenSections || []).includes('webcams')) {
    log('раздел веб-камер выключен на сайте — вместо камеры станция');
    return postStation(state);
  }
  const hidden = new Set((content.hiddenCountries?.webcams || []).map((c) => c.toUpperCase()));
  state.cams = state.cams || [];
  const posted = new Set(state.cams);
  const start = (state.camIndex || 0) % CAM_COUNTRIES.length;
  for (let i = 0; i < 6; i++) {
    const cc = CAM_COUNTRIES[(start + i) % CAM_COUNTRIES.length];
    if (hidden.has(cc)) continue;
    let cams = [];
    try {
      const j = await (await fetchT(`${API}/webcams?country=${cc}&lang=ru&offset=${Math.floor(Math.random() * 3) * 50}`, {}, 20000)).json();
      cams = (j.webcams || []).filter((c) => c.image && !posted.has(c.id));
    } catch (e) {
      log('камеры недоступны:', e.message);
      continue;
    }
    cams.sort((a, b) => Number(b.live) - Number(a.live));
    for (const cam of cams.slice(0, 8)) {
      // Проверяем, что картинка настоящая (не пустая) и страница камеры открывается
      let img = null;
      try {
        const r = await fetchT(cam.image, {}, 15000);
        if (r.ok) img = Buffer.from(await r.arrayBuffer());
      } catch {}
      if (!img || !sharp) continue;
      try {
        const st = await sharp(img).stats();
        if (st.channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3 < 15) continue; // однотонная — камера «спит»
      } catch {
        continue;
      }
      try {
        const pr = await fetchT(cam.page, { method: 'GET' }, 15000);
        try {
          await pr.body?.cancel();
        } catch {}
        if (pr.status === 404 || pr.status === 410) continue;
      } catch {}
      const country = COUNTRY_RU.of(cam.countryCode || cc) || cam.country;
      const place = cam.city || cam.region || country;
      const card = await makeCamCard(img, place, `${country}${cam.live ? ' · прямой эфир' : ''}`);
      const body =
        (await ai(
          STYLE,
          `Напиши короткий пост (2–3 предложения) для рубрики «Взгляд на мир»: приглашение посмотреть на это место через веб-камеру прямо сейчас. Можно одну-две общеизвестные черты места, без выдуманных подробностей.\nМесто: ${place}, ${country}\nНазвание камеры: ${cam.title}`
        )) || `Загляните в ${place} (${country}) прямо сейчас — живая картинка с веб-камеры. А под музыку SlyNet Radio смотреть ещё приятнее!`;
      const caption =
        `📷 <b>Взгляд на мир: ${esc(place)}</b>\n🌍 ${esc(country)}${cam.live ? ' · 🔴 онлайн' : ''}\n\n${esc(body)}\n\n<i>Webcams provided by <a href="https://www.windy.com/">windy.com</a></i>`;
      await postPhotoOrText({
        photo: card || BANNER,
        caption: await withFooter(caption),
        buttons: { inline_keyboard: [[{ text: '📷 Смотреть камеру', url: cam.page }], [{ text: '🌍 Все камеры на SlyNet', url: SITE + '#webcams' }]] },
        silent: true,
      });
      await vkPost(caption, SITE + '#webcams', card);
      state.cams.push(cam.id);
      state.cams = state.cams.slice(-500);
      state.camIndex = (start + i + 1) % CAM_COUNTRIES.length;
      log('опубликована камера:', place, country);
      return;
    }
  }
  log('подходящей камеры не нашлось — вместо неё станция');
  return postStation(state);
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
  if (cron.startsWith('50 18')) return 'ask';
  if (cron.startsWith('50 15')) return 'promo';
  if (cron.startsWith('20 ')) return 'news';
  if (cron.startsWith('35 ')) return 'webcam';
  if (cron.startsWith('5 5 ')) return 'day';
  return 'station';
}

const mode = (process.argv[2] || 'auto') === 'auto' ? autoMode() : process.argv[2];
if (mode === 'vkflush') {
  const st = await loadState();
  await vkFlush(st);
  await saveState(st);
  process.exit(0);
}
if (!TOKEN || !CHANNEL) {
  log('Секреты TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL не заданы — пропускаю.');
  process.exit(0);
}
const state = await loadState();
try {
  if (mode === 'day') await postStation(state, true);
  else if (mode === 'station') await postStation(state);
  else if (mode === 'promo') await postPromo(state);
  else if (mode === 'webcam') await postWebcam(state);
  else if (mode === 'news') await postNews(state);
  else if (mode === 'release') await postRelease(state);
  else if (mode === 'ask') await postAsk(state);
  else if (mode === 'setup') await setup();
  else log('неизвестный режим', mode);
} finally {
  state.aiError = AI_ERROR || undefined;
  state.vkError = VK_ERROR || undefined;
  state.vkPhotoShown = VK_PHOTO_SHOWN;
  await saveState(state);
}
