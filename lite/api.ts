export * from '../src/services/apiService.ts';
import { setApiBase as setOriginalBase } from '../src/services/apiService.ts';
import { api as originalApi } from '../src/services/apiService.ts';
const localBase = (url: string | undefined) => url?.replace(/\/+$/, '') === 'https://slynet-api.tenylse.workers.dev' ? `${location.origin}/api` : url;
// Keep settings.apiUrl canonical, including when the owner publishes content.json.
export function setApiBase(url: string | undefined) {
  setOriginalBase(localBase(url));
}
export function api<T = any>(path: string, opts: Parameters<typeof originalApi>[1] = {}): Promise<T> {
  return originalApi<T>(path, { ...opts, ...(opts.base ? { base: localBase(opts.base) } : {}) });
}
