import { useState } from 'preact/hooks';

export function SearchBar() {
  const [q, setQ] = useState('');
  return (
    <div class="search">
      <input
        type="search"
        placeholder="Search a drug, factor, lab, or term"
        value={q}
        onInput={(e) => setQ(e.currentTarget.value)}
        aria-label="Search"
      />
      {q && <div class="search-results muted small">No content yet.</div>}
    </div>
  );
}
