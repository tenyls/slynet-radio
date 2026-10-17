import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SlyNetSettings, ThemeId } from '../types/radio';
import { isOwnerMode } from '../utils/owner';
import { setApiBase } from '../services/apiService';
import { setHiddenRadioCountries } from '../services/radioApi';
import { setDefaultViewMode } from '../hooks/useViewMode';

/** Личные настройки посетителя (тема, язык) — хранятся только на его устройстве. */
export const SETTINGS_KEY = 'slynet_user_prefs_v3';
/** Черновик владельца: правки из Админ-панели до публикации content.json. */
export const ADMIN_DRAFT_KEY = 'slynet_admin_draft_v1';

/** Поля контента сайта. Источник — файл public/content.json (одинаков для всех посетителей). */
export const SITE_FIELDS = [
  'appTitle',
  'appSubtitle',
  'customLogoUrl',
  'telegramUrl',
  'customLinks',
  'customWebcams',
  'customStations',
  'customTvChannels',
  'featuredStation',
  'contactEmail',
  'apiUrl',
  'hiddenSections',
  'hiddenCountries',
  'defaultViewMode',
  'partners',
  'adminLock',
  'legalContact',
  'heroTitle',
  'heroSubtitle',
  'appVersion',
  'versionChangelog',
  'dmcaPolicy',
] as const;
type SiteField = (typeof SITE_FIELDS)[number];
export type SiteContent = Partial<Pick<SlyNetSettings, SiteField>>;

const USER_FIELDS = ['isPro', 'activeTheme', 'language'] as const;

export const APP_VERSION = 'v0.9.0';

export const DEFAULT_SETTINGS: SlyNetSettings = {
  appTitle: 'SlyNet Radio',
  appSubtitle: 'Радио со всего мира',
  customLogoUrl: './logo.png',
  telegramUrl: 'https://t.me/slynet_radio',
  customLinks: [
    { id: '1', title: 'Telegram Канал', url: 'https://t.me/slynet_radio' },
    { id: '2', title: 'Чат / Поддержка', url: 'https://t.me/slynet_support' },
  ],
  customWebcams: [],
  customStations: [],
  customTvChannels: [],
  hiddenSections: [],
  hiddenCountries: { radio: [], tv: ['RU'], webcams: [] },
  isPro: false,
  activeTheme: 'slynet-original',
  language: 'ru',
  heroTitle: 'SlyNet Radio',
  appVersion: APP_VERSION,
  versionChangelog: '',
  dmcaPolicy:
    'SlyNet Radio — программный интернет-тюнер и каталог публичных радиопотоков и открытых веб-камер. Приложение не хранит, не ретранслирует и не изменяет аудио- и видеоматериалы: все потоки воспроизводятся напрямую с серверов вещателей, каталог станций — открытая база Radio Browser.\n\nВаши настройки (избранное, тема, язык) хранятся только на вашем устройстве.\n\nЕсли вы правообладатель или представитель вещателя и хотите изменить или удалить поток, напишите нам через официальный Telegram-канал.',
};

function pick<T extends object>(obj: any, keys: readonly string[]): Partial<T> {
  const out: any = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function readJson(key: string): any {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

/** Только проверенные поля из content.json, чтобы битый файл не уронил сайт. */
export function sanitizeSiteContent(raw: any): SiteContent {
  const c: any = pick(raw, SITE_FIELDS as unknown as string[]);
  if (c.hiddenCountries && typeof c.hiddenCountries !== 'object') delete c.hiddenCountries;
  for (const k of ['customLinks', 'customWebcams', 'customStations', 'customTvChannels', 'partners', 'hiddenSections']) {
    if (c[k] !== undefined && !Array.isArray(c[k])) delete c[k];
  }
  for (const k of ['apiUrl', 'adminLock', 'contactEmail', 'legalContact', 'appTitle', 'appSubtitle', 'customLogoUrl', 'telegramUrl', 'heroTitle', 'heroSubtitle', 'appVersion', 'versionChangelog', 'dmcaPolicy']) {
    if (c[k] !== undefined && typeof c[k] !== 'string') delete c[k];
  }
  const fs = c.featuredStation;
  if (fs !== undefined && fs !== null && !(typeof fs === 'object' && fs.name && (fs.url_resolved || fs.url))) delete c.featuredStation;
  // Версию задаёт код, а не файл контента
  delete c.appVersion;
  return c;
}

/** Собирает content.json из текущих настроек (для кнопки «Скачать content.json»). */
export function buildSiteContent(settings: SlyNetSettings): SiteContent {
  const c = pick<SiteContent>(settings, SITE_FIELDS as unknown as string[]);
  delete (c as any).appVersion;
  return c;
}

export function optimizeImageFile(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Failed to read file'));
        return;
      }
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size < 250 * 1024) {
          resolve(src);
          return;
        }
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.92);
        resolve(dataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

interface SlyNetSettingsContextType {
  settings: SlyNetSettings;
  customLogoUrl: string;
  updateSettings: (updates: Partial<SlyNetSettings>) => void;
  updateLogo: (base64OrUrl: string) => void;
  resetLogo: () => void;
  /** Контент сайта из опубликованного content.json (без черновика владельца) */
  publishedContent: SiteContent;
  /** Есть ли неопубликованные правки владельца */
  hasDraft: boolean;
  discardDraft: () => void;
  togglePro: () => void;
  setTheme: (themeId: ThemeId) => void;
  setLanguage: (lang: import('../types/radio').Language) => void;
}

const SlyNetSettingsContext = createContext<SlyNetSettingsContextType | null>(null);

export const SlyNetSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [published, setPublished] = useState<SiteContent>({});
  const [draft, setDraft] = useState<SiteContent>(() =>
    isOwnerMode ? sanitizeSiteContent(readJson(ADMIN_DRAFT_KEY)) : {}
  );
  const [userPrefs, setUserPrefs] = useState<Partial<SlyNetSettings>>(() =>
    pick<SlyNetSettings>(readJson(SETTINGS_KEY), USER_FIELDS as unknown as string[])
  );

  // Опубликованный контент сайта
  useEffect(() => {
    let cancelled = false;
    fetch(`./content.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((json) => {
        if (!cancelled) setPublished(sanitizeSiteContent(json));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const settings: SlyNetSettings = {
    ...DEFAULT_SETTINGS,
    ...published,
    ...draft,
    ...userPrefs,
    appVersion: APP_VERSION,
  } as SlyNetSettings;
  if (!settings.customLogoUrl) settings.customLogoUrl = DEFAULT_SETTINGS.customLogoUrl;
  setApiBase(settings.apiUrl);
  setHiddenRadioCountries(settings.hiddenCountries?.radio || []);
  setDefaultViewMode(settings.defaultViewMode);

  // Тема
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.activeTheme || 'slynet-original');
  }, [settings.activeTheme]);

  // Сохраняем только личные настройки
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(userPrefs));
    } catch {}
  }, [userPrefs]);

  // Черновик владельца
  useEffect(() => {
    if (!isOwnerMode) return;
    try {
      if (Object.keys(draft).length) localStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(draft));
      else localStorage.removeItem(ADMIN_DRAFT_KEY);
    } catch (e) {
      console.warn('Черновик слишком большой для хранилища браузера', e);
    }
  }, [draft]);

  const updateSettings = useCallback((updates: Partial<SlyNetSettings>) => {
    const user = pick<SlyNetSettings>(updates, USER_FIELDS as unknown as string[]);
    const site = pick<SiteContent>(updates, SITE_FIELDS as unknown as string[]);
    delete (site as any).appVersion;
    if (Object.keys(user).length) setUserPrefs((p) => ({ ...p, ...user }));
    // Контент сайта меняет только владелец (и только в своём черновике)
    if (isOwnerMode && Object.keys(site).length) setDraft((p) => ({ ...p, ...site }));
  }, []);

  const updateLogo = useCallback(
    (base64OrUrl: string) => updateSettings({ customLogoUrl: base64OrUrl || DEFAULT_SETTINGS.customLogoUrl }),
    [updateSettings]
  );

  const resetLogo = useCallback(() => updateSettings({ customLogoUrl: DEFAULT_SETTINGS.customLogoUrl }), [updateSettings]);

  const discardDraft = useCallback(() => setDraft({}), []);

  const togglePro = useCallback(() => {
    setUserPrefs((prev) => ({ ...prev, isPro: !prev.isPro }));
  }, []);

  const setTheme = useCallback((themeId: ThemeId) => {
    setUserPrefs((prev) => ({ ...prev, activeTheme: themeId }));
  }, []);

  const setLanguage = useCallback((language: import('../types/radio').Language) => {
    setUserPrefs((prev) => ({ ...prev, language }));
  }, []);

  return (
    <SlyNetSettingsContext.Provider
      value={{
        settings,
        customLogoUrl: settings.customLogoUrl,
        updateSettings,
        updateLogo,
        resetLogo,
        publishedContent: published,
        hasDraft: Object.keys(draft).length > 0,
        discardDraft,
        togglePro,
        setTheme,
        setLanguage,
      }}
    >
      {children}
    </SlyNetSettingsContext.Provider>
  );
};

export function useSlyNetSettings() {
  const context = useContext(SlyNetSettingsContext);
  if (!context) {
    return {
      settings: { ...DEFAULT_SETTINGS },
      customLogoUrl: DEFAULT_SETTINGS.customLogoUrl,
      updateSettings: () => {},
      updateLogo: () => {},
      resetLogo: () => {},
      publishedContent: {},
      hasDraft: false,
      discardDraft: () => {},
      togglePro: () => {},
      setTheme: () => {},
      setLanguage: () => {},
    } as SlyNetSettingsContextType;
  }
  return context;
}
