import { useState, useEffect, useCallback } from 'react';
import { Station } from '../types/radio';

const CUSTOM_STATIONS_KEY = 'slynet_custom_stations_v1';

const INITIAL_DEMO_CUSTOM: Station[] = [
  {
    stationuuid: 'custom-slynet-exclusive',
    name: 'SlyNet Ultra Beats (Exclusive)',
    url: 'https://dancewave.online/dance.mp3',
    url_resolved: 'https://dancewave.online/dance.mp3',
    tags: 'dance,electronic,exclusive,club',
    country: 'SlyNet Cloud',
    countrycode: 'SN',
    codec: 'MP3',
    bitrate: 320,
    clickcount: 99999,
    votes: 8888,
    isCustom: true,
  },
];

export function useCustomStations() {
  const [customStations, setCustomStations] = useState<Station[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_STATIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load custom stations', e);
    }
    return INITIAL_DEMO_CUSTOM;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_STATIONS_KEY, JSON.stringify(customStations));
    } catch (e) {
      console.warn('Failed to save custom stations', e);
    }
  }, [customStations]);

  const addCustomStation = useCallback(
    (station: {
      name: string;
      url: string;
      tags?: string;
      country?: string;
      countrycode?: string;
      bitrate?: number;
      codec?: string;
      favicon?: string;
    }) => {
      const newStation: Station = {
        stationuuid: `custom-${Date.now()}`,
        name: station.name.trim(),
        url: station.url.trim(),
        url_resolved: station.url.trim(),
        tags: station.tags?.trim() || 'custom,radio',
        country: station.country?.trim() || 'Custom',
        countrycode: (station.countrycode?.trim() || 'SN').toUpperCase().slice(0, 3),
        bitrate: station.bitrate || 320,
        codec: station.codec || 'MP3',
        favicon: station.favicon?.trim() || '',
        isCustom: true,
        clickcount: 1000,
      };

      setCustomStations((prev) => [newStation, ...prev]);
      return newStation;
    },
    []
  );

  const deleteCustomStation = useCallback((stationuuid: string) => {
    setCustomStations((prev) => prev.filter((s) => s.stationuuid !== stationuuid));
  }, []);

  return {
    customStations,
    addCustomStation,
    deleteCustomStation,
  };
}
