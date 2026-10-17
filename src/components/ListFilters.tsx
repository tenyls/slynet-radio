import React from 'react';
import { CountrySelect } from './CountrySelect';
import { GENRES } from '../constants/genres';
import { GenreCategory } from '../types/radio';

interface Props {
  country: string;
  onCountry: (cc: string) => void;
  genreId?: string;
  onGenre: (g: GenreCategory | null) => void;
}

/** Быстрые фильтры прямо над списком станций: страна + жанр */
export const ListFilters: React.FC<Props> = ({ country, onCountry, genreId, onGenre }) => (
  <div className="flex flex-wrap items-center gap-2">
    <CountrySelect selectedCountry={country} onSelectCountry={onCountry} placeholder="Страна" />
    <label className="relative">
      <span className="sr-only">Жанр</span>
      <select
        value={genreId && genreId !== 'popular' ? genreId : ''}
        onChange={(e) => onGenre(GENRES.find((g) => g.id === e.target.value) || null)}
        className="appearance-none bg-zinc-900/90 hover:bg-zinc-800 text-xs font-semibold text-zinc-100 pl-3 pr-8 py-2.5 rounded-xl border border-zinc-800 focus:border-emerald-400 focus:outline-none max-w-[60vw] sm:max-w-none"
      >
        <option value="">🎵 Все жанры</option>
        {GENRES.filter((g) => g.tag).map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px]">▼</span>
    </label>
  </div>
);
