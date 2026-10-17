#!/usr/bin/env node
/**
 * SlyNet Radio — ежедневная автопроверка каталога.
 *
 * Запускается роботом GitHub (см. .github/workflows/catalog.yml) раз в сутки
 * или вручную из админки. Результат — файл public/catalog.json, который читает сайт:
 *   • artists — рабочие станции каждого исполнителя / подборки саундтреков
 *     (артисты без рабочих станций на сайте скрываются);
 *   • series  — самообновляемый список станций «один исполнитель»;
 *   • tv      — открытые телеканалы с официальных источников, которые реально
 *     показываются во встроенном плеере сайта;
 *   • deadLinks — нерабочие ссылки (веб-камеры, свои станции из админки).
 *
 * Только открытые и бесплатные источники:
 *   Radio Browser (radio-browser.info), laut.fm, открытая база телеканалов iptv-org.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'catalog.json');
const UA = 'SlyNetRadio-CatalogBot/1.0 (+https://github.com/tenyls/slynet-radio)';
const RB = ['https://de1.api.radio-browser.info', 'https://de2.api.radio-browser.info', 'https://fi1.api.radio-browser.info', 'https://nl1.api.radio-browser.info'];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const data = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/artist-search.json'), 'utf8'));

// ---------- утилиты ----------
async function fetchWithTimeout(url, opts = {}, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
  } finally {
    clearTimeout(t);
  }
}

async function getJson(url, ms = 30000) {
  const r = await fetchWithTimeout(url, {}, ms);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function rb(pathAndQuery) {
  let last;
  for (const s of RB) {
    try {
      return await getJson(s + pathAndQuery, 20000);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await fn(items[idx], idx);
        } catch {
          out[idx] = undefined;
        }
      }
    })
  );
  return out;
}

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}/]+/gu, ' ')
    .trim();
const ADULT_RE = /(?<![\p{L}])(xxx|porn\p{L}*|sex|sexy|erotic\p{L}*|nsfw|hentai|эрот\p{L}*|порн\p{L}*|секс\p{L}*)(?![\p{L}])/iu;
const familySafe = (s) => !ADULT_RE.test(`${s.name} ${s.tags || ''}`);
const nameMatches = (name, v) => ` ${norm(name)} `.includes(` ${norm(v)} `);

/** Поток жив: сервер отвечает и отдаёт аудио/плейлист */
async function audioAlive(url) {
  try {
    const r = await fetchWithTimeout(url, { headers: { 'Icy-MetaData': '0' } }, 9000);
    const type = (r.headers.get('content-type') || '').toLowerCase();
    try {
      await r.body?.cancel();
    } catch {}
    return r.ok && /audio|mpeg|aac|ogg|octet|mpegurl|x-scpls|application\/pls/.test(type);
  } catch {
    return false;
  }
}

/** Видео-поток (HLS) жив И разрешён для показа на сайте (CORS) */
async function hlsPlayableInBrowser(url) {
  try {
    const r = await fetchWithTimeout(url, { headers: { Origin: 'https://tenyls.github.io' } }, 9000);
    if (!r.ok) return false;
    const cors = r.headers.get('access-control-allow-origin');
    const text = (await r.text()).slice(0, 200);
    return text.startsWith('#EXTM3U') && (cors === '*' || cors === 'https://tenyls.github.io');
  } catch {
    return false;
  }
}

async function linkAlive(url) {
  // «Мёртвой» считаем только страницу, которой точно нет (404/410).
  // Таймаут или блокировка по стране (многие сайты закрыты для зарубежных серверов) — не повод скрывать.
  try {
    const r = await fetchWithTimeout(url, { redirect: 'follow' }, 12000);
    try {
      await r.body?.cancel();
    } catch {}
    return !(r.status === 404 || r.status === 410);
  } catch {
    return true;
  }
}

const slim = (s) => ({
  stationuuid: s.stationuuid,
  name: String(s.name || '').trim(),
  url: s.url,
  url_resolved: s.url_resolved || s.url,
  homepage: s.homepage || '',
  favicon: (s.favicon || '').startsWith('https://') ? s.favicon : '',
  tags: s.tags || '',
  country: s.country || '',
  countrycode: s.countrycode || '',
  codec: s.codec || '',
  bitrate: s.bitrate || 0,
  clickcount: s.clickcount || 0,
});

async function searchRB(params) {
  const q = new URLSearchParams({ hidebroken: 'true', is_https: 'true', order: 'clickcount', reverse: 'true', limit: '100', ...params });
  const list = await rb(`/json/stations/search?${q}`);
  return (Array.isArray(list) ? list : []).filter((s) => (s.url_resolved || s.url || '').startsWith('https://') && familySafe(s));
}

async function searchLaut(query) {
  try {
    const j = await getJson(`https://api.laut.fm/search/stations?query=${encodeURIComponent(query)}&limit=20`);
    return (j.results || [])
      .flatMap((r) => r.items || [])
      .map((it) => it.station)
      .filter((st) => st?.name)
      .map((st) => ({
        stationuuid: `lautfm-${st.name}`,
        name: st.display_name || st.name,
        url: `https://stream.laut.fm/${st.name}`,
        url_resolved: `https://stream.laut.fm/${st.name}`,
        homepage: st.page_url || `https://laut.fm/${st.name}`,
        favicon: st.images?.station_80x80 || '',
        tags: [...(st.genres || []), st.description || ''].filter(Boolean).join(','),
        country: 'Germany',
        countrycode: 'DE',
        codec: 'MP3',
        bitrate: 128,
        clickcount: 0,
      }));
  } catch {
    return [];
  }
}

function dedupeByUrl(list) {
  const seen = new Set();
  return list.filter((s) => {
    const k = (s.url_resolved || s.url).replace(/[?#].*$/, '').toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------- 1. Исполнители и саундтреки ----------
async function buildArtists() {
  const result = {};
  for (const a of data.artists) {
    let candidates = [];
    if (a.category === 'ost') {
      const tags = data.ostTags[a.tag] || [a.tag];
      for (const t of tags) candidates.push(...(await searchRB({ tag: t, limit: '40' }).catch(() => [])));
    } else {
      const variants = data.nameVariants[a.id] || [a.name.replace(/\s*\(.*?\)\s*/g, '').trim()];
      for (const v of variants) {
        const found = await searchRB({ name: v, limit: '60' }).catch(() => []);
        candidates.push(...found.filter((s) => variants.some((x) => nameMatches(s.name, x))));
      }
      const laut = await searchLaut(variants[0]);
      candidates.push(...laut.filter((s) => variants.some((x) => nameMatches(s.name, x) || nameMatches(s.tags, x))));
    }
    candidates = dedupeByUrl(candidates.map(slim)).sort((x, y) => y.clickcount - x.clickcount).slice(0, 15);
    const alive = await pool(candidates, 8, (s) => audioAlive(s.url_resolved));
    result[a.id] = candidates.filter((_, i) => alive[i]);
    log(`артист ${a.name}: ${result[a.id].length}/${candidates.length}`);
  }
  return result;
}

// ---------- 2. Серии «один исполнитель» ----------
function artistLabel(name) {
  return (
    String(name)
      .replace(/^[^\p{L}\p{N}]*(exclusively|exclusive radio|101\.ru|radio maximum|best of rock\.?\s?fm)\s*[-–—:]?\s*/iu, '')
      .replace(/\((mp3|aac)[^)]*\)/gi, '')
      .trim() || name
  );
}

async function buildSeries() {
  const all = [];
  for (const n of data.series) {
    const found = await searchRB({ name: n, limit: '500' }).catch(() => []);
    all.push(...found.filter((s) => norm(s.name).startsWith(norm(n))));
  }
  const byArtist = new Map();
  for (const s of all.map(slim)) {
    const k = norm(artistLabel(s.name));
    if (!k) continue;
    const prev = byArtist.get(k);
    if (!prev || s.clickcount > prev.clickcount) byArtist.set(k, s);
  }
  const list = [...byArtist.values()];
  const alive = await pool(list, 25, (s) => audioAlive(s.url_resolved));
  const ok = list.filter((_, i) => alive[i]).sort((a, b) => artistLabel(a.name).localeCompare(artistLabel(b.name)));
  log(`серии: ${ok.length}/${list.length} рабочих`);
  return ok;
}

// ---------- 3. Телеканалы ----------
// Только тематики, которые обычно вещаются открыто и легально (без фильмов/спорта по подписке)
const TV_CATEGORIES = new Set(['news', 'music', 'documentary', 'science', 'weather', 'travel', 'outdoor', 'education', 'culture', 'kids', 'business', 'religious', 'lifestyle', 'cooking']);
// Крупные CDN, через которые вещают сами телеканалы
const OFFICIAL_CDN = ['akamaized.net', 'akamaihd.net', 'akamai.net', 'edgesuite.net', 'edgekey.net', 'cloudfront.net', 'llnwi.net', 'llnwd.net', 'fastly.net', 'b-cdn.net', 'cdn77.org', 'cdnvideo.ru', 'ngenix.net', 'amagi.tv', 'wurl.tv', 'wurl.com', 'pluto.tv', 'tubi.video', 'brightcove.net', 'jwplayer.com', 'dailymotion.com', 'vimeocdn.com', 'cdn.jwplayer.com', 'ottera.tv', 'samsungtvplus.com'];

function regDomain(host) {
  const p = host.toLowerCase().split('.');
  if (p.length >= 3 && /^(co|com|org|net|gov|ac|edu)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2) return p.slice(-3).join('.');
  return p.slice(-2).join('.');
}

function looksOfficial(streamUrl, website) {
  try {
    const s = new URL(streamUrl);
    if (s.protocol !== 'https:' || (s.port && s.port !== '443')) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(s.hostname)) return false;
    if (OFFICIAL_CDN.some((c) => s.hostname === c || s.hostname.endsWith('.' + c))) return true;
    if (website) {
      const w = new URL(website);
      return regDomain(w.hostname) === regDomain(s.hostname);
    }
  } catch {}
  return false;
}

async function buildTv() {
  const base = 'https://iptv-org.github.io/api';
  const [channels, streams, logos, blocklist] = await Promise.all(['channels', 'streams', 'logos', 'blocklist'].map((n) => getJson(`${base}/${n}.json`, 60000)));
  const blocked = new Set(blocklist.map((b) => b.channel));
  const chMap = new Map(channels.map((c) => [c.id, c]));
  const logoMap = new Map();
  for (const l of logos) if (l.url?.startsWith('https://') && !logoMap.has(l.channel)) logoMap.set(l.channel, l.url);

  const bestStream = new Map();
  for (const s of streams) {
    const ch = chMap.get(s.channel);
    if (!ch || blocked.has(ch.id) || ch.is_nsfw || ch.closed || ch.replaced_by) continue;
    if (!ch.categories?.some((c) => TV_CATEGORIES.has(c))) continue;
    if (s.referrer || s.user_agent) continue; // требует подмены заголовков — не для нас
    if ((s.labels || []).some((l) => /geo|not 24/i.test(l))) continue;
    if (!s.url?.startsWith('https://') || !/\.m3u8(\?|$)/i.test(s.url)) continue;
    if (!looksOfficial(s.url, ch.website)) continue;
    const q = parseInt(s.quality || '0', 10) || 0;
    const prev = bestStream.get(ch.id);
    if (!prev || q > prev.q) bestStream.set(ch.id, { url: s.url, quality: s.quality || '', q });
  }

  const cand = [...bestStream.entries()].map(([id, st]) => {
    const ch = chMap.get(id);
    return {
      id,
      name: ch.name,
      country: ch.country || '',
      categories: ch.categories || [],
      website: ch.website || '',
      logo: logoMap.get(id) || '',
      stream: st.url,
      quality: st.quality,
    };
  });
  log(`ТВ: кандидатов ${cand.length}, проверяем…`);
  const ok = await pool(cand, 30, (c) => hlsPlayableInBrowser(c.stream));
  const tv = cand.filter((_, i) => ok[i]).sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
  log(`ТВ: работают на сайте ${tv.length}`);
  return tv;
}

// ---------- 4. Ссылки веб-камер и свои станции ----------
async function buildDeadLinks() {
  const src = await fs.readFile(path.join(ROOT, 'src/constants/webcams.ts'), 'utf8');
  const urls = [...new Set([...src.matchAll(/directPortalUrl:\s*'([^']+)'/g)].map((m) => m[1]))];
  let custom = [];
  try {
    const content = JSON.parse(await fs.readFile(path.join(ROOT, 'public/content.json'), 'utf8'));
    custom = (content.customStations || []).map((s) => s.url_resolved || s.url).filter(Boolean);
    for (const c of content.customWebcams || []) if (c.directPortalUrl) urls.push(c.directPortalUrl);
  } catch {}
  const linkOk = await pool(urls, 15, linkAlive);
  const audioOk = await pool(custom, 10, audioAlive);
  const dead = [...urls.filter((_, i) => !linkOk[i]), ...custom.filter((_, i) => !audioOk[i])];
  log(`ссылки: нерабочих ${dead.length} из ${urls.length + custom.length}`);
  return dead;
}

// ---------- запуск ----------
const prev = await fs.readFile(OUT, 'utf8').then(JSON.parse).catch(() => ({}));
const safe = async (name, fn, fallback) => {
  try {
    return await fn();
  } catch (e) {
    log(`⚠ ${name}: ${e.message} — оставляю прошлые данные`);
    return fallback;
  }
};

const catalog = {
  generatedAt: new Date().toISOString(),
  sources: ['Radio Browser (radio-browser.info)', 'laut.fm', 'iptv-org (открытая база телеканалов)'],
  artists: await safe('артисты', buildArtists, prev.artists || {}),
  series: await safe('серии', buildSeries, prev.series || []),
  tv: await safe('ТВ', buildTv, prev.tv || []),
  deadLinks: await safe('ссылки', buildDeadLinks, prev.deadLinks || []),
};

await fs.writeFile(OUT, JSON.stringify(catalog));
log(`готово: ${OUT} (${(JSON.stringify(catalog).length / 1024).toFixed(0)} КБ)`);
