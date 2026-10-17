import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  Upload,
  Radio,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Send,
  Copy,
  Download,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit3,
  Shield,
  Layers,
  Video,
  HardDrive,
  Database,
  Globe,
} from 'lucide-react';
import { SlyNetSettings, Station, CustomSocialLink, WebcamCity } from '../types/radio';
import { SlyNetLogo } from './SlyNetLogo';
import { optimizeImageFile } from '../context/SlyNetSettingsContext';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SlyNetSettings;
  onUpdateSettings: (updates: Partial<SlyNetSettings>) => void;
  onResetLogo: () => void;
  customStations: Station[];
  onAddCustomStation: (station: {
    name: string;
    url: string;
    tags?: string;
    country?: string;
    countrycode?: string;
    bitrate?: number;
    codec?: string;
    favicon?: string;
  }) => void;
  onDeleteCustomStation: (uuid: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetLogo,
  customStations,
  onAddCustomStation,
  onDeleteCustomStation,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'brand' | 'cms' | 'webcams' | 'backup' | 'scanner' | 'stations'>('brand');

  // Brand edit state
  const [appSubtitle, setAppSubtitle] = useState(settings.appSubtitle);
  const [newAdminPin, setNewAdminPin] = useState(settings.adminPin);
  const [logoUrlInput, setLogoUrlInput] = useState(settings.customLogoUrl || '');
  const [logoPreview, setLogoPreview] = useState(settings.customLogoUrl || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // CMS state
  const [appVersion, setAppVersion] = useState(settings.appVersion || 'v0.8.6');
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || settings.appTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || settings.appSubtitle);
  const [telegramUrl, setTelegramUrl] = useState(settings.telegramUrl || 'https://t.me/slynet_radio');
  const [customLinks, setCustomLinks] = useState<CustomSocialLink[]>(
    settings.customLinks && settings.customLinks.length > 0
      ? settings.customLinks
      : [
          { id: '1', title: 'Telegram Канал', url: 'https://t.me/slynet_radio' },
          { id: '2', title: 'Чат / Поддержка', url: 'https://t.me/slynet_support' },
        ]
  );
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [versionChangelog, setVersionChangelog] = useState(
    settings.versionChangelog ||
      'Версия 0.8.6: Умный фильтр RDS и Shazam (сохранение только реальных проверенных песен с исполнителем), каталог «Исполнители & Группы (A–Z)» и «Саундтреки OST 24/7», точный выбор стран без сбоев (до 200 станций на страну, кнопка Закрыть и Esc), быстрая регистрация без Email (Логин + Пароль + QR-код), строгий PIN админки, 50+ проверенных веб-камер мира без черных окон.'
  );
  const [dmcaPolicy, setDmcaPolicy] = useState(
    settings.dmcaPolicy ||
      'SlyNet Radio является свободным программным интернет-тюнером и агрегатором публичных радиовещательных потоков и открытых веб-камер. Приложение не хранит, не ретранслирует и не изменяет аудио- и видеоматериалы на своих серверах. Все аудиопотоки воспроизводятся напрямую из открытой базы Radio Browser API.\n\nВсе персональные настройки (избранные станции, кастомный логотип, темы) сохраняются исключительно в локальном хранилище вашего браузера (localStorage).\n\nЕсли вы являетесь правообладателем или представителем вещателя и хотите обновить метаданные или удалить поток из каталога, направьте официальный запрос разработчикам SlyNet Radio через наш официальный Telegram-канал.'
  );
  const [cmsSavedNotice, setCmsSavedNotice] = useState(false);

  // Custom Webcams State
  const [customWebcams, setCustomWebcams] = useState<WebcamCity[]>(
    settings.customWebcams || []
  );
  const [newCamName, setNewCamName] = useState('');
  const [newCamCountry, setNewCamCountry] = useState('Россия');
  const [newCamFlag, setNewCamFlag] = useState('🇷🇺');
  const [newCamStreamUrl, setNewCamStreamUrl] = useState('');
  const [newCamPortalUrl, setNewCamPortalUrl] = useState('');
  const [newCamTagline, setNewCamTagline] = useState('Прямая трансляция открытой камеры');
  const [newCamCategory, setNewCamCategory] = useState<'city' | 'beach' | 'space' | 'nature' | 'landmark'>('city');
  const [camAddedNotice, setCamAddedNotice] = useState(false);

  // Backup State
  const [backupDownloadNotice, setBackupDownloadNotice] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const item: CustomSocialLink = {
      id: Date.now().toString(),
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
    };
    setCustomLinks((prev) => [...prev, item]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleDeleteLink = (id: string) => {
    setCustomLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLink = (id: string, field: 'title' | 'url', val: string) => {
    setCustomLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // New station form state
  const [newStationName, setNewStationName] = useState('');
  const [newStationUrl, setNewStationUrl] = useState('');
  const [newStationTags, setNewStationTags] = useState('dance, electronic');
  const [newStationCountry, setNewStationCountry] = useState('SlyNet Cloud');
  const [newStationCountryCode, setNewStationCountryCode] = useState('SN');
  const [newStationBitrate, setNewStationBitrate] = useState(320);
  const [newStationFavicon, setNewStationFavicon] = useState('');
  const [stationAddedNotice, setStationAddedNotice] = useState(false);

  // Stream Scanner state
  const [scannerResults, setScannerResults] = useState<
    Array<{ uuid: string; name: string; url: string; status: 'pending' | 'ok' | 'broken'; errorMsg?: string }>
  >([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // PIN check: strict comparison against settings.adminPin (fallback to '1234' only if user hasn't set custom PIN)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveAdminPin = (settings.adminPin && settings.adminPin.trim()) ? settings.adminPin.trim() : '1234';
    if (enteredPin.trim() === effectiveAdminPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Image file upload handler with canvas optimization
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения (PNG, JPG, WebP, SVG)');
      return;
    }

    try {
      const base64 = await optimizeImageFile(file, 512);
      setLogoPreview(base64);
      setLogoUrlInput(base64);
      onUpdateSettings({ customLogoUrl: base64 });
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setLogoPreview(base64);
          setLogoUrlInput(base64);
          onUpdateSettings({ customLogoUrl: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLogo = () => {
    if (logoPreview) {
      navigator.clipboard.writeText(logoPreview);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  const handleDownloadLogo = () => {
    if (logoPreview) {
      const link = document.createElement('a');
      link.href = logoPreview;
      link.download = 'slynet-radio-logo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveBrandSettings = () => {
    try {
      if (logoUrlInput) {
        localStorage.setItem('slynet_permanent_logo', logoUrlInput);
        window.dispatchEvent(new CustomEvent('slynet_logo_changed', { detail: logoUrlInput }));
      }
    } catch {}
    onUpdateSettings({
      appSubtitle,
      adminPin: newAdminPin || '1234',
      customLogoUrl: logoUrlInput,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSaveCms = () => {
    onUpdateSettings({
      heroTitle,
      heroSubtitle,
      telegramUrl,
      customLinks,
      appVersion,
      versionChangelog,
      dmcaPolicy,
    });
    setCmsSavedNotice(true);
    setTimeout(() => setCmsSavedNotice(false), 2500);
  };

  // Custom Webcams handlers
  const handleAddCamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName.trim() || !newCamStreamUrl.trim()) return;

    const newCam: WebcamCity = {
      id: `custom-cam-${Date.now()}`,
      name: newCamName.trim(),
      country: newCamCountry.trim(),
      countryCode: 'SN',
      flag: newCamFlag.trim() || '📹',
      lat: 0,
      lng: 0,
      tagline: newCamTagline.trim() || 'Прямая трансляция открытой веб-камеры',
      videoType: 'live-snapshot',
      streamUrl: newCamStreamUrl.trim(),
      directPortalUrl: newCamPortalUrl.trim() || newCamStreamUrl.trim(),
      thumbnail: newCamStreamUrl.trim(),
      category: newCamCategory,
      liveViews: 'HD Live',
      isCustom: true,
    };

    const updated = [newCam, ...customWebcams];
    setCustomWebcams(updated);
    onUpdateSettings({ customWebcams: updated });
    setNewCamName('');
    setNewCamStreamUrl('');
    setNewCamPortalUrl('');
    setCamAddedNotice(true);
    setTimeout(() => setCamAddedNotice(false), 2500);
  };

  const handleDeleteCam = (id: string) => {
    const updated = customWebcams.filter((c) => c.id !== id);
    setCustomWebcams(updated);
    onUpdateSettings({ customWebcams: updated });
  };

  // 💾 FULL SERVER/SITE BACKUP (.JSON)
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        meta: {
          app: 'SlyNet Radio',
          version: appVersion || 'v0.8.3',
          exportedAt: new Date().toISOString(),
          type: 'full-server-site-backup',
        },
        settings: {
          ...settings,
          appVersion,
          heroTitle,
          heroSubtitle,
          customLinks,
          dmcaPolicy,
          versionChangelog,
          customWebcams,
        },
        customStations: customStations || [],
        customWebcams: customWebcams || [],
        clientStorage: {
          favorites: localStorage.getItem('slynet_favorites_v1'),
          history: localStorage.getItem('slynet_play_history_v1'),
          permanentLogo: localStorage.getItem('slynet_permanent_logo'),
          eqSettings: localStorage.getItem('slynet_eq_settings_v1'),
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `slynet-radio-full-backup-${appVersion || 'v0.8.3'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupDownloadNotice(true);
      setTimeout(() => setBackupDownloadNotice(false), 3000);
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Не удалось создать файл бэкапа');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreNotice(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || (!data.settings && !data.meta)) {
          throw new Error('Некорректный формат файла бэкапа SlyNet Radio');
        }

        const restoredSettings = data.settings || {};
        if (restoredSettings.customLinks) setCustomLinks(restoredSettings.customLinks);
        if (restoredSettings.customWebcams) setCustomWebcams(restoredSettings.customWebcams);
        if (restoredSettings.appVersion) setAppVersion(restoredSettings.appVersion);
        if (restoredSettings.dmcaPolicy) setDmcaPolicy(restoredSettings.dmcaPolicy);
        if (restoredSettings.heroTitle) setHeroTitle(restoredSettings.heroTitle);
        if (restoredSettings.heroSubtitle) setHeroSubtitle(restoredSettings.heroSubtitle);
        if (restoredSettings.customLogoUrl) {
          setLogoPreview(restoredSettings.customLogoUrl);
          setLogoUrlInput(restoredSettings.customLogoUrl);
        }

        // Restore custom stations if present
        if (Array.isArray(data.customStations) && data.customStations.length > 0) {
          localStorage.setItem('slynet_custom_stations_v1', JSON.stringify(data.customStations));
        }

        // Restore client storage if present
        if (data.clientStorage) {
          if (data.clientStorage.favorites) {
            localStorage.setItem('slynet_favorites_v1', data.clientStorage.favorites);
          }
          if (data.clientStorage.permanentLogo) {
            localStorage.setItem('slynet_permanent_logo', data.clientStorage.permanentLogo);
          }
        }

        onUpdateSettings(restoredSettings);

        setRestoreNotice(
          `✓ Сайт успешно восстановлен из бэкапа (${restoredSettings.appVersion || 'v0.8.3'})! Восстановлены тексты CMS, ссылки, радиостанции и веб-камеры.`
        );
      } catch (err: any) {
        setRestoreError(`Ошибка восстановления: ${err.message || 'Не удалось прочитать JSON'}`);
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) {
      backupFileInputRef.current.value = '';
    }
  };

  const handleAddStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim() || !newStationUrl.trim()) return;

    onAddCustomStation({
      name: newStationName.trim(),
      url: newStationUrl.trim(),
      tags: newStationTags.trim(),
      country: newStationCountry.trim(),
      countrycode: newStationCountryCode.trim().toUpperCase(),
      bitrate: Number(newStationBitrate) || 320,
      codec: 'MP3',
      favicon: newStationFavicon.trim(),
    });

    setNewStationName('');
    setNewStationUrl('');
    setNewStationFavicon('');
    setStationAddedNotice(true);
    setTimeout(() => setStationAddedNotice(false), 2500);
  };

  // Stream link scanner
  const runStreamScanner = async () => {
    // Gather stations to test: custom stations first, plus stations from favorites
    const favsStr = localStorage.getItem('slynet_radio_favorites');
    const favs: Station[] = favsStr ? JSON.parse(favsStr) : [];
    const stationsToTest = [...customStations, ...favs].slice(0, 30);

    if (stationsToTest.length === 0) {
      alert('Нет пользовательских станций или избранного для сканирования. Добавьте станцию или добавьте станции в избранное!');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    const initialList = stationsToTest.map((s) => ({
      uuid: s.stationuuid,
      name: s.name,
      url: s.url_resolved || s.url,
      status: 'pending' as const,
    }));
    setScannerResults(initialList);

    for (let i = 0; i < stationsToTest.length; i++) {
      const s = stationsToTest[i];
      const streamUrl = s.url_resolved || s.url;

      try {
        const isAlive = await probeAudioStream(streamUrl);
        setScannerResults((prev) =>
          prev.map((item) =>
            item.uuid === s.stationuuid
              ? { ...item, status: isAlive ? 'ok' : 'broken', errorMsg: isAlive ? undefined : 'Поток недоступен или тайм-аут' }
              : item
          )
        );
      } catch (e: any) {
        setScannerResults((prev) =>
          prev.map((item) =>
            item.uuid === s.stationuuid
              ? { ...item, status: 'broken', errorMsg: e?.message || 'Ошибка сети' }
              : item
          )
        );
      }

      setScanProgress(Math.round(((i + 1) / stationsToTest.length) * 100));
    }

    setIsScanning(false);
  };

  const probeAudioStream = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      let done = false;
      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          audio.src = '';
          resolve(false);
        }
      }, 4500);

      audio.oncanplay = () => {
        if (!done) {
          done = true;
          clearTimeout(timeout);
          audio.src = '';
          resolve(true);
        }
      };

      audio.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timeout);
          audio.src = '';
          resolve(false);
        }
      };

      audio.src = url;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Админ-панель SlyNet Studio</h2>
              <p className="text-xs text-zinc-400">Управление брендом, контентом CMS и проверка потоков</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Screen if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Вход для администратора</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Введите ваш персональный PIN-код для доступа{!settings.adminPin || settings.adminPin === '1234' ? (
                <> (по умолчанию: <span className="font-mono text-amber-400 font-bold">1234</span>)</>
              ) : null}
            </p>

            <form onSubmit={handlePinSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Пин-код..."
                className="w-full text-center tracking-[0.4em] font-mono text-lg py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-amber-400 focus:outline-none text-white"
                autoFocus
              />

              {pinError && (
                <div className="text-xs text-red-400 font-medium">
                  Неверный PIN-код. Доступ запрещен.
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition-colors mt-2"
              >
                Войти в панель
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Views */
          <div>
            {/* Tabs Bar */}
            <div className="flex border-b border-zinc-800 px-5 pt-2 gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('brand')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'brand'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Бренд & Логотип</span>
              </button>

              <button
                onClick={() => setActiveTab('cms')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'cms'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>CMS / Контент</span>
              </button>

              <button
                onClick={() => setActiveTab('webcams')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'webcams'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Video className="w-4 h-4 text-cyan-400" />
                <span>Веб-камеры ({customWebcams.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'backup'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>💾 Полный Бэкап</span>
              </button>

              <button
                onClick={() => setActiveTab('stations')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'stations'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Свои станции ({customStations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('scanner')}
                className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'scanner'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Сканер ссылок</span>
              </button>
            </div>

            {/* TAB 1: Brand & Logo */}
            {activeTab === 'brand' && (
              <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Logo Uploader Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider block mb-3">
                    Логотип приложения SlyNet
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Preview */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <SlyNetLogo customLogoUrl={logoPreview} size="lg" />
                      <span className="text-[10px] text-zinc-400 font-medium">Превью</span>
                    </div>

                    {/* Actions */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>Загрузить картинку (файл)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('');
                            setLogoUrlInput('');
                            onResetLogo();
                          }}
                          className="px-3.5 py-2 bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Неоновый по умолчанию</span>
                        </button>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      {/* Direct URL input */}
                      <div>
                        <div className="text-[11px] text-zinc-400 mb-1">
                          Или вставьте прямую ссылку на изображение:
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={logoUrlInput}
                            onChange={(e) => {
                              setLogoUrlInput(e.target.value);
                              setLogoPreview(e.target.value);
                            }}
                            placeholder="https://example.com/logo.png"
                            className="flex-1 text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white font-mono"
                          />
                          {logoPreview && (
                            <>
                              <button
                                type="button"
                                onClick={handleCopyLogo}
                                title="Скопировать"
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors"
                              >
                                {copiedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={handleDownloadLogo}
                                title="Скачать"
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtitle and PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Подзаголовок в шапке
                    </label>
                    <input
                      type="text"
                      value={appSubtitle}
                      onChange={(e) => setAppSubtitle(e.target.value)}
                      placeholder="Global 1000+ Radio Hub"
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Новый PIN-код админки
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={newAdminPin}
                      onChange={(e) => setNewAdminPin(e.target.value)}
                      placeholder="1234"
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveBrandSettings}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Сохранить настройки бренда</span>
                  </button>

                  {savedNotice && (
                    <span className="text-xs text-emerald-400 font-medium">
                      ✓ Настройки успешно сохранены!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CMS / Content Management */}
            {activeTab === 'cms' && (
              <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>
                    Все изменения мгновенно применяются на сайте и сохраняются в локальном хранилище браузера.
                  </span>
                </div>

                {/* Hero Titles */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Главный заголовок сайта (Hero Title)
                    </label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Подзаголовок и описание под баннером (Hero Subtitle)
                    </label>
                    <textarea
                      rows={2}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white resize-none"
                    />
                  </div>
                </div>

                {/* Social Networks & Dynamic Links (CMS Requirement 2) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Социальные сети и полезные ссылки (Раздел «Информация» на сайте)</span>
                      </label>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Добавляйте произвольное количество ссылок (Telegram, VK, Поддержка, Чат). Они сразу появятся в меню «Информация».
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 shrink-0">
                      {customLinks.length} активных
                    </span>
                  </div>

                  {/* Add new link form */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Название (напр. Telegram, VK, Чат)"
                      className="sm:w-1/3 text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL (https://t.me/slynet_radio)"
                      className="flex-1 text-xs py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shrink-0 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Добавить ссылку</span>
                    </button>
                  </div>

                  {/* List of current dynamic links with inline editing */}
                  <div className="space-y-2 mt-2">
                    {customLinks.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:w-1/3">
                          <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateLink(item.id, 'title', e.target.value)}
                            className="w-full text-xs py-1 px-2 rounded bg-zinc-950 border border-zinc-800/80 text-white font-semibold focus:outline-none focus:border-cyan-400"
                            placeholder="Название ссылки"
                          />
                        </div>
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => handleUpdateLink(item.id, 'url', e.target.value)}
                          className="flex-1 text-xs py-1 px-2 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-mono focus:outline-none focus:border-cyan-400"
                          placeholder="URL ссылки"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 self-end sm:self-center"
                          title="Удалить ссылку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Version Control & Changelog */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Название версии (бейдж)</span>
                    </label>
                    <input
                      type="text"
                      value={appVersion}
                      onChange={(e) => setAppVersion(e.target.value)}
                      placeholder="v0.8.2"
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-emerald-300 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Описание версии & Changelog (Окно «О сайте»)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={versionChangelog}
                      onChange={(e) => setVersionChangelog(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white resize-y min-h-[90px]"
                    />
                  </div>
                </div>

                {/* DMCA / Privacy Policy with Large Comfortable Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>Политика конфиденциальности & DMCA Notice (Полный редактируемый текст)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {dmcaPolicy.length} символов
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={dmcaPolicy}
                    onChange={(e) => setDmcaPolicy(e.target.value)}
                    className="w-full text-xs sm:text-sm leading-relaxed p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-400 focus:outline-none text-white resize-y font-sans min-h-[170px]"
                    placeholder="Полный текст политики конфиденциальности и обращения для правообладателей..."
                  />
                  <p className="text-[11px] text-zinc-400">
                    Текст из этого поля моментально отображается на сайте в разделе «Информация» в блоке DMCA Notice.
                  </p>
                </div>

                {/* Save CMS button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCms}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg hover:brightness-110"
                  >
                    <Check className="w-4 h-4" />
                    <span>Сохранить контент сайта</span>
                  </button>

                  {cmsSavedNotice && (
                    <span className="text-xs text-emerald-400 font-medium">
                      ✓ Контент успешно обновлен и опубликован!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Webcams Manager */}
            {activeTab === 'webcams' && (
              <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>
                    Добавляйте собственные публичные веб-камеры и прямые потоки городов мира. Они появятся в разделе «Веб-камеры мира» и будут доступны на 3D-глобусе и в каталоге.
                  </span>
                </div>

                {/* Add Webcam Form */}
                <form onSubmit={handleAddCamSubmit} className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>Добавить новую веб-камеру</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Название города / локации *</label>
                      <input
                        type="text"
                        required
                        value={newCamName}
                        onChange={(e) => setNewCamName(e.target.value)}
                        placeholder="Напр. Сочи (Красная Поляна)"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Страна и эмодзи-флаг *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newCamCountry}
                          onChange={(e) => setNewCamCountry(e.target.value)}
                          placeholder="Россия"
                          className="flex-1 text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={newCamFlag}
                          onChange={(e) => setNewCamFlag(e.target.value)}
                          placeholder="🇷🇺"
                          className="w-14 text-center text-xs py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Прямой URL потока / кадра (HLS .m3u8, живое фото .jpg, открытый поток) *</label>
                      <input
                        type="url"
                        required
                        value={newCamStreamUrl}
                        onChange={(e) => setNewCamStreamUrl(e.target.value)}
                        placeholder="https://example.com/live-cam.jpg или прямая ссылка"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Ссылка на портал камеры (Кнопка «Открыть прямой поток»)</label>
                      <input
                        type="url"
                        value={newCamPortalUrl}
                        onChange={(e) => setNewCamPortalUrl(e.target.value)}
                        placeholder="https://www.earthcam.com/..."
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Категория</label>
                      <select
                        value={newCamCategory}
                        onChange={(e) => setNewCamCategory(e.target.value as any)}
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="city">Мегаполис (City)</option>
                        <option value="beach">Пляж / Океан (Beach)</option>
                        <option value="nature">Природа / Горы (Nature)</option>
                        <option value="landmark">Достопримечательность (Landmark)</option>
                        <option value="space">Космос / МКС (Space)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Краткое описание / Теглайн</label>
                      <input
                        type="text"
                        value={newCamTagline}
                        onChange={(e) => setNewCamTagline(e.target.value)}
                        placeholder="Панорамный вид 24/7"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Сохранить и опубликовать камеру</span>
                    </button>
                    {camAddedNotice && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Веб-камера успешно добавлена в каталог!
                      </span>
                    )}
                  </div>
                </form>

                {/* List of Custom Webcams */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                    Пользовательские веб-камеры ({customWebcams.length})
                  </h3>

                  {customWebcams.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                      Вы пока не добавили ни одной собственной веб-камеры. По умолчанию отображаются проверенные мировые трансляции EarthCam и городов мира.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customWebcams.map((cam) => (
                        <div
                          key={cam.id}
                          className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{cam.flag}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">
                                {cam.name}
                              </div>
                              <div className="text-xs text-zinc-400 truncate">
                                <span className="text-cyan-400">{cam.country}</span> • {cam.tagline}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCam(cam.id)}
                            title="Удалить камеру"
                            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Full Server/Site Backup */}
            {activeTab === 'backup' && (
              <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Intro banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-3">
                  <HardDrive className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">
                      💾 Полный Бэкап Сервера и Настроек Сайта (.json)
                    </h3>
                    <p className="text-zinc-300 leading-relaxed">
                      Экспортируйте и сохраняйте полную конфигурацию вашего сайта в один компактный .json файл: все тексты CMS, ссылки соцсетей, Политику DMCA, версию, кастомный логотип, базу добавленных станций и веб-камер, а также избранное. Вы всегда сможете восстановить сайт на любом устройстве за 1 секунду.
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {restoreNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{restoreNotice}</span>
                  </div>
                )}

                {restoreError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}

                {/* Backup Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Download Backup Box */}
                  <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-3">
                        <Download className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        1. Скачать полный бэкап сайта
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        Формирует резервную копию .json со всеми текущими параметрами CMS, ссылками, станциями и веб-камерами.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Скачать бэкап (.json)</span>
                    </button>

                    {backupDownloadNotice && (
                      <span className="text-[11px] text-emerald-400 font-medium text-center mt-2">
                        ✓ Файл бэкапа успешно скачан!
                      </span>
                    )}
                  </div>

                  {/* Restore Backup Box */}
                  <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between">
                    <div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        2. Восстановить сайт из бэкапа
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        Загрузите ранее сохраненный .json файл для мгновенного восстановления всех текстов, брендинга, станций и ссылок.
                      </p>
                    </div>

                    <div>
                      <input
                        type="file"
                        ref={backupFileInputRef}
                        accept=".json,application/json"
                        onChange={handleRestoreBackup}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => backupFileInputRef.current?.click()}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-zinc-700 transition-all shadow active:scale-95"
                      >
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>Выбрать файл бэкапа (.json)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup Summary Statistics */}
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                    Что входит в файл полного бэкапа:
                  </h4>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li>Версия и Changelog: <strong className="text-emerald-400">{appVersion}</strong></li>
                    <li>Полный текст Политики конфиденциальности & DMCA Notice ({dmcaPolicy.length} симв.)</li>
                    <li>Динамические социальные сети и ссылки ({customLinks.length} шт.)</li>
                    <li>Пользовательские веб-камеры ({customWebcams.length} шт.)</li>
                    <li>Пользовательские радиостанции ({customStations.length} шт.)</li>
                    <li>Брендинг: Заголовки Hero, подзаголовки, логотип и PIN-код</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: Broken Stream Scanner */}
            {activeTab === 'scanner' && (
              <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Сканер доступности аудиопотоков</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Проверяет ваши добавленные станции и избранное на битые ссылки и таймауты
                    </p>
                  </div>

                  <button
                    onClick={runStreamScanner}
                    disabled={isScanning}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? `Проверка (${scanProgress}%)...` : 'Начать сканирование'}</span>
                  </button>
                </div>

                {isScanning && (
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}

                {scannerResults.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                      <span>Результаты проверки ({scannerResults.length}):</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400">
                          ● {scannerResults.filter((r) => r.status === 'ok').length} онлайн
                        </span>
                        <span className="text-rose-400">
                          ● {scannerResults.filter((r) => r.status === 'broken').length} недоступно
                        </span>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                      {scannerResults.map((item) => (
                        <div
                          key={item.uuid}
                          className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.status === 'ok' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : item.status === 'broken' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{item.name}</div>
                              <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[280px] sm:max-w-md">
                                {item.url}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {item.status === 'ok' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                200 OK
                              </span>
                            )}
                            {item.status === 'broken' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Битая ссылка
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                    Нажмите «Начать сканирование», чтобы проверить доступность всех ваших станций.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Custom Stations */}
            {activeTab === 'stations' && (
              <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Form to add station */}
                <form
                  onSubmit={handleAddStationSubmit}
                  className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Добавить новую станцию в эфир
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Название станции *</label>
                      <input
                        type="text"
                        required
                        value={newStationName}
                        onChange={(e) => setNewStationName(e.target.value)}
                        placeholder="Например: SlyNet Deep House"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Прямой URL потока (MP3/AAC/HLS) *</label>
                      <input
                        type="url"
                        required
                        value={newStationUrl}
                        onChange={(e) => setNewStationUrl(e.target.value)}
                        placeholder="https://stream.server.com/live"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Теги / Жанры (через запятую)</label>
                      <input
                        type="text"
                        value={newStationTags}
                        onChange={(e) => setNewStationTags(e.target.value)}
                        placeholder="dance, club, electronic"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">URL логотипа / иконки станции</label>
                      <input
                        type="url"
                        value={newStationFavicon}
                        onChange={(e) => setNewStationFavicon(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Страна вещания</label>
                      <input
                        type="text"
                        value={newStationCountry}
                        onChange={(e) => setNewStationCountry(e.target.value)}
                        placeholder="Россия / Германия / Global"
                        className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Код страны</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={newStationCountryCode}
                          onChange={(e) => setNewStationCountryCode(e.target.value.toUpperCase())}
                          placeholder="RU"
                          className="w-full text-xs py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Битрейт (kbps)</label>
                        <select
                          value={newStationBitrate}
                          onChange={(e) => setNewStationBitrate(Number(e.target.value))}
                          className="w-full text-xs py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-amber-400 focus:outline-none text-white"
                        >
                          <option value={128}>128 kbps</option>
                          <option value={192}>192 kbps</option>
                          <option value={256}>256 kbps</option>
                          <option value={320}>320 kbps (HD)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Добавить станцию в эфир</span>
                    </button>

                    {stationAddedNotice && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Станция добавлена и доступна в эфире!
                      </span>
                    )}
                  </div>
                </form>

                {/* List of Custom Stations */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                    Добавленные станции ({customStations.length})
                  </h3>

                  {customStations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                      Вы пока не добавили ни одной собственной станции.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customStations.map((station) => (
                        <div
                          key={station.stationuuid}
                          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                              SN
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">
                                {station.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                                <span className="font-mono text-amber-400 font-medium">
                                  {station.bitrate}k
                                </span>
                                <span>·</span>
                                <span>{station.tags}</span>
                                <span>·</span>
                                <span className="truncate max-w-[200px] text-zinc-500 font-mono">
                                  {station.url}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onDeleteCustomStation(station.stationuuid)}
                            title="Удалить станцию"
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
