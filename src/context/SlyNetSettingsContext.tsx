import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SlyNetSettings, ThemeId } from '../types/radio';

export const SETTINGS_KEY = 'slynet_settings_v2';
export const PERMANENT_LOGO_KEY = 'slynet_permanent_logo';

const DEFAULT_SETTINGS: SlyNetSettings = {
  appTitle: 'SlyNet Radio',
  appSubtitle: 'Global 1000+ Radio Hub & World Webcams',
  customLogoUrl: '',
  telegramUrl: 'https://t.me/slynet_radio',
  customLinks: [
    { id: '1', title: 'Telegram Канал', url: 'https://t.me/slynet_radio' },
    { id: '2', title: 'Чат / Поддержка', url: 'https://t.me/slynet_support' },
  ],
  adminPin: '1234',
  isPro: false,
  activeTheme: 'slynet-original',
  language: 'ru',
  heroTitle: 'SlyNet Radio',
  appVersion: 'v0.8.6',
  versionChangelog: 'Версия 0.8.6: Умный фильтр RDS и Shazam (сохранение только реальных проверенных песен с исполнителем), каталог «Исполнители & Группы (A–Z)» и «Саундтреки OST 24/7», точный выбор стран без сбоев (до 200 станций на страну, кнопка Закрыть и Esc), быстрая регистрация без Email (Логин + Пароль + QR-код), строгий PIN админки, 50+ проверенных веб-камер мира без черных окон.',
  dmcaPolicy: 'SlyNet Radio является свободным программным интернет-тюнером и агрегатором публичных радиовещательных потоков и открытых веб-камер. Приложение не хранит, не ретранслирует и не изменяет аудио- и видеоматериалы на своих серверах. Все аудиопотоки воспроизводятся напрямую из открытой базы Radio Browser API.\n\nВсе персональные настройки (избранные станции, кастомный логотип, темы) сохраняются исключительно в локальном хранилище вашего браузера (localStorage).\n\nЕсли вы являетесь правообладателем или представителем вещателя и хотите обновить метаданные или удалить поток из каталога, направьте официальный запрос разработчикам SlyNet Radio через наш официальный Telegram-канал.',
};

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
  togglePro: () => void;
  setTheme: (themeId: ThemeId) => void;
  setLanguage: (lang: import('../types/radio').Language) => void;
}

const SlyNetSettingsContext = createContext<SlyNetSettingsContextType | null>(null);

export const SlyNetSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SlyNetSettings>(() => {
    let initial = { ...DEFAULT_SETTINGS };
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        initial = { ...initial, ...JSON.parse(saved) };
      }
      const permanentLogo = localStorage.getItem(PERMANENT_LOGO_KEY);
      if (permanentLogo) {
        initial.customLogoUrl = permanentLogo;
      }
      // Ensure custom links migration
      if (!initial.customLinks || initial.customLinks.length === 0) {
        initial.customLinks = DEFAULT_SETTINGS.customLinks;
      }
      // Version bump to v0.8.5
      if (!initial.appVersion || initial.appVersion !== 'v0.8.5') {
        initial.appVersion = 'v0.8.5';
        initial.versionChangelog = DEFAULT_SETTINGS.versionChangelog;
      }
      // Clean up any legacy fields
      ['telegram' + 'Ip' + 'tv' + 'Url'].forEach((k) => delete (initial as any)[k]);
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return initial;
  });

  // Apply active theme to DOM root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.activeTheme || 'slynet-original');
  }, [settings.activeTheme]);

  // Persist settings (without bloating with huge strings if possible)
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Listen to external logo changes across tabs or instances
  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent && customEvent.detail !== undefined) {
        setSettings((prev) => {
          if (prev.customLogoUrl === customEvent.detail) return prev;
          return { ...prev, customLogoUrl: customEvent.detail };
        });
      }
    };

    window.addEventListener('slynet_logo_changed', handleLogoUpdate);
    return () => window.removeEventListener('slynet_logo_changed', handleLogoUpdate);
  }, []);

  const updateSettings = useCallback((updates: Partial<SlyNetSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.customLogoUrl !== undefined) {
        try {
          if (updates.customLogoUrl) {
            localStorage.setItem(PERMANENT_LOGO_KEY, updates.customLogoUrl);
          } else {
            localStorage.removeItem(PERMANENT_LOGO_KEY);
          }
          window.dispatchEvent(
            new CustomEvent('slynet_logo_changed', { detail: updates.customLogoUrl || '' })
          );
        } catch (e) {
          console.warn('Failed to persist permanent logo', e);
        }
      }
      return next;
    });
  }, []);

  const updateLogo = useCallback((base64OrUrl: string) => {
    try {
      if (base64OrUrl) {
        localStorage.setItem(PERMANENT_LOGO_KEY, base64OrUrl);
      } else {
        localStorage.removeItem(PERMANENT_LOGO_KEY);
      }
      window.dispatchEvent(
        new CustomEvent('slynet_logo_changed', { detail: base64OrUrl || '' })
      );
    } catch (e) {
      console.warn('Failed to persist permanent logo', e);
    }
    setSettings((prev) => ({ ...prev, customLogoUrl: base64OrUrl }));
  }, []);

  const resetLogo = useCallback(() => {
    try {
      localStorage.removeItem(PERMANENT_LOGO_KEY);
      window.dispatchEvent(new CustomEvent('slynet_logo_changed', { detail: '' }));
    } catch {}
    setSettings((prev) => ({ ...prev, customLogoUrl: '' }));
  }, []);

  const togglePro = useCallback(() => {
    setSettings((prev) => ({ ...prev, isPro: !prev.isPro }));
  }, []);

  const setTheme = useCallback((themeId: ThemeId) => {
    setSettings((prev) => ({ ...prev, activeTheme: themeId }));
  }, []);

  const setLanguage = useCallback((language: import('../types/radio').Language) => {
    setSettings((prev) => ({ ...prev, language }));
  }, []);

  return (
    <SlyNetSettingsContext.Provider
      value={{
        settings,
        customLogoUrl: settings.customLogoUrl,
        updateSettings,
        updateLogo,
        resetLogo,
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
    // Graceful fallback if called outside provider (e.g. initial setup)
    let fallbackLogo = '';
    try {
      fallbackLogo = localStorage.getItem(PERMANENT_LOGO_KEY) || '';
    } catch {}
    return {
      settings: { ...DEFAULT_SETTINGS, customLogoUrl: fallbackLogo },
      customLogoUrl: fallbackLogo,
      updateSettings: () => {},
      updateLogo: () => {},
      resetLogo: () => {},
      togglePro: () => {},
      setTheme: () => {},
      setLanguage: () => {},
    };
  }
  return context;
}
