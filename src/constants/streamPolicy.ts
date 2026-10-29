/**
 * Станции, которые сами запретили использовать свои потоки в сторонних приложениях
 * (правило владельца: только легальные потоки). Список — в data/stream-policy.json.
 */
import policy from '../../data/stream-policy.json';

const HOSTS: string[] = (policy.blockedHosts || []).map((h: { host: string }) => h.host.toLowerCase());

const hostOf = (u?: string) => {
  try {
    return u ? new URL(u).hostname.toLowerCase() : '';
  } catch {
    return '';
  }
};

/** true — станцию показывать нельзя (поток или сайт станции на запрещённом домене) */
export function isBlockedSource(st: { url?: string; url_resolved?: string; homepage?: string }): boolean {
  return [st.url, st.url_resolved, st.homepage].some((u) => {
    const h = hostOf(u);
    return !!h && HOSTS.some((b) => h === b || h.endsWith('.' + b));
  });
}
