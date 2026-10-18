/**
 * Где запущен сайт: в браузере или внутри мобильного приложения (Capacitor).
 * В приложениях для App Store / Google Play отключаем то, что запрещают правила магазинов.
 */
export const isNativeApp: boolean =
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

export const FEATURES = {
  /** Запись эфира в файл: Apple 5.2.3 / Google Play запрещают сохранять чужие трансляции */
  recorder: !isNativeApp,
  /**
   * Прямые ТВ-трансляции: Google Play и App Store массово удаляют IPTV-приложения,
   * поэтому в приложениях показываем только ссылки на официальные сайты/YouTube каналов.
   */
  tvStreams: !isNativeApp,
};

/** Откуда брать свежие content.json / catalog.json: в приложении — с сайта (чтобы обновлялись без новой версии приложения) */
export const DATA_BASE = isNativeApp ? 'https://tenyls.github.io/slynet-radio/' : './';
