import React, { useEffect, useRef, useState } from 'react';
import { Heart, Play, Shuffle, ChevronDown, ListMusic, Pause } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useAudio } from '../context/AudioPlayerContext';
import { StationLogo } from './StationLogo';

export const openPlaylist = () => window.dispatchEvent(new CustomEvent('slynet_open_playlist'));

/**
 * «Мой плейлист» — станции, отмеченные ♥ в любом разделе (это и есть «Избранное», синхронизируется).
 * Красиво раскрывается по кнопке на главной.
 */
export const MyPlaylist: React.FC<{ onGoFavorites: () => void }> = ({ onGoFavorites }) => {
  const { favorites } = useFavorites();
  const { playStation, currentStation, isPlaying, togglePlayPause } = useAudio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = () => {
      setOpen(true);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    window.addEventListener('slynet_open_playlist', h);
    return () => window.removeEventListener('slynet_open_playlist', h);
  }, []);

  const playAll = (shuffle = false) => {
    if (!favorites.length) return;
    const list = shuffle ? [...favorites].sort(() => Math.random() - 0.5) : favorites;
    playStation(list[0], list);
  };

  return (
    <section ref={ref} className="scroll-mt-24">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-3xl text-left border transition-all active:scale-[0.99] ${
          open ? 'bg-gradient-to-r from-emerald-500/25 via-cyan-500/15 to-lime-400/20 border-emerald-400/50' : 'bg-gradient-to-r from-emerald-500/15 via-zinc-900 to-zinc-900 border-emerald-500/30 hover:border-emerald-400/60'
        }`}
      >
        <span className="relative w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-lime-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <ListMusic className="w-7 h-7 text-zinc-950" />
          {favorites.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center border-2 border-zinc-950">
              {favorites.length}
            </span>
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-extrabold text-white">Мой плейлист</span>
          <span className="block text-xs text-zinc-300">
            {favorites.length ? `${favorites.length} станций · собран из ♥ по всему сайту` : 'Нажимайте ♥ у станций в любом разделе — они соберутся здесь'}
          </span>
        </span>
        <ChevronDown className={`w-6 h-6 text-emerald-300 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Плавное раскрытие */}
      <div className={`grid transition-all duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {favorites.length === 0 ? (
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-300 text-center">
              <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              Плейлист пока пуст. Нажмите <b className="text-white">♥</b> у любой станции — в жанрах, эксклюзиве, поиске или в плеере.
            </div>
          ) : (
            <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => playAll(false)} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 text-sm font-extrabold flex items-center gap-2 active:scale-95">
                  <Play className="w-4 h-4 fill-zinc-950" /> Слушать всё
                </button>
                <button onClick={() => playAll(true)} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-bold flex items-center gap-2 active:scale-95">
                  <Shuffle className="w-4 h-4 text-lime-400" /> Перемешать
                </button>
                <button onClick={onGoFavorites} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-bold flex items-center gap-2 active:scale-95">
                  <Heart className="w-4 h-4 text-rose-400" /> Изменить
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                {favorites.map((st, i) => {
                  const active = currentStation?.stationuuid === st.stationuuid;
                  return (
                    <button
                      key={st.stationuuid}
                      onClick={() => (active ? togglePlayPause() : playStation(st, favorites))}
                      style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                      className={`animate-fade-in flex items-center gap-3 p-2 rounded-xl text-left border ${active ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <StationLogo favicon={st.favicon} name={st.name} textClass="text-xs" />
                      </span>
                      <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{st.name}</span>
                      {active && isPlaying ? <Pause className="w-4 h-4 text-emerald-300" /> : <Play className="w-4 h-4 text-zinc-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
