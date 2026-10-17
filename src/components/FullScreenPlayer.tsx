import { liveFallbackLabel } from '../services/rdsService';
import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioPlayerContext';
import { StationFallbackIcon } from './StationFallbackIcon';
import { SlyNetLogo } from './SlyNetLogo';
import { SleepTimerModal } from './SleepTimerModal';
import { CityWeather } from '../types/radio';
import { getStationWeather } from '../services/weatherService';
import { fetchAlbumArtFromItunes } from '../services/itunesService';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Moon,
  Clock,
  ExternalLink,
  Wifi,
  Sparkles,
  Sliders,
  Disc,
  Circle,
  Car,
  Bell,
  CloudSun,
  Wind,
  Bookmark,
  Check,
} from 'lucide-react';

interface FullScreenPlayerProps {
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isFavorite,
  onToggleFavorite,
}) => {
  const {
    currentStation,
    currentTrackTitle,
    isPlaying,
    isLoading,
    togglePlayPause,
    playNext,
    playPrevious,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isFullScreenOpen,
    setIsFullScreenOpen,
    sleepTimerRemainingSec,
    error,
    setIsCarModeOpen,
    setIsEqualizerOpen,
    setIsRecorderOpen,
    setIsAlarmOpen,
    isRecording,
    recordingDurationSec,
    startRecording,
    stopRecording,
    bookmarkCurrentTrack,
  } = useAudio();

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [weather, setWeather] = useState<CityWeather | null>(null);
  const [itunesArtwork, setItunesArtwork] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Auto-fetch artist & album cover via iTunes Search API
  useEffect(() => {
    if (!currentStation) {
      setItunesArtwork(null);
      return;
    }
    let cancelled = false;
    const query = currentTrackTitle || currentStation.name;
    fetchAlbumArtFromItunes(query).then((art) => {
      if (!cancelled && art) {
        setItunesArtwork(art);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentStation?.stationuuid, currentTrackTitle]);

  // Fetch weather for broadcasting city
  useEffect(() => {
    if (!currentStation) {
      setWeather(null);
      return;
    }
    let cancelled = false;
    getStationWeather(currentStation).then((w) => {
      if (!cancelled && w) {
        setWeather(w);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentStation]);

  useEffect(() => {
    setImageError(false);
  }, [currentStation?.stationuuid]);

  if (!isFullScreenOpen || !currentStation) return null;

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cleanTags =
    currentStation.tags
      ?.split(',')
      .slice(0, 3)
      .map((t) => `#${t.trim()}`)
      .join(' ') ||
    currentStation.country ||
    '#Radio';

  return (
    <>
      <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between p-3 sm:p-4 md:p-6 z-50 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black select-none animate-fade-in">
        {/* Full-bleed blurred cover background */}
        {(itunesArtwork || (currentStation.favicon && !imageError)) && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-125 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `url(${itunesArtwork || currentStation.favicon})` }}
          />
        )}

        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top bar with back button & brand title */}
        <div className="relative z-10 flex items-center justify-between px-2 py-1 max-w-2xl w-full mx-auto shrink-0">
          <button
            onClick={() => setIsFullScreenOpen(false)}
            aria-label="Свернуть плеер"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
              СЕЙЧАС ИГРАЕТ
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <SlyNetLogo
                size="xs"
                className="w-4 h-4 shadow-[0_0_10px_rgba(16,185,129,0.4)] border border-emerald-500/40"
                isSpinning={isPlaying}
              />
              <span className="text-xs text-theme-accent font-bold">SlyNet Radio</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSleepModalOpen(true)}
              aria-label="Таймер сна"
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                sleepTimerRemainingSec !== null
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5'
              }`}
            >
              {sleepTimerRemainingSec !== null ? (
                <Clock className="w-4 h-4 animate-pulse text-emerald-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Center content container - strictly fits 1 screen */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-md w-full mx-auto py-1 min-h-0 overflow-hidden">
          {/* Weather of broadcasting city */}
          {weather && (
            <div className="mb-2 px-3 py-1 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center gap-2 text-[11px] text-zinc-300 shadow shrink-0">
              <span className="text-sm">{weather.icon}</span>
              <span className="font-bold text-white font-mono">
                {(weather.temp ?? 0) > 0 ? `+${weather.temp}` : weather.temp}°C
              </span>
              <span className="text-zinc-400">{weather.condition}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-cyan-400 font-mono font-medium truncate max-w-[140px]">
                {weather.city} ({weather.localTime})
              </span>
            </div>
          )}

          {/* Adaptively sized cover art (w-44 to w-64) */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800/80 mb-2 sm:mb-3 flex items-center justify-center bg-zinc-950 shrink-0">
            {itunesArtwork ? (
              <img
                src={itunesArtwork}
                alt={currentStation?.name || 'Радио'}
                className="w-full h-full object-cover animate-fade-in"
              />
            ) : typeof currentStation?.favicon === 'string' && currentStation.favicon && !imageError ? (
              <img
                src={currentStation.favicon}
                alt={currentStation?.name || 'Радио'}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <StationFallbackIcon
                name={currentStation?.name || 'Радио'}
                size="xl"
                className="w-full h-full rounded-3xl"
              />
            )}

            {/* iTunes HD Artwork Badge */}
            {itunesArtwork && (
              <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-cyan-500/30 text-[9px] font-mono text-cyan-300 flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>iTunes Cover</span>
              </div>
            )}

            {/* Custom Station Badge */}
            {currentStation?.isCustom && (
              <div className="absolute top-3 left-3 bg-emerald-500 text-zinc-950 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 fill-zinc-950" />
                <span>SlyNet Choice</span>
              </div>
            )}

            {/* Pulsing visualizer badge when playing */}
            {isPlaying && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-2 bg-lime-400 rounded-full animate-bounce delay-150" />
                <span className="text-[10px] font-mono font-bold text-white ml-0.5">LIVE</span>
              </div>
            )}
          </div>

          {/* Station metadata & favorite row */}
          <div className="w-full flex items-center justify-between gap-3 mb-1.5 shrink-0">
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white truncate">
                {currentStation?.name || 'Радиостанция'}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">{cleanTags}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Bookmark track button */}
              <button
                onClick={() => {
                  const ok = bookmarkCurrentTrack();
                  if (ok) {
                    setSavedNotice(true);
                    setTimeout(() => setSavedNotice(false), 2000);
                  }
                }}
                aria-label="Запомнить трек"
                title={savedNotice ? 'Трек сохранен в историю!' : 'Запомнить трек (RDS)'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-95 ${
                  savedNotice
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                    : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                {savedNotice ? <Check className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
              </button>

              <button
                onClick={onToggleFavorite}
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                  isFavorite
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Prominent Pulsing/Running RDS Live Banner */}
          <div className="w-full mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-zinc-900/90 to-cyan-950/80 border border-emerald-500/40 flex items-center gap-2 shadow-lg shadow-emerald-950/20 overflow-hidden shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-400 shrink-0 font-mono text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>🎵 СЕЙЧАС В ЭФИРЕ:</span>
            </div>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="animate-marquee inline-block font-mono text-xs sm:text-sm font-bold text-white drop-shadow">
                {currentTrackTitle || liveFallbackLabel(currentStation)}
              </div>
            </div>
          </div>

          {/* Badges / Station specifications */}
          <div className="w-full flex items-center gap-1.5 mb-2 text-[11px] text-zinc-400 shrink-0">
            {currentStation.country && (
              <span className="px-2 py-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 font-medium text-zinc-300 truncate max-w-[120px]">
                {currentStation.country}
              </span>
            )}
            {currentStation.bitrate && currentStation.bitrate > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 font-mono tabular-nums text-emerald-400 font-bold">
                {currentStation.bitrate} kbps
              </span>
            )}
            {currentStation.codec && (
              <span className="px-2 py-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 font-mono uppercase text-zinc-300">
                {currentStation.codec}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
              <Wifi className="w-3 h-3 animate-pulse" />
              <span>Ultra HD</span>
            </div>
          </div>

          {/* Primary Playback Controls */}
          <div className="w-full flex items-center justify-center gap-5 mb-2 shrink-0">
            <button
              onClick={playPrevious}
              aria-label="Предыдущая станция"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-900 border border-white/5 active:scale-95"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              aria-label={isPlaying ? 'Пауза' : 'Слушать'}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-emerald-500/25 transition-transform active:scale-95 hover:scale-105"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-zinc-950" />
              ) : (
                <Play className="w-7 h-7 fill-zinc-950 ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              aria-label="Следующая станция"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-900 border border-white/5 active:scale-95"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control Bar */}
          <div className="w-full flex items-center gap-2 px-2 mb-2 shrink-0">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Включить звук' : 'Без звука'}
              className="text-zinc-400 hover:text-white p-1.5"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4 text-lime-400" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Громкость"
              className="flex-1 h-1.5 accent-emerald-400 cursor-pointer bg-zinc-800 rounded-lg"
            />

            <span className="text-[11px] font-mono font-bold text-zinc-300 w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* QUICK TOOLS ROW: Equalizer, Record, Car Mode, Alarm */}
          <div className="w-full grid grid-cols-4 gap-2 pt-1 border-t border-zinc-800/80 shrink-0">
            {/* Equalizer */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              className="py-2 px-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 flex flex-col items-center gap-0.5 text-[10px] font-medium text-zinc-300 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Эквалайзер</span>
            </button>

            {/* Recorder */}
            <button
              onClick={() => (isRecording ? stopRecording() : setIsRecorderOpen(true))}
              className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isRecording
                  ? 'bg-rose-600/30 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/5 text-zinc-300'
              }`}
            >
              {isRecording ? (
                <Circle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              ) : (
                <Disc className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{isRecording ? formatRemaining(recordingDurationSec) : 'Запись'}</span>
            </button>

            {/* Car Mode */}
            <button
              onClick={() => {
                setIsFullScreenOpen(false);
                setIsCarModeOpen(true);
              }}
              className="py-2 px-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 flex flex-col items-center gap-0.5 text-[10px] font-medium text-zinc-300 transition-colors"
            >
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>За рулем</span>
            </button>

            {/* Alarm */}
            <button
              onClick={() => setIsAlarmOpen(true)}
              className="py-2 px-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 flex flex-col items-center gap-0.5 text-[10px] font-medium text-zinc-300 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-lime-400" />
              <span>Будильник</span>
            </button>
          </div>
        </div>

        {/* Footer website link */}
        <div className="relative z-10 py-1 text-center shrink-0">
          {currentStation.homepage && (
            <a
              href={currentStation.homepage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              <span>Сайт радиостанции</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>


      <SleepTimerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
      />
    </>
  );
};
