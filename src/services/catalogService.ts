import { DATA_BASE } from '../utils/platform';
/**
 * Проверенный каталог (public/catalog.json), который каждый день собирает робот GitHub
 * (scripts/build-catalog.mjs). Если файла ещё нет — сайт работает «вживую» без него.
 */
import { Station } from '../types/radio';

export interface CatalogTvChannel {
  id: string;
  name: string;
  country: string;
  categories: string[];
  website: string;
  logo: string;
  stream: string;
  quality: string;
}

export interface Catalog {
  generatedAt: string | null;
  artists: Record<string, Station[]>;
  series: Station[];
  tv: CatalogTvChannel[];
  deadLinks: string[];
  exclusive?: { id: string; name: string; note: string; stations: Station[] }[];
}

const EMPTY: Catalog = { generatedAt: null, artists: {}, series: [], tv: [], deadLinks: [] };
let promise: Promise<Catalog> | null = null;

export function loadCatalog(): Promise<Catalog> {
  if (!promise) {
    promise = fetch(`${DATA_BASE}catalog.json?d=${new Date().toISOString().slice(0, 13)}`)
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((j) => ({ ...EMPTY, ...j }))
      .catch(() => EMPTY);
  }
  return promise;
}

/** Каталог уже собирался роботом хотя бы раз */
export const isCatalogReady = (c: Catalog) => !!c.generatedAt;
