import { ThemeOption } from '../types/radio';

export const THEMES: ThemeOption[] = [
  {
    id: 'slynet-original',
    name: 'SlyNet Original (Cyan-Lime)',
    hex: '#10b981',
    hoverHex: '#059669',
    previewGradient: 'from-cyan-500 via-emerald-500 to-lime-400',
    badge: 'По умолчанию',
  },
  {
    id: 'cyber-red',
    name: 'SlyNet Cyber Red',
    hex: '#f43f5e',
    hoverHex: '#e11d48',
    previewGradient: 'from-rose-600 to-pink-600',
    badge: 'Кибер-рубин',
  },
  {
    id: 'neon-purple',
    name: 'Neon Purple',
    hex: '#a855f7',
    hoverHex: '#9333ea',
    previewGradient: 'from-purple-600 to-fuchsia-600',
    badge: 'Киберпанк',
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    hex: '#06b6d4',
    hoverHex: '#0891b2',
    previewGradient: 'from-cyan-500 to-blue-600',
    badge: 'Неон блюз',
  },
  {
    id: 'gold-vip',
    name: 'Gold VIP',
    hex: '#f59e0b',
    hoverHex: '#d97706',
    previewGradient: 'from-amber-500 to-yellow-600',
    badge: 'Люкс',
  },
];
