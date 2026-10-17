/**
 * SlyNet Radio — прокси метаданных (Cloudflare Worker, бесплатный тариф).
 *
 * Что делает: получает адрес радиопотока, подключается к нему с заголовком
 * "Icy-MetaData: 1", читает первый блок метаданных и возвращает
 * {"title": "Исполнитель - Песня"}. Сам звук НЕ передаёт и НЕ хранит.
 *
 * Запрос: GET https://<воркер>.workers.dev/?url=<адрес потока>
 */

// Сайты, которым разрешено пользоваться прокси. Добавьте свой домен, если появится.
const ALLOWED_ORIGINS = [
  'https://tenyls.github.io',
  'http://localhost:3000',
  'capacitor://localhost',
  'https://localhost',
];

const MAX_METAINT = 64 * 1024; // не читаем больше ~64 КБ звука ради одной строки
const TIMEOUT_MS = 6000;

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const json = (data, status = 200, maxAge = 15) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}` },
      });

    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin not allowed' }, 403);

    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url') || '';
    let streamUrl;
    try {
      streamUrl = new URL(target);
    } catch {
      return json({ error: 'bad url' }, 400);
    }
    if (!/^https?:$/.test(streamUrl.protocol) || isPrivateHost(streamUrl.hostname)) {
      return json({ error: 'url not allowed' }, 400);
    }

    // Кэш на 15 секунд: много слушателей одной станции = один запрос к станции
    const cache = caches.default;
    const cacheKey = new Request(`https://meta.cache/${encodeURIComponent(streamUrl.toString())}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.text();
      return new Response(body, { headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
    }

    let title = null;
    try {
      title = await readIcyTitle(streamUrl.toString());
    } catch (e) {
      title = null;
    }
    const res = json({ title }, 200, 15);
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};

async function readIcyTitle(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'Icy-MetaData': '1', 'User-Agent': 'SlyNetRadio-Meta/1.0' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const metaint = parseInt(res.headers.get('icy-metaint') || '0', 10);
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !res.body || !metaint || metaint > MAX_METAINT || !/audio|mpeg|aac|ogg|octet/i.test(type)) {
      ctrl.abort();
      return null;
    }

    const reader = res.body.getReader();
    const needed = metaint + 1 + 255 * 16; // звук до метаданных + байт длины + максимум метаданных
    const buf = new Uint8Array(needed);
    let got = 0;
    while (got < metaint + 1) {
      const { value, done } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, needed - got);
      buf.set(value.subarray(0, take), got);
      got += take;
    }
    const metaLen = buf[metaint] * 16;
    while (got < metaint + 1 + metaLen) {
      const { value, done } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, needed - got);
      buf.set(value.subarray(0, take), got);
      got += take;
    }
    ctrl.abort(); // сразу закрываем поток
    if (!metaLen) return null;

    const raw = buf.subarray(metaint + 1, metaint + 1 + metaLen);
    const text = decodeMeta(raw);
    const m = text.match(/StreamTitle='(.*?)';/s);
    const t = m ? m[1].trim() : '';
    return t || null;
  } finally {
    clearTimeout(timer);
  }
}

function decodeMeta(bytes) {
  // Большинство станций шлют UTF-8, старые русские — windows-1251
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\0+$/, '');
  if (!utf8.includes('�')) return utf8;
  try {
    return new TextDecoder('windows-1251').decode(bytes).replace(/\0+$/, '');
  } catch {
    return utf8;
  }
}

function isPrivateHost(host) {
  return (
    host === 'localhost' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  );
}
