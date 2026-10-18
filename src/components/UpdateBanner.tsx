import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { isNativeApp } from '../utils/platform';

const APK = 'https://github.com/tenyls/slynet-radio/releases/download/android-latest/SlyNetRadio.apk';

/** В приложении: если на GitHub есть APK новее этой сборки — предлагаем обновиться */
export const UpdateBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isNativeApp || __BUILD__ === 'dev') return;
    fetch('https://api.github.com/repos/tenyls/slynet-radio/releases/tags/android-latest', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((rel) => {
        const latest = String(rel?.body || '').match(/build:\s*([0-9a-f]{7})/)?.[1];
        let dismissed = '';
        try {
          dismissed = localStorage.getItem('slynet_update_dismissed') || '';
        } catch {}
        if (latest && latest !== __BUILD__ && latest !== dismissed) setShow(true);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;
  return (
    <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3">
      <Download className="w-5 h-5 text-emerald-300 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-white">Доступна новая версия</div>
        <div className="text-xs text-emerald-100/80">Новые функции и исправления — обновите приложение.</div>
      </div>
      <a href={APK} className="px-3 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-extrabold shrink-0">
        Обновить
      </a>
      <button
        aria-label="Позже"
        onClick={() => {
          setShow(false);
          fetch('https://api.github.com/repos/tenyls/slynet-radio/releases/tags/android-latest')
            .then((r) => r.json())
            .then((rel) => {
              const v = String(rel?.body || '').match(/build:\s*([0-9a-f]{7})/)?.[1];
              try {
                if (v) localStorage.setItem('slynet_update_dismissed', v);
              } catch {}
            })
            .catch(() => {});
        }}
        className="p-1 text-zinc-400"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
