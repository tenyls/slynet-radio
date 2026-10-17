import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioPlayerContext';
import { EQUALIZER_PRESETS } from '../constants/equalizer';
import { Sliders, X, RotateCcw, Zap, Sparkles, Volume2, Waves } from 'lucide-react';

interface EqualizerModalProps {
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ onClose }) => {
  const {
    isEqEnabled,
    setIsEqEnabled,
    eqBands,
    setBandGain,
    activePresetId,
    setEqualizerPreset,
    bassBoost,
    setBassBoost,
    surround3D,
    setSurround3D,
    getFrequencyData,
    isPlaying,
  } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Canvas Audio Visualizer
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = getFrequencyData();
      const numBars = 32;
      const barWidth = width / numBars - 2;

      // Draw bars
      for (let i = 0; i < numBars; i++) {
        let val = 0;
        if (freqData && isPlaying) {
          const index = Math.floor((i / numBars) * freqData.length);
          val = freqData[index] / 255;
        } else if (isPlaying) {
          // Subtle simulated wave if CORS blocks raw audio bytes
          const t = Date.now() / 300 + i * 0.4;
          val = (Math.sin(t) * 0.3 + 0.5) * (0.5 + 0.5 * Math.sin(i * 0.2));
        } else {
          val = 0.05;
        }

        const barHeight = Math.max(4, val * (height - 6));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // SlyNet Brand Gradient (Cyan -> Emerald -> Lime)
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#10b981');
        gradient.addColorStop(1, '#a3e635');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [getFrequencyData, isPlaying]);

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Эквалайзер SlyNet PRO</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HD Sound
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Настройка частот, усиление басов и 3D объём</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visualizer Canvas */}
        <div className="p-4 bg-zinc-950/80 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Waves className="w-3.5 h-3.5 text-cyan-400" /> Спектр частот реального времени
            </span>
            <span className="font-mono text-[10px] text-emerald-400">
              {isPlaying ? 'ACTIVE STREAM' : 'STANDBY'}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={520}
            height={60}
            className="w-full h-16 rounded-xl bg-black/40 border border-white/5"
          />
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Presets Pills */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              Готовые звуковые пресеты
            </div>
            <div className="flex flex-wrap gap-2">
              {EQUALIZER_PRESETS.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setEqualizerPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-400 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Vertical Sliders */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                5-полосный эквалайзер
              </span>
              <button
                onClick={() => setEqualizerPreset('flat')}
                className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Сброс
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end pt-2 pb-1">
              {eqBands.map((band, idx) => (
                <div key={band.freq} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {band.gain > 0 ? `+${band.gain}` : band.gain} dB
                  </span>

                  {/* Vertical slider wrapper */}
                  <div className="h-36 flex items-center justify-center py-2">
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={band.gain}
                      onChange={(e) => setBandGain(idx, parseInt(e.target.value, 10))}
                      className="h-28 w-2 accent-emerald-400 cursor-pointer -rotate-90 bg-zinc-800"
                    />
                  </div>

                  <span className="text-[10px] font-medium text-zinc-400 text-center">
                    {band.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audio FX: Bass Boost & 3D Surround */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bass Boost */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-lime-400" /> Усиление басов (Bass Boost)
                </span>
                <span className="font-mono text-xs font-bold text-lime-400">{bassBoost}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={bassBoost}
                onChange={(e) => setBassBoost(parseInt(e.target.value, 10))}
                className="w-full h-2 accent-lime-400 cursor-pointer bg-zinc-800 rounded-lg mt-2"
              />
            </div>

            {/* 3D Surround */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Пространственный 3D звук
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Расширение стереобазы</p>
              </div>

              <button
                onClick={() => setSurround3D(!surround3D)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                  surround3D ? 'bg-cyan-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    surround3D ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-400 text-zinc-950 font-bold text-xs shadow-md hover:brightness-110 transition-all"
          >
            Применить и закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
