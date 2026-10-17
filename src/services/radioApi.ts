import { Station } from '../types/radio';

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

let currentServerIndex = 0;

// Curated high-reliability fallback stations in case network/CORS issues occur
export const FALLBACK_STATIONS: Station[] = [
  {
    stationuuid: 'fallback-soma-groove',
    name: 'SomaFM: Groove Salad',
    url: 'https://ice2.somafm.com/groovesalad-128-mp3',
    url_resolved: 'https://ice2.somafm.com/groovesalad-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/groovesalad120.png',
    tags: 'ambient,chillout,electronic,lofi',
    country: 'United States',
    countrycode: 'US',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 94821,
    votes: 3512,
  },
  {
    stationuuid: 'fallback-dance-wave',
    name: 'Dance Wave Online',
    url: 'https://dancewave.online/dance.mp3',
    url_resolved: 'https://dancewave.online/dance.mp3',
    homepage: 'https://dancewave.online',
    favicon: 'https://dancewave.online/favicon.ico',
    tags: 'dance,electronic,club,house',
    country: 'Hungary',
    countrycode: 'HU',
    codec: 'MP3',
    bitrate: 192,
    clickcount: 78210,
    votes: 2190,
  },
  {
    stationuuid: 'fallback-radio-paradise',
    name: 'Radio Paradise (Main Mix)',
    url: 'https://stream.radioparadise.com/mp3-192',
    url_resolved: 'https://stream.radioparadise.com/mp3-192',
    homepage: 'https://radioparadise.com',
    favicon: 'https://radioparadise.com/favicon-32x32.png',
    tags: 'rock,eclectic,pop,alternative',
    country: 'United States',
    countrycode: 'US',
    codec: 'MP3',
    bitrate: 192,
    clickcount: 89430,
    votes: 4120,
  },
  {
    stationuuid: 'fallback-swiss-jazz',
    name: 'Radio Swiss Jazz',
    url: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    url_resolved: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
    homepage: 'https://www.radioswissjazz.ch',
    favicon: '',
    tags: 'jazz,swing,blues,bebop',
    country: 'Switzerland',
    countrycode: 'CH',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 53200,
    votes: 1840,
  },
  {
    stationuuid: 'fallback-swiss-classic',
    name: 'Radio Swiss Classic',
    url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    url_resolved: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
    homepage: 'https://www.radioswissclassic.ch',
    favicon: '',
    tags: 'classical,symphony,piano,opera',
    country: 'Switzerland',
    countrycode: 'CH',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 48900,
    votes: 1620,
  },
  {
    stationuuid: 'fallback-nightwave-plaza',
    name: 'Nightwave Plaza - Synthwave & Vaporwave',
    url: 'https://radio.plaza.one/mp3',
    url_resolved: 'https://radio.plaza.one/mp3',
    homepage: 'https://plaza.one',
    favicon: 'https://plaza.one/favicon.ico',
    tags: 'synthwave,vaporwave,retro,80s,chill',
    country: 'United States',
    countrycode: 'US',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 67120,
    votes: 2980,
  },
  {
    stationuuid: 'fallback-defcon-radio',
    name: 'SomaFM: DEF CON Radio',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    url_resolved: 'https://ice1.somafm.com/defcon-128-mp3',
    homepage: 'https://somafm.com',
    favicon: 'https://somafm.com/img3/defcon120.png',
    tags: 'electronic,techno,ambient,chillout',
    country: 'United States',
    countrycode: 'US',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 42100,
    votes: 1450,
  },
  {
    stationuuid: 'fallback-deep-house-lounge',
    name: 'Deep House Lounge',
    url: 'https://198.58.98.83:8258/stream',
    url_resolved: 'https://198.58.98.83:8258/stream',
    homepage: 'https://deephouselounge.com',
    favicon: '',
    tags: 'dance,house,deephouse,electronic',
    country: 'United States',
    countrycode: 'US',
    codec: 'MP3',
    bitrate: 128,
    clickcount: 36500,
    votes: 1120,
  },
];

async function requestWithFailover(path: string): Promise<Response> {
  const attempts = SERVERS.length;
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    const server = SERVERS[(currentServerIndex + i) % SERVERS.length];
    const fullUrl = `${server}${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'SlyNetRadio/2.0 (AudioApp; AI-Studio)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        currentServerIndex = (currentServerIndex + i) % SERVERS.length;
        return response;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // continue to next server in pool
    }
  }

  throw lastError || new Error('All Radio Browser mirrors failed to respond');
}

export interface FetchOptions {
  tag?: string;
  name?: string;
  countrycode?: string;
  limit?: number;
}

import { isStationQuarantined } from './quarantineService';

/**
 * Normalizes station name to catch duplicate streams like:
 * "DFM 101.2 FM", "DFM [128k]", "DFM Club", "dfm online"
 */
export function normalizeStationName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[\[\(].*?[\]\)]/g, '') // strip brackets e.g. [128k], (320kbps)
    .replace(/\b(fm|am|online|radio|stream|live|hd|hq|aac|mp3|\d+\.?\d*\s*fm)\b/gi, '')
    .replace(/[^a-zа-я0-9]/gi, '')
    .trim();
}

/**
 * Deduplicate stations:
 * Keeps only one stream with the highest bitrate, filters out broken/quarantined ones.
 */
export function deduplicateStations(stations: Station[]): Station[] {
  if (!Array.isArray(stations)) return [];
  const map = new Map<string, Station>();

  for (const st of stations) {
    if (!st || !st.stationuuid) continue;
    if (isStationQuarantined(st.stationuuid)) continue;

    // Normalizing stream host and path
    let streamKey = '';
    try {
      const u = new URL(st.url_resolved || st.url || '');
      streamKey = `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      streamKey = (st.url_resolved || st.url || '').toLowerCase();
    }

    const normName = normalizeStationName(st.name);
    // Combine normalized name + country code
    const key = normName.length >= 3 ? `${st.countrycode || ''}_${normName}` : `stream_${streamKey}`;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, st);
    } else {
      // Keep stream with higher bitrate or higher clickcount
      const currBitrate = st.bitrate || 0;
      const existBitrate = existing.bitrate || 0;
      if (currBitrate > existBitrate) {
        map.set(key, st);
      } else if (currBitrate === existBitrate && (st.clickcount || 0) > (existing.clickcount || 0)) {
        map.set(key, st);
      }
    }
  }

  return Array.from(map.values());
}

export async function fetchStations(options: FetchOptions = {}): Promise<Station[]> {
  const { tag, name, countrycode, limit = 120 } = options;
  let path = '';

  if (countrycode && tag) {
    // Combined Country + Genre Tag Search
    const query = new URLSearchParams({
      hidebroken: 'true',
      lastcheckok: '1',
      order: 'clickcount',
      reverse: 'true',
      limit: String(limit),
      countrycode: countrycode.trim().toUpperCase(),
      tag: tag.trim().toLowerCase(),
    });
    if (name && name.trim()) query.set('name', name.trim());
    path = `/json/stations/search?${query.toString()}`;
  } else if (name && name.trim()) {
    // Search by name
    const query = new URLSearchParams({
      hidebroken: 'true',
      lastcheckok: '1',
      order: 'clickcount',
      reverse: 'true',
      limit: String(limit),
    });
    if (countrycode) query.set('countrycode', countrycode.trim().toUpperCase());
    if (tag) query.set('tag', tag.trim().toLowerCase());
    path = `/json/stations/byname/${encodeURIComponent(name.trim())}?${query.toString()}`;
  } else if (tag && tag.trim()) {
    // Search by genre tag
    const query = new URLSearchParams({
      hidebroken: 'true',
      lastcheckok: '1',
      order: 'clickcount',
      reverse: 'true',
      limit: String(limit),
    });
    path = `/json/stations/bytag/${encodeURIComponent(tag.trim())}?${query.toString()}`;
  } else if (countrycode && countrycode.trim()) {
    // Search by country code (supports US, FR, DE, RU, UA, GB, IT, ES, TR, KZ, BY and all ISO codes)
    const normalizedCode = countrycode.trim().toUpperCase();
    const effectiveLimit = Math.max(limit, 200);
    const query = new URLSearchParams({
      countrycode: normalizedCode,
      hidebroken: 'true',
      lastcheckok: '1',
      order: 'clickcount',
      reverse: 'true',
      limit: String(effectiveLimit),
    });
    path = `/json/stations/search?${query.toString()}`;
  } else {
    // Top world stations
    path = `/json/stations/topclick/${limit}?hidebroken=true&lastcheckok=1`;
  }

  try {
    const res = await requestWithFailover(path);
    const data: Station[] = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return deduplicateStations(data);
    }
    return [];
  } catch (error) {
    console.warn('Radio Browser API fetch failed, using fallback list:', error);
    // Filter fallback stations locally to match query
    let filtered = [...FALLBACK_STATIONS];
    if (tag) {
      filtered = filtered.filter(s => s.tags?.toLowerCase().includes(tag.toLowerCase()));
      if (filtered.length === 0) filtered = FALLBACK_STATIONS;
    }
    if (name) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (countrycode) {
      filtered = filtered.filter(s => s.countrycode?.toUpperCase() === countrycode.toUpperCase());
    }
    return deduplicateStations(filtered);
  }
}

export async function fetchStationsByMultipleTags(tags: string[], limitPerTag = 20, countrycode?: string): Promise<Station[]> {
  try {
    const promises = tags.slice(0, 3).map(tag => fetchStations({ tag, countrycode, limit: limitPerTag }));
    const results = await Promise.allSettled(promises);
    const combined: Station[] = [];
    const seenUuids = new Set<string>();

    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const st of res.value) {
          if (!seenUuids.has(st.stationuuid)) {
            seenUuids.add(st.stationuuid);
            combined.push(st);
          }
        }
      }
    }

    if (combined.length > 0) {
      // Sort by votes/clickcount
      return combined.sort((a, b) => (b.clickcount || b.votes || 0) - (a.clickcount || a.votes || 0));
    }
  } catch (err) {
    console.warn('Failed to fetch multiple tags:', err);
  }

  // Fallback to first tag
  return fetchStations({ tag: tags[0] || 'ambient', countrycode, limit: 40 });
}

export async function registerStationClick(stationuuid: string): Promise<void> {
  if (!stationuuid || stationuuid.startsWith('fallback-')) return;
  try {
    const server = SERVERS[currentServerIndex];
    await fetch(`${server}/json/url/${stationuuid}`, {
      method: 'GET',
      mode: 'no-cors',
    });
  } catch {
    // non-blocking
  }
}

