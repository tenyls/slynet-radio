/**
 * «Поделиться»: ссылки на станции и плейлисты, тексты-рекомендации, отправка в мессенджеры.
 * Ссылка всегда ведёт на публичный сайт (даже из приложения), а на Android может открыться прямо в приложении.
 */
import { Station } from '../types/radio';
import { GENRES } from '../constants/genres';
import { hasNative, nativeShare } from './nativeBridge';

export const PUBLIC_SITE = 'https://tenyls.github.io/slynet-radio/';

// ---------- base64url для UTF-8 ----------
const toB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/** Станция есть в общем каталоге (Radio Browser) или в нашем эксклюзиве — достаточно id */
const isGlobalId = (id: string) => /^[0-9a-f-]{36}$/i.test(id) || id.startsWith('ex-');

/** Компактная запись станции для ссылки */
type Packed = string | [string, string, string, string?, string?];
const pack = (st: Station): Packed =>
  isGlobalId(st.stationuuid) ? st.stationuuid : [st.stationuuid, st.name, st.url_resolved || st.url, st.favicon || '', st.country || ''];

export function unpack(p: Packed): { id: string; station?: Station } {
  if (typeof p === 'string') return { id: p };
  const [id, name, url, favicon, country] = p;
  return { id, station: { stationuuid: id, name, url, url_resolved: url, favicon, country } };
}

// ---------- ссылки ----------
export function stationLink(st: Station): string {
  if (isGlobalId(st.stationuuid)) return `${PUBLIC_SITE}#station=${st.stationuuid}`;
  return `${PUBLIC_SITE}#st=${toB64(JSON.stringify(pack(st)))}`;
}

export interface SharedPlaylist {
  name: string;
  by?: string;
  items: Packed[];
}
export const PLAYLIST_LIMIT = 60;

export function playlistLink(name: string, stations: Station[], by?: string): string {
  const data: SharedPlaylist = { name: name.slice(0, 60), items: stations.slice(0, PLAYLIST_LIMIT).map(pack) };
  if (by) data.by = by.slice(0, 30);
  return `${PUBLIC_SITE}#pl=${toB64(JSON.stringify(data))}`;
}

export function parseSharedPlaylist(code: string): SharedPlaylist | null {
  try {
    const d = JSON.parse(fromB64(code));
    if (!d || !Array.isArray(d.items)) return null;
    return { name: String(d.name || 'Плейлист'), by: d.by ? String(d.by) : undefined, items: d.items.slice(0, PLAYLIST_LIMIT) };
  } catch {
    return null;
  }
}

export function parseSharedStation(code: string): Station | null {
  try {
    return unpack(JSON.parse(fromB64(code))).station || null;
  } catch {
    return null;
  }
}

// ---------- тексты ----------
const RU_TAGS: Record<string, string> = {};
for (const g of GENRES) {
  if (!g.tag) continue;
  RU_TAGS[g.tag.toLowerCase()] = g.name;
  (g.tags || []).forEach((t) => (RU_TAGS[t.toLowerCase()] = g.name));
}
const EXTRA: Record<string, string> = {
  pop: 'поп', rock: 'рок', jazz: 'джаз', dance: 'танцевальная', electronic: 'электроника', house: 'хаус', techno: 'техно',
  trance: 'транс', chillout: 'чилаут', lounge: 'лаунж', ambient: 'эмбиент', classical: 'классика', news: 'новости',
  talk: 'разговорное', hits: 'хиты', oldies: 'хиты прошлых лет', '80s': '80-е', '90s': '90-е', '70s': '70-е', '00s': '2000-е',
  rap: 'рэп', 'hip hop': 'хип-хоп', 'hip-hop': 'хип-хоп', metal: 'метал', blues: 'блюз', soul: 'соул', funk: 'фанк',
  reggae: 'регги', country: 'кантри', folk: 'фолк', indie: 'инди', alternative: 'альтернатива', disco: 'диско', latin: 'латино',
  eclectic: 'всё подряд, но со вкусом', world: 'музыка мира', chill: 'чилл', lofi: 'lo-fi', kids: 'детское', christmas: 'новогоднее',
};
function genresRu(st: Station): string[] {
  const tags = (st.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const out: string[] = [];
  for (const t of tags) {
    const ru = EXTRA[t] || RU_TAGS[t];
    if (ru && !out.includes(ru.toLowerCase())) out.push(ru.toLowerCase());
    if (out.length >= 3) break;
  }
  return out;
}

const HOOKS = [
  '🎧 Мне очень нравится эта станция — рекомендую!',
  '🔥 Нашёл классную станцию, послушай!',
  '💚 Моя любимая станция — включи, не пожалеешь',
  '📻 Слушаю прямо сейчас — зацени!',
  '✨ Эту станцию стоит добавить в избранное',
];

/** Короткое описание станции по её данным (жанры, страна, качество) */
export function describeStation(st: Station): string {
  const g = genresRu(st);
  const parts: string[] = [];
  if (g.length) parts.push(`${g.join(', ')}`);
  if (st.country) parts.push(`📍 ${st.country}`);
  const b = st.bitrate || 0;
  const q = b >= 256 ? `отличное качество ${b} kbps` : b >= 128 ? `хорошее качество ${b} kbps` : '';
  if (q) parts.push(q);
  if (st.stationuuid.startsWith('ex-')) parts.unshift('эксклюзив SlyNet');
  const s = parts.filter(Boolean).join(' · ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Живой эфир 24/7';
}

export function stationShareText(st: Station, variant = 0): string {
  const hook = HOOKS[((variant % HOOKS.length) + HOOKS.length) % HOOKS.length];
  return `${hook}\n«${st.name}»\n${describeStation(st)}\n\nСлушай бесплатно в SlyNet Radio 👇`;
}

export function playlistShareText(name: string, count: number, variant = 0): string {
  const hooks = [
    `🎶 Собрал(а) для тебя плейлист «${name}» — ${count} станций`,
    `💚 Делюсь своим плейлистом «${name}» (${count} станций)`,
    `🔥 Мой плейлист «${name}» — ${count} станций, которые я слушаю сам(а)`,
  ];
  return `${hooks[((variant % hooks.length) + hooks.length) % hooks.length]}\nОткрой, слушай и сохрани себе в SlyNet Radio 👇`;
}

// ---------- отправка ----------
export type ShareTarget = 'system' | 'telegram' | 'whatsapp' | 'vk' | 'viber' | 'copy';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const canSystemShare = () => hasNative() || typeof navigator.share === 'function';

/**
 * Важно для iPhone: вызывать прямо в обработчике нажатия, без ожиданий до navigator.share —
 * иначе Safari молча откажет.
 */
export function shareTo(target: ShareTarget, text: string, url: string, title = 'SlyNet Radio'): Promise<boolean> | boolean {
  const full = `${text}\n${url}`;
  const open = (u: string) => {
    window.open(u, '_blank', 'noopener');
    return true;
  };
  switch (target) {
    case 'telegram':
      return open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    case 'whatsapp':
      return open(`https://wa.me/?text=${encodeURIComponent(full)}`);
    case 'vk':
      return open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&comment=${encodeURIComponent(text)}`);
    case 'viber':
      return open(`viber://forward?text=${encodeURIComponent(full)}`);
    case 'copy':
      return copyText(full);
    case 'system':
    default:
      if (hasNative()) return nativeShare(title, full).then(() => true);
      if (typeof navigator.share === 'function') {
        return navigator
          .share({ title, text, url })
          .then(() => true)
          .catch(() => false);
      }
      return copyText(full);
  }
}

/** Android в браузере: ссылка-«намерение», которая откроет то же самое в установленном приложении */
export function openInAppLink(hash: string): string | null {
  const ua = navigator.userAgent || '';
  if (!/Android/i.test(ua) || hasNative()) return null;
  const fallback = encodeURIComponent(PUBLIC_SITE + hash);
  return `intent://open?h=${encodeURIComponent(hash)}#Intent;scheme=slynet;package=com.slynet.radio;S.browser_fallback_url=${fallback};end`;
}
