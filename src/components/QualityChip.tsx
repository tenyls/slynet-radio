import React, { useEffect, useState } from 'react';
import { getQualityMode, setQualityMode, QualityMode, QUALITY_EVENT } from '../services/streamQuality';

const LABEL: Record<QualityMode, string> = { auto: 'Авто', high: 'Высокое', saver: 'Экономия' };
const NEXT: Record<QualityMode, QualityMode> = { auto: 'high', high: 'saver', saver: 'auto' };

/** Переключатель качества звука: Авто (под сеть) → Высокое → Экономия трафика */
export const QualityChip: React.FC<{ hasVariants: boolean }> = ({ hasVariants }) => {
  const [mode, setMode] = useState<QualityMode>(getQualityMode);
  useEffect(() => {
    const h = () => setMode(getQualityMode());
    window.addEventListener(QUALITY_EVENT, h);
    return () => window.removeEventListener(QUALITY_EVENT, h);
  }, []);
  return (
    <button
      onClick={() => setQualityMode(NEXT[mode])}
      title={hasVariants ? 'Качество звука: Авто подстраивается под интернет' : 'У этой станции один поток'}
      className={`${hasVariants ? '' : 'opacity-50 '}ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border align-middle ${
        mode === 'saver' ? 'bg-amber-500/15 text-amber-200 border-amber-500/40' : mode === 'high' ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40' : 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40'
      }`}
    >
      {LABEL[mode]}
    </button>
  );
};
