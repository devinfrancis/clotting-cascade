// Finds glossary terms inside any text so they can be underlined everywhere they appear.
import { glossary, nodes } from './content.js';
import unverified from '../content/unverified.json';

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const entries = [];
for (const g of glossary) {
  for (const t of [g.term, ...(g.aliases || [])]) entries.push({ text: t, entry: g });
}
// Longest first so "factor IV" wins over "factor".
entries.sort((a, b) => b.text.length - a.text.length);
const byLower = new Map(entries.map((e) => [e.text.toLowerCase(), e.entry]));

const pattern = entries.length
  ? new RegExp(`(?<![\\w-])(${entries.map((e) => esc(e.text)).join('|')})(?![\\w-])`, 'gi')
  : null;

export function findGlossary(term) {
  return byLower.get(term.trim().toLowerCase()) || null;
}

// Splits text into plain strings and { term, entry } pieces. [[x]] / [[shown|x]] markup is resolved first.
export function segment(text) {
  const out = [];
  const markup = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0;
  let m;
  const pushPlain = (s) => {
    if (!s) return;
    if (!pattern) return out.push(s);
    let i = 0;
    let mm;
    pattern.lastIndex = 0;
    while ((mm = pattern.exec(s))) {
      if (mm.index > i) out.push(s.slice(i, mm.index));
      out.push({ term: mm[0], entry: byLower.get(mm[0].toLowerCase()) });
      i = mm.index + mm[0].length;
    }
    if (i < s.length) out.push(s.slice(i));
  };
  while ((m = markup.exec(text))) {
    pushPlain(text.slice(last, m.index));
    const shown = m[1];
    const key = (m[2] || m[1]).toLowerCase();
    const entry = byLower.get(key);
    out.push(entry ? { term: shown, entry } : shown);
    last = m.index + m[0].length;
  }
  pushPlain(text.slice(last));
  return out;
}

// For the Define button: is this term already a node?
export function findNodeForTerm(term) {
  const t = term.trim().toLowerCase();
  return nodes.find((n) => [n.id, n.name, ...(n.aliases || [])].some((a) => a.toLowerCase() === t)) || null;
}

export function findUnverified(term) {
  const t = term.trim().toLowerCase();
  return unverified.find((u) => [u.term, ...(u.aliases || [])].some((a) => a.toLowerCase() === t)) || null;
}
