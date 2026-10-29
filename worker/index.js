/**
 * SlyNet Radio — мини-сервер «slynet-api» (Cloudflare Workers, бесплатный тариф).
 *
 * Что умеет:
 *   GET  /meta?url=…          название песни из радиопотока (ICY StreamTitle) — честный RDS
 *   GET  /geo                 страна посетителя (по данным Cloudflare, без сторонних сервисов)
 *   POST /support             сообщение в техподдержку (попадает в админку и, если настроено, в Telegram)
 *   POST /admin/login         вход в админку по паролю → токен на 7 дней
 *   GET  /admin/messages      сообщения поддержки (только админ)
 *   DELETE /admin/messages/:id
 *   GET  /webcams             веб-камеры Windy (ключ WINDY_API_KEY хранится только здесь)
 *   POST /admin/publish       опубликовать content.json в GitHub одной кнопкой (если задан GITHUB_TOKEN)
 *   POST /sync/register       регистрация (логин + пароль) для синхронизации избранного
 *   POST /sync/login          вход
 *   GET|PUT /sync/data        избранное и треки пользователя
 *   DELETE /sync/account      удаление аккаунта и всех данных (требование Apple / Google)
 *
 * Настройки (Cloudflare → Worker → Settings → Variables and Secrets):
 *   ADMIN_PASSWORD      (Secret, обязательно) — пароль админки
 *   TOKEN_SECRET        (Secret, обязательно) — любая длинная случайная строка
 *   GITHUB_TOKEN        (Secret, по желанию)  — для кнопки «Опубликовать»
 *   TELEGRAM_BOT_TOKEN  (Secret, по желанию)  — сообщения поддержки в Telegram
 *   TELEGRAM_CHAT_ID    (Text,   по желанию)
 * Привязка KV (Bindings → KV namespace): имя переменной DB.
 */

const GITHUB_REPO = 'tenyls/slynet-radio';
const ALLOWED_ORIGINS = ['https://tenyls.github.io', 'https://slynet-radio.pages.dev', 'http://localhost:3000', 'http://localhost:4173', 'capacitor://localhost', 'https://localhost', 'http://localhost'];
const DAY = 86400;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (data, status = 200, extra = {}) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', ...extra } });

    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin' }, 403);

    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (p === '/' || p === '/health') return json({ ok: true, service: 'slynet-api', kv: !!env.DB, publish: !!env.GITHUB_TOKEN, telegram: !!env.TELEGRAM_BOT_TOKEN, windy: !!env.WINDY_API_KEY, vk: !!env.VK_CLIENT_ID, share: true, playlists: true, probe: true, version: '2026-10-29b' });
      if (p === '/s') return sharePage(url);
      if (p === '/meta') return await handleMeta(url, json, ctx);
      if (p === '/webcams') return await handleWebcams(url, env, json, ctx);
      if (p === '/geo') return json({ country: request.cf?.country || '', city: request.cf?.city || '', ip: request.headers.get('CF-Connecting-IP') || '' }, 200, { 'Cache-Control': 'no-store' });
      if (p === '/probe') return await handleProbe(url, json, ctx);

      if (!env.DB) return json({ error: 'KV не подключено (привязка DB)' }, 500);
      const ip = request.headers.get('CF-Connecting-IP') || '0';

      if (p === '/vk/callback') return await vkCallback(url, env);
      if (p === '/vk/token' && request.method === 'POST') {
        if (!env.VK_BRIDGE_KEY || !(await safeEqual(request.headers.get('X-Bridge-Key') || '', env.VK_BRIDGE_KEY))) return json({ error: 'нет доступа' }, 401);
        if (!(await rateLimit(env, `rl:vktok:${ip}`, 60, 3600))) return json({ error: 'слишком часто' }, 429);
        return json(await vkAccessToken(env));
      }

      if (p === '/support' && request.method === 'POST') return await handleSupport(request, env, ip, json, ctx);

      if (p === '/admin/login' && request.method === 'POST') {
        if (!(await rateLimit(env, `rl:login:${ip}`, 10, 3600))) return json({ error: 'Слишком много попыток. Подождите час.' }, 429);
        const { password } = await readJson(request);
        if (!env.ADMIN_PASSWORD || !env.TOKEN_SECRET) return json({ error: 'На сервере не задан ADMIN_PASSWORD / TOKEN_SECRET' }, 500);
        if (!(await safeEqual(String(password || ''), env.ADMIN_PASSWORD))) return json({ error: 'Неверный пароль' }, 401);
        return json({ token: await sign(env, { role: 'admin', exp: now() + 7 * DAY }) });
      }
      if (p.startsWith('/admin/')) {
        const auth = await verify(env, request);
        if (auth?.role !== 'admin') return json({ error: 'Нужен вход в админку' }, 401);
        if (p === '/admin/check') return json({ ok: true });
        if (p === '/admin/messages' && request.method === 'GET') {
          const list = await env.DB.list({ prefix: 'msg:' });
          const items = await Promise.all(list.keys.map(async (k) => ({ id: k.name.slice(4), ...(await env.DB.get(k.name, 'json')) })));
          return json({ messages: items.filter((m) => m.text).sort((a, b) => b.at - a.at) });
        }
        if (p.startsWith('/admin/messages/') && request.method === 'DELETE') {
          await env.DB.delete('msg:' + decodeURIComponent(p.slice('/admin/messages/'.length)));
          return json({ ok: true });
        }
        if (p === '/admin/publish' && request.method === 'POST') return await handlePublish(request, env, json);
        if (p === '/admin/vk/start' && request.method === 'POST') return json(await vkStart(url, env));
        if (p === '/admin/vk/status') {
          const a = await env.DB.get('vk:auth', 'json');
          return json({ configured: !!env.VK_CLIENT_ID, bridge: !!env.VK_BRIDGE_KEY, connected: !!a?.refresh_token, user_id: a?.user_id, scope: a?.scope, at: a?.at, error: a?.error });
        }
      }

      if (p === '/sync/register' && request.method === 'POST') {
        if (!(await rateLimit(env, `rl:reg:${ip}`, 5, 3600))) return json({ error: 'Слишком много регистраций. Подождите час.' }, 429);
        const { login, password } = await readJson(request);
        const l = cleanLogin(login);
        if (!l) return json({ error: 'Логин: 3–32 символа (буквы, цифры, _ . -)' }, 400);
        if (String(password || '').length < 6) return json({ error: 'Пароль: минимум 6 символов' }, 400);
        if (await env.DB.get('user:' + l)) return json({ error: 'Такой логин уже занят' }, 409);
        const salt = randomHex(16);
        await env.DB.put('user:' + l, JSON.stringify({ salt, hash: await pbkdf2(password, salt), at: Date.now() }));
        return json({ token: await sign(env, { role: 'user', login: l, exp: now() + 365 * DAY }), login: l });
      }
      if (p === '/sync/login' && request.method === 'POST') {
        if (!(await rateLimit(env, `rl:ulogin:${ip}`, 20, 3600))) return json({ error: 'Слишком много попыток. Подождите час.' }, 429);
        const { login, password } = await readJson(request);
        const l = cleanLogin(login);
        const user = l && (await env.DB.get('user:' + l, 'json'));
        if (!user || !(await safeEqual(await pbkdf2(password || '', user.salt), user.hash))) return json({ error: 'Неверный логин или пароль' }, 401);
        return json({ token: await sign(env, { role: 'user', login: l, exp: now() + 365 * DAY }), login: l });
      }
      if (p.startsWith('/sync/')) {
        const auth = await verify(env, request);
        if (auth?.role !== 'user') return json({ error: 'Нужен вход' }, 401);
        if (p === '/sync/data' && request.method === 'GET') return json((await env.DB.get('data:' + auth.login, 'json')) || {});
        if (p === '/sync/data' && request.method === 'PUT') {
          const body = await request.text();
          if (body.length > 1500000) return json({ error: 'Слишком много данных' }, 413);
          const d = JSON.parse(body);
          const playlists = Array.isArray(d.playlists)
            ? d.playlists.slice(0, 50).filter((p) => p && typeof p.id === 'string').map((p) => ({ id: String(p.id).slice(0, 40), name: String(p.name || '').slice(0, 60), from: p.from ? String(p.from).slice(0, 30) : undefined, createdAt: Number(p.createdAt) || 0, updatedAt: Number(p.updatedAt) || 0, stations: Array.isArray(p.stations) ? p.stations.slice(0, 200) : [] }))
            : [];
          const clean = { favorites: Array.isArray(d.favorites) ? d.favorites.slice(0, 500) : [], recognizedTracks: Array.isArray(d.recognizedTracks) ? d.recognizedTracks.slice(0, 200) : [], playlists, updatedAt: Date.now() };
          await env.DB.put('data:' + auth.login, JSON.stringify(clean));
          return json({ ok: true, updatedAt: clean.updatedAt });
        }
        if (p === '/sync/account' && request.method === 'DELETE') {
          await env.DB.delete('data:' + auth.login);
          await env.DB.delete('user:' + auth.login);
          return json({ ok: true });
        }
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: 'server error' }, 500);
    }
  },
};

// ---------- Поддержка ----------
async function handleSupport(request, env, ip, json, ctx) {
  if (!(await rateLimit(env, `rl:sup:${ip}`, 5, 3600))) return json({ error: 'Слишком много сообщений. Попробуйте через час.' }, 429);
  const d = await readJson(request);
  const text = String(d.text || '').trim().slice(0, 3000);
  if (text.length < 3) return json({ error: 'Напишите сообщение' }, 400);
  const msg = {
    text,
    name: String(d.name || '').trim().slice(0, 80),
    contact: String(d.contact || '').trim().slice(0, 120),
    topic: String(d.topic || '').trim().slice(0, 40),
    page: String(d.page || '').slice(0, 200),
    at: Date.now(),
  };
  const id = `${Date.now()}-${randomHex(4)}`;
  await env.DB.put('msg:' + id, JSON.stringify(msg), { expirationTtl: 180 * DAY });
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const tg = `📩 SlyNet Radio — ${msg.topic || 'сообщение'}\n\n${msg.text}\n\n👤 ${msg.name || '—'}  ✉️ ${msg.contact || '—'}`;
    ctx.waitUntil(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: tg.slice(0, 4000) }),
      }).catch(() => {})
    );
  }
  return json({ ok: true });
}

// ---------- Публикация content.json в GitHub ----------
async function handlePublish(request, env, json) {
  if (!env.GITHUB_TOKEN) return json({ error: 'GITHUB_TOKEN не задан — публикуйте вручную через GitHub' }, 400);
  const body = await request.text();
  if (body.length > 900000) return json({ error: 'Файл слишком большой' }, 413);
  const { content } = JSON.parse(body);
  if (!content || typeof content !== 'object') return json({ error: 'Нет содержимого' }, 400);
  const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/public/content.json`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'slynet-api', Accept: 'application/vnd.github+json' };
  const cur = await fetch(api, { headers });
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  const text = JSON.stringify(content, null, 2) + '\n';
  const res = await fetch(api, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Контент сайта обновлён из админки', content: b64(text), sha }),
  });
  if (!res.ok) return json({ error: `GitHub ответил ${res.status}` }, 502);
  return json({ ok: true });
}

// ---------- ВКонтакте: вход администратора через VK ID (OAuth 2.1 + PKCE) ----------
// Ключи ВК хранятся только здесь, в KV. Бот получает свежий ключ доступа через /vk/token (по секрету VK_BRIDGE_KEY).
// VK меняет refresh-ключ при каждом обновлении — поэтому он живёт на сервере, а не в секретах GitHub.
const VK_ID = (env) => 'https://' + (env.VK_ID_HOST || 'id.vk.ru');
const vkRedirect = (url) => `${url.origin}/vk/callback`;

async function vkStart(url, env) {
  if (!env.VK_CLIENT_ID) return { error: 'На сервере не задан VK_CLIENT_ID' };
  const state = randomHex(16);
  const verifier = randomHex(32);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))));
  await env.DB.put('vk:pkce:' + state, verifier, { expirationTtl: 900 });
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: env.VK_CLIENT_ID,
    redirect_uri: vkRedirect(url),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: env.VK_SCOPE || 'wall photos groups',
  });
  return { url: `${VK_ID(env)}/authorize?${q}` };
}

async function vkTokenRequest(env, params) {
  const body = new URLSearchParams({ client_id: env.VK_CLIENT_ID, ...params });
  if (env.VK_SERVICE_TOKEN) body.set('service_token', env.VK_SERVICE_TOKEN);
  const r = await fetch(`${VK_ID(env)}/oauth2/auth`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const d = await r.json().catch(() => ({}));
  if (!d.access_token) throw new Error(d.error_description || d.error || `VK ID ответил ${r.status}`);
  return d;
}

async function vkSave(env, d, device_id, prev = {}) {
  const a = {
    access_token: d.access_token,
    refresh_token: d.refresh_token || prev.refresh_token,
    expires_at: now() + (Number(d.expires_in) || 3600),
    device_id,
    user_id: d.user_id || prev.user_id,
    scope: d.scope || prev.scope,
    at: now(),
  };
  await env.DB.put('vk:auth', JSON.stringify(a));
  return a;
}

async function vkCallback(url, env) {
  const page = (title, text, ok) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font-family:system-ui;background:#09090b;color:#fff;display:grid;place-items:center;min-height:90vh;text-align:center;padding:20px"><div><div style="font-size:64px">${ok ? '✅' : '⚠️'}</div><h2>${title}</h2><p style="color:#a1a1aa;max-width:480px">${text}</p></div>`,
      { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  const esc = (t) => String(t).replace(/[<>&"]/g, '');
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code');
  const device_id = url.searchParams.get('device_id');
  if (url.searchParams.get('error')) return page('ВК не подключён', esc(url.searchParams.get('error_description') || url.searchParams.get('error')), false);
  const verifier = state && (await env.DB.get('vk:pkce:' + state));
  if (!verifier || !code || !device_id) return page('Ссылка устарела', 'Нажмите «Подключить ВКонтакте» в админке ещё раз.', false);
  await env.DB.delete('vk:pkce:' + state);
  try {
    const d = await vkTokenRequest(env, { grant_type: 'authorization_code', code, code_verifier: verifier, device_id, redirect_uri: vkRedirect(url), state });
    const a = await vkSave(env, d, device_id);
    return page('ВКонтакте подключён', `Теперь бот сможет публиковать посты с картинками. Права: ${esc(a.scope || '—')}. Эту вкладку можно закрыть.`, true);
  } catch (e) {
    return page('Не получилось', esc(e.message), false);
  }
}

async function vkAccessToken(env) {
  const a = await env.DB.get('vk:auth', 'json');
  if (!a?.refresh_token) return { error: 'ВК не подключён: админка → Сервер → «Подключить ВКонтакте»' };
  if (a.expires_at - 300 > now()) return { access_token: a.access_token, expires_at: a.expires_at, user_id: a.user_id, scope: a.scope };
  try {
    const d = await vkTokenRequest(env, { grant_type: 'refresh_token', refresh_token: a.refresh_token, device_id: a.device_id, state: randomHex(16) });
    const n = await vkSave(env, d, a.device_id, a);
    return { access_token: n.access_token, expires_at: n.expires_at, user_id: n.user_id, scope: n.scope };
  } catch (e) {
    await env.DB.put('vk:auth', JSON.stringify({ ...a, error: e.message, errorAt: now() }));
    return { error: 'Не удалось обновить ключ ВК: ' + e.message + '. Подключите ВК в админке заново.' };
  }
}

// ---------- Проверка потока: станция не играет у человека — она мёртвая или закрыта для его страны? ----------
// Без базы данных: результат кэшируется на 10 минут (бесплатный кэш Cloudflare).
async function handleProbe(url, json, ctx) {
  const target = String(url.searchParams.get('u') || '');
  let u;
  try {
    u = new URL(target);
  } catch {
    return json({ error: 'bad url' }, 400);
  }
  if (!/^https?:$/.test(u.protocol) || isPrivateHost(u.hostname)) return json({ error: 'bad url' }, 400);
  const cacheKey = new Request('https://probe.slynet/' + encodeURIComponent(u.href));
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return json(await hit.json(), 200, { 'Cache-Control': 'no-store' });
  let result;
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(u.href, { headers: { 'Icy-MetaData': '0', 'User-Agent': 'SlyNetRadio/1.0 (+https://tenyls.github.io/slynet-radio/)', Referer: 'https://tenyls.github.io/' }, signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    const type = (r.headers.get('content-type') || '').toLowerCase();
    try {
      await r.body?.cancel();
    } catch {}
    const audio = /audio|mpeg|aac|ogg|octet|mpegurl|x-scpls|pls|video\/mp2t/.test(type);
    result = { ok: r.ok && audio, status: r.status, type, ms: Date.now() - t0 };
  } catch (e) {
    result = { ok: false, status: 0, error: 'timeout', ms: Date.now() - t0 };
  }
  ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(result), { headers: { 'Cache-Control': 'max-age=600', 'Content-Type': 'application/json' } })));
  return json(result, 200, { 'Cache-Control': 'no-store' });
}

// ---------- Красивые превью ссылок «Поделиться» (Telegram, ВК, WhatsApp читают эти теги) ----------
const SITE_URL = 'https://slynet-radio.pages.dev/';
function sharePage(url) {
  const q = url.searchParams;
  const h = String(q.get('h') || '');
  const hash = /^#(station|st|pl)=[A-Za-z0-9_-]{1,8000}$/.test(h) ? h : '';
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const title = String(q.get('n') || 'SlyNet Radio').slice(0, 120);
  const desc = String(q.get('d') || 'Радио со всего мира — бесплатно, без регистрации').slice(0, 240);
  const img0 = String(q.get('i') || '');
  const big = !/^https:\/\//.test(img0);
  const img = big ? SITE_URL + 'promo/all.jpg' : img0;
  const target = SITE_URL + hash;
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="SlyNet Radio">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url.href)}">
<meta name="twitter:card" content="${big ? 'summary_large_image' : 'summary'}">
<style>body{margin:0;background:#09090b;color:#fff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px;box-sizing:border-box}a{display:inline-block;margin-top:18px;padding:14px 24px;border-radius:16px;background:#10b981;color:#09090b;font-weight:800;text-decoration:none}img{width:96px;height:96px;border-radius:20px;object-fit:cover}</style>
</head><body><div><img src="${esc(img)}" alt=""><h2>${esc(title)}</h2><p style="color:#a1a1aa">${esc(desc)}</p><a href="${esc(target)}">▶ Слушать в SlyNet Radio</a></div>
<script>location.replace(${JSON.stringify(target)})</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}

// ---------- RDS ----------

// ---------- Веб-камеры Windy (официальный API, бесплатный ключ) ----------
// Ключ хранится только на сервере. Ссылки на картинки Windy живут 10 минут, поэтому кэшируем на 5.
async function handleWebcams(url, env, json, ctx) {
  if (!env.WINDY_API_KEY) return json({ error: 'WINDY_API_KEY не задан', webcams: [] }, 501);
  const country = (url.searchParams.get('country') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  const category = (url.searchParams.get('category') || '').replace(/[^a-z.]/g, '').slice(0, 20);
  const nearby = (url.searchParams.get('nearby') || '').replace(/[^0-9.,-]/g, '').slice(0, 40);
  const offset = Math.min(Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0), 950);
  const lang = (url.searchParams.get('lang') || 'ru').replace(/[^a-z]/g, '').slice(0, 2) || 'ru';

  const q = new URLSearchParams({ limit: '50', offset: String(offset), include: 'images,location,player,urls,categories', sortKey: 'popularity', lang });
  if (country) q.set('countries', country);
  if (category) q.set('categories', category);
  if (nearby) q.set('nearby', nearby);
  const apiUrl = `https://api.windy.com/webcams/api/v3/webcams?${q}`;

  const cache = caches.default;
  const cacheKey = new Request('https://slynet-cache.local/webcams?' + q.toString());
  const hit = await cache.match(cacheKey);
  if (hit) return json(await hit.json());

  const r = await fetch(apiUrl, { headers: { 'x-windy-api-key': env.WINDY_API_KEY } });
  if (!r.ok) return json({ error: `Windy ответил ${r.status}`, webcams: [] }, 502);
  const data = await r.json();
  const out = {
    total: data.total || 0,
    offset,
    webcams: (data.webcams || [])
      .filter((w) => w.status === 'active' || !w.status)
      .map((w) => ({
        id: String(w.webcamId),
        title: w.title || '',
        city: w.location?.city || '',
        region: w.location?.region || '',
        country: w.location?.country || '',
        countryCode: (w.location?.country_code || '').toUpperCase(),
        lat: w.location?.latitude ?? null,
        lon: w.location?.longitude ?? null,
        image: w.images?.current?.preview || w.images?.current?.thumbnail || w.images?.current?.icon || '',
        player: w.player?.live || w.player?.day || '',
        live: !!w.player?.live,
        page: w.urls?.detail || `https://www.windy.com/webcams/${w.webcamId}`,
        categories: (w.categories || []).map((c) => c.id || c),
        views: w.viewCount || 0,
      })),
  };
  ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(out), { headers: { 'Cache-Control': 'max-age=300' } })));
  return json(out);
}

async function handleMeta(url, json, ctx) {
  let target;
  try {
    target = new URL(url.searchParams.get('url') || '');
  } catch {
    return json({ error: 'bad url' }, 400);
  }
  if (!/^https?:$/.test(target.protocol) || isPrivateHost(target.hostname)) return json({ error: 'url not allowed' }, 400);
  const cache = caches.default;
  const key = new Request(`https://meta.cache/${encodeURIComponent(target.toString())}`);
  const hit = await cache.match(key);
  if (hit) return json(await hit.json());
  let title = null;
  try {
    title = await readIcyTitle(target.toString());
  } catch {}
  const res = new Response(JSON.stringify({ title }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } });
  ctx.waitUntil(cache.put(key, res));
  return json({ title }, 200, { 'Cache-Control': 'public, max-age=15' });
}

async function readIcyTitle(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { headers: { 'Icy-MetaData': '1', 'User-Agent': 'SlyNetRadio-Meta/2.0' }, signal: ctrl.signal });
    const metaint = parseInt(res.headers.get('icy-metaint') || '0', 10);
    if (!res.ok || !res.body || !metaint || metaint > 65536) {
      ctrl.abort();
      return null;
    }
    const reader = res.body.getReader();
    const need = metaint + 1 + 255 * 16;
    const buf = new Uint8Array(need);
    let got = 0;
    while (got < metaint + 1) {
      const { value, done } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, need - got);
      buf.set(value.subarray(0, take), got);
      got += take;
    }
    const len = buf[metaint] * 16;
    while (got < metaint + 1 + len) {
      const { value, done } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, need - got);
      buf.set(value.subarray(0, take), got);
      got += take;
    }
    ctrl.abort();
    if (!len) return null;
    const raw = buf.subarray(metaint + 1, metaint + 1 + len);
    let text = new TextDecoder('utf-8').decode(raw);
    if (text.includes('�')) {
      try {
        text = new TextDecoder('windows-1251').decode(raw);
      } catch {}
    }
    const m = text.replace(/\0+$/, '').match(/StreamTitle='(.*?)';/s);
    return m && m[1].trim() ? m[1].trim() : null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- утилиты ----------
const now = () => Math.floor(Date.now() / 1000);
const enc = new TextEncoder();
const b64 = (s) => btoa(String.fromCharCode(...enc.encode(s)));
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
const cleanLogin = (l) => {
  const s = String(l || '').trim().toLowerCase();
  return /^[a-z0-9а-яё_.-]{3,32}$/i.test(s) ? s : '';
};

async function readJson(request) {
  const t = await request.text();
  if (t.length > 20000) throw new Error('too big');
  return t ? JSON.parse(t) : {};
}

async function hmac(env, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.TOKEN_SECRET || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function sign(env, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(env, body))}`;
}

async function verify(env, request) {
  const h = request.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [body, sig] = token.split('.');
  if (!body || !sig || !env.TOKEN_SECRET) return null;
  if (!(await safeEqual(b64url(await hmac(env, body)), sig))) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  return payload.exp > now() ? payload : null;
}

async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && a.length === b.length;
}

async function pbkdf2(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return b64url(new Uint8Array(bits));
}

async function rateLimit(env, key, max, ttl) {
  const n = parseInt((await env.DB.get(key)) || '0', 10);
  if (n >= max) return false;
  await env.DB.put(key, String(n + 1), { expirationTtl: ttl });
  return true;
}

function isPrivateHost(h) {
  return h === 'localhost' || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || h.endsWith('.local') || h.endsWith('.internal');
}
