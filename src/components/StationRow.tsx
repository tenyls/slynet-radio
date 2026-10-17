import React, { useState } from 'react';
import { Play, Pause, Heart, Music2 } from 'lucide-react';
import { Station } from '../types/radio';
import { getCountryFlag } from '../constants/countries';

interface StationRowProps {
  station: Station;
  isCurrent: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  trackTitle?: string;
  onPlay: () => void;
  onToggleFavorite: (station: Station) => void;
}

/** Компактная строка станции для режима «Список» */
export const StationRow: React.FC<StationRowProps> = ({ station, isCurrent, isPlaying, isFavorite, trackTitle, onPlay, onToggleFavorite }) => {
  const [imgError, setImgError] = useState(false);
  const active = isCurrent && isPlaying;
  const genre = (station.tags || '').split(',').map((t) => t.trim()).filter(Boolean)[0];

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer border transition-colors ${
        isCurrent ? 'bg-cyan-950/40 border-cyan-400/50' : 'bg-zinc-900/50 hover:bg-zinc-800/80 border-zinc-800/70'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        aria-label={active ? 'Пауза' : 'Слушать'}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          active ? 'bg-theme-accent text-zinc-950' : 'bg-zinc-800 text-zinc-200 group-hover:bg-theme-accent group-hover:text-zinc-950'
        }`}
      >
        {active ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <span className="hidden sm:flex w-9 h-9 rounded-lg overflow-hidden bg-zinc-950 items-center justify-center shrink-0">
        {station.favicon && !imgError ? (
          <img src={station.favicon} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} className="w-full h-full object-cover" />
        ) : (
          <Music2 className="w-4 h-4 text-zinc-600" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{station.name}</div>
        <div className="text-[11px] text-zinc-400 truncate">
          {isCurrent && trackTitle ? <span className="text-emerald-300">🎵 {trackTitle}</span> : [genre, station.bitrate ? `${station.bitrate} kbps` : ''].filter(Boolean).join(' · ')}
        </div>
      </div>

      <span className="hidden md:block text-xs text-zinc-400 truncate max-w-[140px]" title={station.country}>
        {getCountryFlag(station.countrycode || '')} {station.country}
      </span>
      <span className="md:hidden text-base shrink-0">{getCountryFlag(station.countrycode || '')}</span>
      {station.bitrate ? (
        <span className="hidden lg:block text-[11px] font-mono text-emerald-400 w-16 text-right shrink-0">{station.bitrate} kbps</span>
      ) : null}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(station);
        }}
        aria-label={isFavorite ? 'Удалить из избранного' : 'В избранное'}
        className="p-2 rounded-lg hover:bg-zinc-800 shrink-0"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}`} />
      </button>
    </div>
  );
};
