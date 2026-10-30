// Tiny overlay bus: any screen can open a node card, a glossary popover, or the define sheet.
import { useEffect, useState } from 'preact/hooks';

// Overlays stack: a definition opened from inside a card closes back to that card.
let stack = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l(stack[stack.length - 1] || null));

export function openOverlay(o) {
  stack = o.kind === 'node' ? [o] : [...stack, o];
  emit();
}
export function closeOverlay() {
  stack = stack.slice(0, -1);
  emit();
}
export function closeAllOverlays() {
  stack = [];
  emit();
}
export const openNode = (id) => openOverlay({ kind: 'node', id });
export const openGlossary = (entry) => openOverlay({ kind: 'glossary', entry });
export const openDefine = (term, context) => openOverlay({ kind: 'define', term, context });

export function useOverlay() {
  const [o, setO] = useState(stack[stack.length - 1] || null);
  useEffect(() => {
    listeners.add(setO);
    return () => listeners.delete(setO);
  }, []);
  return o;
}

// Bumped whenever progress changes, so screens showing counters refresh.
let version = 0;
const vListeners = new Set();
export function progressChanged() {
  version++;
  vListeners.forEach((l) => l(version));
}
export function useProgressVersion() {
  const [v, setV] = useState(version);
  useEffect(() => {
    vListeners.add(setV);
    return () => vListeners.delete(setV);
  }, []);
  return v;
}

export function go(hash) {
  location.hash = hash;
}
