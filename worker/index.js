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
const ALLOWED_ORIGINS = ['https://tenyls.github.io', 'http://localhost:3000', 'http://localhost:4173', 'capacitor://localhost', 'https://localhost', 'http://localhost'];
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
      if (p === '/' || p === '/health') return json({ ok: true, service: 'slynet-api', kv: !!env.DB, publish: !!env.GITHUB_TOKEN, telegram: !!env.TELEGRAM_BOT_TOKEN });
      if (p === '/meta') return await handleMeta(url, json, ctx);
      if (p === '/geo') return json({ country: request.cf?.country || '', city: request.cf?.city || '' }, 200, { 'Cache-Control': 'no-store' });

      if (!env.DB) return json({ error: 'KV не подключено (привязка DB)' }, 500);
      const ip = request.headers.get('CF-Connecting-IP') || '0';

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
          if (body.length > 300000) return json({ error: 'Слишком много данных' }, 413);
          const d = JSON.parse(body);
          const clean = { favorites: Array.isArray(d.favorites) ? d.favorites.slice(0, 500) : [], recognizedTracks: Array.isArray(d.recognizedTracks) ? d.recognizedTracks.slice(0, 200) : [], updatedAt: Date.now() };
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

// ---------- RDS ----------
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
