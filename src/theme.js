import { get, put } from './db.js';

// Dark mode: 'auto' follows the phone, 'on' forces dark.
export async function loadDarkSetting() {
  return (await get('settings', 'dark')) || 'auto';
}

export async function setDarkSetting(value) {
  await put('settings', value, 'dark');
  applyDark(value);
}

export function applyDark(value) {
  if (value === 'on') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  // Mirror to localStorage only so index.html can apply it before first paint.
  try { localStorage.setItem('cc-dark', value); } catch (e) {}
}
