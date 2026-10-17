/**
 * Где запущен сайт: в браузере или внутри мобильного приложения (Capacitor).
 * В приложениях для App Store / Google Play отключаем то, что запрещают правила магазинов.
 */
export const isNativeApp: boolean =
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

export const FEATURES = {
  /** Запись эфира в файл: Apple 5.2.3 / Google Play запрещают сохранять чужие трансляции */
  recorder: !isNativeApp,
};
