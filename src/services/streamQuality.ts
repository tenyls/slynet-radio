/**
 * Качество звука под сеть (как в PCRadio): если у станции есть тот же эфир в разных битрейтах,
 * выбираем подходящий и при «заиканиях» автоматически переходим на поток полегче.
 */
import { Station } from '../types/radio';

export type QualityMode = 'auto' | 'high' | 'saver';
export type Tier = 'low' | 'mid' | 'high';
const KEY = 'slynet_quality';
const EVENT = 'slynet_quality_changed';

export function getQualityMode(): QualityMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'high' || v === 'saver' ? v : 'auto';
  } catch {
    return 'auto';
  }
}
export function setQualityMode(m: QualityMode) {
  try {
    localStorage.setItem(KEY, m);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}
export const QUALITY_EVENT = EVENT;

/** Оценка сети по данным браузера (Android/Chrome). На iPhone данных нет — считаем «хорошей», а дальше смотрим на заикания. */
export function networkTier(): Tier {
  const c = (navigator as any).connection;
  if (!c) return 'high';
  if (c.saveData) return 'low';
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return 'low';
  if (c.effectiveType === '3g' || (typeof c.downlink === 'number' && c.downlink > 0 && c.downlink < 1.2)) return 'mid';
  return 'high';
}

export function variants(st: Station): { bitrate: number; url: string; codec?: string }[] {
  const main = { bitrate: st.bitrate || 128, url: st.url_resolved || st.url, codec: st.codec };
  const list = [main, ...(st.alt || [])].filter((v) => v.url);
  const seen = new Set<string>();
  return list.filter((v) => !seen.has(v.url) && seen.add(v.url)).sort((a, b) => a.bitrate - b.bitrate);
}

const LIMIT: Record<Tier, number> = { low: 64, mid: 128, high: 10000 };

/** Какой поток включить для этой станции сейчас */
export function pickStream(st: Station, tier?: Tier): { url: string; bitrate: number } {
  const v = variants(st);
  if (v.length <= 1) return { url: st.url_resolved || st.url, bitrate: st.bitrate || 0 };
  const mode = getQualityMode();
  const t: Tier = mode === 'high' ? 'high' : mode === 'saver' ? 'low' : tier || networkTier();
  const fit = v.filter((x) => x.bitrate <= LIMIT[t]);
  const chosen = fit.length ? fit[fit.length - 1] : v[0];
  return { url: chosen.url, bitrate: chosen.bitrate };
}

/** Следующий поток полегче (или null, если уже самый лёгкий) */
export function lowerStream(st: Station, currentUrl: string): { url: string; bitrate: number } | null {
  const v = variants(st);
  const i = v.findIndex((x) => x.url === currentUrl);
  if (i <= 0) return null;
  return { url: v[i - 1].url, bitrate: v[i - 1].bitrate };
}
