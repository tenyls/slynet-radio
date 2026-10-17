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
import { fetchStations, fetchStationsByMultipleTags } from './radioApi';

/** Варианты написания имени для поиска в названиях станций */
const NAME_VARIANTS: Record<string, string[]> = {
  kino: ['Кино', 'Виктор Цой', 'Цой', 'Kino Tsoi'],
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
    result.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0));
  }

  cache.set(artist.id, result);
  return result;
}
