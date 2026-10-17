import React from 'react';
import { SlyNetLogo } from './SlyNetLogo';
import { useSlyNetSettings } from '../context/SlyNetSettingsContext';
import {
  X,
  Sparkles,
  Send,
  Radio,
  Sliders,
  Disc,
  Video,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Heart,
  Globe,
  Award,
} from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const { settings } = useSlyNetSettings();

  const versions = [
    {
      version: settings.appVersion ? `${settings.appVersion} (Текущая)` : 'v0.8.6 (Текущая)',
      date: 'Октябрь 2026',
      isLatest: true,
      features: [
        '🎵 Умный фильтр RDS и Shazam: строгое сохранение только проверенных реальных песен с исполнителем и названием, iTunes HD обложки и поиск в YouTube, Spotify, Apple Music в 1 клик',
        '🎤 Каталог «Исполнители & Группы (A–Z)» и «🎬 Саундтреки (OST)»: персональные 24/7 радиостанции любимых артистов (Кино, Сектор Газа, Король и Шут, Queen, Metallica, Zimmer) и кино-игровых саундтреков',
        '🌍 Надежный выбор стран без сбоев: исправлен баг со счетчиками станций (США, Франция), загрузка до 200 рабочих станций на страну, кнопка «✕ Закрыть» и выход по Esc',
        '👁️ Умное скрытие верхней панели фильтров в разделах «Веб-камеры», «Телеканалы» и «Информация» для максимального обзора',
        '🔑 Быстрая регистрация и вход без Email: мгновенный профиль по связке Логин + Пароль с облачной синхронизацией избранного и Shazam-песен',
        '📲 Мгновенный перенос профиля по QR-коду и буквенно-цифровому Sync ID на любое устройство',
        '🔒 Безопасность Админ-панели: устранена лазейка 1234 при установке пользовательского PIN-кода (сравнение строго с персональным паролем)',
        '📹 Веб-камеры мира 50+ локаций: Москва, Питер, Сочи, Байкал, Нью-Йорк, Токио, Париж, Дубай, Альпы, Космос МКС — без черных окон с надежным fallback-плеером',
      ],
    },
    {
      version: 'v0.8.5',
      date: 'Октябрь 2026',
      isLatest: false,
      features: [
        '🛡️ Устранение проблемы черного экрана при запуске радио: безопасный рендеринг и глобальный ErrorBoundary',
        '🌐 Статичный логотип в левой шапке (крутится и пульсирует только в плеере и на играющей карточке во время воспроизведения)',
        '🔒 Полное отключение клика по логотипу в шапке для смены картинки (загрузка логотипа доступна только в Админке)',
        '⚡ Жесткая дедупликация радиостанций (оставляем 1 лучший битрейт без сотен дублей) и точные счетчики станций по странам',
        '⏳ Авто-карантин slynet_quarantine: станция без ответа >4.5с или с ошибкой изолируется на 6 часов с автопереходом к следующей',
        '📻 Рабочий RDS Live: опрос текущего трека (Исполнитель — Песня), iTunes HD обложки, кнопка «Запомнить трек» и точный поиск в YouTube и Spotify',
      ],
    },
    {
      version: 'v0.8.4',
      date: 'Октябрь 2026',
      isLatest: false,
      features: [
        '🔍 Широкая строка поиска станций с голосовым вводом через Web Speech API (🎙️) и кнопкой быстрой очистки (✕)',
        '🌍 Комбо-фильтр «Страна + Жанр»: одновременный выбор страны и жанра с загрузкой из Radio Browser API и плашкой активных фильтров',
        '📻 Расширенный каталог из 30+ популярных жанровых категорий с индивидуальными cyber-градиентами и иконками',
        '✨ Закрепление и быстрый доступ к 8 категориям настроений (Moods) со связкой со странами вещания',
        '📇 Подробные карточки радиостанций: флаг, страна, город/регион, жанр и битрейт в kbps',
      ],
    },
    {
      version: 'v0.8.3',
      date: 'Октябрь 2026',
      isLatest: false,
      features: [
        '🌐 Векторный логотип SlyNet Globe: плавное неоновое вращение на ПК и мобильная анимация',
        '📟 Матричная LED бегущая строка печатным шрифтом в шапке',
        '🎵 Автоматическое подтягивание обложек альбомов артистов через iTunes Search API',
        '🌍 Надежное модальное окно выбора стран радио с мгновенным поиском',
        '📹 Веб-камеры мира: чистка от битых YouTube iframes, стабильные прямые потоки городов',
        '💾 Полный Бэкап Сервера/Сайта: скачивание и восстановление всех настроек CMS, ссылок, станций в .json',
        '👑 SlyNet PRO: кнопка «Активировать PRO-режим (Бесплатный тест)»',
      ],
    },
    {
      version: 'v0.8.2',
      date: 'Октябрь 2026',
      features: [
        '✨ Полная зачистка старых доменов, фокусировка исключительно на SlyNet Radio и веб-камерах мира',
        '⚙️ Расширенная CMS в Админ-панели (PIN 1234): редактирование Политики DMCA через большое поле textarea',
        '🔗 Динамический редактор социальных сетей и ссылок с моментальной публикацией на сайте',
      ],
    },
    {
      version: 'v0.8.1',
      date: 'Октябрь 2026',
      features: [
        '🌍 Проверенные прямые видеопотоки EarthCam и публичные live-трансляции городов с удобным переключателем на каталог списком',
        '⚡ Мгновенный выпадающий фильтр по странам радио с быстрым поиском (Россия, Украина, Германия и весь мир)',
        '📝 Редактирование Политики конфиденциальности & DMCA прямо в браузере',
      ],
    },
    {
      version: 'v0.8',
      date: 'Октябрь 2026',
      features: [
        '🌍 «Веб-камеры мира (Live Cams)»: 16 городов, Нью-Йорк, Токио, Альпы, Париж, МКС',
        '🌐 Интерактивный вращающийся 3D-Глобус на Canvas в неоновом стиле SlyNet',
        '🗣️ Переключатель языка интерфейса: Русский (RU), Английский (EN), Немецкий (DE)',
        '🔄 Облачная синхронизация профиля и экспорт избранного в плейлисты M3U и JSON',
      ],
    },
    {
      version: 'v0.7',
      date: 'Октябрь 2026',
      features: [
        '✨ Раздел «Подборки по настроению и занятиям» (Спорт, Медитация, Релакс, Lo-Fi)',
        '🚗 Автомобильный режим «За рулем» с крупными кнопками и HUD-часами',
        '🎛️ 5-полосный графический эквалайзер Web Audio с усилением басов Bass Boost',
        '🔴 Прямая запись эфира в аудиофайл (REC) со счетчиком времени',
      ],
    },
    {
      version: 'v0.6',
      date: 'Сентябрь 2026',
      features: [
        '🎨 Единый оригинальный векторный логотип SlyNet Globe во всех компонентах',
        '🖼️ Динамическая загрузка собственного логотипа через админ-панель',
        '📻 Добавление собственных пользовательских радиостанций и проверка потоков',
        '🛡️ Защищенная админ-панель со сканером неработающих ссылок',
      ],
    },
    {
      version: 'v0.5',
      date: 'Август 2026',
      features: [
        '🚀 Запуск первой версии SlyNet Radio на Radio Browser API',
        '🌙 Таймер сна с плавным затуханием звука',
        '❤️ Система быстрого добавления в Избранное',
        '✈️ Интеграция с официальным сообществом Telegram @slynet_radio',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-6 border-b border-zinc-800/80 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <SlyNetLogo
                customLogoUrl={settings.customLogoUrl}
                size="md"
                allowUpload={false}
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-emerald-400 text-zinc-950 text-[9px] font-mono font-black rounded-full shadow">
                {settings.appVersion || 'v0.8.6'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {settings.appTitle || 'SlyNet Radio'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  BETA EDITION
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">
                Официальный медиа-хаб сообщества SlyNet
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Advantages */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Преимущества платформы SlyNet Radio</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                <Radio className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">1000+ станций мира</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Каталог на базе Radio Browser с фильтрацией по 40+ странам и жанрам.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                <Video className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Live-камеры & 3D Глобус</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Круглосуточный видеопоток мировых столиц и курортов во время прослушивания.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Web Audio эквалайзер</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    5-полосная настройка частот, Bass Boost и 3D объемное звучание.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3">
                <CloudSun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Живая погода & Время</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Определение погоды и местного времени прямо в студии радиовещания.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Version Changelog History */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>История версий и обновлений</span>
            </h3>
            <div className="space-y-4">
              {versions.map((ver, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    ver.isLatest
                      ? 'bg-gradient-to-b from-cyan-950/20 to-zinc-900/80 border-cyan-500/30'
                      : 'bg-zinc-900/40 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{ver.version}</span>
                      {ver.isLatest && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-400/20 text-emerald-300 rounded border border-emerald-400/30">
                          НОВОЕ
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{ver.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {ver.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-xs text-zinc-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Official Community Channels & Dynamic Links */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-cyan-500/20">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Официальные ссылки и контакты SlyNet</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {(settings.customLinks && settings.customLinks.length > 0
                ? settings.customLinks
                : [
                    { id: '1', title: 'Telegram Канал', url: settings.telegramUrl || 'https://t.me/slynet_radio' },
                  ]
              ).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-200 text-xs transition-colors border border-zinc-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold truncate">{link.title}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            SlyNet Media Group © 2026. Made with <Heart className="w-3 h-3 inline text-rose-500" /> for community
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
