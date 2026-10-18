/**
 * Где запущен сайт: в браузере или внутри мобильного приложения (Capacitor).
 * В приложениях для App Store / Google Play отключаем то, что запрещают правила магазинов.
 */
export const isNativeApp: boolean =
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

/**
 * Сборка для Google Play / App Store помечается строкой «SlyNet-Store» в User-Agent
 * (capacitor.config → appendUserAgent). APK с нашего сайта — без пометки.
 */
export const isStoreBuild: boolean =
  isNativeApp && typeof navigator !== 'undefined' && /SlyNet-Store/.test(navigator.userAgent || '');

export const FEATURES = {
  /** Запись эфира в файл: Apple 5.2.3 / Google Play запрещают сохранять чужие трансляции */
  recorder: !isNativeApp,
  /**
   * Прямые ТВ-трансляции: Google Play и App Store массово удаляют IPTV-приложения,
   * поэтому в версиях из магазинов — только ссылки на официальные сайты/YouTube каналов.
   * На сайте и в APK с нашего сайта трансляции есть.
   */
  tvStreams: !isStoreBuild,
};

/** Откуда брать свежие content.json / catalog.json: в приложении — с сайта (чтобы обновлялись без новой версии приложения) */
export const DATA_BASE = isNativeApp ? 'https://tenyls.github.io/slynet-radio/' : './';
