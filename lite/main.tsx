import { createRoot } from 'react-dom/client';
import './style.css';

// Before importing the player: its first stream must already use weak-network mode.
try {
  if (!localStorage.getItem('slynet_quality')) localStorage.setItem('slynet_quality', 'weak');
  if (!localStorage.getItem('slynet_view_mode')) localStorage.setItem('slynet_view_mode', 'list');
} catch {}

import('./App').then(({ default: App }) => createRoot(document.getElementById('root')!).render(<App />));

if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
