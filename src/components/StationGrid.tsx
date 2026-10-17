import React from 'react';
import { Station } from '../types/radio';
import { StationCard } from './StationCard';
import { Radio } from 'lucide-react';
import { SlyNetLogo } from './SlyNetLogo';

interface StationGridProps {
  stations: Station[];
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  isFavorite: (id: string) => boolean;
  onPlayStation: (station: Station, contextPlaylist?: Station[]) => void;
  onToggleFavorite: (station: Station) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  onResetFilters?: () => void;
}

export const StationGrid: React.FC<StationGridProps> = ({
  stations,
  currentStation,
  isPlaying,
  isLoading,
  isFavorite,
  onPlayStation,
  onToggleFavorite,
  emptyTitle = 'Станции не найдены',
  emptySubtitle = 'Попробуйте изменить поисковый запрос или фильтры по странам',
  onResetFilters,
}) => {
  // Skeleton loader when initial loading
  if (isLoading && stations.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {/* SlyNet Globe Loading Animation */}
        <div className="py-8 flex flex-col items-center justify-center">
          <div className="relative animate-pulse mb-3">
            <SlyNetLogo size="lg" className="w-16 h-16 shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
          </div>
          <span className="text-xs font-medium text-emerald-400 font-mono tracking-wider">
            ПОДКЛЮЧЕНИЕ К ЭФИРУ SLYNET RADIO...
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 animate-pulse"
            >
              <div className="aspect-square w-full rounded-xl bg-zinc-800/60 mb-3" />
              <div className="h-4 bg-zinc-800/80 rounded w-3/4 mb-2" />
              <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (stations.length === 0) {
    return (
      <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{emptyTitle}</h3>
        <p className="text-xs text-zinc-400 mb-6">{emptySubtitle}</p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-theme-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow-lg shadow-theme-glow transition-colors"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {stations.map((station) => {
        const isCurrent = currentStation?.stationuuid === station.stationuuid;
        return (
          <StationCard
            key={station.stationuuid}
            station={station}
            isPlaying={isPlaying}
            isCurrent={isCurrent}
            isFavorite={isFavorite(station.stationuuid)}
            onPlay={() => onPlayStation(station, stations)}
            onToggleFavorite={onToggleFavorite}
          />
        );
      })}
    </div>
  );
};
