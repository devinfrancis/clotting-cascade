import { useEffect, useState } from 'preact/hooks';
import { lessons, modules, claimById, sources, goalById } from '../content.js';
import { getMeta, setMeta } from '../store.js';
import { goalStates } from '../goals.js';
import { RichText } from '../components/RichText.jsx';
import { Diagram, LAYERS } from '../components/Diagram.jsx';
import { go, openNode, progressChanged } from '../ui.js';

// Where Devin left off, so "Continue lesson" on Home opens the right section.
export async function lessonProgress(moduleId) {
  const list = lessons.filter((l) => l.module === moduleId);
  const read = (await getMeta(`lessonRead:${moduleId}`)) || [];
  const next = list.find((l) => !read.includes(l.id));
  return { total: list.length, read: read.filter((id) => list.some((l) => l.id === id)).length, next: next || null, first: list[0] };
}

export function LessonIndex() {
  const [read, setRead] = useState({});
  useEffect(() => {
    (async () => {
      const out = {};
      for (const m of modules) out[m.id] = (await getMeta(`lessonRead:${m.id}`)) || [];
      setRead(out);
    })();
  }, []);
  return (
    <div>
      {modules.map((m) => {
        const list = lessons.filter((l) => l.module === m.id);
        if (!list.length) return null;
        return (
          <div key={m.id}>
            <h2 class="section">{m.id}. {m.title}</h2>
            <ol class="lesson-list">
              {list.map((l) => (
                <li key={l.id}>
                  <button class="goal-row" onClick={() => go(`#/learn/lesson/${l.id}`)}>
                    <span>{l.title}</span>
                    {read[m.id]?.includes(l.id) && <span class="state s-mastered">Read</span>}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

function ParagraphSources({ claims }) {
  const refs = [];
  for (const id of claims) for (const s of claimById[id]?.sources || []) if (!refs.some((r) => r.ref === s.ref && r.passage === s.passage)) refs.push(s);
  return (
    <ul class="sources">
      {refs.map((s, i) => (
        <li key={i}>
          <a href={sources[s.ref]?.url} target="_blank" rel="noopener">{sources[s.ref]?.title || s.ref}</a>
          <blockquote>“{s.passage}”</blockquote>
        </li>
      ))}
    </ul>
  );
}

function Paragraph({ p }) {
  const [open, setOpen] = useState(false);
  const simplified = p.claims.map((id) => claimById[id]).filter((c) => c?.simplified);
  const [simp, setSimp] = useState(false);
  return (
    <div class="lesson-p">
      <p><RichText text={p.text} /></p>
      <div class="claim-actions">
        <button class="chip" onClick={() => setOpen(!open)}>{open ? 'Hide sources' : 'Sources'}</button>
        {simplified.length > 0 && <button class="chip warn" onClick={() => setSimp(!simp)}>Simplified for EMT level</button>}
      </div>
      {simp && simplified.map((c) => (
        <div class="simplified" key={c.id}>
          <p><b>What was simplified:</b> {c.simplified.what}</p>
          <p><b>Fuller truth:</b> {c.simplified.fuller_truth}</p>
        </div>
      ))}
      {open && <ParagraphSources claims={p.claims} />}
    </div>
  );
}

export function LessonSection({ id }) {
  const idx = lessons.findIndex((l) => l.id === id);
  const l = lessons[idx];
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!l) return;
    window.scrollTo(0, 0);
    (async () => {
      // Opening a section marks it read; Home's "Continue" then points at the next one.
      const key = `lessonRead:${l.module}`;
      const read = (await getMeta(key)) || [];
      if (!read.includes(l.id)) { await setMeta(key, [...read, l.id]); progressChanged(); }
      const { states } = await goalStates();
      setState(states[l.goal]);
    })();
  }, [id]);

  if (!l) return <p>Section not found.</p>;
  const prev = lessons[idx - 1]?.module === l.module ? lessons[idx - 1] : null;
  const next = lessons[idx + 1]?.module === l.module ? lessons[idx + 1] : null;
  const list = lessons.filter((x) => x.module === l.module);
  const marked = Object.fromEntries(l.nodes.map((n) => [n, 'hl']));
  const canQuiz = state && state !== 'locked';

  return (
    <article class="lesson">
      <p class="eyebrow">Module {l.module} · {list.indexOf(l) + 1} of {list.length}</p>
      <h1>{l.title}</h1>
      <p class="problem">{l.problem}</p>
      {l.paragraphs.map((p, i) => <Paragraph key={i} p={p} />)}

      <div class="lesson-diagram">
        <p class="muted small">Where this happens (highlighted). Tap any box for its card.</p>
        <Diagram layers={LAYERS.map((x) => x.id)} onTap={openNode} marked={marked} />
      </div>

      <div class="card">
        <p class="small muted">Check yourself</p>
        <p>{goalById[l.goal].title}</p>
        <div class="btns wrap">
          {canQuiz
            ? <button onClick={() => go(`#/quiz/practice/${l.goal}`)}>Practice quiz</button>
            : <button onClick={() => go(`#/study/goal/${l.goal}`)}>See goal</button>}
        </div>
      </div>

      <div class="lesson-nav">
        {prev ? <button onClick={() => go(`#/learn/lesson/${prev.id}`)}>← {prev.title}</button> : <span />}
        {next
          ? <button class="primary" onClick={() => go(`#/learn/lesson/${next.id}`)}>Next: {next.title} →</button>
          : <button class="primary" onClick={() => go('#/study')}>Done: go study →</button>}
      </div>
    </article>
  );
}
