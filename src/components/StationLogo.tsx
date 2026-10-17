import React, { useState } from 'react';

/** Цвета «буквенной» обложки — стабильные для каждой станции */
const PALETTE = [
  ['#10b981', '#0e7490'],
  ['#6366f1', '#0ea5e9'],
  ['#f43f5e', '#f97316'],
  ['#a855f7', '#ec4899'],
  ['#84cc16', '#10b981'],
  ['#f59e0b', '#ef4444'],
  ['#06b6d4', '#3b82f6'],
  ['#14b8a6', '#65a30d'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** «Русское Радио: Русский Рок» → «РР», «DFM - Party» → «DP» */
export function initials(name: string) {
  const words = (name || '?')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(radio|радио|fm|the)$/i.test(w));
  const pick = words.length ? words : (name || '?').split(/\s+/);
  return (pick[0]?.[0] || '?').toUpperCase() + (pick[1]?.[0] || pick[0]?.[1] || '').toUpperCase();
}

/** Логотип станции: картинка, а если её нет или она не грузится — цветной значок с буквами */
export const StationLogo: React.FC<{ favicon?: string; name: string; className?: string; textClass?: string }> = ({
  favicon,
  name,
  className = 'w-full h-full',
  textClass = 'text-sm',
}) => {
  const [failed, setFailed] = useState(false);
  // На https-странице http-картинки блокируются — пробуем https-версию
  const src = favicon && /^https?:\/\//.test(favicon) ? favicon.replace(/^http:\/\//, 'https://') : '';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );
  }
  const [a, b] = PALETTE[hash(name || '') % PALETTE.length];
  return (
    <span
      className={`${className} flex items-center justify-center font-extrabold text-white select-none ${textClass}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
};
