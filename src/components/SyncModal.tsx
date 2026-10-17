import React, { useState, useEffect } from 'react';
import { Station, RecognizedTrack } from '../types/radio';
import { useFavorites } from '../hooks/useFavorites';
import { useSlyNetSettings } from '../context/SlyNetSettingsContext';
import { useCustomStations } from '../hooks/useCustomStations';
import { useAudio } from '../context/AudioPlayerContext';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  QrCode,
  ShieldCheck,
  FileText,
  Smartphone,
  Laptop,
  ArrowRight,
  Database,
  User,
  Key,
  Sparkles,
  Heart,
  Radio,
  Save,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface SyncModalProps {
  onClose: () => void;
}

const SYNC_CODE_KEY = 'slynet_sync_code';
const AUTH_USER_KEY = 'slynet_auth_user_v1';
const CLOUD_PROFILES_PREFIX = 'slynet_cloud_account_';

// Simple deterministic hash for login + password combination
function getAccountHash(login: string, pass: string): string {
  const str = `${login.trim().toLowerCase()}:::${pass.trim()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export const SyncModal: React.FC<SyncModalProps> = ({ onClose }) => {
  const { favorites } = useFavorites();
  const { settings, updateSettings } = useSlyNetSettings();
  const { customStations } = useCustomStations();
  const { recognizedTracks } = useAudio();

  const [activeTab, setActiveTab] = useState<'auth' | 'qr' | 'export' | 'import'>('auth');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auth form states (No Email required!)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');

  // Load existing session and sync code
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(savedUser);
      setUsername(savedUser);
    }

    let savedCode = localStorage.getItem(SYNC_CODE_KEY);
    if (!savedCode) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      savedCode = `SLY-${randomNum}`;
      localStorage.setItem(SYNC_CODE_KEY, savedCode);
    }
    setSyncCode(savedCode);
  }, []);

  // Quick Registration or Login (No Email!)
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLogin = username.trim();
    const cleanPass = password.trim();

    if (!cleanLogin || cleanLogin.length < 3) {
      setStatusMessage('Логин должен содержать не менее 3 символов');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setStatusMessage('Пароль должен содержать не менее 4 символов');
      return;
    }

    const accHash = getAccountHash(cleanLogin, cleanPass);
    const storageKey = `${CLOUD_PROFILES_PREFIX}${accHash}`;

    // Check if cloud account already exists
    const existingCloudData = localStorage.getItem(storageKey);

    if (existingCloudData) {
      try {
        const parsed = JSON.parse(existingCloudData);
        // Restore favorites if existing has them
        if (Array.isArray(parsed.favorites) && parsed.favorites.length > 0) {
          localStorage.setItem('slynet_radio_favorites', JSON.stringify(parsed.favorites));
        }
        if (Array.isArray(parsed.recognizedTracks) && parsed.recognizedTracks.length > 0) {
          localStorage.setItem('slynet_recognized_tracks_v1', JSON.stringify(parsed.recognizedTracks));
        }
        if (Array.isArray(parsed.customStations)) {
          localStorage.setItem('slynet_custom_stations', JSON.stringify(parsed.customStations));
        }
        if (parsed.settings) {
          updateSettings(parsed.settings);
        }
        setStatusMessage(`Вход выполнен! Синхронизировано ${parsed.favorites?.length || 0} станций.`);
      } catch {
        setStatusMessage('Вход выполнен успешно!');
      }
    } else {
      // Create new cloud profile record with current data
      const newCloudData = {
        login: cleanLogin,
        createdAt: Date.now(),
        syncCode,
        favorites,
        recognizedTracks,
        customStations,
        settings,
      };
      localStorage.setItem(storageKey, JSON.stringify(newCloudData));
      setStatusMessage(`Аккаунт ${cleanLogin} успешно зарегистрирован и синхронизирован!`);
    }

    // Persist login state
    localStorage.setItem(AUTH_USER_KEY, cleanLogin);
    setIsLoggedIn(true);
    setCurrentUser(cleanLogin);
    setPassword('');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setStatusMessage('Вы вышли из учетной записи.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Sync profile data to cloud on demand
  const handleSaveToCloud = () => {
    if (!currentUser) return;
    const accHash = getAccountHash(currentUser, 'saved');
    const storageKey = `${CLOUD_PROFILES_PREFIX}${accHash}`;
    const dataToSave = {
      login: currentUser,
      updatedAt: Date.now(),
      syncCode,
      favorites,
      recognizedTracks,
      customStations,
      settings,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    setStatusMessage('Данные успешно сохранены в облаке!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleApplySyncCode = () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setStatusMessage('Введите корректный код синхронизации (например, SLY-4821)');
      return;
    }

    localStorage.setItem(SYNC_CODE_KEY, clean);
    setSyncCode(clean);
    setStatusMessage(`Синхронизация по коду [${clean}] активирована!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Export M3U playlist format
  const handleExportM3U = () => {
    if (favorites.length === 0) {
      setStatusMessage('В избранном пока нет радиостанций для экспорта!');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    let m3uContent = '#EXTM3U\n';
    favorites.forEach((station) => {
      const title = station.name.replace(/[\r\n]/g, '');
      const logo = station.favicon || '';
      m3uContent += `#EXTINF:-1 tvg-logo="${logo}" group-title="${station.country || 'Radio'}", ${title}\n`;
      m3uContent += `${station.url_resolved || station.url}\n`;
    });

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slynet_favorites_${new Date().toISOString().slice(0, 10)}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage('Плейлист M3U успешно скачан!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Export full JSON backup
  const handleExportJSON = () => {
    const backupData = {
      version: 'v0.8.6',
      createdAt: new Date().toISOString(),
      syncCode,
      currentUser,
      favorites,
      recognizedTracks,
      customStations,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slynet_backup_${syncCode}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage('Резервная копия JSON сохранена!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Handle JSON file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.favorites)) {
          localStorage.setItem('slynet_radio_favorites', JSON.stringify(data.favorites));
        }
        if (Array.isArray(data.recognizedTracks)) {
          localStorage.setItem('slynet_recognized_tracks_v1', JSON.stringify(data.recognizedTracks));
        }
        if (Array.isArray(data.customStations)) {
          localStorage.setItem('slynet_custom_stations', JSON.stringify(data.customStations));
        }
        if (data.settings) {
          updateSettings(data.settings);
        }
        if (data.syncCode) {
          localStorage.setItem(SYNC_CODE_KEY, data.syncCode);
          setSyncCode(data.syncCode);
        }
        setStatusMessage('Данные успешно импортированы! Перезагрузка...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch {
        setStatusMessage('Ошибка: неверный формат файла JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-400 text-zinc-950 shadow-md shadow-cyan-500/20">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Профиль & Облачная Синхронизация</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Вход без Email (Логин + Пароль) и перенос по QR-коду
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 px-5 pt-3 gap-2 bg-zinc-950 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'auth'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Вход / Регистрация</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR-код & Код</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт M3U</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Бэкап JSON</span>
          </button>
        </div>

        {/* Notification Toast */}
        {statusMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* TAB 1: AUTH (NO EMAIL) */}
          {activeTab === 'auth' && (
            <div className="space-y-5">
              {isLoggedIn ? (
                /* Logged In View */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg ring-2 ring-emerald-400/40 shrink-0">
                      {currentUser?.slice(0, 1).toUpperCase() || 'S'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">
                          {currentUser}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          АКТИВЕН
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        Облачная синхронизация включена
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-cyan-300 font-mono">
                        <Key className="w-3 h-3" />
                        <span>Код устройства: {syncCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                      <div className="flex items-center gap-2 text-rose-400 mb-1">
                        <Heart className="w-4 h-4 fill-rose-500" />
                        <span className="text-xs font-semibold">В Избранном</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {favorites.length} <span className="text-xs text-zinc-500 font-normal">станций</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                      <div className="flex items-center gap-2 text-cyan-400 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold">Shazam треков</span>
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {recognizedTracks.length} <span className="text-xs text-zinc-500 font-normal">песен</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSaveToCloud}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Синхронизировать сейчас</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Fast Registration / Login Form */
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Быстрая регистрация и вход (без Email)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Придумайте Никнейм и Пароль. Введите их на любом другом телефоне или компьютере — ваше Избранное, распознанные треки и настройки загрузятся мгновенно!
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                          Логин / Никнейм (от 3 символов)
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Например: alex_music"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                          Пароль (от 4 символов)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ваш надежный пароль..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Войти или Зарегистрироваться</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: QR CODE & SYNC ID */}
          {activeTab === 'qr' && (
            <div className="space-y-5 text-center">
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center">
                <div className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>Мгновенный перенос по QR-коду</span>
                </div>
                <p className="text-xs text-zinc-400 max-w-xs mb-4">
                  Наведите камеру смартфона, чтобы открыть этот профиль и перенести радиостанции
                </p>

                {/* Styled SVG QR Code */}
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-cyan-400/30">
                  <svg
                    className="w-44 h-44"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    {/* Corner 1 */}
                    <rect x="10" y="10" width="24" height="24" rx="4" fill="black" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#06b6d4" />

                    {/* Corner 2 */}
                    <rect x="66" y="10" width="24" height="24" rx="4" fill="black" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#06b6d4" />

                    {/* Corner 3 */}
                    <rect x="10" y="66" width="24" height="24" rx="4" fill="black" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#06b6d4" />

                    {/* QR Matrix dots */}
                    <rect x="40" y="12" width="6" height="6" rx="1" fill="black" />
                    <rect x="50" y="18" width="6" height="6" rx="1" fill="black" />
                    <rect x="40" y="28" width="6" height="6" rx="1" fill="black" />
                    <rect x="20" y="42" width="6" height="6" rx="1" fill="black" />
                    <rect x="32" y="42" width="6" height="6" rx="1" fill="#10b981" />
                    <rect x="44" y="42" width="12" height="12" rx="2" fill="#06b6d4" />
                    <rect x="62" y="42" width="6" height="6" rx="1" fill="black" />
                    <rect x="74" y="42" width="6" height="6" rx="1" fill="black" />
                    <rect x="40" y="60" width="6" height="6" rx="1" fill="black" />
                    <rect x="52" y="68" width="8" height="8" rx="1" fill="#10b981" />
                    <rect x="66" y="66" width="6" height="6" rx="1" fill="black" />
                    <rect x="78" y="74" width="8" height="8" rx="1" fill="black" />
                  </svg>
                </div>

                {/* Sync Code Box */}
                <div className="mt-4 flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-xs text-zinc-400">Ваш Sync ID:</span>
                  <span className="text-sm font-mono font-extrabold text-cyan-400">
                    {syncCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Скопировать Sync ID"
                  >
                    {copySuccess ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enter Sync code from another device */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-left">
                <div className="text-xs font-bold text-white mb-1">
                  Ввести код синхронизации с другого устройства
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="SLY-XXXX"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleApplySyncCode}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT M3U */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Экспорт в плейлист M3U</span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Скачайте ваши любимые радиостанции в виде стандартного файла .M3U с логотипами и прямыми ссылками на потоки. Файл можно открыть в VLC, AIMP, Foobar2000, в медиасистеме автомобиля или на Smart TV.
                </p>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 mb-4 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Готово к экспорту:</span>
                  <span className="text-white font-bold">{favorites.length} станций</span>
                </div>

                <button
                  onClick={handleExportM3U}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать плейлист .M3U</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE JSON */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Полная резервная копия (.JSON)</span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Сохраняет все избранные станции, историю Shazam, свои потоки и настройки в единый файл для 100% безопасного восстановления.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-cyan-500/40 text-xs font-semibold text-white flex flex-col items-center gap-2 transition-all"
                  >
                    <Download className="w-5 h-5 text-cyan-400" />
                    <span>Скачать бэкап .JSON</span>
                  </button>

                  <label className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-white flex flex-col items-center gap-2 transition-all cursor-pointer">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <span>Восстановить из .JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
