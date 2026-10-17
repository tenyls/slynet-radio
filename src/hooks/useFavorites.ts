import { useState, useEffect, useCallback } from 'react';
import { Station } from '../types/radio';

const FAVORITES_STORAGE_KEY = 'pcradio_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Station[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to persist favorites to localStorage', e);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (stationuuid: string) => {
      return favorites.some((s) => s.stationuuid === stationuuid);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((station: Station) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.stationuuid === station.stationuuid);
      if (exists) {
        return prev.filter((s) => s.stationuuid !== station.stationuuid);
      } else {
        return [station, ...prev];
      }
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
  };
}
