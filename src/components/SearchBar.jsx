import { useMemo, useState } from 'preact/hooks';
import { nodes, glossary, plain } from '../content.js';
import { normalize } from '../match.js';
import { openNode, openGlossary } from '../ui.js';

// Everything searchable, built once from the bundled content (works offline).
const index = [
  ...nodes.map((n) => ({ kind: 'node', id: n.id, title: n.name, sub: n.type, keys: [n.name, ...(n.aliases || [])].map(normalize), body: normalize(n.claims.map((c) => plain(c.text)).join(' ')) })),
  ...glossary.map((g) => ({ kind: 'glossary', entry: g, title: g.term, sub: 'definition', keys: [g.term, ...(g.aliases || [])].map(normalize), body: normalize(g.definition) }))
];

export function SearchBar() {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const n = normalize(q);
    if (n.length < 2) return [];
    const scored = [];
    for (const it of index) {
      let s = 0;
      if (it.keys.some((k) => k === n)) s = 3;
      else if (it.keys.some((k) => k.startsWith(n))) s = 2;
      else if (it.keys.some((k) => k.includes(n))) s = 1.5;
      else if (it.body.includes(n)) s = 1;
      if (s) scored.push([s, it]);
    }
    return scored.sort((a, b) => b[0] - a[0]).slice(0, 8).map(([, it]) => it);
  }, [q]);

  const pick = (it) => {
    setQ('');
    if (it.kind === 'node') openNode(it.id);
    else openGlossary(it.entry);
  };

  return (
    <div class="search">
      <input
        type="search"
        placeholder="Search a drug, factor, lab, or term"
        value={q}
        onInput={(e) => setQ(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) pick(results[0]); }}
        aria-label="Search"
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false}
      />
      {q.trim().length >= 2 && (
        <ul class="search-results">
          {results.length === 0 && <li class="muted small">Nothing matches "{q}" yet.</li>}
          {results.map((it) => (
            <li key={it.title}>
              <button onClick={() => pick(it)}>
                <b>{it.title}</b> <span class="muted small">{it.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
