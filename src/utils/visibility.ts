import { SlyNetSettings } from '../types/radio';

/** Разделы, которые владелец может выключить в админке («Видимость») */
export const TOGGLABLE_SECTIONS: { id: string; label: string }[] = [
  { id: 'artists', label: '🎤 Артисты и саундтреки' },
  { id: 'genres', label: '🎵 Жанры' },
  { id: 'moods', label: '✨ Настроение' },
  { id: 'webcams', label: '📷 Веб-камеры' },
  { id: 'tv', label: '📺 Телеканалы' },
  { id: 'search', label: '🔍 Поиск' },
  { id: 'history', label: '🕘 История' },
  { id: 'pro', label: '👑 Оформление' },
  { id: 'apps', label: '📱 Mobile Apps' },
];

export const isSectionHidden = (s: Pick<SlyNetSettings, 'hiddenSections'>, id: string) =>
  (s.hiddenSections || []).includes(id);

export type CountryScope = 'radio' | 'tv' | 'webcams';
export const hiddenCountrySet = (s: Pick<SlyNetSettings, 'hiddenCountries'>, scope: CountryScope) =>
  new Set((s.hiddenCountries?.[scope] || []).map((c) => c.toUpperCase()));
