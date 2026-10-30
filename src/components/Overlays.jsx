import { useEffect, useState } from 'preact/hooks';
import { nodeById, sources, goalsForNode, claimById, edges } from '../content.js';
import { useOverlay, closeOverlay, openNode, openDefine as openOverlayDefine, go } from '../ui.js';
import { RichText } from './RichText.jsx';
import { findGlossary, findNodeForTerm, findUnverified } from '../glossaryIndex.js';
import { queueDefine } from '../store.js';
import { goalStates, STATE_LABEL } from '../goals.js';

function Sources({ list }) {
  return (
    <ul class="sources">
      {list.map((s, i) => {
        const src = sources[s.ref];
        return (
          <li key={i}>
            <a href={src?.url} target="_blank" rel="noopener">{src?.title || s.ref}</a>
            <blockquote>“{s.passage}”</blockquote>
          </li>
        );
      })}
    </ul>
  );
}

function Claim({ c }) {
  const [open, setOpen] = useState(false);
  const [simp, setSimp] = useState(false);
  return (
    <div class="claim">
      <p><RichText text={c.text} /></p>
      <div class="claim-actions">
        <button class="chip" onClick={() => setOpen(!open)}>{open ? 'Hide sources' : `Sources (${c.sources.length})`}</button>
        {c.simplified && <button class="chip warn" onClick={() => setSimp(!simp)}>Simplified for EMT level</button>}
      </div>
      {simp && c.simplified && (
        <div class="simplified">
          <p><b>What was simplified:</b> {c.simplified.what}</p>
          <p><b>Fuller truth:</b> {c.simplified.fuller_truth}</p>
        </div>
      )}
      {open && <Sources list={c.sources} />}
    </div>
  );
}

function NodeCard({ id }) {
  const n = nodeById[id];
  const [why, setWhy] = useState(false);
  const [states, setStates] = useState({});
  useEffect(() => { goalStates().then((r) => setStates(r.states)); }, [id]);
  if (!n) return null;
  const whyClaim = claimById[n.why];
  const related = edges.filter((e) => e.from === id || e.to === id);
  return (
    <div class="sheet-body">
      <p class="eyebrow">{n.type}{n.numeral ? ` · factor ${n.numeral}` : ''}</p>
      <h2>{n.name}</h2>
      {n.aliases?.length > 0 && <p class="muted small">Also: {n.aliases.join(', ')}</p>}
      {whyClaim && (
        <div class="why">
          <button class="primary small-btn" onClick={() => setWhy(!why)}>Why does this exist?</button>
          {why && <p class="why-text"><RichText text={whyClaim.text} /></p>}
        </div>
      )}
      {n.claims.map((c) => <Claim key={c.id} c={c} />)}
      {n.drug_note && <p class="muted small">{n.drug_note}</p>}
      {related.length > 0 && (
        <>
          <h3>Connections</h3>
          <ul class="links">
            {related.map((e) => {
              const other = e.from === id ? e.to : e.from;
              return (
                <li key={e.id}>
                  <button class="link-btn" onClick={() => openNode(other)}>
                    {nodeById[e.from].name} <i>{e.relation}</i> {nodeById[e.to].name}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <h3>Goals that cover this</h3>
      <ul class="links">
        {goalsForNode(id).map((g) => (
          <li key={g.id}>{g.title} <span class="state">{STATE_LABEL[states[g.id]] || ''}</span></li>
        ))}
      </ul>
      <button class="link" onClick={() => go(`#/learn/${id}`)}>Show on diagram</button>
    </div>
  );
}

function GlossaryCard({ entry }) {
  const [open, setOpen] = useState(false);
  return (
    <div class="sheet-body">
      <p class="eyebrow">Verified</p>
      <h2>{entry.term}</h2>
      <p>{entry.definition}</p>
      {entry.why_here && <p class="muted">{entry.why_here}</p>}
      {entry.node && <button class="link" onClick={() => openNode(entry.node)}>Open {nodeById[entry.node]?.name}</button>}
      <button class="chip" onClick={() => setOpen(!open)}>{open ? 'Hide sources' : 'Sources'}</button>
      {open && entry.claims.map((c) => <Sources key={c.id} list={c.sources} />)}
    </div>
  );
}

function DefineSheet({ term }) {
  const g = findGlossary(term);
  if (g) return <GlossaryCard entry={g} />;
  const u = findUnverified(term);
  const q = encodeURIComponent(term);
  return (
    <div class="sheet-body">
      <h2>{term}</h2>
      {u ? (
        <>
          <p class="tag-unverified">Unverified: written by the app, not yet reviewed</p>
          <p>{u.definition}</p>
        </>
      ) : (
        <p class="muted">No quick definition for this yet.</p>
      )}
      <p class="small">
        Look it up: <a href={`https://www.ncbi.nlm.nih.gov/books/?term=${q}+statpearls`} target="_blank" rel="noopener">StatPearls</a>
        {' · '}
        <a href={`https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${q}`} target="_blank" rel="noopener">DailyMed</a>
      </p>
      <p class="small ok">Saved to your define list. A verified definition arrives next time you sync with Claude Code.</p>
    </div>
  );
}

export function Overlays() {
  const o = useOverlay();
  if (!o) return <DefineButton />;
  // Define also works on text inside an open card.
  const define = o.kind === 'node' || o.kind === 'glossary' ? <DefineButton /> : null;
  let body = null;
  if (o.kind === 'node') body = <NodeCard id={o.id} />;
  if (o.kind === 'glossary') body = <GlossaryCard entry={o.entry} />;
  if (o.kind === 'define') body = <DefineSheet term={o.term} />;
  return (
    <div class="scrim" onClick={closeOverlay}>
      <div class="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        <button class="close" onClick={closeOverlay} aria-label="Close">×</button>
        {body}
      </div>
      {define}
    </div>
  );
}

// Highlight any word or phrase in the content and a Define button appears.
function DefineButton() {
  const [sel, setSel] = useState(null);
  useEffect(() => {
    const onSel = () => {
      const s = document.getSelection();
      const text = s?.toString().trim();
      if (!text || text.length > 60 || !s.anchorNode) return setSel(null);
      const el = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
      if (!el?.closest('.content, .sheet') || el.closest('input, textarea')) return setSel(null);
      setSel({ text, context: (el.closest('p, li, .card-face') || el).textContent.slice(0, 300) });
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);
  if (!sel) return null;
  const define = async () => {
    const { text, context } = sel;
    await queueDefine(text, context);
    document.getSelection()?.removeAllRanges();
    setSel(null);
    const node = findNodeForTerm(text);
    if (node) openNode(node.id);
    else openOverlayDefine(text, context);
  };
  return <button class="define-btn primary" onPointerDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); define(); }}>Define “{sel.text.slice(0, 24)}”</button>;
}
