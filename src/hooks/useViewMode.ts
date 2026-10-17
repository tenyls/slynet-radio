import { useEffect, useState, useCallback } from 'react';

export type ViewMode = 'grid' | 'list';
const KEY = 'slynet_view_mode';
const EVENT = 'slynet_view_mode_changed';

function read(): ViewMode {
  try {
    return localStorage.getItem(KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/** Вид списка станций: плитка или компактный список (запоминается на устройстве). */
export function useViewMode() {
  const [mode, setModeState] = useState<ViewMode>(read);
  useEffect(() => {
    const sync = () => setModeState(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const setMode = useCallback((m: ViewMode) => {
    try {
      localStorage.setItem(KEY, m);
    } catch {}
    setModeState(m);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);
  return { mode, setMode };
}
