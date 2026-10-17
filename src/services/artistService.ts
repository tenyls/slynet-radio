/**
 * Поиск станций конкретного исполнителя / подборок саундтреков.
 *
 * Правило: для исполнителя показываем ТОЛЬКО станции, в названии которых есть имя
 * исполнителя целым словом (например «Rammstein Radio», «Кино FM»). Никаких
 * подстановок случайных станций по общему тегу «rock». Если подходящих нет — честно
 * возвращаем пустой список.
 */
import { Station } from '../types/radio';
import { ArtistItem } from '../constants/artists';
import { fetchStations, fetchStationsByMultipleTags, deduplicateStations } from './radioApi';

/** Варианты написания имени для поиска в названиях станций */
const NAME_VARIANTS: Record<string, string[]> = {
  // «Кино» без уточнения ловит станции киномузыки, поэтому ищем по Цою
  kino: ['Виктор Цой', 'Цой', 'Группа Кино', 'Kino Tsoi'],
  'sektor-gaza': ['Сектор Газа', 'Sektor Gaza'],
  'korol-i-shut': ['Король и Шут', 'Korol i Shut'],
  aria: ['Ария'],
  nautilus: ['Наутилус', 'Nautilus Pompilius'],
  ddt: ['ДДТ'],
  'bi-2': ['Би-2', 'Би 2'],
  splin: ['Сплин'],
  'ruki-vverh': ['Руки Вверх', 'Ruki Vverh'],
  'laskoviy-may': ['Ласковый Май', 'Laskovyi Mai'],
  'mikhail-krug': ['Михаил Круг'],
  vysotsky: ['Высоцкий', 'Vysotsky'],
  zemfira: ['Земфира', 'Zemfira'],
  basta: ['Баста'],
  miyagi: ['Miyagi', 'Мияги'],
  queen: ['Queen'],
  metallica: ['Metallica'],
  'linkin-park': ['Linkin Park'],
  rammstein: ['Rammstein'],
  'depeche-mode': ['Depeche Mode'],
  'the-prodigy': ['Prodigy'],
  scooter: ['Scooter'],
  'modern-talking': ['Modern Talking'],
  abba: ['ABBA'],
  'michael-jackson': ['Michael Jackson'],
  eminem: ['Eminem'],
  'daft-punk': ['Daft Punk'],
  'pink-floyd': ['Pink Floyd'],
  acdc: ['AC/DC', 'ACDC'],
  nirvana: ['Nirvana'],
  'the-beatles': ['Beatles'],
  'hans-zimmer': ['Hans Zimmer', 'Zimmer'],
};

/** Теги для подборок саундтреков (здесь поиск по жанру — это и есть суть подборки) */
const OST_TAGS: Record<string, string[]> = {
  soundtrack: ['soundtrack', 'soundtracks', 'film music'],
  game: ['video game music', 'game music', 'vgm'],
  anime: ['anime', 'j-pop', 'jpop'],
  series: ['soundtrack', 'tv series', 'movie'],
  synthwave: ['synthwave', 'epic', 'cinematic'],
};

function variantsFor(artist: ArtistItem): string[] {
  const explicit = NAME_VARIANTS[artist.id];
  if (explicit) return explicit;
  const base = artist.name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return [base];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}/]+/gu, ' ')
    .trim();

/** Имя встречается в названии станции целым словом/фразой */
export function nameMatches(stationName: string, variant: string): boolean {
  const hay = ` ${norm(stationName)} `;
  const needle = ` ${norm(variant)} `;
  return hay.includes(needle);
}

const cache = new Map<string, Station[]>();

export async function findArtistStations(artist: ArtistItem): Promise<Station[]> {
  const cached = cache.get(artist.id);
  if (cached) return cached;

  let result: Station[] = [];

  if (artist.category === 'ost') {
    const tags = OST_TAGS[artist.tag] || [artist.tag];
    result = await fetchStationsByMultipleTags(tags, 30);
  } else {
    const variants = variantsFor(artist);
    const lists = await Promise.allSettled(variants.map((v) => fetchStations({ name: v, limit: 40 })));
    const seen = new Set<string>();
    for (const r of lists) {
      if (r.status !== 'fulfilled') continue;
      for (const st of r.value) {
        if (seen.has(st.stationuuid)) continue;
        if (variants.some((v) => nameMatches(st.name, v))) {
          seen.add(st.stationuuid);
          result.push(st);
        }
      }
    }
    // Второй источник — laut.fm (лицензированные в Германии пользовательские станции)
    try {
      for (const st of await searchLautFm(variants[0])) {
        if (!seen.has(st.stationuuid) && variants.some((v) => nameMatches(st.name, v) || nameMatches(st.tags || '', v))) {
          seen.add(st.stationuuid);
          result.push(st);
        }
      }
    } catch {}
    result.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0));
  }

  cache.set(artist.id, result);
  return result;
}

/** Поиск станций на laut.fm (открытый API, без ключа). Поток: https://stream.laut.fm/<name> */
export async function searchLautFm(query: string): Promise<Station[]> {
  const res = await fetch(`https://api.laut.fm/search/stations?query=${encodeURIComponent(query)}&limit=20`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const items: any[] = (json?.results || []).flatMap((r: any) => r?.items || []);
  return items
    .map((it) => it?.station)
    .filter((st: any) => st?.name)
    .map(
      (st: any): Station => ({
        stationuuid: `lautfm-${st.name}`,
        name: st.display_name || st.name,
        url: `https://stream.laut.fm/${st.name}`,
        url_resolved: `https://stream.laut.fm/${st.name}`,
        homepage: st.page_url || `https://laut.fm/${st.name}`,
        favicon: st.images?.station_80x80 || st.images?.station || '',
        tags: [...(st.genres || []), st.description || ''].filter(Boolean).join(','),
        country: 'Germany',
        countrycode: 'DE',
        codec: 'MP3',
        bitrate: 128,
      })
    );
}

/**
 * Самообновляемый каталог «станций одного исполнителя»: в открытом каталоге есть целые
 * серии таких станций («Exclusively …», «101.ru …», «Radio Maximum – …», «Best of Rock FM – …»).
 * Новые станции появляются здесь автоматически, без правок кода.
 */
const SERIES = ['Exclusively', '101.ru', 'Radio Maximum', 'Best of Rock FM', 'Best Of Rock.FM'];
let seriesCache: Promise<Station[]> | null = null;

export function fetchArtistSeriesStations(): Promise<Station[]> {
  if (!seriesCache) {
    seriesCache = Promise.allSettled(SERIES.map((n) => fetchStations({ name: n, limit: 400 })))
      .then((lists) => {
        const all = lists.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
        const onlySeries = all.filter((st) => SERIES.some((n) => norm(st.name).startsWith(norm(n))));
        return deduplicateStations(onlySeries).sort((a, b) => artistLabel(a.name).localeCompare(artistLabel(b.name)));
      })
      .catch(() => {
        seriesCache = null;
        return [];
      });
  }
  return seriesCache;
}

/** «Exclusively - Metallica» → «Metallica» */
export function artistLabel(stationName: string): string {
  return stationName
    .replace(/^\s*(exclusively|exclusive radio|101\.ru|radio maximum|best of rock\.?\s?fm)\s*[-–—:]?\s*/i, '')
    .replace(/\((mp3|aac)[^)]*\)/gi, '')
    .trim() || stationName;
}
