// Progress API. Every call writes to IndexedDB immediately; nothing waits for a timer or page close.
import { db, get, put, add, del, all, STORES } from './db.js';
import { dayKey } from './day.js';

export const DEFAULT_SETTINGS = {
  newCap: 10,
  keepGoingCap: 20,
  catchupDays: 3,
  shiftReviewMin: 10,
  dark: 'auto'
};

export async function getSettings() {
  const out = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    const v = await get('settings', k);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
export const setSetting = (k, v) => put('settings', v, k);

export const getMeta = (k) => get('meta', k);
export const setMeta = (k, v) => put('meta', v, k);

// --- shift day ---
export async function isShiftDay() {
  return (await getMeta('shiftDay')) === dayKey();
}
export async function setShiftDay(on) {
  await setMeta('shiftDay', on ? dayKey() : null);
}

// --- events log helpers ---
export const logReview = (r) => add('reviewLog', r);
export const logAttempt = (a) => add('attempts', a);
export const logOverride = (o) => add('overrides', o);

export async function logGlossaryTap(term) {
  await add('glossaryTaps', { term, at: new Date().toISOString() });
}

export async function queueDefine(term, context) {
  const key = term.trim().toLowerCase();
  const existing = await get('defineList', key);
  await put('defineList', {
    term: term.trim(),
    context: context || existing?.context || '',
    requestedAt: existing?.requestedAt || new Date().toISOString(),
    count: (existing?.count || 0) + 1
  }, key);
}

// --- sessions (resumable in-flight work) ---
export const getSession = (id) => get('sessions', id);
export const saveSession = (id, s) => put('sessions', { ...s, savedAt: new Date().toISOString() }, id);
export const clearSession = (id) => del('sessions', id);

// --- export / import ---
export async function exportAll() {
  const d = await db();
  const data = { app: 'clotting-cascade', version: 1, exportedAt: new Date().toISOString(), stores: {} };
  for (const name of STORES) {
    const tx = d.transaction(name);
    const keys = await tx.store.getAllKeys();
    const vals = await tx.store.getAll();
    data.stores[name] = keys.map((k, i) => [k, vals[i]]);
  }
  // The define list travels inside the export so Devin never handles a separate file.
  data.defineList = (await all('defineList')).map((d) => d.term);
  return data;
}

export async function importAll(data) {
  if (data?.app !== 'clotting-cascade' || !data.stores) throw new Error('Not a Clotting Cascade progress file.');
  const d = await db();
  for (const name of STORES) {
    const tx = d.transaction(name, 'readwrite');
    await tx.store.clear();
    for (const [k, v] of data.stores[name] || []) {
      if (tx.store.keyPath || tx.store.autoIncrement) await tx.store.put(v);
      else await tx.store.put(v, k);
    }
    await tx.done;
  }
}

export async function resetAll() {
  const d = await db();
  for (const name of STORES) {
    if (name === 'settings') continue;
    await d.clear(name);
  }
}
