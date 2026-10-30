import { segment } from '../glossaryIndex.js';
import { openGlossary } from '../ui.js';
import { logGlossaryTap } from '../store.js';

// Text with every glossary term underlined; tapping shows its definition in place.
// hints=false (retention checks) renders plain text with no popovers.
export function RichText({ text, hints = true }) {
  return (
    <>
      {segment(text).map((p, i) =>
        typeof p === 'string' || !hints ? (
          typeof p === 'string' ? p : p.term
        ) : (
          <button
            key={i}
            class="gloss"
            onClick={(e) => {
              e.stopPropagation();
              logGlossaryTap(p.entry.term);
              openGlossary(p.entry);
            }}
          >
            {p.term}
          </button>
        )
      )}
    </>
  );
}
