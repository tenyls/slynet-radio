/**
 * Автообновление приложения (Android/iOS): при запуске проверяем app/version.json на сайте.
 * Если код сайта новее — тихо скачиваем пакет и применяем при следующем запуске (или уходе в фон).
 * Серверы Capgo не используются: пакеты лежат на нашем GitHub Pages.
 */
import { isNativeApp } from '../utils/platform';

const VERSION_URL = 'https://tenyls.github.io/slynet-radio/app/version.json';

export async function initAppUpdater() {
  if (!isNativeApp) return;
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    // Обязательно: сообщаем, что эта версия запустилась нормально (иначе плагин откатит её назад)
    await CapacitorUpdater.notifyAppReady();

    const remote = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
    if (!remote?.version || !remote?.url || remote.version === __BUILD__) return;

    // Уже скачан раньше? Тогда просто назначаем его следующим
    const { bundles } = await CapacitorUpdater.list();
    let bundle = bundles.find((b) => b.version === remote.version && b.status !== 'error');
    if (!bundle) bundle = await CapacitorUpdater.download({ url: remote.url, version: remote.version });
    await CapacitorUpdater.next({ id: bundle.id });
    window.dispatchEvent(new CustomEvent('slynet_update_ready'));
  } catch (e) {
    console.warn('Автообновление не удалось', e);
  }
}

/** Версия установленного APK (например 1.0.7) */
export async function nativeVersion(): Promise<string> {
  if (!isNativeApp) return '';
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
    return (await CapacitorUpdater.current()).native || '';
  } catch {
    return '';
  }
}
