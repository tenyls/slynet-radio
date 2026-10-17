/**
 * Синхронизация избранного и сохранённых треков между устройствами через мини-сервер.
 * Правило: побеждает более свежая версия (так корректно переносятся и удаления).
 */
import { api, hasApi, userSession } from './apiService';
import { FAVORITES_STORAGE_KEY } from '../hooks/useFavorites';

const TRACKS_KEY = 'slynet_recognized_tracks_v1';
export const LOCAL_UPDATED_KEY = 'slynet_sync_local_updated';
const LAST_SYNC_KEY = 'slynet_sync_last';

const readArr = (k: string) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const num = (k: string) => {
  try {
    return Number(localStorage.getItem(k) || 0);
  } catch {
    return 0;
  }
};

export function markLocalChanged() {
  try {
    localStorage.setItem(LOCAL_UPDATED_KEY, String(Date.now()));
  } catch {}
}

export async function syncNow(opts: { mergeFirst?: boolean } = {}): Promise<'pulled' | 'pushed' | 'merged' | 'skip'> {
  const { token } = userSession.get();
  if (!hasApi() || !token) return 'skip';
  const server = await api<{ favorites?: any[]; recognizedTracks?: any[]; updatedAt?: number }>('/sync/data', { token });
  const localFav = readArr(FAVORITES_STORAGE_KEY);
  const localTracks = readArr(TRACKS_KEY);
  const localUpdated = num(LOCAL_UPDATED_KEY);
  const serverUpdated = server.updatedAt || 0;

  const apply = (fav: any[], tracks: any[]) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(fav));
    localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('slynet_favorites_changed'));
  };
  const push = async (fav: any[], tracks: any[]) => {
    const r = await api<{ updatedAt: number }>('/sync/data', { method: 'PUT', body: { favorites: fav, recognizedTracks: tracks }, token });
    localStorage.setItem(LOCAL_UPDATED_KEY, String(r.updatedAt));
  };

  let result: 'pulled' | 'pushed' | 'merged';
  if (opts.mergeFirst) {
    // Первый вход на устройстве: объединяем, ничего не теряя
    const uniq = (arr: any[], key: (x: any) => string) => {
      const seen = new Set<string>();
      return arr.filter((x) => x && !seen.has(key(x)) && seen.add(key(x)));
    };
    const fav = uniq([...(server.favorites || []), ...localFav], (s) => s.stationuuid);
    const tracks = uniq([...(server.recognizedTracks || []), ...localTracks], (t) => `${t.artist}|${t.title}`.toLowerCase());
    apply(fav, tracks);
    await push(fav, tracks);
    result = 'merged';
  } else if (serverUpdated > localUpdated) {
    apply(server.favorites || [], server.recognizedTracks || []);
    localStorage.setItem(LOCAL_UPDATED_KEY, String(serverUpdated));
    result = 'pulled';
  } else {
    await push(localFav, localTracks);
    result = 'pushed';
  }
  localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
  return result;
}

export const lastSyncAt = () => num(LAST_SYNC_KEY);
