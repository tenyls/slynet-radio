/** Страна посетителя: через наш сервер (данные Cloudflare, без сторонних сервисов) или по языку браузера */
import { api, hasApi } from './apiService';
import { guessUserCountry } from './radioApi';

const KEY = 'slynet_geo_country';

export async function getMyCountry(): Promise<string> {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < 86400000 && cached.cc) return cached.cc;
  } catch {}
  let cc = '';
  if (hasApi()) {
    try {
      cc = ((await api<{ country: string }>('/geo')).country || '').toUpperCase();
    } catch {}
  }
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX' || cc === 'T1') cc = guessUserCountry();
  try {
    localStorage.setItem(KEY, JSON.stringify({ cc, at: Date.now() }));
  } catch {}
  return cc;
}
